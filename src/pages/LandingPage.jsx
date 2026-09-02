import React, { useState, useEffect } from 'react';
import { INDUSTRY_EXAMPLES } from '../constants';
import { generateQrDataUrl } from '../lib/qrcode';
import { getCustomerAccessUrl } from '../lib/networkConfig';

export function LandingPage() {
  const [sampleQrUrl, setSampleQrUrl] = useState('');

  useEffect(() => {
    // Generate sample QR code representation using phone accessible Wi-Fi URL
    const targetUrl = getCustomerAccessUrl('counter-demo');
    generateQrDataUrl(targetUrl, { width: 220 }).then(setSampleQrUrl);
  }, []);

  function scrollToSection(id) {
    if (window.lenis) {
      window.lenis.scrollTo(`#${id}`, { offset: -72 });
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section style={{ padding: '64px 0 56px 0', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '16px' }}>
              One Scan, One Turn.
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '28px' }}>
              Effortlessly manage your customer queues without requiring app installations. Customers simply scan the counter QR code, enter their name, and receive their queue ticket instantly.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => scrollToSection('how-it-works')}
              >
                Explore How It Works
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => scrollToSection('features')}
              >
                Features & Benefits
              </button>
            </div>
          </div>

          {/* Workflow Preview Card */}
          <div className="card" style={{ border: '2px solid var(--border-subtle)', background: 'linear-gradient(to bottom, #ffffff, #f8fafc)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '18px' }}>
              <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Simple 4-Step Process</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--text-main)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Scan Counter QR Code</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Customers scan the QR code using any smartphone camera.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--text-main)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Enter Customer Name</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Fast input without complicated registration or passwords.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--text-main)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
                  3
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Get Live Digital Ticket</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Live updates of estimated wait time and people ahead.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
                  4
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Get Served Seamlessly</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Receive your turn notification and proceed to the counter.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" style={{ padding: '64px 0', scrollMarginTop: '72px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '12px' }}>
              How MyGiliran Works
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>
              A frictionless queue journey designed for both service providers and walk-in visitors.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div className="card" style={{ border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem', marginBottom: '16px' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                1. Counter Prints QR
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Premises display their generated counter QR code on acrylic desk stands, posters, or digital displays.
              </p>
            </div>

            <div className="card" style={{ border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem', marginBottom: '16px' }}>
                2
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                2. Customer Scans
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Visitors scan using any standard iOS or Android camera. No app store installation or sign-up needed.
              </p>
            </div>

            <div className="card" style={{ border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem', marginBottom: '16px' }}>
                3
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                3. Live Turn Updates
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                The mobile screen updates in real time showing the number currently being called and queue position.
              </p>
            </div>

            <div className="card" style={{ border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem', marginBottom: '16px' }}>
                4
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                4. Call & Complete
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Counter staff call the next number with one tap, smoothly clearing lines without overcrowding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES & PRODUCT HIGHLIGHTS SECTION */}
      <section id="features" style={{ padding: '64px 0', scrollMarginTop: '72px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
                Engineered for Speed and Simplicity
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px', fontSize: '1.05rem' }}>
                Built to solve the headache of waiting lines without expensive hardware or clunky kiosk machines.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>✓</span>
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>Safe Sequential Numbering:</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Automated ticketing system with custom prefixes ([A], [B]) preventing collisions.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>✓</span>
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>Contactless Mobile Check-In:</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Visitors hold their tickets on their personal phones, keeping physical lobbies clean and spacious.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>✓</span>
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>Instant QR Code Generation:</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Easily print or share your unique venue counter QR code anytime.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>✓</span>
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>High Performance & Low Data:</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ultra-lightweight web interface that loads instantly even on weak cellular networks.</div>
                  </div>
                </li>
              </ul>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => scrollToSection('how-it-works')}
              >
                Learn More About Workflow
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div className="card" style={{ display: 'inline-block', padding: '28px', maxWidth: '360px', width: '100%', border: '2px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                  Interactive QR Preview
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Scan with your phone to preview customer ticket
                </div>
                {sampleQrUrl ? (
                  <img
                    src={sampleQrUrl}
                    alt="MyGiliran Queue QR Code"
                    style={{ width: '220px', height: '220px', margin: '0 auto 16px auto', display: 'block', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                ) : (
                  <div style={{ width: '220px', height: '220px', margin: '0 auto 16px auto', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    Generating QR...
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Each counter queue has a unique QR code for instant customer check-in.
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => scrollToSection('how-it-works')}
                >
                  View 4-Step Process
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES & USE CASES SECTION */}
      <section id="industries" style={{ padding: '64px 0', scrollMarginTop: '72px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '12px' }}>
              Built For Any Industry
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>
              MyGiliran is universally adaptable. Designed to streamline walk-in queues across various premises and industries with zero friction.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {INDUSTRY_EXAMPLES.map((item, idx) => (
              <div
                key={idx}
                className="card"
                style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-subtle)' }}
              >
                <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.1rem' }}>✓</span>
                <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION SECTION */}
      <section id="cta" style={{ padding: '72px 0', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)' }}>
            Start Managing Your Premises Queue
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '28px', lineHeight: '1.6' }}>
            Fast, contactless, and lightweight QR queue system. Ready to deploy immediately at your counters.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '14px 32px', fontSize: '1.05rem' }}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Back to Top
          </button>
        </div>
      </section>
    </div>
  );
}
