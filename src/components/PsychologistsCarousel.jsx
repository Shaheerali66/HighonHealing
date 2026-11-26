import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { psychologists } from '../data/psychologists';
import PsychAvatar from './PsychAvatar';
import './PsychologistsCarousel.css';

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const PsychologistsCarousel = () => {
  const row1 = psychologists.slice(0, 8); // 1 to 8
  const row2 = psychologists.slice(8, 15); // 9 to 15

  const renderCard = (p, key) => (
    <Link to={`/psychologists/${p.slug}`} className="psych-card glass-card" key={key}>
      <PsychAvatar name={p.name} image={p.image} size={48} />
      <div className="psych-card__info">
        <h4 className="psych-card__name">{p.name}</h4>
        <p className="psych-card__title">{p.title}</p>
      </div>
    </Link>
  );

  return (
    <section className="psych-carousel-section section-padding" id="psychologists">
      <div className="container">
        <motion.h2
          className="section-title"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
        >
          Trusted Minds <span className="accent-text">Behind Your Healing</span>
        </motion.h2>
        <motion.p
          className="section-subtitle"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
        >
          Licensed psychologists who listen without judgment, because healing starts with being heard.
        </motion.p>
      </div>

      <div className="psych-carousel__container">
        <div className="psych-carousel__wrapper">
          {/* Row 1: Left to Right */}
          <div className="psych-carousel__row">
            <div className="psych-carousel__track psych-carousel__track--ltr">
              {row1.map((p, i) => renderCard(p, `r1-a-${i}`))}
              {row1.map((p, i) => renderCard(p, `r1-b-${i}`))}
            </div>
          </div>

          {/* Row 2: Right to Left */}
          <div className="psych-carousel__row">
            <div className="psych-carousel__track psych-carousel__track--rtl">
              {row2.map((p, i) => renderCard(p, `r2-a-${i}`))}
              {row2.map((p, i) => renderCard(p, `r2-b-${i}`))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PsychologistsCarousel;
