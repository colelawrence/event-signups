/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState, useEffect } from "https://esm.sh/react@18.2.0";
import AddAttendee from "./AddAttendee.tsx";

interface EventManagementProps {
  eventId: number;
}

interface EventDetails {
  event: {
    id: number;
    name: string;
    location?: string;
    created_at: string;
  };
  attendeeCount: number;
  checkedInCount: number;
}

interface Analytics {
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

export default function EventManagement({ eventId }: EventManagementProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddAttendee, setShowAddAttendee] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setEventDetails(data);
        setIsAuthenticated(true);
        await fetchAnalytics();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleAttendeeAdded = () => {
    // Refresh analytics to show updated counts
    fetchAnalytics();
    setShowAddAttendee(false);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `event_${eventId}_checkins.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        setError(data.error || 'Export failed');
      }
    } catch (error) {
      setError('Export failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-[400px] mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-semibold text-primary mb-3">
              Event Management
            </h1>
            <p className="font-mono text-sm text-secondary tracking-wide">
              Enter password to access event management
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[var(--border-default)] p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-secondary mb-2">
                  Management Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full bg-[var(--accent-primary)] text-white py-2 px-4 rounded-md hover:bg-[var(--accent-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Authenticating...' : 'Access Management'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!eventDetails || !analytics) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="animate-pulse">Loading event details...</div>
        </div>
      </div>
    );
  }

  const checkinRate = (analytics.totalCheckedIn / analytics.totalAttendees * 100).toFixed(1);

  return (
    <div className="py-12 px-4">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-semibold text-primary mb-3">
            {eventDetails.event.name}
          </h1>
          <p className="font-mono text-sm text-secondary tracking-wide">
            Event Management Dashboard
          </p>
          {eventDetails.event.location && (
            <p className="text-sm text-muted mt-1">📍 {eventDetails.event.location}</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-[var(--border-default)] p-6 text-center">
            <div className="text-2xl font-bold text-[var(--accent-primary)]">{analytics.totalAttendees}</div>
            <div className="text-sm text-secondary">Total Attendees</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-[var(--border-default)] p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.totalCheckedIn}</div>
            <div className="text-sm text-secondary">Checked In</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-[var(--border-default)] p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{checkinRate}%</div>
            <div className="text-sm text-secondary">Check-in Rate</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setShowAddAttendee(!showAddAttendee)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {showAddAttendee ? 'Hide' : 'Add'} Attendee
          </button>
          
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
          
          <a
            href={`/events/${eventId}/signin`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[var(--accent-primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--accent-secondary)] transition-colors inline-block text-center"
          >
            Sign-in Link ↗
          </a>
        </div>

        {/* Add Attendee Form */}
        {showAddAttendee && (
          <div className="mb-8">
            <AddAttendee
              eventId={eventId}
              onAttendeeAdded={handleAttendeeAdded}
              onCancel={() => setShowAddAttendee(false)}
            />
          </div>
        )}

        {/* Recent Check-ins */}
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border-default)] p-6">
          <h3 className="text-lg font-medium text-primary mb-4">Recent Check-ins</h3>
          
          {analytics.recentCheckIns.length === 0 ? (
            <p className="text-muted text-center py-4">No check-ins yet</p>
          ) : (
            <div className="space-y-2">
              {analytics.recentCheckIns.map((checkin, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{checkin.attendeeName}</span>
                  <span className="text-sm text-muted">
                    {new Date(checkin.checkedInAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
