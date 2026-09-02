import { QUEUE_STATUS } from '../constants.js';

export { QUEUE_STATUS };

const STORAGE_KEYS = {
  QUEUES: 'mygiliran_queues',
  ENTRIES: 'mygiliran_entries'
};

let isSyncing = false;

async function pushToApi() {
  try {
    const queues = readJson(STORAGE_KEYS.QUEUES, []);
    const entries = readJson(STORAGE_KEYS.ENTRIES, []);
    await fetch('/api/queue-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queues, entries })
    });
  } catch {
    // offline or backend unreachable
  }
}

async function pullFromApi() {
  if (isSyncing) return;
  try {
    const res = await fetch('/api/queue-data');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.queues)) {
        const localQueuesStr = localStorage.getItem(STORAGE_KEYS.QUEUES) || '[]';
        const localEntriesStr = localStorage.getItem(STORAGE_KEYS.ENTRIES) || '[]';
        const remoteQueuesStr = JSON.stringify(data.queues);
        const remoteEntriesStr = JSON.stringify(data.entries || []);

        if (remoteQueuesStr !== localQueuesStr || remoteEntriesStr !== localEntriesStr) {
          isSyncing = true;
          localStorage.setItem(STORAGE_KEYS.QUEUES, remoteQueuesStr);
          localStorage.setItem(STORAGE_KEYS.ENTRIES, remoteEntriesStr);
          window.dispatchEvent(new CustomEvent('mygiliran_sync', { detail: { key: 'all' } }));
          isSyncing = false;
        }
      }
    }
  } catch {
    // ignore
  }
}

// Start auto-sync across all devices (phone, PC, TV)
if (typeof window !== 'undefined') {
  pullFromApi();
  setInterval(pullFromApi, 1200);
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('mygiliran_sync', { detail: { key } }));
    pushToApi();
  } catch (err) {
    console.error('Error writing to storage:', err);
  }
}

export function clearAllSystemData() {
  localStorage.setItem(STORAGE_KEYS.QUEUES, '[]');
  localStorage.setItem(STORAGE_KEYS.ENTRIES, '[]');
  localStorage.setItem('mygiliran_initialized', 'true');
  window.dispatchEvent(new CustomEvent('mygiliran_sync', { detail: { key: 'all' } }));
  pushToApi();
}

export function initQueueStorage() {
  const initialized = localStorage.getItem('mygiliran_initialized');
  if (initialized) {
    return;
  }
  localStorage.setItem('mygiliran_initialized', 'true');
  if (!localStorage.getItem(STORAGE_KEYS.QUEUES)) {
    localStorage.setItem(STORAGE_KEYS.QUEUES, '[]');
  }
  if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, '[]');
  }
}

export function getAllQueues() {
  initQueueStorage();
  return readJson(STORAGE_KEYS.QUEUES, []);
}

export function getQueueBySlug(slug) {
  const queues = getAllQueues();
  return queues.find((q) => q.slug === slug) || null;
}

export function getQueueById(id) {
  const queues = getAllQueues();
  return queues.find((q) => q.id === id) || null;
}

export function getQueueEntries(queueId) {
  const entries = readJson(STORAGE_KEYS.ENTRIES, []);
  return entries.filter((e) => e.queue_id === queueId);
}

export const getEntriesByQueue = getQueueEntries;

export function joinQueue({ queueId, customerName }) {
  const cleanName = (customerName || '').trim();
  if (!cleanName) {
    throw new Error('Please enter customer name.');
  }

  const queues = readJson(STORAGE_KEYS.QUEUES, []);
  const queueIndex = queues.findIndex((q) => q.id === queueId);
  if (queueIndex < 0) {
    throw new Error('Queue not found.');
  }

  const queue = queues[queueIndex];
  const nextNum = (queue.current_counter || 0) + 1;
  queue.current_counter = nextNum;
  queues[queueIndex] = queue;
  writeJson(STORAGE_KEYS.QUEUES, queues);

  const formattedNum = `${queue.prefix || 'A'}${String(nextNum).padStart(3, '0')}`;
  const newEntry = {
    id: 'entry_' + Math.random().toString(36).substring(2, 9),
    queue_id: queueId,
    customer_name: cleanName,
    queue_number: formattedNum,
    status: QUEUE_STATUS.WAITING,
    created_at: new Date().toISOString()
  };

  const entries = readJson(STORAGE_KEYS.ENTRIES, []);
  entries.push(newEntry);
  writeJson(STORAGE_KEYS.ENTRIES, entries);

  return newEntry;
}

