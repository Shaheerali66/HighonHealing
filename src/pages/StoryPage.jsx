import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiMapPin, FiUser, FiBook } from 'react-icons/fi';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';
import { stories } from '../data/stories';
import PsychAvatar from '../components/PsychAvatar';
import './StoryPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const StoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/stories');
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const story = stories.find((s) => s.slug === slug);

  if (!story) {
    return (
      <main className="story-detail-page section-padding">
        <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <h2>Story Not Found</h2>
          <p style={{ margin: '16px 0 24px', color: 'var(--charcoal-500)' }}>
            We could not find the story you are looking for.
          </p>
          <Link to="/stories" className="btn btn-primary">
            Back to Stories
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="story-detail-page section-padding">
      <div className="container">
        <div className="story-detail__back">
          <button
            onClick={handleBack}
            className="story-detail__back-link"
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            <FiArrowLeft /> Back
          </button>
        </div>

        <motion.div
          className="story-detail-card glass-card"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div className="story-detail__header">
            <PsychAvatar name={story.name} image={story.image} size={100} />
            <div className="story-detail__header-info">
              <h1 className="story-detail__name">{story.name}</h1>
              <div className="story-detail__meta">
                <span className="story-detail__meta-item">
                  <FiUser /> Age {story.age}
                </span>
                {story.city && (
                  <span className="story-detail__meta-item">
                    <FiMapPin /> {story.city}
                  </span>
                )}
                <span className="story-detail__meta-item">
                  <FiBook /> {story.education}
                </span>
              </div>
            </div>
          </div>

          <div className="story-detail__body">
            <div className="story-detail__section">
              <h3 className="story-detail__section-title">Where it started</h3>
              <span className="story-detail__chip">{story.challenge}</span>
              <p className="story-detail__text">{story.started}</p>
            </div>

            <div className="story-detail__section">
              <h3 className="story-detail__section-title">What helped</h3>
              <p className="story-detail__text">{story.helped}</p>
            </div>

            <div className="story-detail__section">
              <h3 className="story-detail__section-title">How they feel today</h3>
              <p className="story-detail__text">{story.today}</p>
            </div>

            {/* Review quote */}
            <div className="story-detail__quote glass-card">
              <FaQuoteLeft className="story-detail__quote-icon" />
              <p className="story-detail__quote-text">{story.review}</p>
              <div className="story-detail__quote-stars">
                {[...Array(5)].map((_, j) => (
                  <FaStar key={j} className="story-detail__star" />
                ))}
              </div>
              <p className="story-detail__quote-name">{story.name}</p>
            </div>

            {/* CTA */}
            <div className="story-detail__cta">
              <p className="story-detail__cta-text">Ready to take the first step?</p>
              <div className="story-detail__cta-actions">
                <Link to="/signup" className="btn btn-primary btn-lg">
                  Start Your Journey
                </Link>
                <Link to="/psychologists" className="btn btn-secondary btn-lg">
                  Meet our psychologists
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default StoryPage;
