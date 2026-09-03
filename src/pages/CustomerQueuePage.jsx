import React, { useState, useEffect } from 'react';
import { getAllQueues, getQueueBySlug, getEntriesByQueue, joinQueue } from '../lib/queueStore';
import { QUEUE_STATUS } from '../constants';
import { Badge } from '../components/Badge';

export function CustomerQueuePage({ queueSlug = '', onNavigate }) {
  const [queue, setQueue] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [myEntry, setMyEntry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [queueEntries, setQueueEntries] = useState([]);

  useEffect(() => {
    loadQueueData();

    // Check if customer already submitted in this session
    const savedEntryId = sessionStorage.getItem(`mygiliran_my_entry_${queueSlug}`);
    if (savedEntryId) {
      const allEntries = getEntriesByQueue(queue?.id || 'q_default_1');
      const found = allEntries.find((e) => e.id === savedEntryId);
      if (found) {
        setMyEntry(found);
      }
    }

    function handleSync() {
      loadQueueData();
    }

    window.addEventListener('mygiliran_sync', handleSync);
    return () => window.removeEventListener('mygiliran_sync', handleSync);
  }, [queueSlug, queue?.id]);

  function loadQueueData() {
    let q = getQueueBySlug(queueSlug);

    // Auto-provision from QR query params if not yet present in device storage
    if (!q && typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const paramName = searchParams.get('name') || searchParams.get('qname');
      const paramPrefix = searchParams.get('prefix') || searchParams.get('qpref') || 'A';
      const paramStart = parseInt(searchParams.get('start') || '1', 10);
      const paramDesc = searchParams.get('desc') || '';
      const paramId = searchParams.get('qid') || 'q_' + queueSlug;

      if (paramName || (queueSlug && queueSlug !== 'main-walkin')) {
        const queueName = paramName ? decodeURIComponent(paramName) : (queueSlug.toUpperCase());
        q = {
          id: paramId,
          creator_id: 'usr_auto',
          name: queueName,
          description: paramDesc ? decodeURIComponent(paramDesc) : '',
          slug: queueSlug,
          prefix: paramPrefix.toUpperCase(),
          starting_number: paramStart,
          current_counter: paramStart - 1,
          is_active: true,
          created_at: new Date().toISOString()
        };

        try {
          const raw = localStorage.getItem('mygiliran_queues');
          const list = raw ? JSON.parse(raw) : [];
          if (!list.some((item) => item.slug === queueSlug || item.id === q.id)) {
            list.push(q);
            localStorage.setItem('mygiliran_queues', JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('mygiliran_sync', { detail: { key: 'mygiliran_queues' } }));
          }
        } catch {
          // ignore
        }
      }
    }

    if (!q) {
      const all = getAllQueues();
      if (all.length > 0) q = all[0];
    }

    setQueue(q);
    if (q) {
      const entries = getEntriesByQueue(q.id);
      setQueueEntries(entries);

      // Refresh my entry state if already present
      if (myEntry) {
        const refreshed = entries.find((e) => e.id === myEntry.id);
        if (refreshed) {
          setMyEntry(refreshed);
        }
      }
    }
  }

  function handleTakeQueue(e) {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = customerName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your name to take a queue ticket.');
      return;
    }
    if (trimmed.length > 80) {
      setErrorMsg('Name is too long (maximum 80 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = joinQueue(queue.id, trimmed);
      setMyEntry(created);
      sessionStorage.setItem(`mygiliran_my_entry_${queueSlug}`, created.id);
      loadQueueData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to take queue ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleTakeAnother() {
    sessionStorage.removeItem(`mygiliran_my_entry_${queueSlug}`);
    setMyEntry(null);
    setCustomerName('');
    setErrorMsg('');
  }

  if (!queue) {
    return (
      <div className="container" style={{ padding: '64px 20px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--danger)' }}>
            Queue Not Found
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
            This queue QR code or link is invalid or has been deactivated.
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => onNavigate('landing')}>
            Back to Home Page
          </button>
        </div>
      </div>
    );
  }

  // Calculate current serving and count ahead
  const currentServingEntry = queueEntries.find((e) => e.status === QUEUE_STATUS.SERVING);
  const waitingEntries = queueEntries.filter((e) => e.status === QUEUE_STATUS.WAITING);

  let peopleAhead = 0;
  if (myEntry && myEntry.status === QUEUE_STATUS.WAITING) {
    const myIndex = waitingEntries.findIndex((e) => e.id === myEntry.id);
    peopleAhead = myIndex >= 0 ? myIndex : 0;
  }

  return (
    <div className="page-transition container" style={{ padding: '32px 16px 64px 16px', maxWidth: '480px' }}>
      {/* Header bar */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <img
            src="/logo-icon.png?v=2"
            alt="MyGiliran Logo"
            style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0e4c49', letterSpacing: '-0.02em' }}>
            My<span style={{ color: '#58c4a1' }}>Giliran</span>
          </span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {queue.name}
        </h1>
        {queue.description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {queue.description}
          </p>
        )}
      </div>

      {/* Current Serving Banner */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', borderLeft: '4px solid var(--primary)', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Now Serving
            </div>
            <div className="mono-num" style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)' }}>
              {currentServingEntry ? currentServingEntry.queue_number : 'None'}
            </div>
          </div>
          {currentServingEntry && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                {currentServingEntry.customer_name}
              </div>
              <Badge status={QUEUE_STATUS.SERVING} />
            </div>
          )}
        </div>
      </div>

      {/* Result Card or Take Queue Form */}
      {myEntry ? (
        <div className="card" style={{ border: '2px solid var(--primary)', padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Your Queue Number
          </div>
          <div className="mono-num" style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.1', marginBottom: '8px' }}>
            {myEntry.queue_number}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '14px' }}>
            {myEntry.customer_name}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Badge status={myEntry.status} />
          </div>

          <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px' }}>
            {myEntry.status === QUEUE_STATUS.SERVING ? (
              <div style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.05rem' }}>
                Your ticket is now being called to the counter!
              </div>
            ) : myEntry.status === QUEUE_STATUS.COMPLETED ? (
              <div style={{ color: 'var(--info)', fontWeight: '700', fontSize: '0.95rem' }}>
                Your queue turn has been completed. Thank you!
              </div>
            ) : myEntry.status === QUEUE_STATUS.CANCELLED ? (
              <div style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '0.95rem' }}>
                This queue ticket has been cancelled or terminated.
              </div>
            ) : myEntry.status === QUEUE_STATUS.SKIPPED ? (
              <div style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.95rem' }}>
                Your ticket was skipped. Please notify the counter staff.
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Estimated people ahead of you:
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                  {peopleAhead} {peopleAhead === 1 ? 'person' : 'people'}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={handleTakeAnother}
          >
            Take Another Queue Ticket
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '4px' }}>
            Take a Queue Number
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Enter your name below to receive your digital ticket instantly.
          </p>

          {errorMsg && (
            <div
              role="alert"
              style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '16px' }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleTakeQueue}>
            <div className="form-group">
              <label className="form-label" htmlFor="custName">
                Your Name
              </label>
              <input
                id="custName"
                type="text"
                className="form-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John"
                autoComplete="name"
                required
              />
              <span className="form-help">
                Your name will be displayed on the counter screen when called.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '1.05rem', padding: '12px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Issuing Ticket...' : 'Get Queue Ticket'}
            </button>
          </form>
        </div>
      )}

      {/* Navigation link */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate('landing')}
        >
          Back to Home Page
        </button>
      </div>
    </div>
  );
}
