import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserMd, FaCalendarAlt, FaComments, FaChartLine,
  FaRobot, FaSignOutAlt, FaSearch, FaStar, FaEnvelope, FaCheck,
  FaPhone, FaVideo, FaTimes
} from 'react-icons/fa';
import { FiUsers, FiCalendar, FiMessageCircle, FiActivity, FiCpu } from 'react-icons/fi';
import AIChatbot from '../../components/AIChatbot';
import PsychAvatar from '../../components/PsychAvatar';
import { subscribePsychologists, subscribeSessions, bookSessionInDB, updateSessionStatus } from '../../services/db';
import { getCurrentUser, logoutUser, onAuthChange } from '../../services/auth';
import logoImg from '../../assets/logo.png';
import './Dashboards.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactModal, setContactModal] = useState(null);
  const [contactSuccess, setContactSuccess] = useState(null);

  // Authenticated user
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser() || { name: 'Student', role: 'Student' });

  // Centralized Database-driven state
  const [consultants, setConsultants] = useState([]);
  const [bookedSessions, setBookedSessions] = useState([]);

  useEffect(() => {
    const unsubAuth = onAuthChange((u) => {
      if (u) setCurrentUser(u);
    });

    const unsubPsych = subscribePsychologists(setConsultants, true);

    const unsubSessions = subscribeSessions((sessions) => {
      const myId = currentUser?.id;
      const myName = currentUser?.name;
      const mySessions = sessions.filter(s =>
        (myId && s.studentId === myId) ||
        (myName && s.studentName.toLowerCase() === myName.toLowerCase())
      );
      setBookedSessions(mySessions);
    });

    return () => {
      unsubAuth();
      unsubPsych();
      unsubSessions();
    };
  }, [currentUser?.id, currentUser?.name]);

  const filteredConsultants = consultants.filter(c =>
    (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.credentials && c.credentials.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.affiliation && c.affiliation.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.specializations && c.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleContact = (consultant) => {
    setContactModal(consultant);
  };

  const handleBookSession = (consultant, type) => {
    bookSessionInDB({
      studentId: currentUser?.id,
      studentName: currentUser?.name || 'Student',
      counselorId: consultant.id,
      counselorName: consultant.name,
      type,
    });
    setContactModal(null);
    setContactSuccess(consultant.name);
    setTimeout(() => setContactSuccess(null), 3500);
  };

  const handleCancelSession = (sessionId) => {
    updateSessionStatus(sessionId, 'cancelled');
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const tabs = [
    { id: 'directory', label: 'Consultants', icon: <FiUsers /> },
    { id: 'sessions', label: 'My Sessions', icon: <FiCalendar /> },
    { id: 'messages', label: 'Messages', icon: <FiMessageCircle /> },
    { id: 'progress', label: 'Progress', icon: <FiActivity /> },
    { id: 'chatbot', label: 'AI Chat', icon: <FiCpu /> },
  ];

  return (
    <div className="dashboard" id="student-dashboard">
      {/* Sidebar */}
      <aside className="dashboard__sidebar">
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

      {/* Main Content */}
      <main className="dashboard__main">
        <header className="dashboard__header">
          <div>
            <h1 className="dashboard__welcome">
              Welcome back, <span className="accent-text">{currentUser?.name || 'Student'}</span> 👋
            </h1>
            <p className="dashboard__date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="dashboard__header-actions">
            <div className="dashboard__avatar">{currentUser?.name ? currentUser.name[0] : 'S'}</div>
          </div>
        </header>

        {/* Success Toast */}
        <AnimatePresence>
          {contactSuccess && (
            <motion.div
              className="dashboard__toast"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FaCheck /> Session booked with {contactSuccess}!
            </motion.div>
          )}
        </AnimatePresence>

        {/* User-Specific Real-Time Stats */}
        <div className="dashboard__stats">
          {[
            { label: 'Total Sessions', value: String(bookedSessions.length), icon: <FaCalendarAlt />, color: 'var(--pink-500)' },
            { label: 'Messages', value: bookedSessions.length > 0 ? String(bookedSessions.length * 2) : '0', icon: <FaComments />, color: 'var(--purple-500)' },
            { label: 'Mood Score', value: '—', icon: <FaChartLine />, color: 'var(--blue-400)' },
            { label: 'AI Interactions', value: '0', icon: <FaRobot />, color: 'var(--pink-600)' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="dashboard__stat-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="dashboard__stat-icon" style={{ color: stat.color, background: `${stat.color}14` }}>
                {stat.icon}
              </div>
              <div>
                <p className="dashboard__stat-value">{stat.value}</p>
                <p className="dashboard__stat-label">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'directory' && (
          <section className="dashboard__section">
            <div className="dashboard__section-header">
              <h2 className="dashboard__section-title">Find a Counselor</h2>
              <div className="dashboard__search">
                <FaSearch className="dashboard__search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, title, or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dashboard__search-input"
                  id="consultant-search"
                />
              </div>
            </div>

            <div className="dashboard__consultants-grid">
              {filteredConsultants.map((c, i) => (
                <motion.div
                  key={c.id || c.slug}
                  className="consultant-card glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <PsychAvatar name={c.name} image={c.image} size={56} />
                  </div>
                  <h3 className="consultant-card__name">{c.name}</h3>
                  <p className="consultant-card__designation">{c.title || 'Clinical Specialist'}</p>
                  <p className="consultant-card__qualification">{c.credentials || c.affiliation || c.city || 'Verified Professional'}</p>
                  <div className="consultant-card__meta">
                    <span className="consultant-card__rating"><FaStar /> {c.rating || 5.0}</span>
                    <span className="consultant-card__sessions">{c.sessionsCount || 0} sessions</span>
                  </div>
                  <button className="btn btn-primary consultant-card__contact-btn" onClick={() => handleContact(c)}>
                    <FaEnvelope /> Contact
                  </button>
                </motion.div>
              ))}
              {filteredConsultants.length === 0 && (
                <div className="dashboard__empty-state" style={{ gridColumn: '1 / -1' }}>
                  <FaSearch className="dashboard__empty-icon" />
                  <p>No counselors found matching &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'sessions' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">My Sessions</h2>
            {bookedSessions.length > 0 ? (
              <div className="dashboard__schedule-list">
                {bookedSessions.map((session, i) => (
                  <motion.div key={session.id} className="schedule-item glass-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="schedule-item__avatar">{session.counselorName ? session.counselorName[0] : 'C'}</div>
                    <div className="schedule-item__info">
                      <h4 className="schedule-item__name">{session.counselorName}</h4>
                      <p className="schedule-item__type">{session.type}</p>
                    </div>
                    <div className="schedule-item__time">
                      <span className="schedule-item__clock">{session.time}</span>
                      <span className="schedule-item__date">{session.date}</span>
                    </div>
                    <span className={`schedule-item__status schedule-item__status--${session.status}`}>
                      {session.status === 'upcoming' ? 'Upcoming' : session.status === 'completed' ? 'Completed' : 'Cancelled'}
                    </span>
                    {session.status === 'upcoming' && (
                      <button className="btn-icon btn-icon--danger" onClick={() => handleCancelSession(session.id)} title="Cancel session">
                        <FaTimes />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <FaCalendarAlt className="dashboard__empty-icon" />
                <p>No sessions booked yet. Browse counselors and book your first session!</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('directory')}>Find a Counselor</button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'messages' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">Messages</h2>
            {bookedSessions.length > 0 ? (
              <div className="dashboard__messages-list">
                {bookedSessions.map((session, i) => (
                  <motion.div key={session.id} className="message-preview glass-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="message-preview__avatar">{session.counselorName ? session.counselorName[0] : 'C'}</div>
                    <div className="message-preview__info">
                      <h4>{session.counselorName}</h4>
                      <p className="message-preview__preview">Session {session.type} confirmed for {session.date} at {session.time}</p>
                    </div>
                    <span className="message-preview__time">Active</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <FaComments className="dashboard__empty-icon" />
                <p>Your conversations with counselors will appear here after booking a session.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('directory')}>Find a Counselor</button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'progress' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">My Progress</h2>
            <div className="dashboard__empty-state" style={{ padding: '48px 0' }}>
              <FiActivity className="dashboard__empty-icon" />
              <p style={{ marginTop: '12px', fontSize: '1rem' }}>No mood logs recorded yet. Begin by tracking your daily wellness check-in.</p>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setActiveTab('chatbot')}>
                Talk with AI Assistant
              </button>
            </div>
          </section>
        )}

        {activeTab === 'chatbot' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">AI Chatbot Assistant</h2>
            <AIChatbot />
          </section>
        )}
      </main>

      {/* Contact Modal */}
      <AnimatePresence>
        {contactModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setContactModal(null)}
          >
            <motion.div
              className="modal glass-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal__close" onClick={() => setContactModal(null)}><FaTimes /></button>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <PsychAvatar name={contactModal.name} image={contactModal.image} size={72} />
              </div>
              <h3 className="modal__name">{contactModal.name}</h3>
              <p className="modal__designation">{contactModal.title}</p>
              <p className="modal__qualification">{contactModal.credentials || contactModal.affiliation || contactModal.city}</p>
              <div className="modal__rating">
                <FaStar className="modal__star" /> {contactModal.rating || 5.0} rating • {contactModal.sessionsCount || 0} sessions
              </div>
              <p className="modal__subtitle">Choose how you&apos;d like to connect:</p>
              <div className="modal__actions">
                <button className="btn btn-primary modal__action-btn" onClick={() => handleBookSession(contactModal, 'Video Call')}>
                  <FaVideo /> Video Call
                </button>
                <button className="btn btn-secondary modal__action-btn" onClick={() => handleBookSession(contactModal, 'Phone Call')}>
                  <FaPhone /> Phone Call
                </button>
                <button className="btn btn-secondary modal__action-btn" onClick={() => handleBookSession(contactModal, 'Chat')}>
                  <FaComments /> Chat Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;
