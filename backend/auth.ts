import { sqlite } from "https://esm.town/v/stevekrouse/sqlite";
import { getCookie, setCookie, deleteCookie } from "https://esm.sh/hono@3.11.7/cookie";
import type { Context } from "https://esm.sh/hono@3.11.7";

// Database table names
const SESSIONS_TABLE = "sessions_1";
const EVENTS_TABLE = "events_2";

// Session configuration
const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SESSION_COOKIE_NAME = "session_token";

// Database interfaces
interface Session {
  id: string;
  secretHash: Uint8Array;
  eventId: number;
  createdAt: Date;
}

interface SessionWithToken extends Session {
  token: string;
}

// Initialize sessions table
export async function initSessionsTable() {
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS ${SESSIONS_TABLE} (
    id TEXT NOT NULL PRIMARY KEY,
    secret_hash BLOB NOT NULL,
    event_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (event_id) REFERENCES ${EVENTS_TABLE}(id)
  )`);
}

// Generate secure random string for session IDs and secrets
function generateSecureRandomString(): string {
  const alphabet = "abcdefghijklmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += alphabet[bytes[i] >> 3];
  }
  return result;
}

// Hash secret using SHA-256
async function hashSecret(secret: string): Promise<Uint8Array> {
  const secretBytes = new TextEncoder().encode(secret);
  const secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  return new Uint8Array(secretHashBuffer);
}

// Constant-time comparison for security
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  let c = 0;
  for (let i = 0; i < a.byteLength; i++) {
    c |= a[i] ^ b[i];
  }
  return c === 0;
}

// Create a new session for event management
export async function createSession(eventId: number): Promise<SessionWithToken> {
  const now = new Date();
  const sessionId = generateSecureRandomString();
  const sessionSecret = generateSecureRandomString();
  const secretHash = await hashSecret(sessionSecret);
  
  const token = `${sessionId}.${sessionSecret}`;
  
  const session: SessionWithToken = {
    id: sessionId,
    secretHash,
    eventId,
    createdAt: now,
    token
  };
  
  await sqlite.execute(
    `INSERT INTO ${SESSIONS_TABLE} (id, secret_hash, event_id, created_at) VALUES (?, ?, ?, ?)`,
    [sessionId, secretHash, eventId, Math.floor(now.getTime() / 1000)]
  );
  
  return session;
}

// Validate session token
export async function validateSessionToken(token: string): Promise<Session | null> {
  const tokenParts = token.split(".");
  if (tokenParts.length !== 2) {
    return null;
  }
  
  const [sessionId, sessionSecret] = tokenParts;
  
  try {
    const session = await getSession(sessionId);
    if (!session) {
      return null;
    }
    
    const tokenSecretHash = await hashSecret(sessionSecret);
    const validSecret = constantTimeEqual(tokenSecretHash, session.secretHash);
    
    if (!validSecret) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error("Error validating session token:", error);
    return null;
  }
}

// Get session by ID
async function getSession(sessionId: string): Promise<Session | null> {
  const now = new Date();
  
  const result = await sqlite.execute(
    `SELECT id, secret_hash, event_id, created_at FROM ${SESSIONS_TABLE} WHERE id = ?`,
    [sessionId]
  );
  
  if (result.rows.length !== 1) {
    return null;
  }
  
  const row = result.rows[0];
  const session: Session = {
    id: row[0] as string,
    secretHash: new Uint8Array(row[1] as ArrayBuffer),
    eventId: row[2] as number,
    createdAt: new Date((row[3] as number) * 1000)
  };
  
  // Check expiration
  if (now.getTime() - session.createdAt.getTime() >= SESSION_EXPIRES_IN_SECONDS * 1000) {
    await deleteSession(sessionId);
    return null;
  }
  
  return session;
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  await sqlite.execute(`DELETE FROM ${SESSIONS_TABLE} WHERE id = ?`, [sessionId]);
}

// Set session cookie
export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    maxAge: SESSION_EXPIRES_IN_SECONDS,
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/'
  });
}

// Clear session cookie
export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/'
  });
}

// Get session from request
export async function getSessionFromRequest(c: Context): Promise<Session | null> {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (!token) {
    return null;
  }
  
  return await validateSessionToken(token);
}

// Authentication middleware
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const session = await getSessionFromRequest(c);
  
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  // Store session in context for use in handlers
  c.set('session', session);
  await next();
}

// Verify event access (user has session for this specific event)
export async function verifyEventAccess(c: Context, eventId: number): Promise<boolean> {
  const session = c.get('session') as Session;
  if (!session) {
    return false;
  }
  
  return session.eventId === eventId;
}

// CSRF protection - verify request origin
export function verifyRequestOrigin(c: Context): boolean {
  const method = c.req.method;
  if (method === "GET" || method === "HEAD") {
    return true;
  }
  
  const origin = c.req.header("origin");
  const host = c.req.header("host");
  
  if (!origin || !host) {
    return false;
  }
  
  // Allow same-origin requests
  return origin === `https://${host}` || origin === `http://${host}`;
}

// CSRF middleware
export async function csrfMiddleware(c: Context, next: () => Promise<void>) {
  if (!verifyRequestOrigin(c)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  
  await next();
}
