import React, { useState, useEffect } from 'react';
import {
  getAllQueues,
  getQueueEntries,
  callNextNumber,
  updateEntryStatus,
  updateQueueSettings,
  resetQueueCounter,
  playCallChime,
  createNewQueue,
  deleteQueue,
  joinQueue,
  subscribeToQueue,
  clearAllSystemData,
  QUEUE_STATUS
} from '../lib/queueStore';
import { generateQrDataUrl } from '../lib/qrcode';
import { getCustomerAccessUrl } from '../lib/networkConfig';
import { AdminSidebar } from '../components/AdminSidebar';
import {
  TvIcon,
  PrinterIcon,
  TrashIcon,
  QrIcon,
  CopyIcon,
  VolumeIcon,
  MegaphoneIcon,
  CheckIcon,
  UserIcon,
  ExternalLinkIcon,
  BellIcon,
  RefreshIcon,
  PlusIcon
} from '../components/Icons';

export function AdminDashboardPage({ onNavigate }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'projects', 'settings'
  const [queues, setQueues] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null); // When inside a specific project
  const [callAlertMsg, setCallAlertMsg] = useState('');

  // Create Project State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPrefix, setNewProjectPrefix] = useState('A');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // QR Modal State
  const [selectedQrProject, setSelectedQrProject] = useState(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState('');

  // Walkin inside project
  const [walkinName, setWalkinName] = useState('');

  // Project Settings edit
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectPrefix, setEditProjectPrefix] = useState('A');
  const [saveProjectStatus, setSaveProjectStatus] = useState('');

  // Global Settings State
  const [merchantName, setMerchantName] = useState(localStorage.getItem('mygiliran_merchant_name') || 'Klinik & Kaunter Servis');
  const [branchName, setBranchName] = useState(localStorage.getItem('mygiliran_branch_name') || 'Cawangan Utama');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Load initial data and subscribe
  useEffect(() => {
    refreshAllData();
    const unsub = subscribeToQueue('all', refreshAllData);
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Sync selectedProject edit inputs
  useEffect(() => {
    if (selectedProject) {
      setEditProjectName(selectedProject.name);
      setEditProjectPrefix(selectedProject.prefix || 'A');
    }
  }, [selectedProject?.id]);

  function refreshAllData() {
    const qList = getAllQueues();
    setQueues(qList);

    // Collect all entries across queues
    let combinedEntries = [];
    qList.forEach((q) => {
      const qEntries = getQueueEntries(q.id);
      combinedEntries = combinedEntries.concat(qEntries);
    });
    setAllEntries(combinedEntries);

    // Keep selectedProject up to date
    if (selectedProject) {
      const refreshed = qList.find((q) => q.id === selectedProject.id);
      setSelectedProject(refreshed || null);
    }
  }

  // Handle Call Next inside Project
  function handleCallNext(project) {
    if (!project) return;
    playCallChime();
    const nextEntry = callNextNumber(project.id);
    if (nextEntry) {
      setCallAlertMsg(`Calling Number ${nextEntry.queue_number} (${nextEntry.customer_name})!`);
    } else {
      setCallAlertMsg(`No waiting customers in ${project.name}.`);
    }
    setTimeout(() => setCallAlertMsg(''), 4500);
    refreshAllData();
  }

  // Handle Recall
  function handleRecall(project) {
    if (!project || !project.current_serving || project.current_serving === '-') return;
    playCallChime();
    setCallAlertMsg(`Recalling Number ${project.current_serving} to ${project.name}!`);
    setTimeout(() => setCallAlertMsg(''), 4000);
  }

  // Handle Create New Project
  function handleCreateProject(e) {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const created = createNewQueue({
      name: newProjectName.trim(),
      prefix: newProjectPrefix.trim().toUpperCase() || 'A',
      description: newProjectDesc.trim()
    });

    setNewProjectName('');
    setNewProjectPrefix('A');
    setNewProjectDesc('');
    setShowCreateModal(false);
    setSelectedProject(created); // Automatically enter the new project workspace!
    setActiveTab('projects');
    setCallAlertMsg(`Project "${created.name}" created! You are now in its workspace.`);
    setTimeout(() => setCallAlertMsg(''), 4000);
    refreshAllData();
  }

  // Handle Delete Project
  function handleDeleteProject(e, project) {
    e.stopPropagation();
    const confirmDel = window.confirm(`Delete "${project.name}" and all its queue records?`);
    if (confirmDel) {
      deleteQueue(project.id);
      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
      }
      setCallAlertMsg(`Project "${project.name}" deleted.`);
      setTimeout(() => setCallAlertMsg(''), 3000);
      refreshAllData();
    }
  }

  // Open QR Print Modal
  function handleOpenQrModal(e, project) {
    if (e) e.stopPropagation();
    setSelectedQrProject(project);
    const customerUrl = getCustomerAccessUrl(project.slug);
    generateQrDataUrl(customerUrl, { width: 300 }).then(setQrModalDataUrl);
  }

  // Open TV View for project
  function handleOpenTvView(e, project) {
    if (e) e.stopPropagation();
    if (onNavigate) {
      onNavigate('tv', project.slug);
    } else {
      window.open(`/?page=tv&slug=${project.slug}`, '_blank');
    }
  }

  // Handle Issue Walk-In
  function handleIssueWalkin(e, projectId) {
    e.preventDefault();
    if (!walkinName.trim() || !projectId) return;
    const entry = joinQueue(projectId, walkinName.trim());
    setWalkinName('');
    setCallAlertMsg(`Walk-in ticket ${entry.queue_number} issued for ${entry.customer_name}!`);
    setTimeout(() => setCallAlertMsg(''), 4000);
    refreshAllData();
  }

  // Save Project settings
  function handleSaveProjectSettings(e) {
    e.preventDefault();
    if (!selectedProject) return;
    updateQueueSettings(selectedProject.id, {
      name: editProjectName.trim() || selectedProject.name,
      prefix: editProjectPrefix.trim().toUpperCase().charAt(0) || 'A'
    });
    setSaveProjectStatus('Project details updated successfully!');
    setTimeout(() => setSaveProjectStatus(''), 3000);
    refreshAllData();
  }

  // Reset Project Counter
  function handleResetProjectCounter(projectId) {
    const confirmReset = window.confirm("Reset this project's queue counter to 0 for today?");
    if (confirmReset) {
      resetQueueCounter(projectId);
      setCallAlertMsg('Queue counter reset to 0 for this project.');
      setTimeout(() => setCallAlertMsg(''), 3000);
      refreshAllData();
    }
  }

  // Save Global Settings
  function handleSaveSettings(e) {
    e.preventDefault();
    localStorage.setItem('mygiliran_merchant_name', merchantName);
    localStorage.setItem('mygiliran_branch_name', branchName);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  }

  // Reset All Daily Counters
  function handleResetAllCounters() {
    const confirmReset = window.confirm('Reset ALL projects queue numbers to 0 for today?');
    if (confirmReset) {
      queues.forEach((q) => resetQueueCounter(q.id));
      setCallAlertMsg('All daily counter numbers have been reset to 0.');
      setTimeout(() => setCallAlertMsg(''), 4000);
      refreshAllData();
    }
  }

  // Wipe / Clear All System Data (Projects + Tickets)
  function handleClearAllData() {
    const confirmWipe = window.confirm('Are you sure you want to WIPE & CLEAR ALL DATA? All projects, queues, and customer tickets will be permanently deleted.');
    if (confirmWipe) {
      clearAllSystemData();
      setSelectedProject(null);
      setCallAlertMsg('All projects and queue tickets have been completely cleared.');
      setTimeout(() => setCallAlertMsg(''), 4000);
      refreshAllData();
    }
  }

  // Summarize Monitoring calculations
  const totalWaiting = allEntries.filter((e) => e.status === QUEUE_STATUS.WAITING).length;
  const totalServedToday = allEntries.filter((e) => e.status === QUEUE_STATUS.COMPLETED).length;
  const totalProjects = queues.length;

  // If a project is selected, get its dedicated entries
  const currentProjectEntries = selectedProject ? getQueueEntries(selectedProject.id) : [];
  const currentProjectWaiting = currentProjectEntries.filter((e) => e.status === QUEUE_STATUS.WAITING);
  const currentProjectServing = currentProjectEntries.find((e) => e.status === QUEUE_STATUS.SERVING);

  return (
    <div className="admin-layout-root">
      
      {/* Sidebar Navigation */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'projects') {
            setSelectedProject(null);
          }
        }}
        queues={queues}
        waitingCount={totalWaiting}
        onNavigate={onNavigate}
      />

      {/* Main Content Area */}
      <main className="admin-main-area">
        
        {/* Top Navigation Bar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            {activeTab === 'home' && (
              <h1 className="topbar-title">Dashboard</h1>
            )}

            {activeTab === 'projects' && !selectedProject && (
              <h1 className="topbar-title">Projects</h1>
            )}

            {activeTab === 'projects' && selectedProject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setSelectedProject(null)}
                  style={{ fontWeight: '700' }}
                >
                  ← All Projects
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <h1 className="topbar-title" style={{ margin: 0 }}>
                  {selectedProject.name}
                </h1>
                <span className="project-prefix-box" style={{ width: '26px', height: '26px', fontSize: '0.8rem' }}>
                  {selectedProject.prefix}
                </span>
              </div>
            )}

            {activeTab === 'settings' && (
              <h1 className="topbar-title">Setting</h1>
            )}
          </div>

          <div className="topbar-right"></div>
        </header>

        {/* Global Announcement Alert */}
        {callAlertMsg && (
          <div className="admin-callout-banner">
            <BellIcon size={18} className="callout-icon" />
            <span className="callout-text">{callAlertMsg}</span>
          </div>
        )}

        <div className="admin-content-container">
          
          {/* ========================================================================= */}
          {/* SECTION 1: HOME CONSOLE - SUMMARIZE MONITORING */}
          {/* ========================================================================= */}
          {activeTab === 'home' && (
            <div className="summarize-monitoring-root">
              
              {/* Stat Metric Cards */}
              <div className="stats-metric-grid">
                <div className="stat-card">
                  <span className="stat-label">TOTAL ACTIVE PROJECTS</span>
                  <div className="stat-number-val">{totalProjects}</div>
                  <span className="stat-sub-note">Registered QR Environments</span>
                </div>

                <div className="stat-card stat-accent-card">
                  <span className="stat-label">CUSTOMERS IN WAITING</span>
                  <div className="stat-number-val">{totalWaiting}</div>
                  <span className="stat-sub-note">Across all projects currently</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">TOTAL SERVED TODAY</span>
                  <div className="stat-number-val">{totalServedToday}</div>
                  <span className="stat-sub-note">Completed turns</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">ESTIMATED AVG TURN</span>
                  <div className="stat-number-val">~3m</div>
                  <span className="stat-sub-note">Live queue processing</span>
                </div>
              </div>

              {/* Projects Overview Grid */}
              <div className="monitoring-section-header">
                <div>
                  <h2 className="section-title">Projects Monitoring Overview</h2>
                  <p className="text-muted text-sm">Click any project to enter its dedicated workspace with Call Console, TV View, and QR.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={refreshAllData}
                >
                  <RefreshIcon size={13} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="projects-live-cards-grid">
                {queues.map((project) => {
                  const pEntries = getQueueEntries(project.id);
                  const pWaiting = pEntries.filter((e) => e.status === QUEUE_STATUS.WAITING);
                  const pServing = pEntries.find((e) => e.status === QUEUE_STATUS.SERVING);

                  return (
                    <div
                      key={project.id}
                      className="project-monitor-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedProject(project);
                        setActiveTab('projects');
                      }}
                    >
                      <div className="card-top-info">
                        <div className="project-meta-box">
                          <span className="project-prefix-box">{project.prefix}</span>
                          <div>
                            <h3 className="project-card-title">{project.name}</h3>
                            <span className="project-card-slug">/{project.slug}</span>
                          </div>
                        </div>

                        <div className="wait-count-box">
                          <span className="count-num">{pWaiting.length}</span>
                          <span className="count-txt">WAITING</span>
                        </div>
                      </div>

                      {/* Big Serving Display */}
                      <div className="serving-display-panel">
                        <span className="serving-eyebrow">NOW SERVING</span>
                        <div className="serving-digits">
                          {pServing ? pServing.queue_number : (project.current_serving !== '-' ? project.current_serving : '---')}
                        </div>
                        {pServing && (
                          <div className="serving-customer-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <UserIcon size={14} />
                            <span>{pServing.customer_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Controls */}
                      <div className="monitor-card-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                            setActiveTab('projects');
                          }}
                        >
                          Enter Workspace ➔
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={(e) => handleOpenTvView(e, project)}
                          title="Open TV View"
                        >
                          <TvIcon size={14} />
                          <span>TV</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={(e) => handleOpenQrModal(e, project)}
                          title="Print QR"
                        >
                          <QrIcon size={14} />
                          <span>QR</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cross-Project Recent Activity Log */}
              <div className="card live-activity-feed-card" style={{ marginTop: '28px' }}>
                <h3 className="card-section-title">Cross-Project Recent Activity Log</h3>
                {allEntries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No queue transactions recorded yet.
                  </div>
                ) : (
                  <div className="table-responsive-wrapper">
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>Ticket No</th>
                          <th>Project</th>
                          <th>Customer</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allEntries.slice(0, 8).map((entry) => {
                          const parentProject = queues.find((q) => q.id === entry.queue_id);
                          return (
                            <tr key={entry.id}>
                              <td className="font-mono font-bold">{entry.queue_number}</td>
                              <td>{parentProject?.name || 'Project'}</td>
                              <td>{entry.customer_name}</td>
                              <td className="text-muted text-sm">
                                {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td>
                                <span className={`status-tag status-${entry.status}`}>
                                  {entry.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: PROJECT (TABLE OF PROJECTS & DEDICATED PROJECT WORKSPACE) */}
          {/* ========================================================================= */}
          {activeTab === 'projects' && (
            <div>
              {/* SUBVIEW A: PROJECTS TABLE LIST */}
              {!selectedProject && (
                <div className="project-page-root">
                  <div className="project-action-bar">
                    <div>
                      <h2 className="section-title">Registered Projects & QR Standees</h2>
                      <p className="text-muted text-sm">
                        Each project has its own dedicated Calling Console, TV View, and scan QR code. Click a project to enter.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => setShowCreateModal(true)}
                    >
                      <PlusIcon size={14} />
                      <span>Create New Project</span>
                    </button>
                  </div>

                  <div className="card project-table-card" style={{ marginTop: '20px' }}>
                    <div className="table-responsive-wrapper">
                      <table className="admin-data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '80px' }}>QR Code</th>
                            <th>Project Name</th>
                            <th>Prefix</th>
                            <th>Now Serving</th>
                            <th>Waiting</th>
                            <th>Live URL</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queues.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                No projects registered yet. Click "+ Create New Project" to add one!
                              </td>
                            </tr>
                          ) : (
                            queues.map((project) => {
                              const pEntries = getQueueEntries(project.id);
                              const pWaiting = pEntries.filter((e) => e.status === QUEUE_STATUS.WAITING);
                              const customerUrl = getCustomerAccessUrl(project.slug);

                              return (
                                <tr
                                  key={project.id}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setSelectedProject(project)}
                                >
                                  {/* QR Thumbnail */}
                                  <td>
                                    <button
                                      type="button"
                                      className="qr-thumb-btn"
                                      onClick={(e) => handleOpenQrModal(e, project)}
                                      title="Click to view/print QR"
                                    >
                                      <QrIcon size={24} />
                                    </button>
                                  </td>

                                  {/* Project Details */}
                                  <td>
                                    <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                      {project.name}
                                    </div>
                                    <div className="text-muted text-sm">{project.description || 'General queue counter'}</div>
                                  </td>

                                  {/* Prefix */}
                                  <td>
                                    <span className="project-prefix-box">{project.prefix}</span>
                                  </td>

                                  {/* Serving */}
                                  <td>
                                    <span className="font-mono font-bold" style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                                      {project.current_serving !== '-' ? project.current_serving : '---'}
                                    </span>
                                  </td>

                                  {/* Waiting */}
                                  <td>
                                    <span className="font-bold">{pWaiting.length}</span>
                                  </td>

                                  {/* Customer URL */}
                                  <td>
                                    <button
                                      type="button"
                                      className="url-link-btn"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(customerUrl);
                                        alert('Copied customer URL to clipboard!');
                                      }}
                                      title="Click to copy URL"
                                    >
                                      <span>/{project.slug}</span>
                                      <CopyIcon size={12} />
                                    </button>
                                  </td>

                                  {/* Actions */}
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedProject(project);
                                        }}
                                      >
                                        Open Workspace ➔
                                      </button>

                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-xs"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        onClick={(e) => handleOpenTvView(e, project)}
                                        title="TV View"
                                      >
                                        <TvIcon size={13} />
                                        <span>TV</span>
                                      </button>

                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-xs"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        onClick={(e) => handleOpenQrModal(e, project)}
                                        title="Print QR"
                                      >
                                        <PrinterIcon size={13} />
                                        <span>QR</span>
                                      </button>

                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-xs"
                                        style={{ color: '#dc2626', padding: '5px 7px' }}
                                        onClick={(e) => handleDeleteProject(e, project)}
                                        title="Delete Project"
                                      >
                                        <TrashIcon size={13} />
                                      </button>
                                    </div>
                                  </td>

                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW B: DEDICATED PROJECT WORKSPACE (CALL CONSOLE, TV, QR, TICKETS) */}
              {selectedProject && (
                <div className="project-workspace-root">
                  
                  {/* Workspace Subheader Toolbar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                        {selectedProject.name} — Workspace
                      </h2>
                      <p className="text-muted text-sm" style={{ margin: 0 }}>
                        Dedicated Call Console, TV View, and Ticket Queue for this project.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={(e) => handleOpenTvView(e, selectedProject)}
                      >
                        <TvIcon size={15} />
                        <span>Open TV View</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={(e) => handleOpenQrModal(e, selectedProject)}
                      >
                        <PrinterIcon size={15} />
                        <span>Printable QR Stand</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          window.open(`/?page=customer&slug=${selectedProject.slug}`, '_blank');
                        }}
                      >
                        <span>Customer View</span>
                        <ExternalLinkIcon size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Main Project 2-Column Console Layout */}
                  <div className="console-grid">
                    
                    {/* LEFT COLUMN: HERO CALL CONSOLE */}
                    <div className="card console-hero-card">
                      <div className="console-hero-header">
                        <span className="hero-eyebrow">CURRENTLY SERVING • {selectedProject.name.toUpperCase()}</span>
                        <span className="hero-time-indicator">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="serving-big-number">
                        {currentProjectServing ? currentProjectServing.queue_number : (selectedProject.current_serving !== '-' ? selectedProject.current_serving : '---')}
                      </div>

                      {currentProjectServing ? (
                        <div className="serving-customer-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                          <UserIcon size={16} />
                          <span>Customer: <strong>{currentProjectServing.customer_name}</strong></span>
                        </div>
                      ) : (
                        <div className="serving-customer-name text-muted">
                          No customer currently serving.
                        </div>
                      )}

                      {/* Primary Action: CALL NEXT NUMBER */}
                      <button
                        type="button"
                        className="btn btn-primary call-hero-btn"
                        onClick={() => handleCallNext(selectedProject)}
                      >
                        <span className="call-btn-icon">
                          <MegaphoneIcon size={24} />
                        </span>
                        <div className="call-btn-content">
                          <span className="call-btn-title">CALL NEXT NUMBER</span>
                          <span className="call-btn-sub">
                            ({currentProjectWaiting.length} customers waiting in this project)
                          </span>
                        </div>
                      </button>

                      {/* Secondary Action Controls */}
                      <div className="hero-subactions">
                        <button
                          type="button"
                          className="btn btn-secondary subaction-btn"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                          onClick={() => handleRecall(selectedProject)}
                          disabled={!currentProjectServing}
                        >
                          <VolumeIcon size={14} />
                          <span>Recall Chime</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary subaction-btn"
                          style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', borderColor: 'var(--primary-border)', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                          onClick={() => {
                            if (currentProjectServing) {
                              updateEntryStatus(currentProjectServing.id, QUEUE_STATUS.COMPLETED);
                              refreshAllData();
                            }
                          }}
                          disabled={!currentProjectServing}
                        >
                          <CheckIcon size={14} />
                          <span>Complete Ticket</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary subaction-btn"
                          style={{ color: '#dc2626' }}
                          onClick={() => {
                            if (currentProjectServing) {
                              updateEntryStatus(currentProjectServing.id, QUEUE_STATUS.SKIPPED);
                              refreshAllData();
                            }
                          }}
                          disabled={!currentProjectServing}
                        >
                          Skip
                        </button>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: STATS, ISSUE WALKIN, NEXT IN LINE */}
                    <div className="console-sidebar-column">
                      
                      {/* Metric summary for this project */}
                      <div className="console-stats-row">
                        <div className="card mini-stat-card">
                          <span className="stat-label">IN WAITING</span>
                          <span className="stat-value">{currentProjectWaiting.length}</span>
                        </div>
                        <div className="card mini-stat-card">
                          <span className="stat-label">SERVED TODAY</span>
                          <span className="stat-value">
                            {currentProjectEntries.filter((e) => e.status === QUEUE_STATUS.COMPLETED).length}
                          </span>
                        </div>
                      </div>

                      {/* Issue Walk-in form for this project */}
                      <div className="card walkin-add-card">
                        <h3 className="card-section-title">Issue Walk-In Ticket</h3>
                        <form onSubmit={(e) => handleIssueWalkin(e, selectedProject.id)} className="walkin-form">
                          <input
                            type="text"
                            className="auth-input-line"
                            placeholder="Customer Name (e.g. Encik Razak)"
                            value={walkinName}
                            onChange={(e) => setWalkinName(e.target.value)}
                            required
                          />
                          <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <PlusIcon size={13} />
                            <span>Print Ticket</span>
                          </button>
                        </form>
                      </div>

                      {/* Next in Line for this project */}
                      <div className="card next-line-card">
                        <div className="next-line-header">
                          <h3 className="card-section-title">Next In Line</h3>
                          <span className="text-muted text-sm">{currentProjectWaiting.length} waiting</span>
                        </div>

                        {currentProjectWaiting.length === 0 ? (
                          <div className="empty-waiting-box">
                            <span>Queue is clear! No customers waiting.</span>
                          </div>
                        ) : (
                          <ul className="waiting-mini-list">
                            {currentProjectWaiting.slice(0, 5).map((entry, idx) => (
                              <li key={entry.id} className="waiting-mini-item">
                                <div className="item-position-badge">#{idx + 1}</div>
                                <div className="item-details">
                                  <span className="item-num">{entry.queue_number}</span>
                                  <span className="item-name">{entry.customer_name}</span>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm item-call-btn"
                                  onClick={() => {
                                    updateEntryStatus(entry.id, QUEUE_STATUS.SERVING);
                                    updateQueueSettings(selectedProject.id, { current_serving: entry.queue_number });
                                    playCallChime();
                                    refreshAllData();
                                  }}
                                >
                                  Call Direct
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                    </div>

                  </div>

                  {/* BOTTOM: ALL TICKETS LOG FOR THIS PROJECT */}
                  <div className="card entries-table-card" style={{ marginTop: '28px' }}>
                    <div className="table-header-row">
                      <div>
                        <h3 className="card-title">All Tickets in {selectedProject.name}</h3>
                        <p className="card-subtitle">Complete log of tickets issued for this project.</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={refreshAllData}
                      >
                        <RefreshIcon size={13} />
                        <span>Refresh List</span>
                      </button>
                    </div>

                    <div className="table-responsive-wrapper">
                      <table className="admin-data-table">
                        <thead>
                          <tr>
                            <th>Ticket No</th>
                            <th>Customer Name</th>
                            <th>Time Registered</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentProjectEntries.length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                No tickets created yet for this project. Scan QR or issue a walk-in ticket above!
                              </td>
                            </tr>
                          ) : (
                            currentProjectEntries.map((item) => (
                              <tr key={item.id}>
                                <td className="font-mono font-bold">{item.queue_number}</td>
                                <td className="font-semibold">{item.customer_name}</td>
                                <td className="text-muted text-sm">
                                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td>
                                  <span className={`status-tag status-${item.status}`}>
                                    {item.status.toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    {item.status === QUEUE_STATUS.WAITING && (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-xs"
                                        onClick={() => {
                                          updateEntryStatus(item.id, QUEUE_STATUS.SERVING);
                                          updateQueueSettings(selectedProject.id, { current_serving: item.queue_number });
                                          playCallChime();
                                          refreshAllData();
                                        }}
                                      >
                                        Call
                                      </button>
                                    )}
                                    {item.status === QUEUE_STATUS.SERVING && (
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-xs"
                                        onClick={() => {
                                          updateEntryStatus(item.id, QUEUE_STATUS.COMPLETED);
                                          refreshAllData();
                                        }}
                                      >
                                        Done
                                      </button>
                                    )}
                                    {item.status !== QUEUE_STATUS.COMPLETED && (
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-xs"
                                        style={{ color: '#dc2626' }}
                                        onClick={() => {
                                          updateEntryStatus(item.id, QUEUE_STATUS.CANCELLED);
                                          refreshAllData();
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PROJECT SETTINGS & DAILY RESET */}
                  <div className="card settings-card" style={{ marginTop: '28px' }}>
                    <h3 className="card-title">Project Configuration & Daily Reset</h3>
                    <p className="card-subtitle" style={{ marginBottom: '20px' }}>
                      Update details for {selectedProject.name} or reset today's queue count.
                    </p>

                    {saveProjectStatus && (
                      <div className="auth-alert success" style={{ marginBottom: '16px' }}>
                        {saveProjectStatus}
                      </div>
                    )}

                    <form onSubmit={handleSaveProjectSettings} style={{ maxWidth: '440px' }}>
                      <div className="auth-field-group" style={{ marginBottom: '14px' }}>
                        <label className="auth-label">Project Name</label>
                        <input
                          type="text"
                          className="auth-input-line"
                          value={editProjectName}
                          onChange={(e) => setEditProjectName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="auth-field-group" style={{ marginBottom: '18px' }}>
                        <label className="auth-label">Ticket Prefix Letter</label>
                        <input
                          type="text"
                          maxLength="2"
                          className="auth-input-line"
                          value={editProjectPrefix}
                          onChange={(e) => setEditProjectPrefix(e.target.value)}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-primary">
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleResetProjectCounter(selectedProject.id)}
                        >
                          <RefreshIcon size={13} />
                          <span>Daily Reset for This Project</span>
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: SETTING (SYSTEM & MERCHANT) */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="card settings-card" style={{ maxWidth: '100%' }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 className="card-title">System & Merchant Settings</h2>
                <p className="card-subtitle" style={{ margin: 0 }}>
                  Configure your store details, audio chime testing, and master reset controls.
                </p>
              </div>

              {settingsSaved && (
                <div className="auth-alert success" style={{ marginBottom: '20px' }}>
                  Settings saved successfully!
                </div>
              )}

              {/* SECTION 1: MERCHANT PROFILE DETAILS */}
              <form onSubmit={handleSaveSettings} style={{ marginBottom: '28px' }}>
                <div className="settings-grid-2col" style={{ marginBottom: '20px' }}>
                  <div className="auth-field-group">
                    <label className="auth-label">Business / Clinic / Store Name</label>
                    <input
                      type="text"
                      className="auth-input-line"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-label">Branch / Counter Location</label>
                    <input
                      type="text"
                      className="auth-input-line"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  Save Settings
                </button>
              </form>

              <hr style={{ margin: '24px 0', borderColor: 'var(--border-subtle)' }} />

              {/* SECTION 2: AUDIO CHIME TEST */}
              <div className="settings-action-row">
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                    Audio Chime Speaker Test
                  </h3>
                  <p className="text-muted text-sm" style={{ margin: 0 }}>
                    Test the high-definition Ding-Dong airport chime played through speakers when calling customer tickets.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  onClick={() => playCallChime()}
                >
                  <VolumeIcon size={14} />
                  <span>Test Chime Sound</span>
                </button>
              </div>

              <hr style={{ margin: '24px 0', borderColor: 'var(--border-subtle)' }} />

              {/* SECTION 3: DANGER ZONE PANEL */}
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#991b1b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚠️ Danger Zone & Reset Controls</span>
                  </h3>
                  <p className="text-muted text-sm" style={{ margin: '4px 0 0 0' }}>
                    Actions here directly modify or clear queue turns and saved system records.
                  </p>
                </div>

                <div className="danger-zone-container">
                  <div className="danger-zone-header">
                    <h3>Critical System Actions</h3>
                  </div>

                  {/* Row 1: Daily Counter Reset */}
                  <div className="danger-zone-row">
                    <div className="danger-zone-meta">
                      <h4 className="danger-zone-title">Master Daily Counter Reset</h4>
                      <p className="danger-zone-desc">
                        Reset all project ticket numbers back to #1 and clear today's queue turns across all counters for a new business day.
                      </p>
                    </div>
                    <div className="danger-zone-action">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                        onClick={handleResetAllCounters}
                      >
                        <RefreshIcon size={13} />
                        <span>Reset Today's Counters</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Permanent Factory Data Wipe */}
                  <div className="danger-zone-row">
                    <div className="danger-zone-meta">
                      <h4 className="danger-zone-title critical">Permanent Factory Wipe</h4>
                      <p className="danger-zone-desc">
                        Permanently clear and wipe ALL registered projects, active queues, and customer ticket history. Starts with a pristine, empty dashboard.
                      </p>
                    </div>
                    <div className="danger-zone-action">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', whiteSpace: 'nowrap' }}
                        onClick={handleClearAllData}
                      >
                        <TrashIcon size={14} />
                        <span>Clear & Wipe All Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW PROJECT */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Create New Project</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ marginTop: '16px' }}>
              <div className="auth-field-group" style={{ marginBottom: '16px' }}>
                <label className="auth-label">Project / Counter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kaunter Pendaftaran, Pharmacy, Dr. Room 1"
                  className="auth-input-line"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group" style={{ marginBottom: '16px' }}>
                <label className="auth-label">Ticket Prefix Letter</label>
                <input
                  type="text"
                  maxLength="2"
                  placeholder="e.g. A, B, C, P"
                  className="auth-input-line"
                  value={newProjectPrefix}
                  onChange={(e) => setNewProjectPrefix(e.target.value)}
                  required
                />
                <small className="text-muted" style={{ marginTop: '4px', display: 'block' }}>
                  Produces tickets like {newProjectPrefix.toUpperCase() || 'A'}001, {newProjectPrefix.toUpperCase() || 'A'}002...
                </small>
              </div>

              <div className="auth-field-group" style={{ marginBottom: '24px' }}>
                <label className="auth-label">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fast consultation, document submission"
                  className="auth-input-line"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project & Enter Workspace ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE QR STANDEE VIEW */}
      {/* ========================================================================= */}
      {selectedQrProject && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedQrProject(null)}>
          <div className="admin-modal-content qr-print-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Registered QR Standee</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedQrProject(null)}
              >
                ✕
              </button>
            </div>

            <div className="printable-qr-stand" style={{ marginTop: '20px', border: '2px solid var(--primary)', borderRadius: '12px' }}>
              <div className="stand-header">
                <img src="/logo-icon.png?v=2" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '6px' }} />
                <h2 className="stand-brand-name">MyGiliran</h2>
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '14px' }}>
                {selectedQrProject.name}
              </div>

              <div className="stand-qr-wrapper">
                {qrModalDataUrl ? (
                  <img src={qrModalDataUrl} alt="QR Code" style={{ width: '220px', height: '220px' }} />
                ) : (
                  <div>Generating QR...</div>
                )}
              </div>

              <div className="stand-instructions" style={{ fontSize: '0.85rem' }}>
                <p>1. Scan QR with your Phone Camera</p>
                <p>2. Enter your Name</p>
                <p>3. Watch Turn on your Phone Live</p>
              </div>

              {/* Wi-Fi Phone Direct Link Notice */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginTop: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  📶 Direct Wi-Fi Phone Access URL
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#15803d', wordBreak: 'break-all', fontWeight: '700' }}>
                  {getCustomerAccessUrl(selectedQrProject.slug)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  const url = getCustomerAccessUrl(selectedQrProject.slug);
                  navigator.clipboard.writeText(url);
                  alert('Copied phone Wi-Fi link: ' + url);
                }}
              >
                <CopyIcon size={14} />
                <span>Copy Link</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => window.print()}
              >
                <PrinterIcon size={14} />
                <span>Print Standee</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
