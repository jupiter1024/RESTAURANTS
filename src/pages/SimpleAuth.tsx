import React, { useState } from 'react';
import { simpleDb } from '../db/simpleDb';

interface SimpleAuthProps {
  mode: 'login' | 'signup';
  plan?: 'menu-link' | 'whatsapp' | 'website';
  onSuccess: (restaurantId: string, isSignUp: boolean) => void;
  onToggleMode: () => void;
}

export const SimpleAuth: React.FC<SimpleAuthProps> = ({ mode, plan = 'menu-link', onSuccess, onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !restaurantName.trim()) { setError('Please enter your restaurant name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const user = await simpleDb.register(email, password, restaurantName.trim(), plan);
        onSuccess(user.restaurantId, true);
      } else {
        const user = await simpleDb.login(email, password);
        onSuccess(user.restaurantId, false);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="sauth-root">
      {/* Background */}
      <div className="sauth-orb sauth-orb-1" />
      <div className="sauth-orb sauth-orb-2" />
      <div className="sauth-grid" />

      <div className="sauth-card animate-fade-in">
        {/* Logo */}
        <div className="sauth-logo">
          <div className="sauth-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#authGrad)" />
              <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="authGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f97316" /><stop offset="1" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="sauth-logo-text">BistroFlow</span>
        </div>

        <h1 className="sauth-title">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="sauth-subtitle">
          {mode === 'signup'
            ? 'Upload your menu and get a shareable link in minutes.'
            : 'Sign in to manage your menu.'}
        </p>

        <form onSubmit={handleSubmit} className="sauth-form">
          {mode === 'signup' && (
            <div className="sauth-field">
              <label className="sauth-label">Restaurant Name</label>
              <div className="sauth-input-wrap">
                <svg className="sauth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  className="sauth-input"
                  type="text"
                  placeholder="e.g. Bella Italia"
                  value={restaurantName}
                  onChange={e => setRestaurantName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="sauth-field">
            <label className="sauth-label">Email Address</label>
            <div className="sauth-input-wrap">
              <svg className="sauth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                className="sauth-input"
                type="email"
                placeholder="admin@myrestaurant.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus={mode === 'login'}
              />
            </div>
          </div>

          <div className="sauth-field">
            <label className="sauth-label">Password</label>
            <div className="sauth-input-wrap">
              <svg className="sauth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                className="sauth-input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" className="sauth-eye-btn" onClick={() => setShowPass(p => !p)}>
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="sauth-error animate-fade-in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <button className="sauth-submit" type="submit" disabled={loading}>
            {loading ? (
              <svg className="sauth-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="sauth-toggle">
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <button onClick={onToggleMode} className="sauth-toggle-btn">
            {mode === 'signup' ? 'Sign in' : 'Create one free'}
          </button>
        </div>
      </div>
    </div>
  );
};
