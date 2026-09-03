import { QUEUE_STATUS } from '../constants.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

export { QUEUE_STATUS };

const STORAGE_KEYS = {
  QUEUES: 'mygiliran_queues',
  ENTRIES: 'mygiliran_entries'
};

let isSyncing = false;
let isSupabasePulling = false;

// ---------------------------------------------------------------------------
// Supabase Cloud Realtime & REST Synchronization
// ---------------------------------------------------------------------------

export async function pullFromSupabase() {
  if (!isSupabaseConfigured || isSupabasePulling) return;
  try {
    isSupabasePulling = true;
    const [queuesRes, entriesRes] = await Promise.all([
      supabase.from('queues').select('*').order('created_at', { ascending: true }),
      supabase.from('queue_entries').select('*').order('created_at', { ascending: true })
    ]);

    if (!queuesRes.error && Array.isArray(queuesRes.data) && queuesRes.data.length > 0) {
      const remoteQueues = queuesRes.data;
      const remoteEntries = entriesRes.data || [];

      const currentQueuesStr = localStorage.getItem(STORAGE_KEYS.QUEUES) || '[]';
      const currentEntriesStr = localStorage.getItem(STORAGE_KEYS.ENTRIES) || '[]';
      const newQueuesStr = JSON.stringify(remoteQueues);
      const newEntriesStr = JSON.stringify(remoteEntries);

      if (currentQueuesStr !== newQueuesStr || currentEntriesStr !== newEntriesStr) {
        localStorage.setItem(STORAGE_KEYS.QUEUES, newQueuesStr);
        localStorage.setItem(STORAGE_KEYS.ENTRIES, newEntriesStr);
        window.dispatchEvent(new CustomEvent('mygiliran_sync', { detail: { key: 'supabase_sync' } }));
      }
    } else if (queuesRes.error) {
      // Table may not be created yet in user's Supabase project; graceful fallback
      console.warn('Supabase sync notice:', queuesRes.error.message);
    }
  } catch (err) {
    console.warn('Supabase pull error (using local storage):', err);
  } finally {
    isSupabasePulling = false;
  }
}

// Push local state to Supabase Cloud
async function syncToSupabase(action, table, payload) {
  if (!isSupabaseConfigured) return;
  try {
    if (action === 'upsert') {
      await supabase.from(table).upsert(payload);
    } else if (action === 'delete') {
      await supabase.from(table).delete().match(payload);
    }
  } catch (err) {
    console.warn(`Supabase ${action} error on ${table}:`, err);
  }
}

// Setup Supabase Realtime WebSockets Subscription
if (typeof window !== 'undefined') {
  // 1. Initial Pull from Supabase Cloud
  pullFromSupabase();

  // 2. Realtime WebSocket Channel
  if (isSupabaseConfigured) {
    try {
      supabase
        .channel('public_queue_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => {
          pullFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, () => {
          pullFromSupabase();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime channel subscription notice:', err);
    }
  }

  // Periodic cloud sync heartbeat
  setInterval(() => {
    pullFromSupabase();
  }, 2500);
}

// ---------------------------------------------------------------------------
// Storage Helpers
// ---------------------------------------------------------------------------

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
  } catch (err) {
    console.error('Error writing to storage:', err);
  }
}

// ---------------------------------------------------------------------------
// Core Queue Operations
// ---------------------------------------------------------------------------

export function clearAllSystemData() {
  localStorage.setItem(STORAGE_KEYS.QUEUES, '[]');
  localStorage.setItem(STORAGE_KEYS.ENTRIES, '[]');
  localStorage.setItem('mygiliran_initialized', 'true');
  window.dispatchEvent(new CustomEvent('mygiliran_sync', { detail: { key: 'all' } }));

  if (isSupabaseConfigured) {
    supabase.from('queue_entries').delete().neq('id', 'none').then(() => {});
    supabase.from('queues').delete().neq('id', 'none').then(() => {});
  }
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

  // Sync to Supabase Cloud
  syncToSupabase('upsert', 'queues', queue);
  syncToSupabase('upsert', 'queue_entries', newEntry);

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
      syncToSupabase('upsert', 'queue_entries', e);
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
    syncToSupabase('upsert', 'queue_entries', nextEntry);
  } else {
    queue.current_serving = '-';
  }

  queues[qIdx] = queue;
  writeJson(STORAGE_KEYS.QUEUES, queues);
  writeJson(STORAGE_KEYS.ENTRIES, entries);

  syncToSupabase('upsert', 'queues', queue);

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
    syncToSupabase('upsert', 'queues', queue);
  }

  writeJson(STORAGE_KEYS.ENTRIES, entries);
  syncToSupabase('upsert', 'queue_entries', entry);
  return entry;
}

export function updateQueueSettings(queueId, updates) {
  const queues = readJson(STORAGE_KEYS.QUEUES, []);
  const qIdx = queues.findIndex((q) => q.id === queueId);
  if (qIdx < 0) return null;

  queues[qIdx] = { ...queues[qIdx], ...updates, updated_at: new Date().toISOString() };
  writeJson(STORAGE_KEYS.QUEUES, queues);
  syncToSupabase('upsert', 'queues', queues[qIdx]);
  return queues[qIdx];
}

export function resetQueueCounter(queueId) {
  const queues = readJson(STORAGE_KEYS.QUEUES, []);
  const qIdx = queues.findIndex((q) => q.id === queueId);
  if (qIdx < 0) return null;

  queues[qIdx].current_counter = 0;
  queues[qIdx].current_serving = '-';
  queues[qIdx].updated_at = new Date().toISOString();
  writeJson(STORAGE_KEYS.QUEUES, queues);
  syncToSupabase('upsert', 'queues', queues[qIdx]);

  // Mark all existing active entries as completed
  const entries = readJson(STORAGE_KEYS.ENTRIES, []);
  const updatedEntries = entries.map((e) => {
    if (e.queue_id === queueId && (e.status === QUEUE_STATUS.WAITING || e.status === QUEUE_STATUS.SERVING)) {
      const updated = { ...e, status: QUEUE_STATUS.COMPLETED, completed_at: new Date().toISOString() };
      syncToSupabase('upsert', 'queue_entries', updated);
      return updated;
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  queues.push(newQ);
  writeJson(STORAGE_KEYS.QUEUES, queues);

  syncToSupabase('upsert', 'queues', newQ);

  return newQ;
}

export function deleteQueue(queueId) {
  let queues = readJson(STORAGE_KEYS.QUEUES, []);
  queues = queues.filter((q) => q.id !== queueId);
  writeJson(STORAGE_KEYS.QUEUES, queues);

  let entries = readJson(STORAGE_KEYS.ENTRIES, []);
  entries = entries.filter((e) => e.queue_id !== queueId);
  writeJson(STORAGE_KEYS.ENTRIES, entries);

  syncToSupabase('delete', 'queue_entries', { queue_id: queueId });
  syncToSupabase('delete', 'queues', { id: queueId });
}

export function playCallChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // Tone 1
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

    // Tone 2
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
    console.log('Audio chime waiting for user interaction:', err);
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
