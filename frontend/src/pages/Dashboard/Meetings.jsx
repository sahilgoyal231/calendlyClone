import { useState, useEffect } from 'react';
import { getBookings, cancelBooking, rescheduleBooking, getEventTypes, getAvailableSlots } from '../../lib/api';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import Calendar from '../../components/Calendar';
import { Link } from 'react-router-dom';

export default function Meetings() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showBuffers, setShowBuffers] = useState(false);
  const { addToast } = useToast();

  const [showRescheduleModal, setShowRescheduleModal] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', slot: null, slots: [], loadingSlots: false });

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await getBookings(activeTab);
      setBookings(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    try {
      await cancelBooking(showCancelModal.id, { cancel_reason: cancelReason });
      addToast('Booking cancelled successfully');
      setShowCancelModal(null);
      loadBookings();
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function openReschedule(booking) {
    setShowRescheduleModal(booking);
    setRescheduleData({ date: '', slot: null, slots: [], loadingSlots: false });
  }

  async function handleDateSelect(dateStr) {
    setRescheduleData(prev => ({ ...prev, date: dateStr, slot: null, loadingSlots: true }));
    try {
      const et = await getEventTypes().then(res => res.find(e => e.id === showRescheduleModal.event_type_id));
      if (!et) throw new Error('Event type not found');

      const data = await getAvailableSlots(et.schedule_id, dateStr, {
        duration: showRescheduleModal.duration,
        buffer_before: et.buffer_before,
        buffer_after: et.buffer_after,
        event_type_id: et.id
      });
      setRescheduleData(prev => ({ ...prev, slots: data.slots || [], loadingSlots: false }));
    } catch (err) {
      addToast('Failed to load slots', 'error');
      setRescheduleData(prev => ({ ...prev, loadingSlots: false }));
    }
  }

  async function handleReschedule() {
    if (!rescheduleData.slot) return;
    try {
      await rescheduleBooking(showRescheduleModal.id, {
        start_time: rescheduleData.slot.start_time,
        end_time: rescheduleData.slot.end_time
      });
      addToast('Booking rescheduled successfully');
      setShowRescheduleModal(null);
      loadBookings();
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  function getExactTimeRange(start, end) {
    const s = new Date(start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const e = new Date(end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${s} - ${e}`;
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 className="dashboard-title" style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--gray-900)' }}>Meetings</h1>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
      </div>

      <div className="meetings-controls-row">
        <div className="meetings-controls-left">
          <button className="btn btn-secondary btn-sm" style={{ padding: '8px 12px', fontSize: '0.875rem' }}>
            My Calendly
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div className="meetings-buffer-toggle">
            <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Show buffers
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </span>
            <div className={`toggle-switch ${showBuffers ? 'active' : ''}`} onClick={() => setShowBuffers(!showBuffers)} style={{ transform: 'scale(0.8)' }} />
          </div>
        </div>
        <div className="meetings-controls-right" style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
          Displaying {bookings.length > 0 ? 1 : 0} – {bookings.length} of {bookings.length} Events
        </div>
      </div>

      <div className="card meetings-main-card">
        <div className="meetings-card-header">
          <div className="meetings-tabs-inline">
            <button className={`meetings-tab-inline ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>Upcoming</button>
            <button className={`meetings-tab-inline ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>Past</button>
            <button className="meetings-tab-inline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Date Range
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <div className="meetings-card-actions">
            <button className="btn btn-secondary btn-sm pill-btn" style={{ padding: '6px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Export
            </button>
            <button className="btn btn-secondary btn-sm pill-btn" style={{ padding: '6px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filter
            </button>
          </div>
        </div>

        <div className="meetings-card-body">
          {loading ? (
            <div className="loading-spinner" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
          ) : bookings.length === 0 ? (
            <div className="meetings-empty-state">
              <div className="meetings-empty-icon-wrap">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ced4da" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                </svg>
                <div className="meetings-empty-badge">0</div>
              </div>
              <h3 className="meetings-empty-title">No Events Yet</h3>
              <p className="meetings-empty-subtitle">Share Event Type links to schedule events.</p>
              <Link to="/" className="btn btn-primary" style={{ borderRadius: '24px', marginTop: '16px', padding: '8px 24px' }}>
                View Event Types
              </Link>
            </div>
          ) : (
            <div className="meetings-list">
              {bookings.map(booking => {
                const d = new Date(booking.start_time);
                return (
                  <div key={booking.id} className="meeting-card">
                    <div className="meeting-date-badge">
                      <span className="meeting-date-month">{d.toLocaleString('en-US', { month: 'short' })}</span>
                      <span className="meeting-date-day">{d.getDate()}</span>
                    </div>
                    
                    <div className="meeting-info">
                      <div className="meeting-time">{getExactTimeRange(booking.start_time, booking.end_time)}</div>
                      <div className="meeting-event-name">
                        <div className="meeting-event-dot" style={{ backgroundColor: booking.color || 'var(--primary)' }} />
                        {booking.invitee_name} - {booking.event_name}
                      </div>
                      <div className="meeting-invitee">
                        Email: {booking.invitee_email} • Duration: {booking.duration}m
                      </div>
                      {booking.status === 'cancelled' && booking.cancel_reason && (
                        <div style={{ marginTop: '8px', fontSize: '0.8125rem', color: 'var(--gray-600)', background: 'var(--gray-50)', padding: '8px', borderRadius: '4px' }}>
                          <strong>Reason:</strong> {booking.cancel_reason}
                        </div>
                      )}
                    </div>

                    <div className="meeting-actions">
                      {booking.status === 'confirmed' && activeTab === 'upcoming' && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => openReschedule(booking)}>Reschedule</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => { setShowCancelModal(booking); setCancelReason(''); }}>Cancel</button>
                        </>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="meeting-cancelled-badge">Cancelled</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={!!showCancelModal} onClose={() => setShowCancelModal(null)} title="Cancel Event"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowCancelModal(null)}>Keep Event</button>
          <button className="btn btn-danger" onClick={handleCancel}>Cancel Event</button>
        </>}
      >
        <p style={{ marginBottom: '16px' }}>Are you sure you want to cancel the event with <strong>{showCancelModal?.invitee_name}</strong> on {showCancelModal && new Date(showCancelModal.start_time).toLocaleDateString()}?</p>
        <div className="form-group">
          <label className="form-label">Reason for cancelling</label>
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Let the invitee know why you're cancelling..." rows={3} />
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={!!showRescheduleModal} onClose={() => setShowRescheduleModal(null)} title="Reschedule Event"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowRescheduleModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleReschedule} disabled={!rescheduleData.slot}>Confirm Reschedule</button>
        </>}
      >
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <Calendar selectedDate={rescheduleData.date} onSelectDate={handleDateSelect} />
          </div>
          {rescheduleData.date && (
            <div style={{ width: '200px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '0.9375rem' }}>Select Time</h4>
              {rescheduleData.loadingSlots ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
              ) : rescheduleData.slots.length === 0 ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>No available times</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rescheduleData.slots.map((slot, idx) => (
                    <button key={idx} className={`time-slot-btn ${rescheduleData.slot?.start_time === slot.start_time ? 'selected' : ''}`}
                      onClick={() => setRescheduleData(prev => ({ ...prev, slot }))}>
                      {slot.display}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
