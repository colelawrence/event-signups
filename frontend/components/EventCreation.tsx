/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState } from "https://esm.sh/react@18.2.0";

interface EventCreationProps {
  onEventCreated: (eventId: number) => void;
}

export default function EventCreation({ onEventCreated }: EventCreationProps) {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    location: '',
    csvContent: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFormData(prev => ({ ...prev, csvContent: content }));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setCsvErrors([]);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.csvErrors) {
          setCsvErrors(result.csvErrors);
        }
        throw new Error(result.error || 'Failed to create event');
      }

      // Show success and redirect
      onEventCreated(result.eventId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-[600px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-semibold text-primary mb-3">
            Create New Event
          </h1>
          <p className="font-mono text-sm text-secondary tracking-wide">
            Set up your event and upload attendee list
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[var(--border-default)] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary mb-2">
                Event Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                placeholder="Enter event name"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-2">
                Management Password *
              </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                placeholder="Enter password for event management"
              />
              <p className="text-xs text-muted mt-1">
                This password will be required to access analytics and export data
              </p>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-secondary mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                placeholder="Enter event location (optional)"
              />
            </div>

            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-secondary mb-2">
                Attendee List (CSV) *
              </label>
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
              />
              <div className="text-xs text-muted mt-2 space-y-1">
                <p>Upload a CSV file with attendee names. Supported column headers:</p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li><code>name</code>, <code>Name</code>, <code>full_name</code></li>
                  <li><code>first_name</code> + <code>last_name</code> (will be combined)</li>
                  <li><code>id</code> (optional, for external reference)</li>
                </ul>
              </div>
            </div>

            {formData.csvContent && (
              <div className="bg-[var(--bg-secondary)] p-3 rounded-md">
                <p className="text-sm text-secondary">
                  CSV loaded: {formData.csvContent.split('\n').length - 1} rows
                </p>
              </div>
            )}

            {csvErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-red-800 mb-2">CSV Parsing Issues:</h4>
                <ul className="text-xs text-red-700 space-y-1">
                  {csvErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.password || !formData.csvContent}
              className="w-full bg-[var(--accent-primary)] text-white py-2 px-4 rounded-md hover:bg-[var(--accent-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating Event...' : 'Create Event'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p>1. Your event will be created with the uploaded attendee list</p>
              <p>2. You'll be redirected to the management dashboard</p>
              <p>3. Share the sign-in link with your attendees</p>
              <p>4. Monitor check-ins and export data as needed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}