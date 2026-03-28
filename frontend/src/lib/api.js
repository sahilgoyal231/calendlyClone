const API_BASE = '/api';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

// Users
export const getUser = () => fetchAPI('/users/me');
export const updateUser = (data) => fetchAPI('/users/me', { method: 'PUT', body: JSON.stringify(data) });

// Event Types
export const getEventTypes = () => fetchAPI('/event-types');
export const getEventType = (id) => fetchAPI(`/event-types/${id}`);
export const getEventTypeBySlug = (slug) => fetchAPI(`/event-types/slug/${slug}`);
export const createEventType = (data) => fetchAPI('/event-types', { method: 'POST', body: JSON.stringify(data) });
export const updateEventType = (id, data) => fetchAPI(`/event-types/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEventType = (id) => fetchAPI(`/event-types/${id}`, { method: 'DELETE' });

// Availability
export const getAvailability = () => fetchAPI('/availability');
export const createAvailability = (data) => fetchAPI('/availability', { method: 'POST', body: JSON.stringify(data) });
export const updateAvailability = (id, data) => fetchAPI(`/availability/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const getAvailableSlots = (scheduleId, date, params = {}) => {
  const query = new URLSearchParams({ date, ...params }).toString();
  return fetchAPI(`/availability/${scheduleId}/slots?${query}`);
};

// Bookings
export const createBooking = (data) => fetchAPI('/bookings', { method: 'POST', body: JSON.stringify(data) });
export const getBookings = (status) => fetchAPI(`/bookings${status ? `?status=${status}` : ''}`);
export const getBooking = (id) => fetchAPI(`/bookings/${id}`);
export const cancelBooking = (id, data = {}) => fetchAPI(`/bookings/${id}/cancel`, { method: 'PUT', body: JSON.stringify(data) });
export const rescheduleBooking = (id, data) => fetchAPI(`/bookings/${id}/reschedule`, { method: 'PUT', body: JSON.stringify(data) });
