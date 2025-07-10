# On-Site Registration Feature

## Overview
Allow event creators to enable on-site registration where attendees can register themselves at the event venue.

## Acceptance Criteria

### Event Configuration
- [ ] Add checkbox "Enable on-site registration" to EventCreation form
- [ ] Store `allow_onsite_registration` boolean field in Event table
- [ ] Default to `false` for new events

### API Changes
- [ ] Update `CreateEventRequest` type to include `allowOnsiteRegistration?: boolean`
- [ ] Modify POST `/api/events` endpoint to accept and store new field
- [ ] Update Event interface to include `allow_onsite_registration: boolean`

### Registration Form
- [ ] Add GET `/api/events/{eventId}/signup` endpoint returning event name and registration status
- [ ] Add POST `/api/events/{eventId}/signup` endpoint accepting `{ name: string }`
- [ ] Only show registration form if `allow_onsite_registration` is true
- [ ] Create new attendee record with `external_id` set to "onsite-{timestamp}"

### Frontend Changes
- [ ] Create OnSiteRegistration component with name input and submit button
- [ ] Display registration form on event page when enabled
- [ ] Show success message after registration
- [ ] Add validation for duplicate names (case-insensitive)

### Database Schema
- [ ] Add `allow_onsite_registration` column to events table (default false)
- [ ] No changes to attendees or checkins tables required

## Technical Notes
- Use existing attendee flow for check-in after registration
- Leverage existing fuzzy search for finding registered attendees
- Maintain password protection for event management features
