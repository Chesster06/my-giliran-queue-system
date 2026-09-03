import React, { useState, useEffect } from 'react';
import { initQueueStorage } from './lib/queueStore';
import { initAuthStorage, getCurrentUser, subscribeToAuth, logoutUser, resetAllCredentials } from './lib/authStore';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { CustomerQueuePage } from './pages/CustomerQueuePage';
import { AuthPage } from './pages/AuthPage';

import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { TvDisplayPage } from './pages/TvDisplayPage';

export function App() {
  const [activeRoute, setActiveRoute] = useState('landing');
  const [activeSlug, setActiveSlug] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    initQueueStorage();
    initAuthStorage();
    const user = getCurrentUser();
    if (user?.email?.toLowerCase().includes('chesstereter')) {
      resetAllCredentials();
      setCurrentUser(null);
    } else {
      setCurrentUser(user);
    }

    const unsubscribeAuth = subscribeToAuth((updatedUser) => {
      setCurrentUser(updatedUser);
    });

    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    const slugParam = params.get('slug');
    const resetParam = params.get('reset');

    if (resetParam === 'credentials' || resetParam === 'all' || resetParam === 'true') {
      resetAllCredentials();
      setCurrentUser(null);
      showToast('Semua credential dan sesi telah berjaya direset!');
    }

    if (pageParam === 'customer') {
      setActiveRoute('customer');
      if (slugParam) setActiveSlug(slugParam);
    } else if (pageParam === 'tv') {
      setActiveRoute('tv');
      if (slugParam) setActiveSlug(slugParam);
    } else if (pageParam === 'login') {
      setActiveRoute('login');
    } else if (pageParam === 'register') {
      setActiveRoute('register');
    } else if (pageParam === 'admin' || pageParam === 'dashboard') {
      setActiveRoute('admin');
    } else {
      setActiveRoute('landing');
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
    }, 3500);
  }

  function handleNavigate(route, param = '') {
    let finalRoute = 'landing';
    if (route === 'customer') {
      finalRoute = 'customer';
      setActiveSlug(param);
    } else if (route === 'tv') {
      finalRoute = 'tv';
      setActiveSlug(param);
    } else if (route === 'login') {
      finalRoute = 'login';
    } else if (route === 'register') {
      finalRoute = 'register';
    } else if (route === 'admin' || route === 'dashboard') {
      finalRoute = 'admin';
    }

    setActiveRoute(finalRoute);

    if (window.lenis) {
      window.lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const url = new URL(window.location.href);
    if (finalRoute === 'landing') {
      url.search = '';
    } else {
      url.searchParams.set('page', finalRoute);
      if ((finalRoute === 'customer' || finalRoute === 'tv') && param) {
        url.searchParams.set('slug', param);
      } else {
        url.searchParams.delete('slug');
      }
    }
    window.history.pushState({}, '', url.toString());
  }

  function handleAuthSuccess(user) {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`);
    handleNavigate('admin');
  }

  function handleLogout() {
    logoutUser();
    setCurrentUser(null);
    showToast('Logged out successfully.');
    handleNavigate('landing');
  }

  const isAuthPage = activeRoute === 'login' || activeRoute === 'register';

  if (isAuthPage) {
    return (
      <div key={`auth-view-${activeRoute}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AuthPage
          initialMode={activeRoute === 'register' ? 'register' : 'login'}
          onNavigate={handleNavigate}
          onAuthSuccess={handleAuthSuccess}
        />
        {toastMsg && (
          <div className="toast-container">
            <div className="toast">{toastMsg}</div>
          </div>
        )}
      </div>
    );
  }

  if (activeRoute === 'tv') {
    return (
      <TvDisplayPage
        queueSlug={activeSlug}
        onNavigate={handleNavigate}
      />
    );
  }

  if (activeRoute === 'admin') {
    return (
      <div key="admin-dashboard-view" style={{ minHeight: '100vh' }}>
        <AdminDashboardPage onNavigate={handleNavigate} />
        {toastMsg && (
          <div className="toast-container">
            <div className="toast">{toastMsg}</div>
          </div>
        )}
      </div>
    );
  }

  if (activeRoute === 'customer') {
    return (
      <div key={`customer-view-${activeSlug}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
        <main className="page-transition" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CustomerQueuePage
            queueSlug={activeSlug}
            onNavigate={handleNavigate}
          />
        </main>
        {toastMsg && (
          <div className="toast-container">
            <div className="toast">{toastMsg}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Banner if merchant is logged in */}
      {currentUser && (
        <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '8px 16px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 101 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            <span>Logged in as <strong>{currentUser.name}</strong> ({currentUser.email})</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}
          >
            Sign Out
          </button>
        </div>
      )}

      <Navbar onNavigate={handleNavigate} />

      <main key={`route-${activeRoute}`} className="page-transition" style={{ flex: 1 }}>
        {activeRoute === 'landing' && (
          <LandingPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Floating Notification Toast */}
      {toastMsg && (
        <div className="toast-container">
          <div className="toast">
            {toastMsg}
          </div>
        </div>
      )}

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
