import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import logoImg from '../assets/logo.png';
import './Navbar.css';

const generateDisplacementMap = (w, h) => {
  if (!w || !h || w <= 0 || h <= 0) return '';
  const bezel = 14;
  const pX1 = Math.min(50, (bezel / w) * 100).toFixed(2);
  const pX2 = Math.max(50, 100 - (bezel / w) * 100).toFixed(2);
  const pY1 = Math.min(50, (bezel / h) * 100).toFixed(2);
  const pY2 = Math.max(50, 100 - (bezel / h) * 100).toFixed(2);
  const rx = h / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="rx" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff0000"/>
      <stop offset="${pX1}%" stop-color="#800000"/>
      <stop offset="${pX2}%" stop-color="#800000"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="gy" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00ff00"/>
      <stop offset="${pY1}%" stop-color="#008000"/>
      <stop offset="${pY2}%" stop-color="#008000"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" rx="${rx}" fill="url(#rx)"/>
  <rect width="${w}" height="${h}" rx="${rx}" fill="url(#gy)" style="mix-blend-mode:screen"/>
</svg>`;

  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  } catch (e) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
};

const checkIsChromium = () => {
  if (typeof window === 'undefined') return false;
  if (window.innerWidth < 768) return false;
  if (navigator.userAgentData?.brands) {
    return navigator.userAgentData.brands.some((b) =>
      ['Chromium', 'Google Chrome', 'Microsoft Edge', 'Opera'].includes(b.brand)
    );
  }
  const ua = navigator.userAgent || '';
  return ua.includes('Chrome') && !ua.includes('Firefox');
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChromium, setIsChromium] = useState(false);

  const [leftMapURI, setLeftMapURI] = useState(() => generateDisplacementMap(720, 60));
  const [rightMapURI, setRightMapURI] = useState(() => generateDisplacementMap(220, 60));
  const [leftSize, setLeftSize] = useState({ w: 720, h: 60 });
  const [rightSize, setRightSize] = useState({ w: 220, h: 60 });

  const headerRef = useRef(null);
  const capsuleLeftRef = useRef(null);
  const capsuleRightRef = useRef(null);
  const leftDisplaceRef = useRef(null);
  const rightDisplaceRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const updateChromium = () => {
      setIsChromium(checkIsChromium());
    };
    updateChromium();
    window.addEventListener('resize', updateChromium);
    return () => window.removeEventListener('resize', updateChromium);
  }, []);

  useEffect(() => {
    if (!capsuleLeftRef.current && !capsuleRightRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const w = Math.round(width);
        const h = Math.round(height);
        if (w > 0 && h > 0) {
          if (entry.target === capsuleLeftRef.current) {
            setLeftSize({ w, h });
            setLeftMapURI(generateDisplacementMap(w, h));
          } else if (entry.target === capsuleRightRef.current) {
            setRightSize({ w, h });
            setRightMapURI(generateDisplacementMap(w, h));
          }
        }
      }
    });

    if (capsuleLeftRef.current) observer.observe(capsuleLeftRef.current);
    if (capsuleRightRef.current) observer.observe(capsuleRightRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setIsScrolled(scrollY > 20);

          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (headerRef.current) {
            if (!prefersReduced) {
              const shinePercent = (scrollY % 400) / 4;
              headerRef.current.style.setProperty('--shine', `${shinePercent}%`);

              const currentScale = 34 + (Math.min(scrollY, 240) / 240) * 16;
              if (leftDisplaceRef.current) {
                leftDisplaceRef.current.setAttribute('scale', currentScale);
              }
              if (rightDisplaceRef.current) {
                rightDisplaceRef.current.setAttribute('scale', currentScale);
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Psychologists', path: '/psychologists' },
  ];

  return (
    <>
      {/* SVG Liquid Glass Refraction Filters */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter
          id="hoh-glass-left"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          {leftMapURI && (
            <feImage
              href={leftMapURI}
              x="0"
              y="0"
              width={leftSize.w}
              height={leftSize.h}
              result="map"
              preserveAspectRatio="none"
            />
          )}
          <feDisplacementMap
            ref={leftDisplaceRef}
            in="SourceGraphic"
            in2="map"
            scale={34}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter
          id="hoh-glass-right"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          {rightMapURI && (
            <feImage
              href={rightMapURI}
              x="0"
              y="0"
              width={rightSize.w}
              height={rightSize.h}
              result="map"
              preserveAspectRatio="none"
            />
          )}
          <feDisplacementMap
            ref={rightDisplaceRef}
            in="SourceGraphic"
            in2="map"
            scale={34}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <header
        ref={headerRef}
        className={`navbar ${isScrolled ? 'is-scrolled' : ''} ${isChromium ? 'hoh-refract' : ''}`}
        id="main-navbar"
      >
        <div className="navbar__container container">
          {/* Capsule 1: Brand & Nav Links */}
          <div ref={capsuleLeftRef} className="navbar__capsule navbar__capsule--main">
            <div className="navbar__capsule-content">
              <Link to="/" className="navbar__logo" id="nav-logo">
                <img src={logoImg} alt="High on Healing" className="navbar__logo-img" />
                <span className="navbar__logo-text">High on Healing</span>
              </Link>

              <ul className="navbar__links" id="nav-links">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
                    >
                      {link.name}
                      <span className="navbar__link-indicator" />
                    </Link>
                  </li>
                ))}
              </ul>

              <button
                className="navbar__hamburger"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                id="nav-hamburger"
                aria-label="Toggle menu"
              >
                {isMobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>

          {/* Capsule 2: Auth Actions */}
          <div ref={capsuleRightRef} className="navbar__capsule navbar__capsule--actions">
            <div className="navbar__capsule-content navbar__capsule-content--actions">
              <Link to="/login" className="btn btn-secondary navbar__login-btn" id="nav-login-btn">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary navbar__signup-btn" id="nav-signup-btn">
                Get Started
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {isMobileOpen && (
          <div className="navbar__mobile-container container">
            <div className="navbar__mobile-panel">
              <ul className="navbar__mobile-links">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`navbar__mobile-link ${location.pathname === link.path ? 'navbar__mobile-link--active' : ''}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="navbar__mobile-divider" />
              <div className="navbar__mobile-actions">
                <Link
                  to="/login"
                  className="btn btn-secondary navbar__mobile-btn"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary navbar__mobile-btn"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Mobile overlay */}
        {isMobileOpen && (
          <div className="navbar__mobile-overlay" onClick={() => setIsMobileOpen(false)} />
        )}
      </header>
    </>
  );
};

export default Navbar;
