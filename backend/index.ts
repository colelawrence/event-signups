import { Hono } from "https://esm.sh/hono@3.11.7";
import { readFile, serveFile } from "https://esm.town/v/std/utils@85-main/index.ts";
import { sqlite } from "https://esm.town/v/stevekrouse/sqlite";
import { getCookie, setCookie } from "https://esm.sh/hono@3.11.7/cookie";

const app = new Hono();

// Unwrap Hono errors to see original error details
app.onError((err, c) => {
  throw err;
});

// Database table names
const EVENTS_TABLE = "events_2";
const ATTENDEES_TABLE = "attendees_2"; 
const CHECKINS_TABLE = "checkins_2";

// Initialize database
async function initDatabase() {
  console.log(`💾 [DB] Initializing database tables`);
  
  // Events table - using unix timestamp as primary key
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS ${EVENTS_TABLE} (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Attendees table
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS ${ATTENDEES_TABLE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    external_id TEXT,
    FOREIGN KEY (event_id) REFERENCES ${EVENTS_TABLE}(id)
  )`);
  
  // Check-ins table
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS ${CHECKINS_TABLE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    attendee_id INTEGER NOT NULL,
    checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES ${EVENTS_TABLE}(id),
    FOREIGN KEY (attendee_id) REFERENCES ${ATTENDEES_TABLE}(id)
  )`);
  
  console.log(`✅ [DB] Database initialization complete`);
}

// Initialize database on startup
await initDatabase();
console.log(`🚀 [System] Event check-in system ready!`);

// Serve static files
app.get("/frontend/*", c => serveFile(c.req.path, import.meta.url));
app.get("/shared/*", c => serveFile(c.req.path, import.meta.url));

// Serve main page
app.get("/", async c => {
  const html = await readFile("/frontend/index.html", import.meta.url);
  return c.html(html);
});

// Route handlers for different pages
app.get("/events/new", async c => {
  const html = await readFile("/frontend/index.html", import.meta.url);
  return c.html(html);
});

app.get("/events/:eventId/signin", async c => {
  const html = await readFile("/frontend/index.html", import.meta.url);
  return c.html(html);
});

app.get("/events/:eventId/manage", async c => {
  const html = await readFile("/frontend/index.html", import.meta.url);
  return c.html(html);
});

