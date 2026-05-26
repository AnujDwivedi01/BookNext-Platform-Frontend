import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: 'var(--gap-xl)'
    }}>
      <div style={{ fontSize: 80, marginBottom: 'var(--gap-lg)', opacity: 0.3 }}>📚</div>
      <h1 style={{ fontSize: 96, fontFamily: 'var(--font-display)', color: 'var(--gold)', opacity: 0.4, lineHeight: 1 }}>404</h1>
      <h2 style={{ fontSize: 24, marginBottom: 'var(--gap-md)' }}>Page Not Found</h2>
      <p className="text-dim" style={{ marginBottom: 'var(--gap-xl)' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-gold">← Back to Home</Link>
    </div>
  );
}
