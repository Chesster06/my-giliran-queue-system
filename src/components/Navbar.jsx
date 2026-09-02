import React, { useState } from 'react';

export function Navbar({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        try {
          window.lenis.scrollTo(el, { offset: -72 });
        } catch {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  }

  return (
    <header style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (onNavigate) onNavigate('landing');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="MyGiliran Home Page"
        >
          <img
            src="/logo-icon.png?v=2"
            alt="MyGiliran Logo"
            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'contain' }}
          />
          <span style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#0e4c49' }}>
            My<span style={{ color: '#58c4a1' }}>Giliran</span>
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '20px' }} className="desktop-nav" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', padding: '6px 0' }}
            onMouseOver={(e) => (e.target.style.color = 'var(--primary)')}
            onMouseOut={(e) => (e.target.style.color = 'var(--text-muted)')}
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', padding: '6px 0' }}
            onMouseOver={(e) => (e.target.style.color = 'var(--primary)')}
            onMouseOut={(e) => (e.target.style.color = 'var(--text-muted)')}
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('industries')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', padding: '6px 0' }}
            onMouseOver={(e) => (e.target.style.color = 'var(--primary)')}
            onMouseOut={(e) => (e.target.style.color = 'var(--text-muted)')}
          >
            Industries
          </button>

          {/* Auth Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '6px' }}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#0f172a',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background-color 0.15s'
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#f1f5f9')}
              onMouseOut={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              Log in
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate && onNavigate('register')}
              style={{ height: '38px', padding: '0 18px', fontSize: '0.875rem' }}
            >
              Sign Up Free
            </button>
          </div>
        </nav>

        {/* Mobile Hamburger Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="mobile-nav-toggle">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Open Navigation Menu"
            style={{ minHeight: '44px', padding: '0 14px' }}
          >
            Menu {mobileMenuOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => scrollToSection('how-it-works')}
          >
            How It Works
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => scrollToSection('features')}
          >
            Features
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => scrollToSection('industries')}
          >
            Industries
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'center', minHeight: '44px', fontWeight: '700' }}
              onClick={() => {
                setMobileMenuOpen(false);
                if (onNavigate) onNavigate('login');
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ justifyContent: 'center', minHeight: '44px' }}
              onClick={() => {
                setMobileMenuOpen(false);
                if (onNavigate) onNavigate('register');
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
}
