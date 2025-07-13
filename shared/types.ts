// Event-related types
export interface Event {
  id: number;
  name: string;
  password_hash: string;
  location?: string;
  created_at: string;
}

export interface Attendee {
  id: number;
  event_id: number;
  name: string;
  external_id?: string;
}

export interface CheckIn {
  id: number;
  event_id: number;
  attendee_id: number;
  checked_in_at: string;
}

// API request/response types
export interface CreateEventRequest {
  name: string;
  password: string;
  location?: string;
  attendees: AttendeeData[];
}

export interface AttendeeData {
  name: string;
  external_id?: string;
}

export interface CreateEventResponse {
  success: boolean;
  eventId: number;
}

export interface SignInRequest {
  attendeeId: number;
}

export interface SignInResponse {
  success: boolean;
  attendeeName: string;
  alreadySignedIn?: boolean;
  // TODO: Consider tracking multiple sign-in attempts for security
  // previousSignIns?: CheckIn[];
}

export interface EventDetailsResponse {
  event: Event;
  attendeeCount: number;
  checkedInCount: number;
}

export interface AttendeeListResponse {
  attendees: Array<{
    id: number;
    name: string;
    checkedIn: boolean;
  }>;
}

export interface AnalyticsResponse {
  totalAttendees: number;
  totalCheckedIn: number;
  checkInsByDate: Array<{
    date: string;
    count: number;
  }>;
  recentCheckIns: Array<{
    attendeeName: string;
    checkedInAt: string;
  }>;
}

// CSV parsing utility types
export interface CSVParseResult {
  attendees: AttendeeData[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

// Add attendee request/response types
export interface AddAttendeeRequest {
  password: [REDACTED:password];
  name: string;
  external_id?: string;
}

export interface AddAttendeeResponse {
  success: boolean;
  attendee: {
    id: number;
    name: string;
    external_id?: string;
    event_id: number;
  };
}