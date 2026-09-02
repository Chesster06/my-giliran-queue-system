import React from 'react';

export function Footer({ onNavigate }) {
  return (
    <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '48px 0 32px 0', marginTop: '64px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px', marginBottom: '36px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src="/logo-icon.png?v=2"
                  alt="MyGiliran Logo"
                  style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'contain' }}
                />
              </div>
              <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
                My<span style={{ color: '#58c4a1' }}>Giliran</span>
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', maxWidth: '320px' }}>
              One scan, one turn. Fast, mobile-first QR queue management system for counters and service premises.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>
              Quick Links
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  style={{ color: '#cbd5e1', textAlign: 'left' }}
                >
                  Home Page
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  style={{ color: '#cbd5e1', textAlign: 'left' }}
                >
                  Management Console
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  style={{ color: '#cbd5e1', textAlign: 'left' }}
                >
                  Merchant Login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  style={{ color: '#cbd5e1', textAlign: 'left' }}
                >
                  Create Merchant Account
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('landing');
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ color: '#cbd5e1', textAlign: 'left' }}
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('landing');
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ color: '#cbd5e1', textAlign: 'left' }}
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('landing');
                    document.getElementById('industries')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ color: '#cbd5e1', textAlign: 'left' }}
                >
                  Industries & Use Cases
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>
              Core Philosophy
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
              Customers never need to download an app or create an account. Simply scan the counter QR code and enter their name.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #334155', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '0.8125rem' }}>
          <div>
            &copy; {new Date().getFullYear()} MyGiliran. All rights reserved.
          </div>
          <div>
            Built for modern businesses, service centers, and public counters.
          </div>
        </div>
      </div>
    </footer>
  );
}
