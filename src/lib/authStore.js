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
    throw new Error('Please enter your email address.');
  }
  if (!cleanPass) {
    throw new Error('Please enter your password.');
  }

  let sessionData = null;
  let supabaseAuthError = null;

  // 1. Authenticate with Supabase Cloud Auth if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      });

      if (error) {
        supabaseAuthError = error;
        console.warn('Supabase login notice:', error.message);
      } else if (data?.user) {
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
      supabaseAuthError = err;
      console.warn('Supabase authentication check:', err);
    }
  }

  // 2. Check existence in local registry or Cloud profile
  const users = readJson(AUTH_KEYS.USERS, []);
  const localUser = users.find(u => u.email.toLowerCase() === cleanEmail);

  // If local credentials match, allow seamless login
  if (localUser && localUser.password === cleanPass) {
    sessionData = {
      id: localUser.id,
      name: localUser.name,
      email: localUser.email,
      businessName: localUser.businessName || 'My Business',
      avatar: localUser.avatar || '',
      role: localUser.role || 'merchant',
      loggedInAt: new Date().toISOString()
    };
    writeJson(AUTH_KEYS.SESSION, sessionData);
    return sessionData;
  }

  // Check if account exists in Supabase profiles
  let cloudProfileExists = false;
  if (isSupabaseConfigured) {
    try {
      const { data: cloudProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (cloudProfile?.id) {
        cloudProfileExists = true;
      }
    } catch (e) {
      console.warn('Profile check notice:', e);
    }
  }

  // Case A: Supabase unconfirmed email
  if (supabaseAuthError) {
    const msg = (supabaseAuthError.message || '').toLowerCase();
    if (msg.includes('confirm') || msg.includes('verification')) {
      throw new Error('Your email is not confirmed yet. Please verify your email or click "Auto Confirm User" in Supabase.');
    }
  }

  // Case B: Account is NOT registered
  if (!localUser && !cloudProfileExists) {
    throw new Error('This account is not registered. Please click "Create a new account now" to register.');
  }

  // Case C: Account exists, but password was incorrect
  throw new Error('Incorrect password. Please double-check your password and try again.');
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
    throw new Error('Please enter your full name.');
  }
  if (!cleanEmail) {
    throw new Error('Please enter a valid email address.');
  }
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const users = readJson(AUTH_KEYS.USERS, []);
  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('An account with this email is already registered. Please click "Log in here".');
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

export async function deleteCurrentAccountAndData() {
  try {
    const currentUser = getCurrentUser();

    // 1. Delete from Supabase Cloud if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('queue_entries').delete().neq('id', 'none');
        await supabase.from('queues').delete().neq('id', 'none');
        if (currentUser?.id) {
          await supabase.from('profiles').delete().eq('id', currentUser.id);
        }
        
        // Execute Supabase Postgres function to delete from auth.users
        try {
          const { error: rpcError } = await supabase.rpc('delete_user');
          if (rpcError) {
            console.warn('Supabase delete_user RPC notice:', rpcError.message);
          }
        } catch (rpcErr) {
          console.warn('Supabase delete_user execution error:', rpcErr);
        }

        await supabase.auth.signOut().catch(() => {});
      } catch (cloudErr) {
        console.warn('Supabase cloud records deletion:', cloudErr);
      }
    }

    // 2. Remove user from local users registry
    if (currentUser?.email) {
      const users = readJson(AUTH_KEYS.USERS, []);
      const remainingUsers = users.filter(u => u.email.toLowerCase() !== currentUser.email.toLowerCase());
      writeJson(AUTH_KEYS.USERS, remainingUsers);
    }

    // 3. Clear session and profile records
    localStorage.removeItem(AUTH_KEYS.SESSION);
    localStorage.removeItem('mygiliran_profile_name');
    localStorage.removeItem('mygiliran_profile_role');
    localStorage.removeItem('mygiliran_profile_email');
    localStorage.removeItem('mygiliran_profile_avatar');
    localStorage.removeItem('mygiliran_merchant_name');
    localStorage.removeItem('mygiliran_branch_name');
    sessionStorage.clear();

    // 4. Clear all queues and customer entries
    localStorage.setItem('mygiliran_queues', '[]');
    localStorage.setItem('mygiliran_entries', '[]');
    localStorage.setItem('mygiliran_initialized', 'true');

    // 5. Broadcast synchronization events
    window.dispatchEvent(new CustomEvent('mygiliran_auth_sync', { detail: { key: 'account_deleted' } }));
    window.dispatchEvent(new CustomEvent('mygiliran_sync', { detail: { key: 'all' } }));

    return true;
  } catch (err) {
    console.error('Delete account error:', err);
    throw err;
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
    console.log('All credentials, profile, and session data have been cleared successfully.');
  } catch (err) {
    console.error('Reset error:', err);
  }
}

if (typeof window !== 'undefined') {
  window.resetAllCredentials = resetAllCredentials;
  window.deleteCurrentAccountAndData = deleteCurrentAccountAndData;
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
