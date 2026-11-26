import { supabase, isSupabaseConfigured } from './supabase';
import { psychologists as initialPsychologists } from '../data/psychologists';

// Real-Time BroadcastChannel for cross-tab and cross-session synchronization
const broadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('hoh_realtime_bus')
  : null;

const STORAGE_KEY = 'hoh_central_db_v1';

// Seed Initial Data Structure
const getInitialDB = () => {
  const psychList = initialPsychologists.map(p => ({
    ...p,
    id: p.id || p.slug,
    status: p.status || 'Active',
    rating: p.rating || 5.0,
    sessionsCount: p.sessionsCount || 0,
    role: 'Counselor',
  }));

  const pricing = [
    {
      id: 'starter',
      name: 'Starter',
      price: 500,
      period: '/month',
      desc: 'Perfect for students who want to explore mental wellness resources at a minimal cost.',
      features: [
        'AI Chatbot Access (24/7)',
        '1 Monthly Session (30 min)',
        'Basic Chat Support',
        'Mood Tracking Journal',
        'Self-Help Resources Library',
      ],
      cta: 'Get Started',
      popular: false,
      color: 'var(--pink-400)',
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 1500,
      period: '/month',
      desc: 'Our most popular plan for students who need regular, consistent support.',
      features: [
        'Everything in Starter',
        '4 Monthly Sessions (45 min)',
        'Priority Chat Support',
        'Progress Reports',
        'Personalized Wellness Plan',
        'Group Support Sessions',
      ],
      cta: 'Choose Growth',
      popular: true,
      color: 'var(--pink-600)',
    },
    {
      id: 'premium',
      name: 'Premium Care',
      price: 3000,
      period: '/month',
      desc: 'Comprehensive care with senior graduates for students who need dedicated, intensive support.',
      features: [
        'Everything in Growth',
        '4 Video Sessions (60 min)',
        'Unlimited Messaging',
        'Senior Graduate Counselor',
        'Custom Progress Tracking',
        'Emergency Chat Support',
        'Family Session (1/month)',
      ],
      cta: 'Go Premium',
      popular: false,
      color: 'var(--pink-800)',
    },
  ];

  const users = [
    { id: 'admin-1', name: 'Admin', role: 'Admin', email: 'admin@highonhealing.pk', status: 'Active', joined: 'Jan 2026' },
    ...psychList.map((p, idx) => ({
      id: `counselor-${p.id}`,
      psychologistId: p.id,
      name: p.name,
      role: 'Counselor',
      email: `${p.slug.replace(/[^a-z]/g, '')}@highonhealing.pk`,
      status: p.status,
      joined: 'Feb 2026',
    })),
  ];

  const approvals = [
    { id: 'app-1', name: 'Nida Farooq', qualification: 'MSc Applied Psychology', university: 'GCU Lahore', applied: '1 day ago', status: 'pending' },
    { id: 'app-2', name: 'Tariq Hassan', qualification: 'BSc Psychology', university: 'FAST Islamabad', applied: '3 hours ago', status: 'pending' },
  ];

  const queries = [
    { id: 'q-1', from: 'Sana M.', role: 'Student', email: 'sana@email.com', subject: 'Change counselor request', message: 'I would like to switch to a different counselor. How can I do this?', time: '1 day ago', status: 'open', reply: '' },
    { id: 'q-2', from: 'Ahmed R.', role: 'Student', email: 'ahmed@email.com', subject: 'Session connection question', message: 'Can I do my session through audio only if my camera is not working?', time: '3 hours ago', status: 'open', reply: '' },
  ];

  const sessions = [];
  const activities = [
    { id: 'act-1', text: 'System initialized with verified psychologists', time: 'Just now', type: 'new' },
  ];

  return {
    psychologists: psychList,
    pricing,
    users,
    approvals,
    queries,
    sessions,
    activities,
  };
};

// Memory Cache & Persistence
let memoryDB = null;

