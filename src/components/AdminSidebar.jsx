import React, { useState, useEffect, useRef } from 'react';
import { getCurrentUser, subscribeToAuth } from '../lib/authStore';

export const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Cdefs%3E%3CclipPath id='c'%3E%3Ccircle cx='64' cy='64' r='64'/%3E%3C/clipPath%3E%3C/defs%3E%3Cg clip-path='url(%23c)'%3E%3Crect width='128' height='128' fill='%23E2E8F0'/%3E%3Ccircle cx='64' cy='46' r='24' fill='%2364748B'/%3E%3Cpath d='M64 78c-23.2 0-42 16.8-42 37.5 0 4.1 3.4 7.5 7.5 7.5h69c4.1 0 7.5-3.4 7.5-7.5C106 94.8 87.2 78 64 78z' fill='%2364748B'/%3E%3C/g%3E%3C/svg%3E";

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  onMouseEnter,
  onMouseLeave,
  activeTab,
  onSelectTab,
  activeQueue,
  queues = [],
  onSelectQueue,
  waitingCount = 0,
  onNavigate
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Profile Information (dynamically derived from active logged-in user)
  const initialUser = getCurrentUser();
  const [profileName, setProfileName] = useState(initialUser?.name || localStorage.getItem('mygiliran_profile_name') || 'Admin');
  const [profileRole, setProfileRole] = useState(initialUser?.role || localStorage.getItem('mygiliran_profile_role') || 'Owner');
  const [profileEmail, setProfileEmail] = useState(initialUser?.email || localStorage.getItem('mygiliran_profile_email') || '');
  
  const getInitialAvatar = () => {
    if (initialUser?.avatar && !initialUser.avatar.includes('images.unsplash.com')) {
      return initialUser.avatar;
    }
    const saved = localStorage.getItem('mygiliran_profile_avatar');
    if (saved && !saved.includes('images.unsplash.com')) {
      return saved;
    }
    return DEFAULT_AVATAR;
  };

  const [profileAvatar, setProfileAvatar] = useState(getInitialAvatar);

  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      if (user) {
        setProfileName(user.name || 'Admin');
        setProfileEmail(user.email || '');
        setProfileRole(user.role || 'Owner');
        if (user.avatar && !user.avatar.includes('images.unsplash.com')) {
          setProfileAvatar(user.avatar);
        } else {
          setProfileAvatar(DEFAULT_AVATAR);
        }
      } else {
        setProfileName('Admin');
        setProfileEmail('');
        setProfileRole('Owner');
        setProfileAvatar(DEFAULT_AVATAR);
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Form edit state
  const [editName, setEditName] = useState(profileName);
  const [editRole, setEditRole] = useState(profileRole);
  const [editEmail, setEditEmail] = useState(profileEmail);
  const [editAvatar, setEditAvatar] = useState(profileAvatar);

  const popoverRef = useRef(null);

  // Close profile menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  function handleSaveProfile(e) {
    e.preventDefault();
    setProfileName(editName);
    setProfileEmail(editEmail);
    const finalAvatar = editAvatar || DEFAULT_AVATAR;
    setProfileAvatar(finalAvatar);
    localStorage.setItem('mygiliran_profile_name', editName);
    localStorage.setItem('mygiliran_profile_email', editEmail);
    if (finalAvatar === DEFAULT_AVATAR) {
      localStorage.removeItem('mygiliran_profile_avatar');
    } else {
      localStorage.setItem('mygiliran_profile_avatar', finalAvatar);
    }
    setShowEditModal(false);
  }

  function handleAvatarFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setEditAvatar(uploadEvent.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <>
      <aside
        className={`admin-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        
        {/* Top Header with MyGiliran Logo */}
        <div className="sidebar-brand-box">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            title="MyGiliran Home"
          >
            <img
              src="/logo-icon.png?v=2"
              alt="MyGiliran Logo"
              style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', flexShrink: 0 }}
            />
            {!collapsed && (
              <div className="brand-text-wrap" style={{ textAlign: 'left' }}>
                <span className="brand-main-name" style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#0e4c49' }}>
                  My<span style={{ color: '#047857' }}>Giliran</span>
                </span>
                <span className="brand-sub-badge" style={{ fontSize: '0.65rem', fontWeight: '700', color: '#047857', letterSpacing: '0.05em' }}>
                  MANAGEMENT CONSOLE
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Nav List: Dashboard, Project, Setting */}
        <nav className="sidebar-nav-scroll" aria-label="Admin Navigation">
          
          {!collapsed && <div className="sidebar-section-title">ADMIN DASHBOARD</div>}

          <ul className="sidebar-menu-list">
            {/* 1. Dashboard - Summarize Monitoring */}
            <li className="sidebar-menu-item">
              <button
                type="button"
                className={`sidebar-link ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => onSelectTab('home')}
                data-tooltip="Dashboard"
              >
                <span className="link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </span>
                {!collapsed && <span className="link-label">Dashboard</span>}
              </button>
            </li>

            {/* 2. Project - Create New, List QR, TV Views */}
            <li className="sidebar-menu-item">
              <button
                type="button"
                className={`sidebar-link ${activeTab === 'projects' ? 'active' : ''}`}
                onClick={() => onSelectTab('projects')}
                data-tooltip="Projects & QR"
              >
                <span className="link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </span>
                {!collapsed && <span className="link-label">Project</span>}
                {!collapsed && queues.length > 0 && (
                  <span className="nav-badge-count">{queues.length}</span>
                )}
              </button>
            </li>

            {/* 3. Setting */}
            <li className="sidebar-menu-item">
              <button
                type="button"
                className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => onSelectTab('settings')}
                data-tooltip="Settings"
              >
                <span className="link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                {!collapsed && <span className="link-label">Setting</span>}
              </button>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer: User Profile at bottom */}
        <div className="sidebar-footer-box" ref={popoverRef}>
          {/* User Profile Trigger Box */}
          <div className="sidebar-profile-box">
            
            {/* Popover Profile Menu */}
            {showProfileMenu && (
              <div className="sidebar-profile-popover" onClick={(e) => e.stopPropagation()}>
                {/* Popover Header Card */}
                <div className="popover-header-card">
                  <img src={profileAvatar} alt="Profile" className="popover-avatar-big" />
                  <div style={{ overflow: 'hidden' }}>
                    <h4 className="popover-user-name">{profileName}</h4>
                    <p className="popover-user-email">{profileEmail}</p>
                  </div>
                </div>

                {/* Popover Action Links */}
                <div className="popover-body-list">
                  <button
                    type="button"
                    className="popover-item-btn"
                    onClick={() => {
                      setEditName(profileName);
                      setEditEmail(profileEmail);
                      setEditAvatar(profileAvatar);
                      setShowProfileMenu(false);
                      setShowEditModal(true);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Edit Profile Info</span>
                  </button>

                  <button
                    type="button"
                    className="popover-item-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSelectTab('settings');
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Store Settings</span>
                  </button>

                  <div className="popover-divider"></div>

                  <button
                    type="button"
                    className="popover-item-btn"
                    style={{ color: '#dc2626' }}
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('landing');
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Profile Avatar Button (Toggle Menu) */}
            <button
              type="button"
              className="sidebar-profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              data-tooltip="Profile"
              title={`Click for ${profileName}'s profile menu`}
            >
              <div className="profile-avatar-container">
                <img src={profileAvatar} alt={profileName} className="profile-avatar-img" />
                <span className="profile-status-dot"></span>
              </div>

              {!collapsed && (
                <div className="profile-meta-text">
                  <span className="profile-display-name">{profileName}</span>
                </div>
              )}

              {!collapsed && (
                <span className="profile-caret">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              )}
            </button>

          </div>

        </div>

      </aside>

      {/* Profile Edit Modal */}
      {showEditModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header-row">
              <h3>Edit Profile</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ marginTop: '16px' }}>
              {/* Circular Avatar with Small Pencil Icon */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <img
                    src={editAvatar || DEFAULT_AVATAR}
                    alt="Avatar Preview"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--primary)',
                      display: 'block'
                    }}
                  />
                  <label
                    htmlFor="avatar-upload-file-input"
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '28px',
                      height: '28px',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      border: '2px solid #ffffff',
                      transition: 'transform 0.15s ease, background-color 0.15s ease'
                    }}
                    title="Upload / Change Photo"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <input
                      id="avatar-upload-file-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarFileChange}
                    />
                  </label>
                </div>
                {editAvatar && editAvatar !== DEFAULT_AVATAR && (
                  <button
                    type="button"
                    onClick={() => setEditAvatar(DEFAULT_AVATAR)}
                    style={{
                      marginTop: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '2px 8px',
                      textDecoration: 'underline'
                    }}
                  >
                    Reset to default icon
                  </button>
                )}
              </div>

              <div className="auth-field-group" style={{ marginBottom: '14px' }}>
                <label className="auth-label">Display Name</label>
                <input
                  type="text"
                  className="auth-input-line"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group" style={{ marginBottom: '22px' }}>
                <label className="auth-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input-line"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
