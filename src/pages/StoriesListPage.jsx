import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiMapPin } from 'react-icons/fi';
import { stories } from '../data/stories';
import PsychAvatar from '../components/PsychAvatar';
import './StoriesListPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const StoriesListPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="stories-list-page" id="stories-list-page">
      <section className="stories-list-hero section-padding">
        <div className="container">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="stories-list-hero__content"
          >
            <h1 className="section-title">
              From Overwhelmed to <span className="accent-text">Okay Again</span>
            </h1>
            <p className="section-subtitle">
              They came to us carrying a lot. Today they&apos;re breathing easier. Read where their journey began and how they feel now.
            </p>
          </motion.div>

          <motion.div
            className="stories-list-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {stories.map((s, i) => (
              <motion.div key={s.slug} variants={fadeUp} custom={i}>
                <Link to={`/stories/${s.slug}`} className="stories-list-card glass-card">
                  <PsychAvatar name={s.name} image={s.image} size={68} />
                  <h3 className="stories-list-card__name">{s.name}</h3>
                  <p className="stories-list-card__edu">{s.education}</p>
                  {s.city && (
                    <span className="stories-list-card__city">
                      <FiMapPin /> {s.city}
                    </span>
                  )}
                  <span className="stories-list-card__challenge">{s.challenge}</span>
                  <p className="stories-list-card__snippet">
                    {s.today.split('. ')[0]}.
                  </p>
                  <span className="stories-list-card__action">
                    Read Story <FiArrowRight />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default StoriesListPage;
