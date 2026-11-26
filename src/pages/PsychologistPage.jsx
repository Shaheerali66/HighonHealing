import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiMapPin, FiGlobe, FiBriefcase, FiAward, FiClock } from 'react-icons/fi';
import { psychologists } from '../data/psychologists';
import PsychAvatar from '../components/PsychAvatar';
import './PsychologistPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const PsychologistPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/psychologists');
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const psychologist = psychologists.find((p) => p.slug === slug);

  if (!psychologist) {
    return (
      <main className="psych-detail-page section-padding">
        <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <h2>Psychologist Not Found</h2>
          <p style={{ margin: '16px 0 24px', color: 'var(--charcoal-500)' }}>
            We could not find the specialist you are looking for.
          </p>
          <Link to="/#psychologists" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="psych-detail-page section-padding">
      <div className="container">
        <div className="psych-detail__back">
          <button
            onClick={handleBack}
            className="psych-detail__back-link"
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            <FiArrowLeft /> Back
          </button>
        </div>

        <motion.div
          className="psych-detail-card glass-card"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div className="psych-detail__header">
            <PsychAvatar name={psychologist.name} image={psychologist.image} size={100} />
            <div className="psych-detail__header-info">
              <h1 className="psych-detail__name">{psychologist.name}</h1>
              <p className="psych-detail__title">{psychologist.title}</p>

              <div className="psych-detail__meta">
                {psychologist.credentials && (
                  <span className="psych-detail__meta-item">
                    <FiAward /> {psychologist.credentials}
                  </span>
                )}
                {psychologist.affiliation && (
                  <span className="psych-detail__meta-item">
                    <FiBriefcase /> {psychologist.affiliation}
                  </span>
                )}
                {psychologist.city && (
                  <span className="psych-detail__meta-item">
                    <FiMapPin /> {psychologist.city}
                  </span>
                )}
                {psychologist.sessionMode && (
                  <span className="psych-detail__meta-item">
                    <FiClock /> {psychologist.sessionMode}
                  </span>
                )}
                {psychologist.languages?.length > 0 && (
                  <span className="psych-detail__meta-item">
                    <FiGlobe /> {psychologist.languages.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="psych-detail__body">
            <div className="psych-detail__section">
              <h3 className="psych-detail__section-title">About</h3>
              <p className="psych-detail__about">{psychologist.about}</p>
            </div>

            {psychologist.specializations?.length > 0 && (
              <div className="psych-detail__section">
                <h3 className="psych-detail__section-title">Specializations</h3>
                <div className="psych-detail__chips">
                  {psychologist.specializations.map((spec, i) => (
                    <span key={i} className="psych-detail__chip">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="psych-detail__action">
              <Link to="/signup" className="btn btn-primary btn-lg" id="psych-book-appointment-btn">
                Book Appointment
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default PsychologistPage;