const loadDB = () => {
  if (memoryDB) return memoryDB;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        memoryDB = JSON.parse(saved);
        // Ensure all required collections exist
        if (!memoryDB.psychologists) memoryDB.psychologists = [];
        if (!memoryDB.pricing) memoryDB.pricing = getInitialDB().pricing;
        if (!memoryDB.users) memoryDB.users = [];
        if (!memoryDB.sessions) memoryDB.sessions = [];
        if (!memoryDB.approvals) memoryDB.approvals = [];
        if (!memoryDB.queries) memoryDB.queries = [];
        if (!memoryDB.activities) memoryDB.activities = [];
        return memoryDB;
      }
    } catch (e) {
      console.warn('Failed to load from storage, using memory DB', e);
    }
  }
  memoryDB = getInitialDB();
  saveDB(memoryDB);
  return memoryDB;
};

const saveDB = (data) => {
  memoryDB = data;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to persist DB', e);
    }
  }
};

// Event Subscription Registry
const listeners = {
  psychologists: new Set(),
  pricing: new Set(),
  users: new Set(),
  sessions: new Set(),
  approvals: new Set(),
  queries: new Set(),
  stats: new Set(),
  activities: new Set(),
};

const notify = (channel, data) => {
  if (listeners[channel]) {
    listeners[channel].forEach(fn => {
      try { fn(data); } catch (err) { console.error('Listener error', err); }
    });
  }
  // If stats affected, recompute and notify stats listeners
  if (channel === 'users' || channel === 'psychologists' || channel === 'sessions' || channel === 'approvals') {
    const stats = computeStats();
    listeners.stats.forEach(fn => {
      try { fn(stats); } catch (err) { console.error('Stats listener error', err); }
    });
  }
};

// Listen to Cross-Tab Broadcasts
if (broadcast) {
  broadcast.onmessage = (event) => {
    const { channel, data } = event.data || {};
    if (channel) {
      // Reload memoryDB from storage so current tab has the latest state
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) memoryDB = JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
      notify(channel, data);
    }
  };
}

const emitChange = (channel, data) => {
  notify(channel, data);
  if (broadcast) {
    try {
      broadcast.postMessage({ channel, data, timestamp: Date.now() });
    } catch (e) {
      console.warn('Broadcast error', e);
    }
  }
};

// Compute Real-time Admin Statistics
export const computeStats = () => {
  const db = loadDB();
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const studentsCount = db.users.filter(u => u.role === 'Student' && u.status === 'Active').length;
  const counselorsCount = db.psychologists.filter(p => p.status === 'Active').length;
  const sessionsToday = db.sessions.filter(s => s.status !== 'cancelled' && (s.date === 'Today' || s.date.includes(todayStr))).length;
  const pendingReviews = db.approvals.filter(a => a.status === 'pending').length;

  return {
    totalStudents: studentsCount,
    counselors: counselorsCount,
    sessionsToday,
    pendingReviews,
  };
};

// ==========================================
// PSYCHOLOGISTS API
// ==========================================
export const getPsychologists = (onlyActive = true) => {
  const db = loadDB();
  return onlyActive ? db.psychologists.filter(p => p.status === 'Active') : [...db.psychologists];
};

export const subscribePsychologists = (callback, onlyActive = true) => {
  const handler = () => callback(getPsychologists(onlyActive));
  listeners.psychologists.add(handler);
  handler(); // Immediate initial call
  return () => listeners.psychologists.delete(handler);
};

export const getPsychologistBySlug = (slug) => {
  const db = loadDB();
  return db.psychologists.find(p => p.slug === slug) || null;
};

export const togglePsychologistStatus = (id) => {
  const db = loadDB();
  const psych = db.psychologists.find(p => p.id === id);
  if (psych) {
    psych.status = psych.status === 'Active' ? 'Inactive' : 'Active';
    // Sync with corresponding user in users table
    const user = db.users.find(u => u.psychologistId === id || u.name === psych.name);
    if (user) user.status = psych.status;
    saveDB(db);
    emitChange('psychologists', db.psychologists);
    emitChange('users', db.users);
    return psych;
  }
  return null;
};

