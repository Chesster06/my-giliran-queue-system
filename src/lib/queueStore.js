import { QUEUE_STATUS } from '../constants.js';

export { QUEUE_STATUS };

const STORAGE_KEYS = {
  QUEUES: 'mygiliran_queues',
  ENTRIES: 'mygiliran_entries'
};

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

export function initQueueStorage() {
  const queues = readJson(STORAGE_KEYS.QUEUES, []);
  if (queues.length === 0) {
    const defaultQueue = {
      id: 'q_demo',
      name: 'Counter 1 (Main Service)',
      description: 'General inquiry and customer turn counter',
      slug: 'counter-demo',
      prefix: 'A',
      starting_number: 1,
      current_counter: 0,
      is_active: true,
      created_at: new Date().toISOString()
    };
    writeJson(STORAGE_KEYS.QUEUES, [defaultQueue]);
  }
}

export function getQueueBySlug(slug) {
  const queues = readJson(STORAGE_KEYS.QUEUES, []);
  return queues.find((q) => q.slug === slug) || null;
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
