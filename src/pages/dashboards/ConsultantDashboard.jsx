import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCalendarAlt, FaUsers, FaComments, FaMoneyBillWave,
  FaSignOutAlt, FaClock, FaCheckCircle, FaCheck, FaTimes
} from 'react-icons/fa';
import { FiCalendar, FiUsers, FiMessageCircle, FiDollarSign, FiEdit, FiCpu } from 'react-icons/fi';
import AIChatbot from '../../components/AIChatbot';
import { subscribeSessions, updateSessionStatus, subscribePsychologists, updatePsychologist } from '../../services/db';
import { getCurrentUser, logoutUser, onAuthChange } from '../../services/auth';
import logoImg from '../../assets/logo.png';
import './Dashboards.css';

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('schedule');
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser() || { name: 'Counselor', role: 'Counselor' });
  const [schedule, setSchedule] = useState([]);
  const [myPsychologist, setMyPsychologist] = useState(null);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [noteText, setNoteText] = useState('');

  const [profileData, setProfileData] = useState({
    name: 'Consultant Counselor',
    title: 'Clinical Specialist',
    credentials: '',
    about: '',
  });

  useEffect(() => {
    const unsubAuth = onAuthChange((u) => {
      if (u) setCurrentUser(u);
    });

    const unsubSessions = subscribeSessions((all) => {
      const myName = currentUser?.name;
      const myPsychId = currentUser?.psychologistId;
      const mySchedule = all.filter(s =>
        (myPsychId && s.counselorId === myPsychId) ||
        (myName && s.counselorName && s.counselorName.toLowerCase() === myName.toLowerCase()) ||
        currentUser?.role === 'Admin'
      );
      setSchedule(mySchedule);
    });

    const unsubPsych = subscribePsychologists((list) => {
      const found = list.find(p =>
        p.id === currentUser?.psychologistId ||
        p.name.toLowerCase() === currentUser?.name?.toLowerCase()
      );
      if (found) {
        setMyPsychologist(found);
        setProfileData({
          name: found.name,
          title: found.title,
          credentials: found.credentials,
          about: found.about,
        });
      }
    }, false);

    return () => {
      unsubAuth();
      unsubSessions();
      unsubPsych();
    };
  }, [currentUser?.id, currentUser?.name, currentUser?.psychologistId]);

  const handleCompleteSession = (sessionId) => {
    updateSessionStatus(sessionId, 'completed');
  };

  const handleCancelSession = (sessionId) => {
    updateSessionStatus(sessionId, 'cancelled');
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (myPsychologist) {
      updatePsychologist(myPsychologist.id, profileData);
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  // Extract unique students
  const studentMap = {};
  schedule.forEach(s => {
    if (!studentMap[s.studentName]) {
      studentMap[s.studentName] = {
        name: s.studentName,
        sessions: 1,
        lastSession: s.date,
        mood: 'Stable',
      };
    } else {
      studentMap[s.studentName].sessions++;
    }
  });
  const studentsList = Object.values(studentMap);

  const completedCount = schedule.filter(s => s.status === 'completed').length;
  const earningsEstimate = completedCount * 1500;

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: <FiCalendar /> },
    { id: 'students', label: 'Students', icon: <FiUsers /> },
    { id: 'messages', label: 'Messages', icon: <FiMessageCircle /> },
    { id: 'earnings', label: 'Earnings', icon: <FiDollarSign /> },
    { id: 'profile', label: 'Profile', icon: <FiEdit /> },
    { id: 'chatbot', label: 'AI Chat', icon: <FiCpu /> },
  ];

  return (
    <div className="dashboard dashboard--consultant" id="consultant-dashboard">
      <aside className="dashboard__sidebar dashboard__sidebar--consultant">
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
            <h1 className="dashboard__welcome">
              Welcome, <span className="accent-text">{currentUser?.name || 'Counselor'}</span> 💜
            </h1>
            <p className="dashboard__date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="dashboard__header-actions">
            <div className="dashboard__avatar dashboard__avatar--consultant">{currentUser?.name ? currentUser.name[0] : 'C'}</div>
          </div>
        </header>

        {/* Toasts */}
        <AnimatePresence>
          {profileSaved && (
            <motion.div className="dashboard__toast" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <FaCheck /> Profile updated successfully!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="dashboard__stats">
          {[
            { label: 'Total Students', value: String(studentsList.length), icon: <FaUsers />, color: 'var(--purple-500)' },
            { label: 'Sessions Scheduled', value: String(schedule.length), icon: <FaCalendarAlt />, color: 'var(--pink-500)' },
            { label: 'Completed', value: String(completedCount), icon: <FaCheckCircle />, color: 'var(--blue-400)' },
            { label: 'Earnings', value: `Rs. ${earningsEstimate.toLocaleString()}`, icon: <FaMoneyBillWave />, color: 'var(--pink-600)' },
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

        {activeTab === 'schedule' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">My Schedule</h2>
            {schedule.length > 0 ? (
              <div className="dashboard__schedule-list">
                {schedule.map((s, i) => (
                  <motion.div key={s.id} className="schedule-item glass-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <div className="schedule-item__avatar">{s.studentName ? s.studentName[0] : 'S'}</div>
                    <div className="schedule-item__info">
                      <h4 className="schedule-item__name">{s.studentName}</h4>
                      <p className="schedule-item__type">{s.type}</p>
                    </div>
                    <div className="schedule-item__time">
                      <span className="schedule-item__clock"><FaClock /> {s.time}</span>
                      <span className="schedule-item__date">{s.date}</span>
                    </div>
                    <span className={`schedule-item__status schedule-item__status--${s.status}`}>
                      {s.status === 'upcoming' ? 'Upcoming' : s.status === 'completed' ? 'Completed' : 'Cancelled'}
                    </span>
                    {s.status === 'upcoming' && (
                      <div className="schedule-item__actions">
                        <button className="btn-icon btn-icon--success" onClick={() => handleCompleteSession(s.id)} title="Mark complete">
                          <FaCheckCircle />
                        </button>
                        <button className="btn-icon btn-icon--danger" onClick={() => handleCancelSession(s.id)} title="Cancel">
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <FaCalendarAlt className="dashboard__empty-icon" />
                <p>No sessions scheduled. Your booked student sessions will appear here.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'students' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">My Students</h2>
            {studentsList.length > 0 ? (
              <div className="dashboard__students-list">
                {studentsList.map((s, i) => (
                  <motion.div key={i} className="student-row glass-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <div className="student-row__avatar">{s.name[0]}</div>
                    <div className="student-row__info">
                      <h4>{s.name}</h4>
                      <p>{s.sessions} session{s.sessions > 1 ? 's' : ''} • Last: {s.lastSession}</p>
                    </div>
                    <span className="student-row__mood student-row__mood--stable">{s.mood}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedStudent(s); setNoteText(''); }}>
                      Add Note
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <FaUsers className="dashboard__empty-icon" />
                <p>No student records yet. Students who book sessions with you will be listed here.</p>
              </div>
            )}

            {/* Note Modal */}
            <AnimatePresence>
              {selectedStudent && (
                <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedStudent(null)}>
                  <motion.div className="modal glass-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
                    <button className="modal__close" onClick={() => setSelectedStudent(null)}><FaTimes /></button>
                    <h3 className="modal__name">Session Notes: {selectedStudent.name}</h3>
                    <p className="modal__designation">Add confidential notes about this student&apos;s progress.</p>
                    <textarea
                      className="modal__textarea"
                      rows="6"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Write session notes here..."
                    />
                    <div className="modal__actions">
                      <button className="btn btn-primary" onClick={() => setSelectedStudent(null)}>Save Note</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {activeTab === 'messages' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">Messages</h2>
            {schedule.length > 0 ? (
              <div className="dashboard__messages-list">
                {schedule.map((s, i) => (
                  <motion.div key={s.id} className="message-preview glass-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="message-preview__avatar">{s.studentName ? s.studentName[0] : 'S'}</div>
                    <div className="message-preview__info">
                      <h4>{s.studentName}</h4>
                      <p className="message-preview__preview">Session {s.type} scheduled for {s.date} at {s.time}</p>
                    </div>
                    <span className="message-preview__time">{s.date}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <FaComments className="dashboard__empty-icon" />
                <p>Messages from your booked students will appear here.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'earnings' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">Earnings Overview</h2>
            <div className="dashboard__earnings-summary">
              <div className="earnings-card glass-card">
                <h3>This Month</h3>
                <p className="earnings-card__amount">Rs. {earningsEstimate.toLocaleString()}</p>
                <p className="earnings-card__detail">{completedCount} sessions completed</p>
              </div>
              <div className="earnings-card glass-card">
                <h3>Total Earned</h3>
                <p className="earnings-card__amount">Rs. {earningsEstimate.toLocaleString()}</p>
                <p className="earnings-card__detail">Since joining High on Healing</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">Edit Profile</h2>
            <form className="dashboard__profile-form glass-card" onSubmit={handleSaveProfile}>
              <div className="profile-form__fields">
                <div className="profile-form__group">
                  <label>Display Name</label>
                  <input type="text" value={profileData.name} onChange={(e) => handleProfileChange('name', e.target.value)} />
                </div>
                <div className="profile-form__group">
                  <label>Title / Designation</label>
                  <input type="text" value={profileData.title} onChange={(e) => handleProfileChange('title', e.target.value)} />
                </div>
                <div className="profile-form__group">
                  <label>Qualification / Affiliation</label>
                  <input type="text" value={profileData.credentials} onChange={(e) => handleProfileChange('credentials', e.target.value)} />
                </div>
                <div className="profile-form__group">
                  <label>Bio / About</label>
                  <textarea rows="4" value={profileData.about} onChange={(e) => handleProfileChange('about', e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'chatbot' && (
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">AI Assistant</h2>
            <AIChatbot />
          </section>
        )}
      </main>
    </div>
  );
};

export default ConsultantDashboard;
