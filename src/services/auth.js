import { registerUserInDB, getUsers } from './db';

const AUTH_STORAGE_KEY = 'hoh_current_session';

const listeners = new Set();

const notifyAuth = (user) => {
  listeners.forEach(fn => {
    try { fn(user); } catch (e) { console.error(e); }
  });
};

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setCurrentUser = (user) => {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
  notifyAuth(user);
};

export const loginUser = async ({ email, password, role }) => {
  const users = getUsers();
  const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  
  // Find matching user or create session
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // If first time logging in with this email, create user record
    const derivedName = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
    user = registerUserInDB({
      name: formattedName,
      email,
      role: normalizedRole,
      password,
    });
  } else {
    // Ensure role matches login selection if specified
    if (user.role.toLowerCase() !== role.toLowerCase()) {
      user.role = normalizedRole;
    }
  }

  setCurrentUser(user);
  return user;
};

export const signupUser = async ({ name, email, password, role }) => {
  const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  const user = registerUserInDB({
    name,
    email,
    password,
    role: normalizedRole,
  });
  setCurrentUser(user);
  return user;
};

export const logoutUser = () => {
  setCurrentUser(null);
};

export const onAuthChange = (callback) => {
  listeners.add(callback);
  callback(getCurrentUser());
  return () => listeners.delete(callback);
};
