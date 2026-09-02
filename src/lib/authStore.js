// Authentication store for MyGiliran with LocalStorage persistence
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

// Initial demo users
export function initAuthStorage() {
  const users = readJson(AUTH_KEYS.USERS, []);
  if (users.length === 0) {
    const defaultUser = {
      id: 'usr_demo',
      name: 'Owner Admin',
      email: 'hlsalim.ux@gmail.com',
      password: 'password123',
      businessName: 'Klinik & Salon Utama',
      role: 'owner',
      createdAt: new Date().toISOString()
    };
    writeJson(AUTH_KEYS.USERS, [defaultUser]);
  }
}

export function getCurrentUser() {
  return readJson(AUTH_KEYS.SESSION, null);
}

export function loginUser({ email, password }) {
  initAuthStorage();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail) {
    throw new Error('Please enter your email address.');
  }
  if (!cleanPass) {
    throw new Error('Please enter your password.');
  }

  const users = readJson(AUTH_KEYS.USERS, []);
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    throw new Error('Account not found with this email.');
  }

  if (user.password !== cleanPass) {
    throw new Error('Incorrect password. Please double-check and try again.');
  }

  const sessionData = {
    id: user.id,
    name: user.name,
    email: user.email,
    businessName: user.businessName || 'My Business',
    role: user.role || 'merchant',
    loggedInAt: new Date().toISOString()
  };

  writeJson(AUTH_KEYS.SESSION, sessionData);
  return sessionData;
}

export function registerUser({ name, email, password, businessName }) {
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
  const exists = users.some(u => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    throw new Error('An account with this email already exists. Try logging in.');
  }

  const newUser = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
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

export function loginWithGoogleDemo() {
  const googleUser = {
    id: 'usr_google_' + Math.random().toString(36).substring(2, 7),
    name: 'Google User',
    email: 'google.merchant@gmail.com',
    businessName: 'Retail & Service Hub',
    role: 'merchant',
    avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    loggedInAt: new Date().toISOString()
  };
  writeJson(AUTH_KEYS.SESSION, googleUser);
  return googleUser;
}

export function logoutUser() {
  try {
    localStorage.removeItem(AUTH_KEYS.SESSION);
    window.dispatchEvent(new CustomEvent('mygiliran_auth_sync', { detail: { key: AUTH_KEYS.SESSION } }));
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export function subscribeToAuth(callback) {
  function handleSync() {
    callback(getCurrentUser());
  }
  window.addEventListener('mygiliran_auth_sync', handleSync);
  window.addEventListener('storage', handleSync);

  return () => {
    window.removeEventListener('mygiliran_auth_sync', handleSync);
    window.removeEventListener('storage', handleSync);
  };
}