export const updatePsychologist = (id, updates) => {
  const db = loadDB();
  const idx = db.psychologists.findIndex(p => p.id === id);
  if (idx !== -1) {
    db.psychologists[idx] = { ...db.psychologists[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDB(db);
    emitChange('psychologists', db.psychologists);
    return db.psychologists[idx];
  }
  return null;
};

export const deletePsychologist = (id) => {
  const db = loadDB();
  const psych = db.psychologists.find(p => p.id === id);
  db.psychologists = db.psychologists.filter(p => p.id !== id);
  db.users = db.users.filter(u => u.psychologistId !== id && u.name !== psych?.name);
  saveDB(db);
  emitChange('psychologists', db.psychologists);
  emitChange('users', db.users);
};

// ==========================================
// PRICING API
// ==========================================
export const defaultPricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 500,
    period: '/month',
    desc: 'Perfect for students who want to explore mental wellness resources at a minimal cost.',
    features: [
      'AI Chatbot Access (24/7)',
      '1 Monthly Session (30 min)',
      'Basic Chat Support',
      'Mood Tracking Journal',
      'Self-Help Resources Library',
    ],
    cta: 'Get Started',
    popular: false,
    color: 'var(--pink-400)',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 1500,
    period: '/month',
    desc: 'Our most popular plan for students who need regular, consistent support.',
    features: [
      'Everything in Starter',
      '4 Monthly Sessions (45 min)',
      'Priority Chat Support',
      'Progress Reports',
      'Personalized Wellness Plan',
      'Group Support Sessions',
    ],
    cta: 'Choose Growth',
    popular: true,
    color: 'var(--pink-600)',
  },
  {
    id: 'premium',
    name: 'Premium Care',
    price: 3000,
    period: '/month',
    desc: 'Comprehensive care with senior graduates for students who need dedicated, intensive support.',
    features: [
      'Everything in Growth',
      '4 Video Sessions (60 min)',
      'Unlimited Messaging',
      'Senior Graduate Counselor',
      'Custom Progress Tracking',
      'Emergency Chat Support',
      'Family Session (1/month)',
    ],
    cta: 'Go Premium',
    popular: false,
    color: 'var(--pink-800)',
  },
];

export const getPricingPlans = () => {
  const db = loadDB();
  if (!db.pricing || !Array.isArray(db.pricing) || db.pricing.length === 0) {
    db.pricing = defaultPricingPlans;
    saveDB(db);
  }

  // Always return all 3 plans, merging any saved price overrides safely
  return defaultPricingPlans.map((def) => {
    const found = db.pricing.find(
      (p) => p && p.id && p.id.toLowerCase() === def.id.toLowerCase()
    );
    let parsedPrice = def.price;
    if (found && found.price != null) {
      const num = Number(String(found.price).replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && num > 0) parsedPrice = num;
    }
    return {
      ...def,
      ...(found || {}),
      price: parsedPrice,
      desc: found?.desc || found?.description || def.desc,
      features: Array.isArray(found?.features) && found.features.length > 0 ? found.features : def.features,
    };
  });
};

export const subscribePricing = (callback) => {
  const handler = () => {
    try {
      callback(getPricingPlans());
    } catch (e) {
      console.error('Pricing subscription error:', e);
      callback(defaultPricingPlans);
    }
  };
  listeners.pricing.add(handler);
  handler();
  return () => listeners.pricing.delete(handler);
};

export const updatePricingPlans = async (priceMap) => {
  const db = loadDB();
  if (!db.pricing || !Array.isArray(db.pricing)) {
    db.pricing = defaultPricingPlans;
  }

  const errors = [];
  for (const [id, val] of Object.entries(priceMap)) {
    const num = Number(String(val).replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) {
      errors.push(`Invalid price for ${id}`);
      continue;
    }

    let match = db.pricing.find((p) => p.id && p.id.toLowerCase() === id.toLowerCase());
    if (!match) {
      const def = defaultPricingPlans.find((p) => p.id.toLowerCase() === id.toLowerCase());
      if (def) {
        match = { ...def };
        db.pricing.push(match);
      }
    }

    if (match) {
      match.price = num;
      // If Supabase configured, update on remote DB
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('pricing_plans')
          .update({ price: num, updated_at: new Date().toISOString() })
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('Supabase pricing update error', error);
          });
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  db.activities.unshift({
    id: `act-${Date.now()}`,
    text: 'Platform pricing updated',
    time: 'Just now',
    type: 'payment',
  });

  saveDB(db);
  const updatedPlans = getPricingPlans();
  emitChange('pricing', updatedPlans);
  emitChange('activities', db.activities);
  return updatedPlans;
};

export const updatePricingPlan = async (planId, newPrice) => {
  return updatePricingPlans({ [planId]: newPrice });
};

