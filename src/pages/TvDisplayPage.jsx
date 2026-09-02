import React, { useState, useEffect } from 'react';
import { getQueueBySlug, getQueueEntries, playCallChime, subscribeToQueue, QUEUE_STATUS } from '../lib/queueStore';
import { generateQrDataUrl } from '../lib/qrcode';
import { getCustomerAccessUrl } from '../lib/networkConfig';

export function TvDisplayPage({ queueSlug = 'counter-demo', onNavigate }) {
  const [queue, setQueue] = useState(null);
  const [entries, setEntries] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prevServing, setPrevServing] = useState('');

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
  }, [queueSlug]);

  function refresh() {
    const q = getQueueBySlug(queueSlug);
    if (q) {
      setQueue(q);
      const qEntries = getQueueEntries(q.id);
      setEntries(qEntries);

      // Play chime if serving number changed
      if (q.current_serving && q.current_serving !== '-' && q.current_serving !== prevServing) {
        if (prevServing !== '') {
          playCallChime();
        }
        setPrevServing(q.current_serving);
      }

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
            <img src="/logo-icon.png?v=2" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
            <div>
              <span className="tv-brand-title">MyGiliran TV</span>
              <span className="tv-queue-name">{queue?.name || 'Waiting Hall Display'}</span>
            </div>
          </div>
        </div>

        <div className="tv-header-right">
          <div className="tv-clock">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <button
            type="button"
            className="tv-ctrl-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            ⛶
          </button>
          <button
            type="button"
            className="tv-ctrl-btn"
            onClick={() => onNavigate('admin')}
            title="Back to Admin Dashboard"
          >
            ✕
          </button>
        </div>
      </header>

      {/* TV Main Grid */}
      <main className="tv-main-grid">
        {/* Left Column: Huge Currently Serving Box */}
        <section className="tv-serving-box">
          <div className="tv-serving-label">
            <span className="tv-pulsing-dot"></span>
            SEDANG DIPANGGIL • NOW SERVING
          </div>

          <div className="tv-number-display">
            {servingEntry ? servingEntry.queue_number : (queue?.current_serving && queue.current_serving !== '-' ? queue.current_serving : '---')}
          </div>

          <div className="tv-customer-callout">
            {servingEntry ? (
              <>
                <span className="tv-lbl">Pelanggan:</span>
                <span className="tv-name">{servingEntry.customer_name}</span>
              </>
            ) : (
              <span className="tv-idle-text">Sila bersedia untuk giliran anda</span>
            )}
          </div>

          <div className="tv-counter-ref">
            {queue?.name || 'Kaunter Utama'}
          </div>
        </section>

        {/* Right Column: Next in Line & Scan QR */}
        <section className="tv-side-panel">
          {/* Next in line */}
          <div className="tv-next-box">
            <div className="tv-panel-title">
              <span>SENARAI GILIRAN SETERUSNYA</span>
              <span className="tv-wait-count">{waitingEntries.length} Menunggu</span>
            </div>

            {waitingEntries.length === 0 ? (
              <div className="tv-empty-wait">
                Tiada pelanggan sedang menunggu.
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
              <h4>IMBAS DENGAN KAMERA</h4>
              <p>Ambil nombor giliran digital terus ke telefon pintar anda. Tanpa perlu download sebarang app!</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
