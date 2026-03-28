import { useState, useEffect } from 'react';
import { getAvailability, updateAvailability } from '../../lib/api';
import { useToast } from '../../components/Toast';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Availability() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const [rules, setRules] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [newOverride, setNewOverride] = useState({ specific_date: '', start_time: '09:00', end_time: '17:00', is_unavailable: false });

  // UI state
  const [activeTab, setActiveTab] = useState('schedules');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getAvailability();
      setSchedules(data);
      if (data.length > 0) {
        const defaultSchedule = data.find(s => s.is_default) || data[0];
        setTimezone(defaultSchedule.timezone);
        setOverrides(defaultSchedule.overrides || []);
        
        const rulesByDay = {};
        defaultSchedule.rules.forEach(r => { rulesByDay[r.day_of_week] = r; });
        const allRules = [];
        for (let d = 0; d < 7; d++) {
          if (rulesByDay[d]) {
            allRules.push({ ...rulesByDay[d] });
          } else {
            allRules.push({ day_of_week: d, start_time: '09:00', end_time: '17:00', is_active: false });
          }
        }
        setRules(allRules);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const defaultSchedule = schedules.find(s => s.is_default) || schedules[0];
    if (!defaultSchedule) return;

    setSaving(true);
    try {
      await updateAvailability(defaultSchedule.id, {
        timezone,
        rules: rules.map(r => ({
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
          is_active: r.is_active
        })),
        overrides: overrides.map(o => ({
          specific_date: o.specific_date,
          start_time: o.start_time,
          end_time: o.end_time,
          is_unavailable: o.is_unavailable
        }))
      });
      addToast('Availability updated successfully');
      loadData();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function markDayInactive(dayIndex) {
    setRules(r => r.map((rule, i) => i === dayIndex ? { ...rule, is_active: false } : rule));
  }

  function markDayActive(dayIndex) {
    setRules(r => r.map((rule, i) => i === dayIndex ? { ...rule, is_active: true } : rule));
  }

  function updateRule(dayIndex, field, value) {
    setRules(r => r.map((rule, i) => i === dayIndex ? { ...rule, [field]: value } : rule));
  }

  function addOverride() {
    if (!newOverride.specific_date) {
      addToast('Please select a date', 'error');
      return;
    }
    setOverrides(o => [...o, { ...newOverride }]);
    setNewOverride({ specific_date: '', start_time: '09:00', end_time: '17:00', is_unavailable: false });
    setShowOverrideForm(false);
  }

  function removeOverride(idx) {
    setOverrides(o => o.filter((_, i) => i !== idx));
  }

  function formatAmPm(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'pm' : 'am';
    const hr12 = hr % 12 || 12;
    return `${hr12}:${m}${ampm}`;
  }

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ maxWidth: '1200px' }}>
      <div className="dashboard-header" style={{ marginBottom: '16px' }}>
        <h1 className="dashboard-title" style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--gray-900)' }}>Availability</h1>
      </div>

      <div className="meetings-tabs-inline" style={{ marginBottom: '24px', borderBottom: '1px solid var(--gray-200)' }}>
        <button className={`meetings-tab-inline ${activeTab === 'schedules' ? 'active' : ''}`} onClick={() => setActiveTab('schedules')}>Schedules</button>
        <button className={`meetings-tab-inline ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendar settings</button>
        <button className={`meetings-tab-inline ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>Advanced settings</button>
      </div>

      {activeTab === 'schedules' && (
        <div className="card availability-main-card">
          <div className="availability-card-header">
            <div className="availability-header-left">
              <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Schedule
              </div>
              <div className="availability-schedule-title">
                Working hours (default)
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div className="availability-active-on">
                <span style={{ color: 'var(--gray-700)', fontWeight: '500' }}>Active on:</span> <span style={{ color: 'var(--primary)', fontWeight: '600' }}>1 event type</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <div className="availability-header-right">
              <div className="view-toggle">
                <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  List
                </button>
                <div className="view-toggle-divider"></div>
                <button className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Calendar
                </button>
              </div>
              <button className="btn btn-ghost btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
            </div>
          </div>

          <div className="availability-grid">
            {/* Left Column: Weekly Hours */}
            <div className="availability-weekly-col">
              <div className="availability-col-header">
                <div>
                  <h3 className="availability-col-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                    Weekly hours
                  </h3>
                  <p className="availability-col-subtitle">Set when you are typically available for meetings</p>
                </div>
              </div>

              <div className="weekly-hours-list">
                {rules.map((rule, idx) => (
                  <div key={idx} className="weekly-hour-row">
                    <div className="weekly-day-col">
                      <div className={`weekly-day-badge ${rule.is_active ? 'active' : ''}`}>
                        {DAY_LABELS[rule.day_of_week]}
                      </div>
                    </div>
                    
                    <div className="weekly-times-col">
                      {rule.is_active ? (
                        <div className="weekly-time-entry">
                          <input type="time" className="av-time-input" value={rule.start_time} onChange={(e) => updateRule(idx, 'start_time', e.target.value)} />
                          <span className="av-time-sep">-</span>
                          <input type="time" className="av-time-input" value={rule.end_time} onChange={(e) => updateRule(idx, 'end_time', e.target.value)} />
                          <button className="btn btn-ghost btn-icon" onClick={() => markDayInactive(idx)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                          <button className="btn btn-ghost btn-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                          <button className="btn btn-ghost btn-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="weekly-time-unavailable">
                          <span style={{ marginRight: '16px' }}>Unavailable</span>
                          <button className="btn btn-ghost btn-icon" onClick={() => markDayActive(idx)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="availability-timezone-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: '500' }}>
                    {timezone}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{ borderRadius: '24px' }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Right Column: Date-specific hours */}
            <div className="availability-specific-col">
              <div className="availability-col-header" style={{ justifyContent: 'space-between' }}>
                <div>
                  <h3 className="availability-col-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Date-specific hours
                  </h3>
                  <p className="availability-col-subtitle">Adjust hours for specific days</p>
                </div>
                <button className="pill-btn" onClick={() => setShowOverrideForm(true)} style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Hours
                </button>
              </div>

              <div className="specific-hours-list" style={{ marginTop: '24px' }}>
                {showOverrideForm && (
                  <div style={{ padding: '16px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">Date</label>
                      <input type="date" value={newOverride.specific_date}
                        onChange={(e) => setNewOverride(o => ({ ...o, specific_date: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">Status</label>
                      <select value={newOverride.is_unavailable ? 'unavailable' : 'available'}
                        onChange={(e) => setNewOverride(o => ({ ...o, is_unavailable: e.target.value === 'unavailable' }))}>
                        <option value="available">Custom Hours</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                    {!newOverride.is_unavailable && (
                      <div className="form-row" style={{ marginBottom: '12px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Start</label>
                          <input type="time" value={newOverride.start_time}
                            onChange={(e) => setNewOverride(o => ({ ...o, start_time: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">End</label>
                          <input type="time" value={newOverride.end_time}
                            onChange={(e) => setNewOverride(o => ({ ...o, end_time: e.target.value }))} />
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowOverrideForm(false)}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={addOverride}>Apply</button>
                    </div>
                  </div>
                )}

                {overrides.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.875rem', padding: '40px 0' }}>
                    No overrides configured
                  </div>
                ) : (
                  overrides.map((ovr, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{ovr.specific_date}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {ovr.is_unavailable ? 'Unavailable' : `${formatAmPm(ovr.start_time)} - ${formatAmPm(ovr.end_time)}`}
                      </div>
                      <button className="btn btn-ghost btn-icon" onClick={() => removeOverride(idx)} style={{ color: 'var(--gray-500)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'calendar' && (
        <div className="settings-tab-card">
          <div className="settings-card-header">
            <h2 className="settings-card-title">Calendar settings</h2>
            <p className="settings-card-subtitle">Set which calendars we use to check for busy times</p>
          </div>
          <div className="settings-card-divider"></div>

          <div className="settings-section">
            <div className="settings-section-header">
              <div>
                <h3 className="settings-section-title">Calendars to check for conflicts</h3>
                <p className="settings-section-subtitle">These calendars will be used to prevent double bookings</p>
              </div>
              <button className="btn btn-secondary pill-btn" style={{ padding: '8px 16px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Connect calendar account
              </button>
            </div>
            
            <div className="settings-box">
              <div className="settings-box-content">
                <div className="settings-box-icon" style={{ background: '#fff', border: '1px solid var(--gray-200)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="#34A853"/></svg>
                </div>
                <div>
                  <div className="settings-box-text-primary">Google Calendar</div>
                  <div className="settings-box-text-secondary">test.academia0001@gmail.com</div>
                  <div className="settings-box-text-link" style={{ marginTop: '2px' }}>Checking 1 calendar</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" style={{ color: 'var(--gray-500)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title" style={{ marginBottom: '16px' }}>Calendar to add events to</h3>
            
            <div className="settings-box">
              <div className="settings-box-content">
                <div className="settings-box-icon" style={{ background: '#fff', border: '1px solid var(--gray-200)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="#34A853"/></svg>
                </div>
                <div>
                  <div className="settings-box-text-primary" style={{ fontSize: '0.875rem' }}>test.academia0001@gmail.com</div>
                  <div className="settings-box-text-secondary">test.academia0001@gmail.com</div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            
            <div style={{ marginTop: '24px' }}>
              <h3 className="settings-section-title" style={{ marginBottom: '8px' }}>Sync settings</h3>
              <label className="settings-checkbox-group">
                <input type="checkbox" />
                Include buffers on this calendar
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </label>
              <label className="settings-checkbox-group">
                <input type="checkbox" defaultChecked />
                Automatically sync changes from this calendar to Calendly
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="settings-tab-card">
          <div className="settings-card-header">
            <h2 className="settings-card-title">Advanced settings</h2>
            <p className="settings-card-subtitle">Control availability across all your event types</p>
          </div>
          <div className="settings-card-divider"></div>

          <div className="settings-section">
            <h3 className="settings-section-title">Meeting limits</h3>
            <p className="settings-section-subtitle">Set a maximum number of total meetings. You can also set specific limits within individual events.</p>
            <div className="settings-box-text-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: '500' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add a meeting limit
            </div>
          </div>

          <div className="settings-section" style={{ marginTop: '40px' }}>
            <h3 className="settings-section-title">Holidays</h3>
            <p className="settings-section-subtitle">Calendly will automatically mark you as unavailable for the selected holidays</p>
            
            <div className="h-box-split">
              <div className="h-box-top">
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '4px' }}>Country for holidays</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                    Other
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <div className="toggle-switch" style={{ opacity: 0.5, cursor: 'not-allowed' }}></div>
              </div>
              <div className="h-box-bottom">
                Holidays for <strong>other countries</strong> are not yet supported.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
