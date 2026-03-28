import { useState, useEffect } from 'react';
import { getEventTypes, createEventType, updateEventType, deleteEventType, getUser } from '../../lib/api';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';

const COLORS = ['#0069ff', '#7B2FFE', '#FF5733', '#2ecc71', '#e74c9c', '#f39c12', '#1abc9c', '#e74c3c'];

export default function EventTypes() {
  const [eventTypes, setEventTypes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const { addToast } = useToast();

  const [form, setForm] = useState({
    name: '', slug: '', description: '', duration: 30, color: '#0069ff',
    location: '', buffer_before: 0, buffer_after: 0, custom_questions: []
  });
  const [newQuestion, setNewQuestion] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [types, userData] = await Promise.all([getEventTypes(), getUser()]);
      setEventTypes(types);
      setUser(userData);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingEvent(null);
    setForm({ name: '', slug: '', description: '', duration: 30, color: '#0069ff', location: '', buffer_before: 0, buffer_after: 0, custom_questions: [] });
    setNewQuestion('');
    setShowModal(true);
  }

  function openEditModal(et) {
    setEditingEvent(et);
    setForm({
      name: et.name, slug: et.slug, description: et.description || '', duration: et.duration,
      color: et.color, location: et.location || '', buffer_before: et.buffer_before || 0,
      buffer_after: et.buffer_after || 0, custom_questions: et.custom_questions || []
    });
    setNewQuestion('');
    setShowModal(true);
  }

  function handleNameChange(value) {
    setForm(f => ({
      ...f, name: value,
      slug: editingEvent ? f.slug : value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }));
  }

  async function handleSubmit() {
    if (!form.name || !form.slug || !form.duration) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    try {
      if (editingEvent) {
        await updateEventType(editingEvent.id, form);
        addToast('Event type updated successfully');
      } else {
        await createEventType(form);
        addToast('Event type created successfully');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEventType(id);
      addToast('Event type deleted');
      setShowDeleteConfirm(null);
      loadData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  function copyLink(et) {
    const link = `${window.location.origin}/${user?.username}/${et.slug}`;
    navigator.clipboard.writeText(link).then(() => {
      addToast('Link copied to clipboard');
    });
  }

  function addQuestion() {
    if (newQuestion.trim()) {
      setForm(f => ({ ...f, custom_questions: [...f.custom_questions, { question: newQuestion.trim(), required: false }] }));
      setNewQuestion('');
    }
  }

  function removeQuestion(idx) {
    setForm(f => ({ ...f, custom_questions: f.custom_questions.filter((_, i) => i !== idx) }));
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {/* Top right profile nav */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', paddingBottom: '32px' }}>
        <button className="btn btn-ghost btn-icon" style={{ color: 'var(--gray-700)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <div className="dashboard-user-avatar" style={{ background: '#e8f0fe', color: '#004299', width: '36px', height: '36px', fontSize: '0.9375rem' }}>
            {user?.name?.charAt(0) || 'D'}
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gray-700)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 className="dashboard-title" style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--gray-900)' }}>Scheduling</h1>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-primary" onClick={openCreateModal} style={{ borderRadius: '24px', padding: '10px 20px', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create Event Type
          </button>
        </div>
      </div>


          <div className="dashboard-top-actions">
            <div className="dashboard-search-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" placeholder="Search event types" className="dashboard-search" />
            </div>
          </div>

          {user && (
            <div className="dashboard-user-bar">
              <div className="dashboard-user-info">
                <div className="dashboard-user-avatar">{user.name?.charAt(0) || 'D'}</div>
                <div className="dashboard-user-name">{user.name || 'Deku'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <a href={`/${user.username}`} target="_blank" rel="noreferrer" className="dashboard-view-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  View landing page
                </a>
                <button className="btn btn-ghost btn-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                </button>
              </div>
            </div>
          )}

          {eventTypes.length === 0 ? (
            <div className="empty-state">
              <h3>No event types yet</h3>
              <p>Create your first event type to start accepting bookings.</p>
              <button className="btn btn-primary" onClick={openCreateModal}>Create Event Type</button>
            </div>
          ) : (
            <div className="dashboard-list">
              {eventTypes.map(et => (
                <div key={et.id} className="list-item-card" style={{ borderLeftColor: et.color || 'var(--accent-purple)' }}>
                  <div className="list-item-checkbox">
                    <input type="checkbox" />
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{et.name}</div>
                    <div className="list-item-subtitle" style={{ color: 'var(--gray-600)' }}>
                      {et.duration} min • {et.location || 'Google Meet'} • One-on-One
                    </div>
                    <div className="list-item-meta" style={{ color: 'var(--gray-500)', fontSize: '0.8125rem', marginTop: '4px' }}>
                      Weekdays, 9 am - 5 pm
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => openEditModal(et)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
                    </button>
                    <button className="btn btn-ghost btn-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    </button>
                    <button className="btn btn-ghost btn-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg>
                    </button>
                    <button className="btn btn-ghost btn-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                    </button>

                    <button className="pill-btn" onClick={() => copyLink(et)} style={{ margin: '0 4px', fontSize: '0.8125rem' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                      Copy link
                    </button>

                    <button className="btn btn-ghost btn-icon" onClick={() => window.open(`/${user?.username}/${et.slug}`, '_blank')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => setShowDeleteConfirm(et.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}


      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Event Type"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
        </>}
      >
        <p>Are you sure you want to delete this event type? This action cannot be undone and all associated bookings will be removed.</p>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEvent ? 'Edit Event Type' : 'New Event Type'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editingEvent ? 'Save Changes' : 'Create'}</button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Event Name *</label>
          <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. 30 Minute Meeting" />
        </div>

        <div className="form-group">
          <label className="form-label">URL Slug *</label>
          <input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. 30min" />
          {user && <div className="form-slug-preview">Link: {window.location.origin}/{user.username}/<span>{form.slug || '...'}</span></div>}
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this event" rows={3} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Duration (minutes) *</label>
            <select value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))}>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Zoom, Google Meet" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Color</label>
          <div className="color-picker-group">
            {COLORS.map(c => (
              <div key={c} className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Buffer Before (min)</label>
            <input type="number" min="0" max="60" value={form.buffer_before}
              onChange={(e) => setForm(f => ({ ...f, buffer_before: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Buffer After (min)</label>
            <input type="number" min="0" max="60" value={form.buffer_after}
              onChange={(e) => setForm(f => ({ ...f, buffer_after: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Custom Invitee Questions</label>
          {form.custom_questions.map((q, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input value={q.question} readOnly style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-sm" onClick={() => removeQuestion(idx)} style={{ color: 'var(--error)' }}>×</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Add a question..." style={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()} />
            <button className="btn btn-secondary btn-sm" onClick={addQuestion}>Add</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
