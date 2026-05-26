import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import './Home.css';

export default function Home() {
  const { isLoggedIn, isAdmin } = useAuth();

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-glow" />
        </div>
        <div className="container hero-content fade-up">
          <div className="hero-eyebrow">
            <span className="badge badge-gold">BookNest Platform</span>
          </div>
          <h1 className="hero-title">
            Discover Stories<br />
            <em>That Move You</em>
          </h1>
          <p className="hero-subtitle">
            A curated bookstore platform for readers and administrators.
            Browse our catalog, manage books, and explore a world of knowledge.
          </p>
          <div className="hero-actions">
            <Link to="/books" className="btn btn-gold hero-btn">
              Browse Catalog →
            </Link>
            {!isLoggedIn() && (
              <Link to="/register" className="btn btn-outline hero-btn">
                Create Account
              </Link>
            )}
            {isLoggedIn() && (
              <Link to="/dashboard" className="btn btn-outline hero-btn">
                {isAdmin() ? 'Admin Panel' : 'My Dashboard'}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features container">
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isLoggedIn() && (
        <section className="cta container">
          <div className="cta-card card">
            <div className="cta-inner">
              <div>
                <h2>Ready to get started?</h2>
                <p className="text-dim">Join BookNest and explore our growing catalog of books.</p>
              </div>
              <div className="cta-actions">
                <Link to="/register" className="btn btn-gold">Register Now</Link>
                <Link to="/login" className="btn btn-ghost">Sign In</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-logo">
            <Logo size={20} style={{ marginRight: 8 }} />
            <span>Book<em>Nest</em></span>
          </div>
          <p className="text-dim text-sm">Discover. Read. Belong. © 2026 BookNest Platform</p>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  { 
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ), 
    title: 'Interactive Quizzes',    
    desc: 'Test your understanding with AI-powered quizzes and interactive summaries for every book in our library.' 
  },
  { 
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ), 
    title: 'Academic Focus',     
    desc: 'Access a curated collection of textbooks, research journals, and study materials across all major disciplines.' 
  },
  { 
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ), 
    title: 'Learning Goals',     
    desc: 'Set personalized reading targets, track your study hours, and master new subjects with our goal tracker.' 
  },
  { 
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ), 
    title: 'Smart Annotations',   
    desc: 'Highlight key insights, create digital flashcards, and sync your study notes across all your devices.' 
  },
];