// ==========================================
// USERS API
// ==========================================
export const getUsers = () => {
  const db = loadDB();
  return [...db.users];
};

export const subscribeUsers = (callback) => {
  const handler = () => callback(getUsers());
  listeners.users.add(handler);
  handler();
  return () => listeners.users.delete(handler);
};

export const registerUserInDB = ({ name, email, role = 'Student', password }) => {
  const db = loadDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return existing;
  }
  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    role: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
    status: 'Active',
    joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  };
  db.users.push(newUser);
  db.activities.unshift({
    id: `act-${Date.now()}`,
    text: `New ${newUser.role.toLowerCase()} registration: ${newUser.name}`,
    time: 'Just now',
    type: 'new',
  });
  saveDB(db);
  emitChange('users', db.users);
  emitChange('activities', db.activities);
  return newUser;
};

export const toggleUserStatus = (id) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === id);
  if (user) {
    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    // If counselor, also toggle in psychologists table
    if (user.role === 'Counselor') {
      const psych = db.psychologists.find(p => p.id === user.psychologistId || p.name === user.name);
      if (psych) psych.status = user.status;
      emitChange('psychologists', db.psychologists);
    }
    saveDB(db);
    emitChange('users', db.users);
    return user;
  }
  return null;
};

export const deleteUserFromDB = (id) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === id);
  db.users = db.users.filter(u => u.id !== id);
  if (user && user.role === 'Counselor') {
    db.psychologists = db.psychologists.filter(p => p.id !== user.psychologistId && p.name !== user.name);
    emitChange('psychologists', db.psychologists);
  }
  saveDB(db);
  emitChange('users', db.users);
};

// ==========================================
// SESSIONS API
// ==========================================
export const getSessions = (filter = {}) => {
  const db = loadDB();
  let list = [...db.sessions];
  if (filter.studentId) list = list.filter(s => s.studentId === filter.studentId);
  if (filter.studentName) list = list.filter(s => s.studentName === filter.studentName);
  if (filter.counselorName) list = list.filter(s => s.counselorName === filter.counselorName);
  return list;
};

export const subscribeSessions = (callback, filter = {}) => {
  const handler = () => callback(getSessions(filter));
  listeners.sessions.add(handler);
  handler();
  return () => listeners.sessions.delete(handler);
};

export const bookSessionInDB = ({ studentId, studentName, counselorId, counselorName, type }) => {
  const db = loadDB();
  const newSession = {
    id: `sess-${Date.now()}`,
    studentId: studentId || 'student-current',
    studentName: studentName || 'Student',
    counselorId: counselorId || 'counselor-1',
    counselorName: counselorName,
    type,
    date: new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: type === 'Video Call' ? '3:00 PM' : type === 'Chat' ? '5:00 PM' : '4:00 PM',
    status: 'upcoming',
    createdAt: new Date().toISOString(),
  };
  db.sessions.unshift(newSession);

  // Update counselor sessionsCount
  const psych = db.psychologists.find(p => p.id === counselorId || p.name === counselorName);
  if (psych) {
    psych.sessionsCount = (psych.sessionsCount || 0) + 1;
    emitChange('psychologists', db.psychologists);
  }

  db.activities.unshift({
    id: `act-${Date.now()}`,
    text: `Session booked: ${counselorName} ↔ ${newSession.studentName} (${type})`,
    time: 'Just now',
    type: 'new',
  });

  saveDB(db);
  emitChange('sessions', db.sessions);
  emitChange('activities', db.activities);
  return newSession;
};

export const updateSessionStatus = (sessionId, status) => {
  const db = loadDB();
  const session = db.sessions.find(s => s.id === sessionId);
  if (session) {
    session.status = status;
    db.activities.unshift({
      id: `act-${Date.now()}`,
      text: `Session ${status}: ${session.counselorName} ↔ ${session.studentName}`,
      time: 'Just now',
      type: status === 'completed' ? 'complete' : 'query',
    });
    saveDB(db);
    emitChange('sessions', db.sessions);
    emitChange('activities', db.activities);
    return session;
  }
  return null;
};

// ==========================================
// APPROVALS API
// ==========================================
export const getApprovals = () => {
  const db = loadDB();
  return db.approvals.filter(a => a.status === 'pending');
};

