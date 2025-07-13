/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState, useEffect } from "https://esm.sh/react@18.2.0";
import type { AttendeeListResponse, SignInRequest, SignInResponse } from "../../shared/types.ts";

interface EventSignInProps {
  eventId: number;
}

export default function EventSignIn({ eventId }: EventSignInProps) {
  const [attendees, setAttendees] = useState<AttendeeListResponse['attendees']>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signInResult, setSignInResult] = useState<SignInResponse | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadAttendees();
  }, [eventId]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (signInResult?.success) {
      const timer = setTimeout(() => {
        setSignInResult(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [signInResult]);

  const loadAttendees = async () => {
    try {
      const response = await fetch(`/api/${eventId}/attendees`);
      if (!response.ok) throw new Error('Failed to load attendees');
      const data: AttendeeListResponse = await response.json();
      setAttendees(data.attendees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (attendeeId: number) => {
    setIsSigningIn(true);
    setSignInResult(null);
    
    try {
      const response = await fetch(`/api/${eventId}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId } as SignInRequest)
      });
      
      if (!response.ok) throw new Error('Failed to sign in');
      
      const result: SignInResponse = await response.json();
      setSignInResult(result);
      
      // Refresh attendees to show updated status
      await loadAttendees();
      
      // Clear search after successful sign-in
      setSearchTerm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Simple fuzzy search with optional filtering of checked-in attendees
  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = attendee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const shouldShow = showAll || !attendee.checkedIn;
    return matchesSearch && shouldShow;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
          <p className="mt-4 text-[var(--text-muted)]">Loading attendees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--error)] mb-4">{error}</p>
          <button
            onClick={() => { setError(null); loadAttendees(); }}
            className="px-4 py-2 bg-[var(--accent-primary)] text-[#2d3748] font-mono rounded hover:bg-[var(--accent-secondary)]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl text-[var(--text-primary)] mb-6 text-center">
          Event Check-In
        </h1>



        <div className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="Search for your name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-[var(--border-default)] rounded-lg focus:outline-none focus:border-[var(--border-focus)]"
          />
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {showAll ? 'Hide Checked-In' : 'Show All'}
            </button>
            <span className="text-sm text-[var(--text-muted)]">
              {filteredAttendees.length} attendee{filteredAttendees.length !== 1 ? 's' : ''} shown
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {filteredAttendees.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)]">
              {searchTerm ? 'No attendees found matching your search.' : 'No attendees found.'}
            </div>
          ) : (
            filteredAttendees.map(attendee => (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-[var(--border-default)] hover:border-[var(--border-focus)] transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    {attendee.name}
                  </h3>
                  {attendee.checkedIn && (
                    <span className="text-sm text-[var(--success)]">✓ Already checked in</span>
                  )}
                </div>
                
                <button
                  onClick={() => handleSignIn(attendee.id)}
                  disabled={isSigningIn}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    attendee.checkedIn
                      ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                      : 'bg-[var(--accent-primary)] text-[#2d3748] hover:bg-[var(--accent-secondary)]'
                  } ${isSigningIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSigningIn ? 'Signing In...' : attendee.checkedIn ? 'Check In Again' : 'Check In'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Fixed bottom flash message */}
      {signInResult && (
        <div className={`fixed bottom-4 left-4 right-4 mx-auto max-w-md p-4 rounded-lg shadow-lg ${signInResult.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
          {signInResult.success ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-green-800">
                  ✓ Welcome, {signInResult.attendeeName}!
                </h2>
                <button
                  onClick={() => setSignInResult(null)}
                  className="text-green-600 hover:text-green-800 text-lg"
                >
                  ×
                </button>
              </div>
              {signInResult.alreadySignedIn && (
                <p className="text-green-700 text-sm mt-1">
                  Note: You were already signed in, but we've recorded this check-in too.
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-red-800">Failed to sign in. Please try again.</p>
              <button
                onClick={() => setSignInResult(null)}
                className="text-red-600 hover:text-red-800 text-lg"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
