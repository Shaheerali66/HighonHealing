import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaHeart, FaShieldAlt, FaUserMd, FaRobot, FaQuoteLeft, FaStar,
  FaCheckCircle, FaArrowRight, FaUsers, FaLock, FaHandHoldingHeart
} from 'react-icons/fa';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { stats } from '../data/stats';
import { subscribePricing } from '../services/db';
import PsychologistsCarousel from '../components/PsychologistsCarousel';
import './HomePage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const HomePage = () => {
  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  const targetAngleRef = useRef(0);
  const currentAngleRef = useRef(0);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    let animationFrameId;
    const animate = () => {
      if (isHoveredRef.current) {
        let diff = targetAngleRef.current - currentAngleRef.current;
        diff = ((diff + 180) % 360 + 360) % 360 - 180;
        currentAngleRef.current += diff * 0.05; 
      } else {
        currentAngleRef.current += 0.3; 
      }

      cardsRef.current.forEach((card, index) => {
        if (card) {
          const radius = window.innerWidth < 768 ? 130 : 200;
          const angleOffset = index * 120;
          const totalAngle = currentAngleRef.current + angleOffset;
          const rad = totalAngle * (Math.PI / 180);
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          card.style.setProperty('--px', `${x}px`);
          card.style.setProperty('--py', `${y}px`);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const cx = left + width / 2;
    const cy = top + height / 2;
    const angleRad = Math.atan2(e.clientY - cy, e.clientX - cx);
    targetAngleRef.current = angleRad * (180 / Math.PI);
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
  };

  const [testiIndex, setTestiIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);
  const [starterPrice, setStarterPrice] = useState('500');

  useEffect(() => {
    const unsub = subscribePricing((plans) => {
      const starter = plans.find((p) => p.id === 'starter');
      if (starter) setStarterPrice(Number(starter.price).toLocaleString());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setVisibleCards(1);
      } else if (window.innerWidth <= 992) {
        setVisibleCards(2);
      } else {
        setVisibleCards(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Demo content, replace with real reviews
  const testimonials = [
    {
      text: "I was drowning in exam stress and couldn't talk to anyone. High on Healing matched me with an amazing counselor who understood exactly what I was going through.",
      name: 'Ayesha K.',
      role: 'LUMS Student',
      rating: 5,
      initial: 'A',
    },
    {
      text: "The AI chatbot helped me during a panic attack at 2 AM. It calmed me down and booked a session for the next day. This platform literally saved me.",
      name: 'Ahmed R.',
      role: 'NUST Student',
      rating: 5,
      initial: 'A',
    },
    {
      text: "As a psychology graduate, this platform gave me real-world experience and helped me earn while doing what I love — helping others.",
      name: 'Fatima S.',
      role: 'Counselor on High on Healing',
      rating: 5,
      initial: 'F',
    },
    {
      text: "Honestly, I was skeptical about online therapy. But my first session felt like talking to someone who actually listened. I've already booked three more.",
      name: 'Hamza T.',
      role: 'University of Karachi Student',
      rating: 5,
      initial: 'H',
    },
    {
      text: "Booking was so easy. I picked a slot after my classes and was in a session by evening. The reminders helped me stay consistent.",
      name: 'Maryam I.',
      role: 'FAST-NUCES Student',
      rating: 5,
      initial: 'M',
    },
    {
      text: "I work long hours and could never find time for therapy. The late evening slots fit my schedule, and my counselor never made me feel rushed.",
      name: 'Usman Q.',
      role: 'Software Engineer',
      rating: 5,
      initial: 'U',
    },
    {
      text: "Tracking my mood every day showed me patterns I never noticed. Now my counselor and I actually use those logs during our sessions.",
      name: 'Hira M.',
      role: 'IBA Student',
      rating: 5,
      initial: 'H',
    },
    {
      text: "I was nervous about talking to anyone about the pressure at home. Doing it privately from my own room made it so much easier to open up.",
      name: 'Bilal S.',
      role: 'University of Sindh Student',
      rating: 5,
      initial: 'B',
    },
    {
      text: "My counselor suggested small breathing and journaling routines that I actually stuck with. Exams were still tough, but I felt in control for the first time.",
      name: 'Zoya A.',
      role: 'COMSATS Student',
      rating: 5,
      initial: 'Z',
    },
    {
      text: "I used to bottle everything up. After a few sessions I could finally say what I was feeling without being scared of being judged.",
      name: 'Sana R.',
      role: 'Bahria University Student',
      rating: 5,
      initial: 'S',
    },
    {
      text: "My counselor was patient and never rushed me. I left every session with one small thing to try, and it actually helped.",
      name: 'Daniyal K.',
      role: 'NED University Student',
      rating: 5,
      initial: 'D',
    },
    {
      text: "I was dealing with burnout during my final year. Having someone to talk to who actually gets student life made a real difference.",
      name: 'Noor F.',
      role: 'University of Sindh Student',
      rating: 5,
      initial: 'N',
    },
    {
      text: "Affordable and easy to book. I didn't have to explain my whole story from scratch each time, which was a big relief.",
      name: 'Taha M.',
      role: 'Aga Khan University Student',
      rating: 5,
      initial: 'T',
    },
    {
      text: "I tried the chatbot first just out of curiosity, then booked a real session. Both felt warm and genuine, not robotic.",
      name: 'Iqra B.',
      role: 'Karachi University Student',
      rating: 5,
      initial: 'I',
    },
    {
      text: "Sessions fit around my shifts and my family, which is rare. I feel calmer and I'm sleeping better than I have in months.",
      name: 'Rizwan A.',
      role: 'Working Professional',
      rating: 5,
      initial: 'R',
    },
  ];

  const maxTestiIndex = Math.max(0, testimonials.length - visibleCards);

  useEffect(() => {
    setTestiIndex((prev) => Math.min(prev, maxTestiIndex));
  }, [maxTestiIndex]);

  const handlePrevTesti = () => {
    setTestiIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextTesti = () => {
    setTestiIndex((prev) => Math.min(maxTestiIndex, prev + 1));
  };

  return (
    <main className="home" id="homepage">
      {/* ============ HERO ============ */}
      <section className="hero" id="hero-section">
        <div className="hero__bg-shapes">
          <div className="hero__shape hero__shape--1" />
          <div className="hero__shape hero__shape--2" />
          <div className="hero__shape hero__shape--3" />
          <div className="hero__shape hero__shape--4" />
        </div>

        <div className="container hero__container">
          <motion.div
            className="hero__content"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="hero__badge" variants={fadeUp}>
              <FaHeart className="hero__badge-icon" />
              <span>Trusted by {stats.happyStudents} Students</span>
            </motion.div>

            <motion.h1 className="hero__title" variants={fadeUp}>
              Your Safe Space to{' '}
              <span className="hero__title-highlight">Talk, Heal</span>
              <br />& <span className="hero__title-highlight">Grow</span>
            </motion.h1>

            <motion.p className="hero__subtitle" variants={fadeUp}>
              Affordable, confidential mental health support from psychology students and graduates.
              No judgment. No stigma. Just a compassionate ear when you need it most.
            </motion.p>

            <motion.div className="hero__ctas" variants={fadeUp}>
              <Link to="/signup" className="btn btn-primary btn-lg" id="hero-cta-primary">
                Start Your Journey <FiArrowRight />
              </Link>
              <Link to="/about" className="btn btn-secondary btn-lg" id="hero-cta-secondary">
                Learn More
              </Link>
            </motion.div>

            <motion.div className="hero__stats" variants={fadeUp}>
              <div className="hero__stat">
                <span className="hero__stat-number">{stats.happyStudents}</span>
                <span className="hero__stat-label">Happy Students</span>
              </div>
              <div className="hero__stat-divider" />
              <div className="hero__stat">
                <span className="hero__stat-number">{stats.counselors}</span>
                <span className="hero__stat-label">Psychologists</span>
              </div>
              <div className="hero__stat-divider" />
              <div className="hero__stat">
                <span className="hero__stat-number">{stats.satisfaction}</span>
                <span className="hero__stat-label">Satisfaction</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero__visual"
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="hero__illustration">
              <div 
                className="hero__card hero__card--1 float-animation"
                ref={el => cardsRef.current[0] = el}
              >
                <FaShieldAlt className="hero__card-icon" />
                <span>100% Private</span>
              </div>
              <div 
                className="hero__card hero__card--2 float-animation" 
                ref={el => cardsRef.current[1] = el}
                style={{ animationDelay: '1s' }}
              >
                <FaUserMd className="hero__card-icon" />
                <span>Expert Counselors</span>
              </div>
              <div 
                className="hero__card hero__card--3 float-animation" 
                ref={el => cardsRef.current[2] = el}
                style={{ animationDelay: '2s' }}
              >
                <FaRobot className="hero__card-icon" />
                <span>AI Assistant</span>
              </div>
              <div className="hero__illustration-circle">
                <FaHandHoldingHeart size={72} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="features section-padding" id="features-section">
        <div className="container">
          <motion.h2
            className="section-title"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            Why Choose <span className="accent-text">High on Healing</span>?
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            We combine technology with empathy to create a mental health experience that is affordable, accessible, and judgment-free.
          </motion.p>

          <motion.div
            className="features__grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            {[
              {
                icon: <FaLock />,
                title: 'Complete Privacy',
                desc: 'End-to-end encrypted sessions. Your data stays yours. No one else can access your conversations.',
                color: '#f04080',
              },
              {
                icon: <FaUsers />,
                title: 'Peer Counselors',
                desc: 'Psychology students and graduates who truly understand your struggles and speak your language.',
                color: '#a855f7',
              },
              {
                icon: <FaHeart />,
                title: 'Affordable Care',
                desc: `Plans starting from just Rs. ${starterPrice}/month. Mental health support should never be a luxury.`,
                color: '#f04080',
              },
              {
                icon: <FaRobot />,
                title: 'AI Chatbot',
                desc: '24/7 AI assistant for instant mood check-ins, basic guidance, and easy appointment booking.',
                color: '#60a5fa',
              },
              {
                icon: <FaShieldAlt />,
                title: 'No Judgment',
                desc: 'A safe, stigma-free environment where you can express yourself openly without fear.',
                color: '#a855f7',
              },
              {
                icon: <FaUserMd />,
                title: 'Track Progress',
                desc: 'Monitor your well-being journey with mood logs, session summaries, and personalized insights.',
                color: '#f04080',
              },
            ].map((feature, i) => (
              <motion.div className="feature-card glass-card" key={i} variants={fadeUp} custom={i}>
                <div className="feature-card__icon" style={{ color: feature.color, background: `${feature.color}14` }}>
                  {feature.icon}
                </div>
                <h3 className="feature-card__title">{feature.title}</h3>
                <p className="feature-card__desc">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ PSYCHOLOGISTS ============ */}
      <PsychologistsCarousel />

      {/* ============ HOW IT WORKS ============ */}
      <section className="how-it-works section-padding" id="how-it-works-section">
        <div className="container">
          <motion.h2
            className="section-title"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            How It <span className="accent-text">Works</span>
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            Getting support is just three simple steps away.
          </motion.p>

          <motion.div
            className="steps"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            {[
              { step: '01', title: 'Create Your Account', desc: 'Sign up in under 60 seconds. Choose your role and set up your secure profile.', color: 'var(--pink-500)' },
              { step: '02', title: 'Find a Counselor', desc: 'Browse our directory of verified psychology students and graduates. Choose the right fit for you.', color: 'var(--purple-500)' },
              { step: '03', title: 'Start Healing', desc: 'Book your first session, chat with the AI bot, or message your counselor directly. You are not alone.', color: 'var(--pink-600)' },
            ].map((item, i) => (
              <motion.div className="step-card" key={i} variants={fadeUp} custom={i}>
                <div className="step-card__number" style={{ background: item.color }}>{item.step}</div>
                <div className="step-card__connector" />
                <h3 className="step-card__title">{item.title}</h3>
                <p className="step-card__desc">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="testimonials section-padding" id="testimonials-section">
        <div className="container">
          <motion.h2
            className="section-title"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            Stories of <span className="accent-text">Hope</span>
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            Real experiences from students who found their light.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeUp}
          >
            <div className="testimonials-carousel">
              <button
                className="testimonials-carousel__btn testimonials-carousel__btn--prev"
                onClick={handlePrevTesti}
                disabled={testiIndex === 0}
                aria-label="Previous review"
              >
                <FiChevronLeft />
              </button>

              <div className="testimonials-carousel__viewport">
                <div
                  className="testimonials__track"
                  style={{
                    transform: `translateX(calc(-${testiIndex} * ((100% - (var(--visible-count) - 1) * var(--gap)) / var(--visible-count) + var(--gap))))`,
                  }}
                >
                  {testimonials.map((t, i) => (
                    <div className="testimonial-card glass-card" key={i}>
                      <FaQuoteLeft className="testimonial-card__quote" />
                      <p className="testimonial-card__text">{t.text}</p>
                      <div className="testimonial-card__stars">
                        {[...Array(t.rating)].map((_, j) => (
                          <FaStar key={j} className="testimonial-card__star" />
                        ))}
                      </div>
                      <div className="testimonial-card__author">
                        <div className="testimonial-card__avatar">{t.initial || t.name[0]}</div>
                        <div>
                          <p className="testimonial-card__name">{t.name}</p>
                          <p className="testimonial-card__role">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="testimonials-carousel__btn testimonials-carousel__btn--next"
                onClick={handleNextTesti}
                disabled={testiIndex >= maxTestiIndex}
                aria-label="Next review"
              >
                <FiChevronRight />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="cta-banner" id="cta-banner-section">
        <div className="container">
          <motion.div
            className="cta-banner__content"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.h2 className="cta-banner__title" variants={fadeUp}>
              Your Healing Journey<br />
              Starts <span className="cta-banner__highlight">Today</span>
            </motion.h2>
            <motion.p className="cta-banner__subtitle" variants={fadeUp}>
              Join thousands of students who chose to prioritize their mental health. Take the first step.
            </motion.p>
            <motion.div className="cta-banner__btns" variants={fadeUp}>
              <Link to="/signup" className="btn btn-primary btn-lg cta-banner__btn" id="cta-signup">
                Get Started Free <FiArrowRight />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
