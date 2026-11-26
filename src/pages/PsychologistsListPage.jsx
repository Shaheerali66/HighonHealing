import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiMapPin } from 'react-icons/fi';
import { subscribePsychologists } from '../services/db';
import PsychAvatar from '../components/PsychAvatar';
import './PsychologistsListPage.css';

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

const PsychologistsListPage = () => {
  const [psychList, setPsychList] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const unsub = subscribePsychologists((list) => {
      setPsychList(list);
    }, true);
    return unsub;
  }, []);

  return (
    <main className="psych-list-page" id="psychologists-list-page">
      <section className="psych-list-hero section-padding">
        <div className="container">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="psych-list-hero__content"
          >
            <h1 className="section-title">
              Meet Our <span className="accent-text">Psychologists</span>
            </h1>
            <p className="section-subtitle">
              Choose someone who feels right for you. Every profile is a step towards feeling lighter.
            </p>
          </motion.div>

          <motion.div
            className="psych-list-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {psychList.map((p, i) => (
              <motion.div key={p.slug} variants={fadeUp} custom={i}>
                <Link to={`/psychologists/${p.slug}`} className="psych-list-card glass-card">
                  <PsychAvatar name={p.name} image={p.image} size={68} />
                  <h3 className="psych-list-card__name">{p.name}</h3>
                  <p className="psych-list-card__title">{p.title}</p>
                  {p.city && (
                    <span className="psych-list-card__city">
                      <FiMapPin /> {p.city}
                    </span>
                  )}
                  <span className="psych-list-card__action">
                    View Profile <FiArrowRight />
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

export default PsychologistsListPage;
