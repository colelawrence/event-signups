/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState, useEffect } from "https://esm.sh/react@18.2.0";
import type { EventDetailsResponse } from "../../shared/types.ts";

interface EventLinksProps {
  eventId: number;
}

export default function EventLinks({ eventId }: EventLinksProps) {
  const [eventDetails, setEventDetails] = useState<EventDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      const response = await fetch(`/api/${eventId}`);
      if (!response.ok) throw new Error('Failed to load event details');
      const data: EventDetailsResponse = await response.json();
      setEventDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const getSignInUrl = () => {
    return `${window.location.origin}/${eventId}/signin`;
  };

  const getManageUrl = () => {
    return `${window.location.origin}/${eventId}/manage`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
          <p className="mt-4 text-[var(--text-muted)]">Loading event details...</p>
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
            onClick={() => { setError(null); loadEventDetails(); }}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-secondary)]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl text-[var(--text-primary)] mb-2">
            {eventDetails?.event.name}
          </h1>
          {eventDetails?.event.location && (
            <p className="text-[var(--text-secondary)] text-lg">📍 {eventDetails.event.location}</p>
          )}
          <div className="mt-4 flex justify-center gap-4 text-sm text-[var(--text-muted)]">
            <span>{eventDetails?.attendeeCount || 0} attendees</span>
            <span>•</span>
            <span>{eventDetails?.checkedInCount || 0} checked in</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendee Check-in */}
          <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-[var(--accent-primary)] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl text-[var(--text-primary)] mb-2">
                Attendee Check-in
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                For attendees to check in to the event
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-[var(--bg-secondary)] rounded text-sm text-[var(--text-primary)]">
                  {getSignInUrl()}
                </code>
                <button
                  onClick={() => copyToClipboard(getSignInUrl())}
                  className="px-3 py-2 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-secondary)] text-sm"
                >
                  Copy
                </button>
              </div>
              
              <a
                href={getSignInUrl()}
                className="block w-full py-3 bg-[var(--accent-primary)] text-white text-center rounded-lg hover:bg-[var(--accent-secondary)] transition-colors font-medium"
              >
                Go to Check-in Page
              </a>
            </div>
          </div>

          {/* Event Management */}
          <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-[var(--info)] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl text-[var(--text-primary)] mb-2">
                Event Management
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                For organizers to manage the event (requires password)
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-[var(--bg-secondary)] rounded text-sm text-[var(--text-primary)]">
                  {getManageUrl()}
                </code>
                <button
                  onClick={() => copyToClipboard(getManageUrl())}
                  className="px-3 py-2 bg-[var(--info)] text-white rounded hover:bg-blue-600 text-sm"
                >
                  Copy
                </button>
              </div>
              
              <a
                href={getManageUrl()}
                className="block w-full py-3 bg-[var(--info)] text-white text-center rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Go to Management Page
              </a>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-lg border border-[var(--border-default)] p-6">
          <h3 className="font-heading text-lg text-[var(--text-primary)] mb-4">Event Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-[var(--text-secondary)]">Event ID:</span>
              <span className="ml-2 text-[var(--text-primary)]">{eventId}</span>
            </div>
            <div>
              <span className="font-medium text-[var(--text-secondary)]">Created:</span>
              <span className="ml-2 text-[var(--text-primary)]">
                {eventDetails?.event.created_at ? new Date(eventDetails.event.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
            <div>
              <span className="font-medium text-[var(--text-secondary)]">Total Attendees:</span>
              <span className="ml-2 text-[var(--text-primary)]">{eventDetails?.attendeeCount || 0}</span>
            </div>
            <div>
              <span className="font-medium text-[var(--text-secondary)]">Checked In:</span>
              <span className="ml-2 text-[var(--text-primary)]">{eventDetails?.checkedInCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
