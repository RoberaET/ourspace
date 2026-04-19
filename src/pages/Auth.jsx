import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data?.user) {
          const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const { error: profileError } = await supabase.from('profiles').insert([
            { id: data.user.id, name: name || email.split('@')[0], invite_code: inviteCode, onboarded: false }
          ]);

          if (profileError) {
             throw new Error('Could not create profile: ' + profileError.message);
          }

          if (!data.session) {
             alert('Account created successfully! Please check your email to confirm your account.');
             setIsLogin(true);
             setPassword('');
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', padding: 40, textAlign: 'center' }}>
        
        <div style={{ marginBottom: 32 }}>
          <div style={{ background: 'var(--color-primary)', width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Our Space</h2>
          <p className="text-dim" style={{ fontSize: 14 }}>Sign in to continue to your private space.</p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Your Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input bg-input"
              style={{ marginBottom: 0 }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input bg-input"
            style={{ marginBottom: 0 }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input bg-input"
            style={{ marginBottom: 0 }}
            required
          />
          
          {error && <p style={{ color: 'var(--color-primary)', fontSize: 12 }}>{error}</p>}
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Processing...' : isLogin ? 'Enter' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: 32, fontSize: 13, color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
