import React, { useState } from 'react';
import { supabase } from '../supabase';

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuth(data.user);

      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setMessage('Check your email to confirm your account, then log in.');
        } else if (data.user) {
          onAuth(data.user);
        }
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card fade-up">
        <div className="auth-header">
          <p className="header-eyebrow">Welcome</p>
          <h1 className="logo">Melius<span>.</span></h1>
          <p className="tagline">Your personal AI agent</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setMessage(''); }}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
            type="button"
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login' ? 'Sign in' : 'Create account'
            }
          </button>
        </form>

        <p className="auth-footer">
          Your data is private and secure. Melius never shares your information.
        </p>
      </div>
    </div>
  );
}

export default AuthScreen;