// Utility functions
function hashPassword(password: string): string {
  // Simple hash for demo - in production, use proper bcrypt or similar
  return btoa(password + "salt").replace(/[^a-zA-Z0-9]/g, '');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// CSV parsing utility with proper quoted field handling
function parseCSV(csvContent: string): { attendees: Array<{name: string, external_id?: string}>, errors: string[] } {
  const lines = csvContent.trim().split('\n');
  const errors: string[] = [];
  const attendees: Array<{name: string, external_id?: string}> = [];
  
  if (lines.length === 0) {
    errors.push("CSV file is empty");
    return { attendees, errors };
  }
  
  // Parse CSV row with proper quote handling
  function parseCSVRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        // Check for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip the escaped quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      i++;
    }
    
    result.push(current.trim());
    return result;
  }
  
  // Parse header row
  const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase());
  console.log(`📋 [CSV] Found headers:`, headers);
  
  // Find name columns - flexible matching
  let nameIndex = -1;
  let firstNameIndex = -1;
  let lastNameIndex = -1;
  let idIndex = -1;
  let emailIndex = -1;
  
  headers.forEach((header, index) => {
    const cleanHeader = header.toLowerCase();
    if (cleanHeader === 'name' || (cleanHeader.includes('name') && !cleanHeader.includes('first') && !cleanHeader.includes('last') && !cleanHeader.includes('given') && !cleanHeader.includes('family'))) {
      nameIndex = index;
    } else if (cleanHeader.includes('first') || cleanHeader === 'first name') {
      firstNameIndex = index;
    } else if (cleanHeader.includes('last') || cleanHeader === 'last name' || cleanHeader.includes('family') || cleanHeader.includes('surname')) {
      lastNameIndex = index;
    } else if ((cleanHeader.includes('id') || cleanHeader === 'member id') && !cleanHeader.includes('email')) {
      idIndex = index;
    } else if (cleanHeader.includes('email') || cleanHeader === 'email') {
      emailIndex = index;
    }
  });
  
  console.log(`📋 [CSV] Column mapping - name: ${nameIndex}, firstName: ${firstNameIndex}, lastName: ${lastNameIndex}, id: ${idIndex}, email: ${emailIndex}`);
  
  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    
    if (row.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${row.length})`);
      continue;
    }
    
    let name = '';
    
    // Extract name using flexible logic
    if (nameIndex >= 0 && row[nameIndex]) {
      name = row[nameIndex];
    } else if (firstNameIndex >= 0 && lastNameIndex >= 0) {
      const firstName = row[firstNameIndex] || '';
      const lastName = row[lastNameIndex] || '';
      name = `${firstName} ${lastName}`.trim();
    } else if (firstNameIndex >= 0) {
      name = row[firstNameIndex];
    }
    
    if (!name) {
      errors.push(`Row ${i + 1}: No name found`);
      continue;
    }
    
    const attendee: {name: string, external_id?: string} = { name };
    
    if (idIndex >= 0 && row[idIndex]) {
      attendee.external_id = row[idIndex];
    }
    
    attendees.push(attendee);
  }
  
  console.log(`📋 [CSV] Parsed ${attendees.length} attendees with ${errors.length} errors`);
  return { attendees, errors };
}

// API Routes

// Create new event
app.post("/api/events", async c => {
  console.log(`🎯 [API] New event creation request`);
  
  try {
    const body = await c.req.json();
    const { name, password, location, csvContent } = body;
    
    console.log(`📋 [API] Event details: "${name}", location: "${location || 'N/A'}"`);
    
    if (!name || !password || !csvContent) {
      return c.json({ error: "Missing required fields: name, password, csvContent" }, 400);
    }
    
    // Parse CSV
    const { attendees, errors } = parseCSV(csvContent);
    
    if (attendees.length === 0) {
      return c.json({ error: "No valid attendees found in CSV", csvErrors: errors }, 400);
    }
    
    // Create event with unix timestamp as ID
    const passwordHash = hashPassword(password);
    const eventId = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    
    await sqlite.execute(
      `INSERT INTO ${EVENTS_TABLE} (id, name, password_hash, location) VALUES (?, ?, ?, ?)`,
      [eventId, name, passwordHash, location || null]
    );
    console.log(`✅ [API] Event created with ID: ${eventId}`);
    
    // Insert attendees
    for (const attendee of attendees) {
      await sqlite.execute(
        `INSERT INTO ${ATTENDEES_TABLE} (event_id, name, external_id) VALUES (?, ?, ?)`,
        [eventId, attendee.name, attendee.external_id || null]
      );
    }
    
    console.log(`✅ [API] Added ${attendees.length} attendees to event`);
    
    return c.json({
      success: true,
      eventId,
      attendeeCount: attendees.length,
      csvErrors: errors
    });
    
  } catch (error) {
    console.error(`💥 [API] Error creating event:`, error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get attendee list for sign-in (names only, no sensitive info)
app.get("/api/events/:eventId/attendees", async c => {
  const eventId = parseInt(c.req.param("eventId"));
  console.log(`📋 [API] Fetching attendees for event ${eventId}`);
  
  try {
    // First check if event exists
    const eventCheck = await sqlite.execute(`
      SELECT id FROM ${EVENTS_TABLE} WHERE id = ?
    `, [eventId]);
    
    if (eventCheck.length === 0) {
      console.log(`❌ [API] Event ${eventId} not found`);
      return c.json({ error: "Event not found" }, 404);
    }
    
    // Get attendees with check-in status
    const attendees = await sqlite.execute(`
      SELECT a.id, a.name, 
             CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as checked_in
      FROM ${ATTENDEES_TABLE} a
      LEFT JOIN ${CHECKINS_TABLE} c ON a.id = c.attendee_id
      WHERE a.event_id = ?
      ORDER BY a.name
    `, [eventId]);
    
    console.log(`📋 [API] Found ${attendees.length} attendees for event ${eventId}`);
    
    return c.json({
      attendees: attendees.map(row => ({
        id: row.id,
        name: row.name,
        checkedIn: Boolean(row.checked_in)
      }))
    });
    
  } catch (error) {
    console.error(`💥 [API] Error fetching attendees:`, error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Sign in to event
app.post("/api/events/:eventId/signin", async c => {
  const eventId = parseInt(c.req.param("eventId"));
  
  try {
    const body = await c.req.json();
    const { attendeeId } = body;
    
    if (!attendeeId) {
      return c.json({ error: "Attendee ID required" }, 400);
    }
    
    // Verify attendee belongs to this event
    const attendee = await sqlite.execute(
      `SELECT * FROM ${ATTENDEES_TABLE} WHERE id = ? AND event_id = ?`,
      [attendeeId, eventId]
    );
    
    if (attendee.length === 0) {
      return c.json({ error: "Attendee not found for this event" }, 404);
    }
    
    // Check if already signed in
    const existingCheckIn = await sqlite.execute(
      `SELECT * FROM ${CHECKINS_TABLE} WHERE event_id = ? AND attendee_id = ?`,
      [eventId, attendeeId]
    );
    
    if (existingCheckIn.length > 0) {
      console.log(`⚠️ [API] Attendee ${attendee[0].name} already signed in`);
      // TODO: Consider security implications of multiple sign-in attempts
      // For now, we'll allow it but flag it
      return c.json({
        success: true,
        attendeeName: attendee[0].name,
        alreadySignedIn: true,
        message: "You were already signed in, but we've recorded this additional check-in."
      });
    }
    
    // Record check-in
    await sqlite.execute(
      `INSERT INTO ${CHECKINS_TABLE} (event_id, attendee_id) VALUES (?, ?)`,
      [eventId, attendeeId]
    );
    
    console.log(`✅ [API] ${attendee[0].name} signed in to event ${eventId}`);
    
    return c.json({
      success: true,
      attendeeName: attendee[0].name,
      alreadySignedIn: false
    });
    
  } catch (error) {
    console.error(`💥 [API] Error during sign-in:`, error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get event details (password protected)
app.post("/api/events/:eventId/details", async c => {
  const eventId = parseInt(c.req.param("eventId"));
  
  try {
    const body = await c.req.json();
    const { password } = body;
    
    if (!password) {
      return c.json({ error: "Password required" }, 401);
    }
    
    // Get event
    const events = await sqlite.execute(
      `SELECT * FROM ${EVENTS_TABLE} WHERE id = ?`,
      [eventId]
    );
    
    if (events.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }
    
    const event = events[0];
    
    // Verify password
    if (!verifyPassword(password, event.password_hash)) {
      return c.json({ error: "Invalid password" }, 401);
    }
    
    // Get counts
    const attendeeCount = await sqlite.execute(
      `SELECT COUNT(*) as count FROM ${ATTENDEES_TABLE} WHERE event_id = ?`,
      [eventId]
    );
    
    const checkedInCount = await sqlite.execute(
      `SELECT COUNT(*) as count FROM ${CHECKINS_TABLE} WHERE event_id = ?`,
      [eventId]
    );
    
    return c.json({
      event: {
        id: event.id,
        name: event.name,
        location: event.location,
        created_at: event.created_at
      },
      attendeeCount: attendeeCount[0].count,
      checkedInCount: checkedInCount[0].count
    });
    
  } catch (error) {
    console.error(`💥 [API] Error fetching event details:`, error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get analytics (password protected)
app.post("/api/events/:eventId/analytics", async c => {
  const eventId = parseInt(c.req.param("eventId"));
  
  try {
    const body = await c.req.json();
    const { password } = body;
    
    if (!password) {
      return c.json({ error: "Password required" }, 401);
    }
    
    // Verify event and password
    const events = await sqlite.execute(
      `SELECT password_hash FROM ${EVENTS_TABLE} WHERE id = ?`,
      [eventId]
    );
    
    if (events.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }
    
    if (!verifyPassword(password, events[0].password_hash)) {
      return c.json({ error: "Invalid password" }, 401);
    }
    
    // Get total counts
    const totalAttendees = await sqlite.execute(
      `SELECT COUNT(*) as count FROM ${ATTENDEES_TABLE} WHERE event_id = ?`,
      [eventId]
    );
    
    const totalCheckedIn = await sqlite.execute(
      `SELECT COUNT(*) as count FROM ${CHECKINS_TABLE} WHERE event_id = ?`,
      [eventId]
    );
    
    // Get check-ins by date
    const checkInsByDate = await sqlite.execute(`
      SELECT DATE(checked_in_at) as date, COUNT(*) as count
      FROM ${CHECKINS_TABLE}
      WHERE event_id = ?
      GROUP BY DATE(checked_in_at)
      ORDER BY date
    `, [eventId]);
    
    // Get recent check-ins
    const recentCheckIns = await sqlite.execute(`
      SELECT a.name as attendee_name, c.checked_in_at
      FROM ${CHECKINS_TABLE} c
      JOIN ${ATTENDEES_TABLE} a ON c.attendee_id = a.id
      WHERE c.event_id = ?
      ORDER BY c.checked_in_at DESC
      LIMIT 10
    `, [eventId]);
    
    return c.json({
      totalAttendees: totalAttendees[0].count,
      totalCheckedIn: totalCheckedIn[0].count,
      checkInsByDate: checkInsByDate.map(row => ({
        date: row.date,
        count: row.count
      })),
      recentCheckIns: recentCheckIns.map(row => ({
        attendeeName: row.attendee_name,
        checkedInAt: row.checked_in_at
      }))
    });
    
  } catch (error) {
    console.error(`💥 [API] Error fetching analytics:`, error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Export check-in data as CSV (password protected)
app.post("/api/events/:eventId/export", async c => {
  const eventId = parseInt(c.req.param("eventId"));
  
  try {
    const body = await c.req.json();
    const { password } = body;
    
    if (!password) {
      return c.json({ error: "Password required" }, 401);
    }
    
    // Verify event and password
    const events = await sqlite.execute(
      `SELECT password_hash, name FROM ${EVENTS_TABLE} WHERE id = ?`,
      [eventId]
    );
    
    if (events.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }
    
    if (!verifyPassword(password, events[0].password_hash)) {
      return c.json({ error: "Invalid password" }, 401);
    }
    
    // Get all attendees with check-in data
    const data = await sqlite.execute(`
      SELECT a.name, a.external_id, c.checked_in_at
      FROM ${ATTENDEES_TABLE} a
      LEFT JOIN ${CHECKINS_TABLE} c ON a.id = c.attendee_id
      WHERE a.event_id = ?
      ORDER BY a.name
    `, [eventId]);
    
    // Generate CSV
    const csvRows = [
      'Name,External ID,Checked In,Check-in Time'
    ];
    
    for (const row of data) {
      const checkedIn = row.checked_in_at ? 'Yes' : 'No';
      const checkInTime = row.checked_in_at || '';
      csvRows.push(`"${row.name}","${row.external_id || ''}","${checkedIn}","${checkInTime}"`);
    }
    
    const csvContent = csvRows.join('\n');
    const filename = `${events[0].name.replace(/[^a-zA-Z0-9]/g, '_')}_checkins.csv`;
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
    
  } catch (error) {
    console.error(`💥 [API] Error exporting data:`, error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app.fetch;