export function callNextNumber(queueId) {
  const queues = readJson(STORAGE_KEYS.QUEUES, []);
  const qIdx = queues.findIndex((q) => q.id === queueId);
  if (qIdx < 0) return null;

  const queue = queues[qIdx];
  const entries = readJson(STORAGE_KEYS.ENTRIES, []);
  
  // Find current serving and mark as completed if present
  entries.forEach((e) => {
    if (e.queue_id === queueId && e.status === QUEUE_STATUS.SERVING) {
      e.status = QUEUE_STATUS.COMPLETED;
      e.completed_at = new Date().toISOString();
    }
  });

  // Find next waiting entry
  const nextEntry = entries.find(
    (e) => e.queue_id === queueId && e.status === QUEUE_STATUS.WAITING
  );

  if (nextEntry) {
    nextEntry.status = QUEUE_STATUS.SERVING;
    nextEntry.served_at = new Date().toISOString();
    queue.current_serving = nextEntry.queue_number;
  } else {
    queue.current_serving = '-';
  }

  queues[qIdx] = queue;
  writeJson(STORAGE_KEYS.QUEUES, queues);
  writeJson(STORAGE_KEYS.ENTRIES, entries);

  return nextEntry || null;
}

export function updateEntryStatus(entryId, newStatus) {
  const entries = readJson(STORAGE_KEYS.ENTRIES, []);
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return null;

  entry.status = newStatus;
  if (newStatus === QUEUE_STATUS.COMPLETED) {
    entry.completed_at = new Date().toISOString();
  }

  const queues = readJson(STORAGE_KEYS.QUEUES, []);
  const queue = queues.find((q) => q.id === entry.queue_id);
  if (queue && queue.current_serving === entry.queue_number && newStatus !== QUEUE_STATUS.SERVING) {
    queue.current_serving = '-';
    writeJson(STORAGE_KEYS.QUEUES, queues);
  }

  writeJson(STORAGE_KEYS.ENTRIES, entries);
  return entry;
}

export function updateQueueSettings(queueId, updates) {
  const queues = readJson(STORAGE_KEYS.QUEUES, []);
  const qIdx = queues.findIndex((q) => q.id === queueId);
  if (qIdx < 0) return null;

  queues[qIdx] = { ...queues[qIdx], ...updates };
  writeJson(STORAGE_KEYS.QUEUES, queues);
  return queues[qIdx];
}

export function resetQueueCounter(queueId) {
  const queues = readJson(STORAGE_KEYS.QUEUES, []);
  const qIdx = queues.findIndex((q) => q.id === queueId);
  if (qIdx < 0) return null;

  queues[qIdx].current_counter = 0;
  queues[qIdx].current_serving = '-';
  writeJson(STORAGE_KEYS.QUEUES, queues);

  // Clear or mark all existing entries as completed
  const entries = readJson(STORAGE_KEYS.ENTRIES, []);
  const updatedEntries = entries.map((e) => {
    if (e.queue_id === queueId && (e.status === QUEUE_STATUS.WAITING || e.status === QUEUE_STATUS.SERVING)) {
      return { ...e, status: QUEUE_STATUS.COMPLETED, completed_at: new Date().toISOString() };
    }
    return e;
  });
  writeJson(STORAGE_KEYS.ENTRIES, updatedEntries);

  return queues[qIdx];
}

export function createNewQueue({ name, prefix = 'A', description = '' }) {
  const queues = readJson(STORAGE_KEYS.QUEUES, []);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `counter-${Date.now()}`;
  
  const newQ = {
    id: 'q_' + Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    description: description.trim(),
    slug: slug,
    prefix: prefix.trim().toUpperCase().charAt(0) || 'A',
    starting_number: 1,
    current_counter: 0,
    current_serving: '-',
    is_active: true,
    created_at: new Date().toISOString()
  };

  queues.push(newQ);
  writeJson(STORAGE_KEYS.QUEUES, queues);
  return newQ;
}

export function deleteQueue(queueId) {
  let queues = readJson(STORAGE_KEYS.QUEUES, []);
  queues = queues.filter((q) => q.id !== queueId);
  writeJson(STORAGE_KEYS.QUEUES, queues);

  let entries = readJson(STORAGE_KEYS.ENTRIES, []);
  entries = entries.filter((e) => e.queue_id !== queueId);
  writeJson(STORAGE_KEYS.ENTRIES, entries);
}

export function playCallChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Modern 2-tone airport / counter chime
    const now = audioCtx.currentTime;
    
    // Tone 1 (High)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2 (Higher Harmonious)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.18); // A5
    gain2.gain.setValueAtTime(0.3, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.log('Audio chime not allowed without user interaction yet:', err);
  }
}

export function subscribeToQueue(queueId, callback) {
  function handleSync() {
    callback();
  }
  window.addEventListener('mygiliran_sync', handleSync);
  window.addEventListener('storage', handleSync);

  return () => {
    window.removeEventListener('mygiliran_sync', handleSync);
    window.removeEventListener('storage', handleSync);
  };
}