export const subscribeApprovals = (callback) => {
  const handler = () => callback(getApprovals());
  listeners.approvals.add(handler);
  handler();
  return () => listeners.approvals.delete(handler);
};

export const approveCounselorApplication = (id) => {
  const db = loadDB();
  const app = db.approvals.find(a => a.id === id);
  if (app) {
    app.status = 'approved';
    const slug = app.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newPsych = {
      id: slug,
      slug,
      name: app.name,
      title: 'Counseling Psychologist',
      credentials: app.qualification,
      affiliation: app.university,
      city: 'Pakistan',
      image: '',
      about: `${app.name} is a licensed counseling psychologist specializing in student well-being and emotional regulation.`,
      specializations: ['Stress Management', 'Student Mental Health', 'Anxiety Support'],
      languages: ['English', 'Urdu'],
      sessionMode: 'Online',
      rating: 5.0,
      sessionsCount: 0,
      status: 'Active',
      role: 'Counselor',
    };
    db.psychologists.push(newPsych);

    const newUser = {
      id: `counselor-${slug}`,
      psychologistId: slug,
      name: app.name,
      role: 'Counselor',
      email: `${slug.split('-')[0]}@highonhealing.pk`,
      status: 'Active',
      joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };
    db.users.push(newUser);

    db.activities.unshift({
      id: `act-${Date.now()}`,
      text: `Counselor application approved: ${app.name}`,
      time: 'Just now',
      type: 'complete',
    });

    saveDB(db);
    emitChange('approvals', db.approvals);
    emitChange('psychologists', db.psychologists);
    emitChange('users', db.users);
    emitChange('activities', db.activities);
    return newPsych;
  }
  return null;
};

export const rejectCounselorApplication = (id) => {
  const db = loadDB();
  const app = db.approvals.find(a => a.id === id);
  if (app) {
    app.status = 'rejected';
    db.activities.unshift({
      id: `act-${Date.now()}`,
      text: `Counselor application rejected: ${app.name}`,
      time: 'Just now',
      type: 'query',
    });
    saveDB(db);
    emitChange('approvals', db.approvals);
    emitChange('activities', db.activities);
  }
};

// ==========================================
// SUPPORT QUERIES API
// ==========================================
export const getQueries = () => {
  const db = loadDB();
  return [...db.queries];
};

export const subscribeQueries = (callback) => {
  const handler = () => callback(getQueries());
  listeners.queries.add(handler);
  handler();
  return () => listeners.queries.delete(handler);
};

export const submitSupportQuery = ({ name, email, subject, message }) => {
  const db = loadDB();
  const newQuery = {
    id: `q-${Date.now()}`,
    from: name,
    email,
    role: 'Student',
    subject,
    message,
    time: 'Just now',
    status: 'open',
    reply: '',
  };
  db.queries.unshift(newQuery);
  db.activities.unshift({
    id: `act-${Date.now()}`,
    text: `Support query submitted: ${subject} (${name})`,
    time: 'Just now',
    type: 'query',
  });
  saveDB(db);
  emitChange('queries', db.queries);
  emitChange('activities', db.activities);
  return newQuery;
};

export const replyToQuery = (id, replyText) => {
  const db = loadDB();
  const query = db.queries.find(q => q.id === id);
  if (query) {
    query.status = 'resolved';
    query.reply = replyText;
    saveDB(db);
    emitChange('queries', db.queries);
    return query;
  }
  return null;
};

export const closeQueryInDB = (id) => {
  const db = loadDB();
  db.queries = db.queries.filter(q => q.id !== id);
  saveDB(db);
  emitChange('queries', db.queries);
};

// ==========================================
// RECENT ACTIVITY & ADMIN STATS
// ==========================================
export const getRecentActivities = () => {
  const db = loadDB();
  return [...db.activities].slice(0, 8);
};

export const subscribeActivities = (callback) => {
  const handler = () => callback(getRecentActivities());
  listeners.activities.add(handler);
  handler();
  return () => listeners.activities.delete(handler);
};

export const subscribeAdminStats = (callback) => {
  const handler = () => callback(computeStats());
  listeners.stats.add(handler);
  handler();
  return () => listeners.stats.delete(handler);
};
