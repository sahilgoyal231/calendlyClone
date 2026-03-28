import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../../components/Calendar';
import { useToast } from '../../components/Toast';
import { getEventTypeBySlug, getAvailability, getAvailableSlots, createBooking } from '../../lib/api';

export default function BookingPage() {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [eventType, setEventType] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', notes: '', answers: [] });

  useEffect(() => {
    loadEventType();
  }, [slug]);

  async function loadEventType() {
    try {
      const data = await getEventTypeBySlug(slug);
      setEventType(data);

      if (data.custom_questions?.length > 0) {
        setForm(f => ({
          ...f,
          answers: data.custom_questions.map(q => ({ question: q.question, answer: '' }))
        }));
      }

      const schedData = await getAvailability();
      setSchedules(schedData);
    } catch (err) {
      addToast(err.message || 'Event not found', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDateSelect(dateStr) {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setShowForm(false);
    setLoadingSlots(true);

    const schedule = schedules.find(s => s.id === eventType?.schedule_id) || schedules.find(s => s.is_default) || schedules[0];
    if (!schedule) {
      setLoadingSlots(false);
      return;
    }

    try {
      const data = await getAvailableSlots(schedule.id, dateStr, {
        duration: eventType.duration,
        buffer_before: eventType.buffer_before || 0,
        buffer_after: eventType.buffer_after || 0,
        event_type_id: eventType.id
      });
      setSlots(data.slots || []);
    } catch (err) {
      addToast('Failed to load time slots', 'error');
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleSlotClick(slot) {
    if (selectedSlot?.start_time === slot.start_time) {
      setShowForm(true);
    } else {
      setSelectedSlot(slot);
    }
  }

  function confirmSlot() {
    setShowForm(true);
  }

  async function handleBooking(e) {
    e.preventDefault();
    if (!form.name || !form.email) {
      addToast('Please fill in your name and email', 'error');
      return;
    }
    setSubmitting(true);

    try {
      const booking = await createBooking({
        event_type_id: eventType.id,
        invitee_name: form.name,
        invitee_email: form.email,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        timezone: eventType.user_timezone || 'Asia/Kolkata',
        answers: form.answers.filter(a => a.answer),
        notes: form.notes
      });

      // Navigate to confirmation page
      navigate(`/${username}/${slug}/success?booking=${booking.id}`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const getAvailableDays = () => {
    const schedule = schedules.find(s => s.id === eventType?.schedule_id) || schedules.find(s => s.is_default) || schedules[0];
    if (!schedule) return [];
    return schedule.rules.filter(r => r.is_active).map(r => r.day_of_week);
  };

  function formatSelectedDate() {
    if (!selectedDate) return '';
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  if (loading) {
    return (
      <div className="booking-page">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="booking-page">
        <div className="confirmation-card">
          <h2 style={{ marginBottom: '8px' }}>Event Not Found</h2>
          <p style={{ color: 'var(--gray-600)' }}>This event type does not exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        {/* Left sidebar with event info */}
        <div className="booking-sidebar">
          <div className="booking-host-avatar">
            {eventType.user_name?.charAt(0) || 'U'}
          </div>
          <div className="booking-host-name">{eventType.user_name}</div>
          <div className="booking-event-name">{eventType.name}</div>

          <div className="booking-detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {eventType.duration} min
          </div>

          {eventType.location && (
            <div className="booking-detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {eventType.location}
            </div>
          )}

          {selectedDate && (
            <div className="booking-detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              {formatSelectedDate()}
            </div>
          )}

          {selectedSlot && (
            <div className="booking-detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {selectedSlot.display}
            </div>
          )}

          {eventType.user_timezone && (
            <div className="booking-detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" /></svg>
              {eventType.user_timezone} Time
            </div>
          )}

          {eventType.description && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-200)' }}>
              <div className="booking-detail" style={{ alignItems: 'flex-start' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                {eventType.description}
              </div>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="booking-main">
          {showForm ? (
            <div className="booking-form">
              <div className="booking-form-header">
                <button className="booking-form-back" onClick={() => setShowForm(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <h2 className="booking-main-header" style={{ margin: 0 }}>Enter Details</h2>
              </div>

              <form onSubmit={handleBooking}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" required />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" required />
                </div>

                {eventType.custom_questions?.map((q, idx) => (
                  <div key={idx} className="form-group">
                    <label className="form-label">{q.question} {q.required ? '*' : ''}</label>
                    <input
                      value={form.answers[idx]?.answer || ''}
                      onChange={(e) => {
                        const newAnswers = [...form.answers];
                        newAnswers[idx] = { question: q.question, answer: e.target.value };
                        setForm(f => ({ ...f, answers: newAnswers }));
                      }}
                      required={q.required}
                    />
                  </div>
                ))}

                <div className="form-group">
                  <label className="form-label">Additional Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Please share anything that will help prepare for our meeting." rows={3} />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }} disabled={submitting}>
                  {submitting ? 'Scheduling...' : 'Schedule Event'}
                </button>
              </form>
            </div>
          ) : (
            <>
              <h2 className="booking-main-header">Select a Date & Time</h2>
              <div style={{ display: 'flex', gap: '0', flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <Calendar selectedDate={selectedDate} onSelectDate={handleDateSelect} availableDays={getAvailableDays()} />
                </div>

                {selectedDate && (
                  <div className="time-slots-panel">
                    <div className="time-slots-date">{formatSelectedDate()}</div>
                    {loadingSlots ? (
                      <div className="loading-spinner"><div className="spinner"></div></div>
                    ) : slots.length === 0 ? (
                      <div className="time-slots-empty">No available times for this date</div>
                    ) : (
                      <div className="time-slots-list">
                        {slots.map((slot, idx) => (
                          <div key={idx}>
                            {selectedSlot?.start_time === slot.start_time ? (
                              <div className="time-slot-confirm-group">
                                <button className="time-slot-btn selected">{slot.display}</button>
                                <button className="time-slot-btn btn-confirm" onClick={confirmSlot}>Confirm</button>
                              </div>
                            ) : (
                              <button className="time-slot-btn" onClick={() => handleSlotClick(slot)}>
                                {slot.display}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
