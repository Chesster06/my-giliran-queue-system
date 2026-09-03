import { supabase, isSupabaseConfigured } from './supabase.js';

// Authentication store for MyGiliran with Supabase Cloud Auth & Instant Dynamic Provisioning
const AUTH_KEYS = {
  USERS: 'mygiliran_users',
  SESSION: 'mygiliran_session'
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
    window.dispatchEvent(new CustomEvent('mygiliran_auth_sync', { detail: { key } }));
  } catch (err) {
    console.error('Auth store storage error:', err);
  }
}

// Force immediate clean wipe of all legacy stored credentials and sessions
if (typeof window !== 'undefined') {
  const WIPE_FLAG = 'mygiliran_clean_wipe_v4';
  if (localStorage.getItem('mygiliran_wipe_key') !== WIPE_FLAG) {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('mygiliran_wipe_key', WIPE_FLAG);
      localStorage.setItem(AUTH_KEYS.USERS, '[]');
      localStorage.setItem('mygiliran_queues', '[]');
      localStorage.setItem('mygiliran_entries', '[]');
      window.dispatchEvent(new CustomEvent('mygiliran_auth_sync', { detail: { key: 'clean_wipe' } }));
    } catch (e) {
      console.warn('Wipe notice:', e);
    }
  }
}

export function initAuthStorage() {
  const users = readJson(AUTH_KEYS.USERS, null);
  if (users === null) {
    writeJson(AUTH_KEYS.USERS, []);
  }
}

export function getCurrentUser() {
  return readJson(AUTH_KEYS.SESSION, null);
}

/**
 * Real Strict Cloud & Local Login:
 * Authenticates against Supabase and database.
 * If user does not exist, prompts them to register first.
 */
export async function loginUser({ email, password }) {
  initAuthStorage();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail) {
    throw new Error('Sila masukkan alamat email anda.');
  }
  if (!cleanPass) {
    throw new Error('Sila masukkan kata laluan anda.');
  }

  let sessionData = null;

  // 1. Authenticate with Supabase Cloud Auth if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      });

      if (!error && data?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
          .catch(() => ({ data: null }));

        sessionData = {
          id: data.user.id,
          name: profile?.name || data.user.user_metadata?.name || cleanEmail.split('@')[0],
          email: data.user.email,
          businessName: profile?.business_name || data.user.user_metadata?.business_name || 'My Business',
          avatar: profile?.avatar_url || data.user.user_metadata?.avatar_url || '',
          role: profile?.role || 'merchant',
          loggedInAt: new Date().toISOString()
        };

        writeJson(AUTH_KEYS.SESSION, sessionData);
        return sessionData;
      }
    } catch (err) {
      console.warn('Supabase authentication check:', err);
    }
  }

  // 2. Check Local Database / Fallback Accounts
  const users = readJson(AUTH_KEYS.USERS, []);
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    throw new Error('Akaun tidak dijumpai dengan email ini. Sila klik "Daftar di sini" untuk cipta akaun baru.');
  }

  if (user.password !== cleanPass) {
    throw new Error('Kata laluan tidak tepat. Sila semak semula kata laluan anda.');
  }

  sessionData = {
    id: user.id,
    name: user.name,
    email: user.email,
    businessName: user.businessName || 'My Business',
    avatar: user.avatar || '',
    role: user.role || 'merchant',
    loggedInAt: new Date().toISOString()
  };

  writeJson(AUTH_KEYS.SESSION, sessionData);
  return sessionData;
}

/**
 * Universal Seamless Registration:
 * Creates user in Supabase & local DB and signs them in right away.
 */
export async function registerUser({ name, email, password, businessName }) {
  initAuthStorage();
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();
  const cleanBiz = (businessName || '').trim() || `${cleanName}'s Counter`;

  if (!cleanName) {
    throw new Error('Sila masukkan nama penuh anda.');
  }
  if (!cleanEmail) {
    throw new Error('Sila masukkan email yang sah.');
  }
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
  }

  const users = readJson(AUTH_KEYS.USERS, []);
  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('Akaun dengan email ini sudah berdaftar. Sila klik "Log masuk di sini".');
  }

  let supabaseUserId = null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            name: cleanName,
            business_name: cleanBiz
          }
        }
      });

      if (!error && data?.user) {
        supabaseUserId = data.user.id;
        await supabase.from('profiles').upsert({
          id: supabaseUserId,
          email: cleanEmail,
          name: cleanName,
          business_name: cleanBiz,
          role: 'merchant',
          created_at: new Date().toISOString()
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Supabase registration notice:', err);
    }
  }

  // Local storage synchronization
  const newUser = {
    id: supabaseUserId || ('usr_' + Math.random().toString(36).substring(2, 9)),
    name: cleanName,
    email: cleanEmail,
    password: cleanPass,
    businessName: cleanBiz,
    role: 'merchant',
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  writeJson(AUTH_KEYS.USERS, users);

  const sessionData = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    businessName: newUser.businessName,
    role: newUser.role,
    loggedInAt: new Date().toISOString()
  };

  writeJson(AUTH_KEYS.SESSION, sessionData);
  return sessionData;
}

export async function signInWithGoogle() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  }
  throw new Error('Google OAuth requires Supabase configuration.');
}

export async function logoutUser() {
  try {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(AUTH_KEYS.SESSION);
    window.dispatchEvent(new CustomEvent('mygiliran_auth_sync', { detail: { key: AUTH_KEYS.SESSION } }));
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export function resetAllCredentials() {
  try {
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(AUTH_KEYS.SESSION);
    localStorage.removeItem(AUTH_KEYS.USERS);
    localStorage.removeItem('mygiliran_profile_name');
    localStorage.removeItem('mygiliran_profile_role');
    localStorage.removeItem('mygiliran_profile_email');
    localStorage.removeItem('mygiliran_profile_avatar');
    localStorage.setItem(AUTH_KEYS.USERS, '[]');
    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent('mygiliran_auth_sync', { detail: { key: 'reset_credentials' } }));
    console.log('Semua credentials, profil, dan sesi telah berjaya dibersihkan.');
  } catch (err) {
    console.error('Reset error:', err);
  }
}

if (typeof window !== 'undefined') {
  window.resetAllCredentials = resetAllCredentials;
}

export function subscribeToAuth(callback) {
  function handleSync() {
    callback(getCurrentUser());
  }
  window.addEventListener('mygiliran_auth_sync', handleSync);
  window.addEventListener('storage', handleSync);

  // Listen to Supabase Auth state changes
  let supabaseUnsub = null;
  if (isSupabaseConfigured) {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .catch(() => ({ data: null }));

        const sessionData = {
          id: session.user.id,
          name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
          email: session.user.email,
          businessName: profile?.business_name || session.user.user_metadata?.business_name || 'My Business',
          avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url || '',
          role: profile?.role || 'merchant',
          loggedInAt: new Date().toISOString()
        };
        writeJson(AUTH_KEYS.SESSION, sessionData);
        callback(sessionData);
      }
    });
    supabaseUnsub = authListener?.subscription;
  }

  return () => {
    window.removeEventListener('mygiliran_auth_sync', handleSync);
    window.removeEventListener('storage', handleSync);
    if (supabaseUnsub) supabaseUnsub.unsubscribe();
  };
}
