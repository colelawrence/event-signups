/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState } from "https://esm.sh/react@18.2.0";

interface AddAttendeeProps {
  eventId: number;
  onAttendeeAdded?: () => void;
  onCancel?: () => void;
}

export default function AddAttendee({ eventId, onAttendeeAdded, onCancel }: AddAttendeeProps) {
  const [formData, setFormData] = useState({
    password: '',
    name: '',
    external_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/events/${eventId}/attendees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
          name: formData.name,
          external_id: formData.external_id || undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add attendee');
      }

      setSuccess(`Successfully added ${result.attendee.name} to the event!`);
      setFormData(prev => ({ ...prev, name: '', external_id: '' })); // Keep password for convenience
      
      if (onAttendeeAdded) {
        onAttendeeAdded();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[var(--border-default)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-primary">Add New Attendee</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-secondary mb-2">
            Event Password *
          </label>
          <input
            type="password"
            id="password"
            required
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
            placeholder="Enter event management password"
          />
          <p className="text-xs text-muted mt-1">
            Required to verify you have permission to add attendees
          </p>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-secondary mb-2">
            Attendee Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
            placeholder="Enter attendee's full name"
          />
        </div>

        <div>
          <label htmlFor="external_id" className="block text-sm font-medium text-secondary mb-2">
            External ID (Optional)
          </label>
          <input
            type="text"
            id="external_id"
            value={formData.external_id}
            onChange={(e) => setFormData(prev => ({ ...prev, external_id: e.target.value }))}
            className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
            placeholder="Employee ID, badge number, etc. (optional)"
          />
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !formData.password || !formData.name}
            className="flex-1 bg-[var(--accent-primary)] text-white py-2 px-4 rounded-md hover:bg-[var(--accent-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Adding Attendee...' : 'Add Attendee'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How it works:</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p>• Enter the event management password to authenticate</p>
          <p>• Add the attendee's name (must be unique for this event)</p>
          <p>• External ID is optional but helpful for tracking</p>
          <p>• The attendee will immediately appear in the sign-in list</p>
        </div>
      </div>
    </div>
  );
}
