/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState, useEffect } from "https://esm.sh/react@18.2.0";
import type { EventDetailsResponse, AttendeeListResponse, AnalyticsResponse } from "../../shared/types.ts";

interface EventManagementProps {
  eventId: number;
}

export default function EventManagement({ eventId }: EventManagementProps) {
  const [eventDetails, setEventDetails] = useState<EventDetailsResponse | null>(null);
  const [attendees, setAttendees] = useState<AttendeeListResponse['attendees']>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'analytics'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [eventId, isAuthenticated]);

  const authenticate = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Authentication failed');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [detailsRes, attendeesRes, analyticsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/attendees`),
        fetch(`/api/events/${eventId}/analytics`)
      ]);

      if (!detailsRes.ok || !attendeesRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to load event data');
      }

      const [details, attendeesList, analyticsData] = await Promise.all([
        detailsRes.json() as Promise<EventDetailsResponse>,
        attendeesRes.json() as Promise<AttendeeListResponse>,
        analyticsRes.json() as Promise<AnalyticsResponse>
      ]);

      setEventDetails(details);
      setAttendees(attendeesList.attendees);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/export`);
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${eventId}-checkins.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const getSignInUrl = () => {
    return `${window.location.origin}/events/${eventId}/signin`;
  };

  const copySignInUrl = () => {
    navigator.clipboard.writeText(getSignInUrl());
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="bg-white p-8 rounded-lg border border-[var(--border-default)] w-full max-w-md">
          <h2 className="font-heading text-2xl text-[var(--text-primary)] mb-6 text-center">
            Event Management
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Enter event password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-[var(--border-default)] rounded-lg focus:outline-none focus:border-[var(--border-focus)]"
              onKeyPress={(e) => e.key === 'Enter' && authenticate()}
            />
          </div>
          
          <button
            onClick={authenticate}
            className="w-full py-3 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
          >
            Access Event
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
          <p className="mt-4 text-[var(--text-muted)]">Loading event data...</p>
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
            onClick={() => { setError(null); loadData(); }}
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading text-3xl text-[var(--text-primary)] mb-2">
            {eventDetails?.event.name}
          </h1>
          {eventDetails?.event.location && (
            <p className="text-[var(--text-secondary)]">📍 {eventDetails.event.location}</p>
          )}
        </div>

        {/* Sign-in URL */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-[var(--border-default)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Check-in URL</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-[var(--bg-secondary)] rounded text-sm">
              {getSignInUrl()}
            </code>
            <button
              onClick={copySignInUrl}
              className="px-3 py-2 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-secondary)] text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-[var(--border-default)]">
          <div className="flex space-x-8">
            {(['overview', 'attendees', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Total Attendees</h3>
              <p className="text-3xl font-bold text-[var(--accent-primary)]">
                {eventDetails?.attendeeCount || 0}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Checked In</h3>
              <p className="text-3xl font-bold text-[var(--success)]">
                {eventDetails?.checkedInCount || 0}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Check-in Rate</h3>
              <p className="text-3xl font-bold text-[var(--info)]">
                {eventDetails?.attendeeCount 
                  ? Math.round(((eventDetails?.checkedInCount || 0) / eventDetails.attendeeCount) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        )}

        {/* Attendees Tab */}
        {activeTab === 'attendees' && (
          <div className="bg-white rounded-lg border border-[var(--border-default)]">
            <div className="p-6 border-b border-[var(--border-default)] flex justify-between items-center">
              <h3 className="font-semibold text-[var(--text-primary)]">Attendees</h3>
              <button
                onClick={exportCSV}
                className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-secondary)] text-sm"
              >
                Export CSV
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[var(--border-default)]">
                  {attendees.map((attendee) => (
                    <tr key={attendee.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                        {attendee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {attendee.checkedIn ? (
                          <span className="text-[var(--success)]">✓ Checked In</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">Not checked in</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-[var(--border-default)]">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Check-ins by Date</h3>
                <div className="space-y-2">
                  {analytics.checkInsByDate.map((entry) => (
                    <div key={entry.date} className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)] text-sm">{entry.date}</span>
                      <span className="font-medium text-[var(--text-primary)]">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-[var(--border-default)]">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Recent Check-ins</h3>
                <div className="space-y-2">
                  {analytics.recentCheckIns.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)] text-sm">{entry.attendeeName}</span>
                      <span className="font-medium text-[var(--text-primary)] text-sm">
                        {new Date(entry.checkedInAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
