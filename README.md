# Event Check-in System

A complete event check-in system for managing attendee sign-ins with secure name verification.

## Features

- **Event Management**: Create events with attendee lists and password protection
- **Secure Check-in**: Fuzzy search-based sign-in with name verification
- **Analytics Dashboard**: Track check-ins with date-based analytics
- **CSV Import/Export**: Import attendee lists and export check-in data
- **Responsive UI**: Clean, modern interface built with React and TailwindCSS

## How It Works

1. **Event Creation**: Organizers create events with attendee lists via CSV upload
2. **Attendee Sign-in**: Attendees use fuzzy search to find and check in with their names
3. **Data Tracking**: System tracks all check-ins with timestamps
4. **Analytics**: Organizers can view check-in analytics and export data
5. **Security**: No sensitive information exposed, password-protected management

## Project Structure

```
├── backend/
│   └── index.ts              # Main API server with Hono
├── frontend/
│   ├── index.html           # Main HTML template
│   ├── index.tsx            # React app entry point
│   └── components/
│       ├── App.tsx          # Main app component
│       ├── EventSignIn.tsx  # Sign-in component with fuzzy search
│       ├── EventManagement.tsx  # Management dashboard
│       └── EventCreation.tsx    # Event creation form
├── shared/
│   └── types.ts             # Shared TypeScript types
└── README.md
```

## Setup

### Environment Variables

No external API keys required for basic functionality. Optional Discord integration available for future features.

### Database

The system uses SQLite with the following schema:

```sql
-- Events table
CREATE TABLE events_N (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Attendees table  
CREATE TABLE attendees_N (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  external_id TEXT,
  FOREIGN KEY (event_id) REFERENCES events_2(id)
);

-- Check-ins table
CREATE TABLE checkins_N (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  attendee_id INTEGER NOT NULL,
  checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events_2(id),
  FOREIGN KEY (attendee_id) REFERENCES attendees_1(id)
);
```

## API Endpoints

- `POST /api/events` - Create a new event
- `GET /api/:eventId` - Get event details (password protected)
- `POST /api/:eventId/signin` - Sign in to an event
- `GET /api/:eventId/attendees` - Get attendee list for sign-in (names only)
- `GET /api/:eventId/analytics` - Get check-in analytics (password protected)
- `GET /api/:eventId/export` - Export check-in data as CSV (password protected)

## Routes

- `/` - Home page with event creation
- `/new` - Event creation form
- `/:eventId/signin` - Event sign-in page
- `/:eventId/manage` - Event management dashboard (password protected)

## Usage

### Creating an Event
1. Navigate to the event creation page
2. Enter event name, password, and location
3. Upload a CSV file with attendee names
4. System will parse the CSV and create the event

### Attendee Sign-in
1. Navigate to the event sign-in page
2. Use fuzzy search to find your name
3. Click to sign in
4. Confirmation displayed

### Event Management
1. Navigate to the management page
2. Enter event password
3. View analytics and export data

## CSV Format

The system accepts flexible CSV formats with attendee names. Common column headers recognized:
- `name`, `Name`, `NAME`
- `full_name`, `Full Name`, `FULL_NAME`
- `first_name` + `last_name` (will be combined)
- `given_name` + `family_name` (will be combined)

Additional columns like `id`, `email`, etc. are preserved but not displayed to attendees.

## Tech Stack

- **Backend**: Hono (API framework)
- **Frontend**: React 18.2.0 with TypeScript
- **Database**: SQLite
- **Styling**: TailwindCSS
- **Platform**: Val Town (Deno runtime)