import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ borderRadius: '50%', background: 'transparent' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-3H8v3H6v-7h2v2h3v-2h2v7h-2zm4.5-5c-.83 0-1.5-.67-1.5-1.5S14.67 9.5 15.5 9.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="var(--primary)" />
            <circle cx="12" cy="12" r="9" stroke="var(--primary)" strokeWidth="2.5" fill="none"/>
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5" stroke="#00d0ff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="sidebar-logo-text" style={{ letterSpacing: '-0.04em' }}>Calendly</span>
        <div className="sidebar-logo-collapse">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
          </svg>
        </div>
      </div>

      <div className="sidebar-create-btn-wrapper">
        <button className="btn sidebar-create-btn" style={{ borderRadius: '24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span className="sidebar-link-text">Scheduling</span>
        </NavLink>
        <NavLink to="/meetings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="sidebar-link-text">Meetings</span>
        </NavLink>
        <NavLink to="/availability" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="sidebar-link-text">Availability</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {/* Footers disabled for clean MVP format */}
      </div>
    </aside>
  );
}
