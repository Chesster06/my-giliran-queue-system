import React, { useState, useEffect, useRef } from 'react';
import { getAllQueues, getQueueBySlug, getQueueEntries, playCallChime, playChimeAndVoice, subscribeToQueue, QUEUE_STATUS } from '../lib/queueStore';
import { generateQrDataUrl } from '../lib/qrcode';
import { getCustomerAccessUrl } from '../lib/networkConfig';

export function TvDisplayPage({ queueSlug = '', onNavigate }) {
  const [queue, setQueue] = useState(null);
  const [entries, setEntries] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prevServing, setPrevServing] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioMuted, setAudioMuted] = useState(false);
  const isFirstLoad = useRef(true);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load and subscribe to queue
  useEffect(() => {
    refresh();
    const unsub = subscribeToQueue('all', refresh);
    return () => {
      if (unsub) unsub();
    };
  }, [queueSlug, voiceEnabled, audioMuted]);

  function refresh() {
    let q = queueSlug ? getQueueBySlug(queueSlug) : null;
    if (!q) {
      const all = getAllQueues();
      if (all.length > 0) q = all[0];
    }
    if (q) {
      setQueue(q);
      const qEntries = getQueueEntries(q.id);
      setEntries(qEntries);

      // Play sound and voice announcement if serving number changed
      if (q.current_serving && q.current_serving !== '-' && q.current_serving !== prevServing) {
        if (!isFirstLoad.current && prevServing !== '') {
          if (!audioMuted) {
            if (voiceEnabled) {
              playChimeAndVoice(q.current_serving, q.name || 'Kaunter', 'ms-MY');
            } else {
              playCallChime();
            }
          }
        }
        setPrevServing(q.current_serving);
      }
      isFirstLoad.current = false;

      // Generate on-screen QR for TV using phone Wi-Fi LAN address
      const customerUrl = getCustomerAccessUrl(q.slug);
      generateQrDataUrl(customerUrl, { width: 220 }).then(setQrDataUrl);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  const waitingEntries = entries.filter((e) => e.status === QUEUE_STATUS.WAITING);
  const servingEntry = entries.find((e) => e.status === QUEUE_STATUS.SERVING);

  return (
    <div className="tv-display-root">
      {/* TV Header Bar */}
      <header className="tv-header">
        <div className="tv-header-left">
          <div className="tv-logo-badge">
            <img src="/logo-icon.png?v=2" alt="Logo" style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'contain' }} />
            <div>
              <span className="tv-brand-title">
                My<span className="tv-brand-accent">Giliran</span>
              </span>
              <span className="tv-queue-name">
                <span className="tv-queue-dot"></span>
                {queue?.name || 'Main Counter'}
              </span>
            </div>
          </div>
        </div>

        <div className="tv-header-right">
          <div className="tv-clock">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>

          {/* Sound Mute / Unmute Toggle */}
          <button
            type="button"
            className="tv-ctrl-btn"
            onClick={() => setAudioMuted((prev) => !prev)}
            title={audioMuted ? "Unmute Audio" : "Mute Audio"}
            aria-label={audioMuted ? "Unmute Audio" : "Mute Audio"}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: audioMuted ? '#ef4444' : 'inherit' }}
          >
            {audioMuted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          {/* Voice Announcement Toggle */}
          <button
            type="button"
            className="tv-ctrl-btn"
            onClick={() => setVoiceEnabled((prev) => !prev)}
            title={voiceEnabled ? "Voice Callout: ON" : "Voice Callout: OFF (Chime Only)"}
            aria-label={voiceEnabled ? "Disable Voice Callout" : "Enable Voice Callout"}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700', padding: '0 10px', width: 'auto', minWidth: '42px' }}
          >
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>TTS</span>
            <span style={{ color: voiceEnabled ? '#10b981' : '#94a3b8' }}>{voiceEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Test Sound Button */}
          <button
            type="button"
            className="tv-ctrl-btn"
            onClick={() => {
              const testNum = queue?.current_serving && queue.current_serving !== '-' ? queue.current_serving : 'A001';
              if (voiceEnabled) {
                playChimeAndVoice(testNum, queue?.name || 'Kaunter', 'ms-MY');
              } else {
                playCallChime();
              }
            }}
            title="Test Chime & Voice"
            aria-label="Test Chime & Voice"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>

          <button
            type="button"
            className="tv-ctrl-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
          <button
            type="button"
            className="tv-ctrl-btn"
            onClick={() => onNavigate('admin')}
            title="Back to Admin Dashboard"
            aria-label="Close TV View"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* TV Main Grid */}
      <main className="tv-main-grid">
        {/* Left Column: Huge Currently Serving Box */}
        <section className="tv-serving-box">
          <div className="tv-number-display">
            {servingEntry ? servingEntry.queue_number : (queue?.current_serving && queue.current_serving !== '-' ? queue.current_serving : '---')}
          </div>
        </section>

        {/* Right Column: Next in Line & Scan QR */}
        <section className="tv-side-panel">
          {/* Next in line */}
          <div className="tv-next-box">
            <div className="tv-panel-title">
              <span>NEXT IN LINE</span>
              <span className="tv-wait-count">{waitingEntries.length} Waiting</span>
            </div>

            {waitingEntries.length === 0 ? (
              <div className="tv-empty-wait">
                No customers currently waiting.
              </div>
            ) : (
              <div className="tv-next-list">
                {waitingEntries.slice(0, 4).map((entry, idx) => (
                  <div key={entry.id} className="tv-next-item">
                    <span className="tv-pos">#{idx + 1}</span>
                    <span className="tv-ticket">{entry.queue_number}</span>
                    <span className="tv-cname">{entry.customer_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* On-screen QR for walk-in scanning */}
          <div className="tv-qr-box">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="Scan QR" className="tv-qr-image" />
            )}
            <div className="tv-qr-info">
              <h4>SCAN WITH CAMERA</h4>
              <p>Take your digital queue number directly on your smartphone. No app download needed!</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
