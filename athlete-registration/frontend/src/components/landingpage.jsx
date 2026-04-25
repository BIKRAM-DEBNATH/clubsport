import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import videoBg from '../assets/backgroud video.mp4';
import basketball from '../assets/basketball.png';
import swimming from '../assets/swimming.png';
import gym from '../assets/gym.png';
import chatImage1 from '../assets/ChatGPT Image Apr 20, 2026, 10_36_23 PM.png';
import chatImage2 from '../assets/ChatGPT Image Apr 20, 2026, 10_38_12 PM.png';
import chatImage3 from '../assets/ChatGPT Image Apr 20, 2026, 10_49_30 PM.png';
import './LandingPage.css';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Background Video */}
      <video src={videoBg} autoPlay muted loop   playsInline webkit-playsinline="true" className="hero-video" />
      <div className="video-overlay" />

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">BikramSports</div>

          <ul className="nav-menu">
            <li><a href="#about">About</a></li>
            <li><a href="#competitions">Competitions</a></li>
            <li><a href="#programs">Programs</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div>
            <Link to="/Register" className="cta-btn nav-login-btn">Athlete Register</Link><span style={{ margin: '0 10px' }}>|    </span>
            <Link to="/admin/login" className="cta-btn nav-admin-btn">Admin Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <h1>Welcome to BikramSportsClub</h1>
        <p>Your premier sports club for excellence in basketball, swimming, and more.</p>
        <Link to="/login" className="hero-cta">Get Started</Link>
      </section>

      {/* About */}
      <section id="about" className="section">
        <h2>About BikramSports</h2>
        <div className="section-grid">
          <div className="card">
            <h3>Basketball Excellence</h3>
            <p>Professional coaching and competitive leagues.</p>
          </div>
          <div className="card">
            <h3>Swimming Academy</h3>
            <p>Olympic-sized pool with certified instructors.</p>
          </div>
          <div className="card">
            <h3>Multi-Sport Programs</h3>
            <p>Football, tennis, and fitness programs.</p>
          </div>
        </div>
      </section>

      {/* Competitions */}
      <section id="competitions" className="section">
        <h2>Upcoming Competitions</h2>
        <div className="section-grid">
          <div className="card">
            <h3>League 2026</h3>
            <p>Basketball tournament for U12-U18.</p>
          </div>
          <div className="card">
            <h3>Swim Championship</h3>
            <p>Regional swimming competition.</p>
          </div>
          <div className="card">
            <h3>Multi-Sport Fest</h3>
            <p>Annual sports festival.</p>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="section">
        <h2>Our Programs</h2>
        <div className="section-grid">

          <div className="card">
            <img src={basketball} alt="Basketball" />
            <h3>Youth Basketball</h3>
          </div>

          <div className="card">
            <img src={swimming} alt="Swimming" />
            <h3>Swim Training</h3>
          </div>

          <div className="card">
            <img src={gym} alt="Gym" />
            <h3>Fitness</h3>
          </div>

          <div className="card">
            <img src={chatImage1} alt="Training" />
            <h3>Elite Coaching</h3>
          </div>

          <div className="card">
            <img src={chatImage2} alt="Competition" />
            <h3>Tournaments</h3>
          </div>

          <div className="card">
            <img src={chatImage3} alt="Facility" />
            <h3>Facilities</h3>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="cta-section">
        <h2>Join BikramSports</h2>
        <div className="cta-buttons">
          <Link to="/register" className="btn-primary">Register</Link>
          <Link to="/login" className="btn-secondary">Login</Link>
          <Link to="/admin/login" className="btn-secondary">Admin</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <h3>BikramSports</h3>
        <p>bikramdebnath905@gmail.com</p>
        <p>+91 6294920220</p>
        <p>© 2026 All rights reserved</p>
      </footer>
    </>
  );
};

export default LandingPage;
