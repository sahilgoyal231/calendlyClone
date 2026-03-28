import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getBooking } from '../../lib/api';

export default function ConfirmationPage() {
  const { username, slug } = useParams();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  async function loadBooking() {
    try {
      const data = await getBooking(bookingId);
      setBooking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <h2 style={{ marginBottom: '8px' }}>Booking Not Found</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px' }}>We couldn't find the details for this booking.</p>
          <Link to={`/${username}/${slug}`} className="btn btn-primary">Return to Booking Page</Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(booking.start_time);
  const endDate = new Date(booking.end_time);

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        
        <h1 className="confirmation-title">You are scheduled</h1>
        <p className="confirmation-subtitle">
          A calendar invitation has been sent to your email address.
        </p>

        <div className="confirmation-details">
          <div className="confirmation-detail-row">
            <div className="confirmation-detail-label">What</div>
            <div className="confirmation-detail-value">{booking.event_name} between {booking.host_name} and {booking.invitee_name}</div>
          </div>
          
          <div className="confirmation-detail-row">
            <div className="confirmation-detail-label">When</div>
            <div className="confirmation-detail-value">
              {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}<br />
              {startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>

          <div className="confirmation-detail-row">
            <div className="confirmation-detail-label">Who</div>
            <div className="confirmation-detail-value">
              {booking.host_name} ({booking.host_email})<br />
              {booking.invitee_name} ({booking.invitee_email})
            </div>
          </div>

          <div className="confirmation-detail-row">
            <div className="confirmation-detail-label">Where</div>
            <div className="confirmation-detail-value">
              Google Meet / Zoom (Link to follow)
            </div>
          </div>

          {booking.notes && (
            <div className="confirmation-detail-row">
              <div className="confirmation-detail-label">Notes</div>
              <div className="confirmation-detail-value">
                {booking.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
