import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import logoImg from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Psychologists', path: '/psychologists' },
  ];

  return (
    <header className="navbar" id="main-navbar">
      <div className="navbar__container container">
        {/* Capsule 1: Brand & Nav Links */}
        <div className="navbar__capsule navbar__capsule--main">
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

        {/* Capsule 2: Auth Actions */}
        <div className="navbar__capsule navbar__capsule--actions">
          <Link to="/login" className="btn btn-secondary navbar__login-btn" id="nav-login-btn">
            Log In
          </Link>
          <Link to="/signup" className="btn btn-primary navbar__signup-btn" id="nav-signup-btn">
            Get Started
          </Link>
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
  );
};

export default Navbar;
