import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset';

export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'System Check: Bekräftelsemail har skickats. Kontrollera din inkorg för att aktivera ditt konto.' });
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'System Check: Återställningslänk skickad till din e-post.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `FAIL: ${err.message || 'Ett oväntat fel uppstod'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
        scopes: 'repo',
      },
    });
    if (error) setMessage({ type: 'error', text: `FAIL: ${error.message}` });
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="logo">
            <ShieldCheck className="glow-text" size={32} />
            <h1 className="glow-text">SPARKCODE_AUTH</h1>
          </div>
          <p className="auth-subtitle">
            {mode === 'signin' ? '// ACCESS_GRANTED_PENDING_LOGIN' : 
             mode === 'signup' ? '// INITIALIZE_NEW_IDENTITY' : 
             '// RECOVER_ACCESS_PROTOCOL'}
          </p>
        </div>

        <button 
          onClick={handleGitHubLogin} 
          disabled={loading} 
          className="hacker-button github-button"
          style={{ marginBottom: '20px', background: '#333', color: 'white' }}
        >
          {loading ? <Loader2 className="spinner" /> : (
            <>
              CONTINUE WITH GITHUB
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              placeholder="USER_EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="hacker-input"
            />
          </div>

          {mode !== 'reset' && (
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="USER_PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="hacker-input"
              />
            </div>
          )}

          {message && (
            <div className={`auth-message ${message.type}`}>
               <Info size={16} />
               <span>{message.text}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="hacker-button glow-button">
            {loading ? <Loader2 className="spinner" /> : (
              <>
                {mode === 'signin' ? 'LOGIN' : mode === 'signup' ? 'REGISTER' : 'SEND RESET LINK'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'signin' ? (
            <>
              <button onClick={() => setMode('signup')} className="footer-link">Skapa konto</button>
              <button onClick={() => setMode('reset')} className="footer-link">Glömt lösenord?</button>
            </>
          ) : (
            <button onClick={() => setMode('signin')} className="footer-link">Tillbaka till inloggning</button>
          )}
        </div>
      </div>

      <style>{`
        .auth-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #0a0a0a 0%, #000 100%);
          padding: 20px;
        }

        .auth-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          border: 2px solid var(--border-color);
          box-shadow: 0 0 30px rgba(0, 255, 65, 0.1);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .auth-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 10px;
          letter-spacing: 1px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .hacker-input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          background: #050505;
          border: 1px solid var(--border-color);
          color: var(--accent-primary);
          font-family: var(--font-mono);
          outline: none;
          transition: all 0.2s;
        }

        .hacker-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.2);
        }

        .hacker-button {
          padding: 14px;
          background: var(--accent-primary);
          color: black;
          border: none;
          font-family: var(--font-mono);
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
        }

        .hacker-button:hover {
          background: #00dd33;
          transform: translateY(-2px);
          box-shadow: 0 0 15px var(--accent-primary);
        }

        .hacker-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .auth-message {
          padding: 12px;
          font-size: 0.8rem;
          display: flex;
          gap: 8px;
          border-left: 3px solid;
        }

        .auth-message.success {
          background: rgba(0, 255, 65, 0.1);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .auth-message.error {
          background: rgba(255, 51, 51, 0.1);
          border-color: var(--error-color);
          color: var(--error-color);
        }

        .auth-footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }

        .footer-link {
          background: none;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          cursor: pointer;
          transition: color 0.2s;
        }

        .footer-link:hover {
          color: var(--accent-primary);
          text-decoration: underline;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin-bottom: 20px;
          color: var(--text-muted);
          font-size: 0.7rem;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-color);
        }

        .auth-divider span {
          margin: 0 10px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
