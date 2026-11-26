import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers, FaUserMd, FaCalendarAlt,
  FaSignOutAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaEnvelope, FaUserGraduate, FaCheck, FaTimes, FaTrash,
  FaReply
} from 'react-icons/fa';
import { FiUsers, FiUserCheck, FiBarChart2, FiInbox, FiSettings } from 'react-icons/fi';
import {
  subscribeUsers, toggleUserStatus, deleteUserFromDB,
  subscribeApprovals, approveCounselorApplication, rejectCounselorApplication,
  subscribeQueries, replyToQuery, closeQueryInDB,
  subscribeAdminStats, subscribeActivities, subscribeSessions,
  subscribePricing, updatePricingPlan, updatePricingPlans
} from '../../services/db';
import { logoutUser } from '../../services/auth';
import logoImg from '../../assets/logo.png';
import './Dashboards.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Database-driven state
  const [stats, setStats] = useState({ totalStudents: 0, counselors: 0, sessionsToday: 0, pendingReviews: 0 });
  const [users, setUsers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [queries, setQueries] = useState([]);
  const [activities, setActivities] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [pricing, setPricing] = useState([]);

  // Editable pricing inputs
  const [starterPrice, setStarterPrice] = useState(500);
  const [growthPrice, setGrowthPrice] = useState(1500);
  const [premiumPrice, setPremiumPrice] = useState(3000);
  const [savingPricing, setSavingPricing] = useState(false);

  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Real-time subscriptions
  useEffect(() => {
    const unsubStats = subscribeAdminStats(setStats);
    const unsubUsers = subscribeUsers(setUsers);
    const unsubApprovals = subscribeApprovals(setApprovals);
    const unsubQueries = subscribeQueries(setQueries);
    const unsubActivities = subscribeActivities(setActivities);
    const unsubSessions = subscribeSessions(setSessions);
    const unsubPricing = subscribePricing((plans) => {
      setPricing(plans);
      const st = plans.find(p => p.id === 'starter');
      const gr = plans.find(p => p.id === 'growth');
      const pr = plans.find(p => p.id === 'premium');
      if (st) setStarterPrice(st.price);
      if (gr) setGrowthPrice(gr.price);
      if (pr) setPremiumPrice(pr.price);
    });

    return () => {
      unsubStats();
      unsubUsers();
      unsubApprovals();
      unsubQueries();
      unsubActivities();
      unsubSessions();
      unsubPricing();
    };
  }, []);

  const handleApprove = (id) => {
    const psych = approveCounselorApplication(id);
    if (psych) {
      showToast(`${psych.name} approved as Counselor!`);
    }
  };

  const handleReject = (id) => {
    rejectCounselorApplication(id);
    showToast('Counselor application rejected.');
  };

  const handleToggleUserStatus = (id) => {
    const updated = toggleUserStatus(id);
    if (updated) {
      showToast(`User status set to ${updated.status}.`);
    }
  };

  const handleDeleteUser = (id) => {
    deleteUserFromDB(id);
    showToast('User removed from platform.');
  };

  const handleReplyQuery = (id) => {
    replyToQuery(id, replyText);
    setReplyModal(null);
    setReplyText('');
    showToast('Reply sent successfully!');
  };

  const handleCloseQuery = (id) => {
    closeQueryInDB(id);
    showToast('Query closed.');
  };

  const handleUpdatePricing = async () => {
    const s = Number(starterPrice);
    const g = Number(growthPrice);
    const p = Number(premiumPrice);
    if (isNaN(s) || s <= 0 || isNaN(g) || g <= 0 || isNaN(p) || p <= 0) {
      showToast('Error: All prices must be positive numbers.');
      return;
    }
    setSavingPricing(true);
    try {
      await updatePricingPlans({ starter: s, growth: g, premium: p });
      showToast('Pricing updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to update pricing');
    } finally {
      setSavingPricing(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  // Compute weekly sessions breakdown (Mon to Sun) from actual session records
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  sessions.forEach(s => {
    const d = new Date(s.createdAt || Date.now());
    const dayIdx = (d.getDay() + 6) % 7; // Convert Sun(0) -> 6, Mon(1) -> 0
    dayCounts[dayIdx]++;
  });
  const maxDayCount = Math.max(...dayCounts, 1);
  const barHeights = dayCounts.map(count => (count / maxDayCount) * 85);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FiBarChart2 /> },
    { id: 'users', label: 'Users', icon: <FiUsers /> },
    { id: 'approvals', label: 'Approvals', icon: <FiUserCheck /> },
    { id: 'queries', label: 'Queries', icon: <FiInbox /> },
    { id: 'settings', label: 'Settings', icon: <FiSettings /> },
  ];

  return (
    <div className="dashboard dashboard--admin" id="admin-dashboard">
      <aside className="dashboard__sidebar dashboard__sidebar--admin">
        <Link to="/" className="dashboard__logo">
          <img src={logoImg} alt="High on Healing" className="dashboard__logo-img" />
          <span className="dashboard__logo-text">High on Healing</span>
        </Link>

        <nav className="dashboard__nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`dashboard__nav-item ${activeTab === tab.id ? 'dashboard__nav-item--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} className="dashboard__logout" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      <main className="dashboard__main">
        <header className="dashboard__header">
          <div>
            <h1 className="dashboard__welcome">Admin <span className="accent-text">Dashboard</span> 🛡️</h1>
            <p className="dashboard__date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="dashboard__header-actions">
            <div className="dashboard__avatar dashboard__avatar--admin">A</div>
          </div>
        </header>

        {/* Toast */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div className="dashboard__toast" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <FaCheck /> {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time Calculated Statistics */}
        <div className="dashboard__stats">
          {[
            { label: 'Total Students', value: String(stats.totalStudents), icon: <FaUserGraduate />, color: 'var(--pink-500)' },
            { label: 'Counsellors', value: String(stats.counselors), icon: <FaUserMd />, color: 'var(--purple-500)' },
            { label: 'Sessions Today', value: String(stats.sessionsToday), icon: <FaCalendarAlt />, color: 'var(--blue-400)' },
            { label: 'Pending Reviews', value: String(stats.pendingReviews), icon: <FaClock />, color: 'var(--pink-600)' },
          ].map((stat, i) => (
            <motion.div key={i} className="dashboard__stat-card glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="dashboard__stat-icon" style={{ color: stat.color, background: `${stat.color}14` }}>{stat.icon}</div>
              <div>
                <p className="dashboard__stat-value">{stat.value}</p>
                <p className="dashboard__stat-label">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {activeTab === 'overview' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">Platform Overview</h2>
            <div className="admin-overview-grid">
              <div className="admin-chart-card glass-card">
                <h3>Weekly Sessions</h3>
                {sessions.length > 0 ? (
                  <div className="admin-chart-placeholder">
                    <div className="admin-bar-chart">
                      {barHeights.map((h, i) => (
                        <motion.div key={i} className="admin-bar" initial={{ height: 0 }} animate={{ height: `${Math.max(h, 8)}%` }} transition={{ delay: i * 0.08, duration: 0.5 }} />
                      ))}
                    </div>
                    <div className="admin-bar-labels">
                      {dayNames.map((d, i) => (
                        <span key={i}>{d}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="dashboard__empty-state" style={{ padding: '36px 0' }}>
                    <FaCalendarAlt className="dashboard__empty-icon" />
                    <p>No session activity recorded yet this week.</p>
                  </div>
                )}
              </div>
              <div className="admin-chart-card glass-card">
                <h3>Recent Activity</h3>
                {activities.length > 0 ? (
                  <div className="admin-activity-list">
                    {activities.map((a, i) => (
                      <div key={a.id || i} className="admin-activity-item">
                        <div className={`admin-activity-dot admin-activity-dot--${a.type}`} />
                        <div>
                          <p className="admin-activity-text">{a.text}</p>
                          <p className="admin-activity-time">{a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard__empty-state" style={{ padding: '36px 0' }}>
                    <p>No recent activity recorded.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">User Management</h2>
            {users.length > 0 ? (
              <div className="admin-users-table glass-card">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="admin-users-table__name">{u.name}</td>
                        <td><span className={`admin-role-badge admin-role-badge--${u.role.toLowerCase()}`}>{u.role}</span></td>
                        <td>{u.email}</td>
                        <td>
                          <span
                            className={`admin-status admin-status--${u.status.toLowerCase()} admin-status--clickable`}
                            onClick={() => handleToggleUserStatus(u.id)}
                            title="Click to toggle status"
                          >
                            {u.status}
                          </span>
                        </td>
                        <td>{u.joined}</td>
                        <td>
                          <button className="btn-icon btn-icon--danger" onClick={() => handleDeleteUser(u.id)} title="Remove user">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <FaUsers className="dashboard__empty-icon" />
                <p>No users found in database.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'approvals' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">Pending Approvals</h2>
            {approvals.length > 0 ? (
              <div className="admin-approvals-list">
                {approvals.map((a, i) => (
                  <motion.div key={a.id} className="approval-card glass-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <div className="approval-card__avatar">{a.name[0]}</div>
                    <div className="approval-card__info">
                      <h4>{a.name}</h4>
                      <p>{a.qualification} — {a.university}</p>
                      <p className="approval-card__time">Applied {a.applied}</p>
                    </div>
                    <div className="approval-card__actions">
                      <button className="btn btn-primary approval-card__approve" onClick={() => handleApprove(a.id)}><FaCheckCircle /> Approve</button>
                      <button className="btn btn-secondary approval-card__reject" onClick={() => handleReject(a.id)}><FaTimesCircle /> Reject</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <FaCheckCircle className="dashboard__empty-icon" style={{ color: '#22c55e' }} />
                <p>All caught up! No pending approvals.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'queries' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">Support Queries</h2>
            {queries.length > 0 ? (
              <div className="admin-queries-list">
                {queries.map((q, i) => (
                  <motion.div key={q.id} className="query-card glass-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="query-card__header">
                      <div className="query-card__from">
                        <div className="query-card__avatar">{q.from[0]}</div>
                        <div>
                          <h4>{q.from}</h4>
                          <span className={`admin-role-badge admin-role-badge--${(q.role || 'student').toLowerCase()}`}>{q.role || 'Student'}</span>
                        </div>
                      </div>
                      <span className={`query-card__status query-card__status--${q.status}`}>{q.status === 'open' ? '🟡 Open' : '✅ Resolved'}</span>
                    </div>
                    <h4 className="query-card__subject">{q.subject}</h4>
                    <p className="query-card__message">{q.message}</p>
                    {q.reply && (
                      <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <strong>Reply sent:</strong> {q.reply}
                      </div>
                    )}
                    <div className="query-card__footer">
                      <span className="query-card__time">{q.time}</span>
                      <div className="query-card__actions">
                        {q.status === 'open' && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setReplyModal(q); setReplyText(''); }}>
                            <FaReply /> Reply
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => handleCloseQuery(q.id)}>
                          <FaTimes /> Close
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <FaEnvelope className="dashboard__empty-icon" />
                <p>No support queries at the moment.</p>
              </div>
            )}

            {/* Reply Modal */}
            <AnimatePresence>
              {replyModal && (
                <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReplyModal(null)}>
                  <motion.div className="modal glass-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
                    <button className="modal__close" onClick={() => setReplyModal(null)}><FaTimes /></button>
                    <h3 className="modal__name">Reply to: {replyModal.from}</h3>
                    <p className="modal__designation">Re: {replyModal.subject}</p>
                    <div className="modal__original-msg">
                      <p>&quot;{replyModal.message}&quot;</p>
                    </div>
                    <textarea className="modal__textarea" rows="5" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..." />
                    <div className="modal__actions">
                      <button className="btn btn-primary" onClick={() => handleReplyQuery(replyModal.id)} disabled={!replyText.trim()}>
                        <FaReply /> Send Reply
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">Platform Settings</h2>
            <div className="dashboard__settings-grid">
              <div className="settings-card glass-card">
                <h3>General</h3>
                <div className="settings-card__item">
                  <label>Platform Name</label>
                  <input type="text" defaultValue="High on Healing" />
                </div>
                <div className="settings-card__item">
                  <label>Support Email</label>
                  <input type="email" defaultValue="support@highonhealing.pk" />
                </div>
                <button className="btn btn-primary" onClick={() => showToast('Settings saved!')}>Save Settings</button>
              </div>
              <div className="settings-card glass-card">
                <h3>Pricing (PKR)</h3>
                <div className="settings-card__item">
                  <label>Starter Plan</label>
                  <input
                    type="number"
                    value={starterPrice}
                    onChange={(e) => setStarterPrice(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="settings-card__item">
                  <label>Growth Plan</label>
                  <input
                    type="number"
                    value={growthPrice}
                    onChange={(e) => setGrowthPrice(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="settings-card__item">
                  <label>Premium Plan</label>
                  <input
                    type="number"
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(e.target.value)}
                    min="1"
                  />
                </div>
                <button className="btn btn-primary" onClick={handleUpdatePricing} disabled={savingPricing}>
                  {savingPricing ? 'Saving...' : 'Update Pricing'}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
