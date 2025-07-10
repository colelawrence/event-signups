import { sqlite } from "https://esm.town/v/stevekrouse/sqlite";

// Database table names - centralized source of truth
export const TABLES = {
  EVENTS: "events_4",
  ATTENDEES: "attendees_4", 
  CHECKINS: "checkins_4",
  SESSIONS: "sessions_2"
} as const;

/**
 * Initialize all database tables with proper schema and migrations
 */
export async function initDatabase() {
  console.log(`💾 [DB] Initializing database tables`);
  
  // Events table - using unix timestamp as primary key
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS ${TABLES.EVENTS} (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    location TEXT,
    allow_onsite_registration BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Attendees table
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS ${TABLES.ATTENDEES} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    external_id TEXT,
    FOREIGN KEY (event_id) REFERENCES ${TABLES.EVENTS}(id)
  )`);
  
  // Check-ins table
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS ${TABLES.CHECKINS} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    attendee_id INTEGER NOT NULL,
    checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES ${TABLES.EVENTS}(id),
    FOREIGN KEY (attendee_id) REFERENCES ${TABLES.ATTENDEES}(id)
  )`);
  
  // Sessions table for authentication
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS ${TABLES.SESSIONS} (
    id TEXT PRIMARY KEY,
    secret_hash TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES ${TABLES.EVENTS}(id)
  )`);
  
  console.log(`✅ [DB] Database initialization complete`);
}

/**
 * Utility function to get table name with type safety
 */
export function getTableName(table: keyof typeof TABLES): string {
  return TABLES[table];
}
