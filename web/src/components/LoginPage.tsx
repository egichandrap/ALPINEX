import React, { useState } from 'react';
import { Lock, User, AlertCircle, RefreshCw, KeyRound, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types/auth';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getApiUrl = () => {
    if (typeof window !== 'undefined' && window.location.port === '5173') {
      return 'http://localhost:8080';
    }
    return '';
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || 'Invalid username/email or password');
      }

      const { user, access_token } = json.data;
      onLoginSuccess(user, access_token);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with control plane API.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setEmail('admin');
    setPassword('admin');
    setError(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#0b0f19',
        color: '#f3f4f6',
        padding: '20px',
        boxSizing: 'border-box',
        backgroundImage: 'radial-gradient(ellipse at 50% 10%, #1e1b4b 0%, #0b0f19 70%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#6366f1',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '22px',
              margin: '0 auto 12px auto',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            ▲
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.5px', margin: 0, color: '#f3f4f6' }}>
            ALPINEX
          </h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '6px 0 0 0' }}>
            Open-Source API Testing & Performance Engineering
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#450a0a',
              border: '1px solid #991b1b',
              borderRadius: '6px',
              padding: '10px 14px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '6px' }}>
              USERNAME OR EMAIL
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#0b0f19',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '0 12px',
              }}
            >
              <User size={16} color="#6b7280" />
              <input
                type="text"
                required
                placeholder="admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 12px',
                  color: '#f3f4f6',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '6px' }}>
              PASSWORD
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#0b0f19',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '0 12px',
              }}
            >
              <Lock size={16} color="#6b7280" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 12px',
                  color: '#f3f4f6',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: loading || !email.trim() || !password.trim() ? '#4338ca' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: loading || !email.trim() || !password.trim() ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              opacity: loading || !email.trim() || !password.trim() ? 0.6 : 1,
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Helper Box for Default Credentials */}
        <div
          style={{
            marginTop: '24px',
            padding: '12px 14px',
            backgroundColor: '#161e2e',
            borderRadius: '6px',
            border: '1px solid #1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={16} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Default Credentials</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>admin / admin</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoFill}
            style={{
              padding: '4px 10px',
              backgroundColor: '#1e293b',
              border: '1px solid #374151',
              borderRadius: '4px',
              color: '#f3f4f6',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Auto-fill
          </button>
        </div>
      </div>
    </div>
  );
};
