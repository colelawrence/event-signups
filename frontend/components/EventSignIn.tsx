/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState, useEffect } from "https://esm.sh/react@18.2.0";

interface EventSignInProps {
  eventId: number;
}

interface Attendee {
  id: number;
  name: string;
  checkedIn: boolean;
}

export default function EventSignIn({ eventId }: EventSignInProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [signInStatus, setSignInStatus] = useState<{
    success: boolean;
    message: string;
    attendeeName?: string;
  } | null>(null);

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendees`);
      const data = await response.json();
      setAttendees(data.attendees || []);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (attendeeId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendeeId }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSignInStatus({
          success: true,
          message: result.alreadySignedIn 
            ? `Welcome back, ${result.attendeeName}! You were already signed in.`
            : `Successfully signed in ${result.attendeeName}!`,
          attendeeName: result.attendeeName
        });
        
        // Refresh attendee list to update check-in status
        fetchAttendees();
      } else {
        setSignInStatus({
          success: false,
          message: result.error || 'Failed to sign in'
        });
      }
    } catch (error) {
      setSignInStatus({
        success: false,
        message: 'Network error occurred'
      });
    }
  };

  // Fuzzy search functionality
  const filteredAttendees = attendees.filter(attendee =>
    attendee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-[600px] mx-auto text-center">
          <div className="animate-pulse">Loading attendees...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-[600px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-semibold text-primary mb-3">
            Event Sign-In
          </h1>
          <p className="font-mono text-sm text-secondary tracking-wide">
            Find your name and check in to the event
          </p>
        </div>

        {signInStatus && (
          <div className={`mb-6 p-4 rounded-md ${
            signInStatus.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm font-medium">{signInStatus.message}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-[var(--border-default)] p-6">
          <div className="mb-6">
            <label htmlFor="search" className="block text-sm font-medium text-secondary mb-2">
              Search for your name
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
              placeholder="Type your name..."
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAttendees.length === 0 ? (
              <p className="text-center text-muted py-4">
                {searchQuery ? 'No attendees found matching your search.' : 'No attendees registered for this event.'}
              </p>
            ) : (
              filteredAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className={`flex items-center justify-between p-3 rounded-md border ${
                    attendee.checkedIn
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="font-medium">{attendee.name}</span>
                    {attendee.checkedIn && (
                      <span className="ml-2 text-xs text-green-600 font-medium">✓ Checked In</span>
                    )}
                  </div>
                  
                  {!attendee.checkedIn && (
                    <button
                      onClick={() => handleSignIn(attendee.id)}
                      className="bg-[var(--accent-primary)] text-white px-4 py-1 rounded text-sm hover:bg-[var(--accent-secondary)] transition-colors"
                    >
                      Check In
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted">
          <p>Can't find your name? Contact the event organizer.</p>
        </div>
      </div>
    </div>
  );
}
