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
      {/* 🟢 HACKER TELEMETRY OVERLAY */}
      <div className="telemetry-layout">
        <div className="telemetry-block top-left">
          <div className="line active">INITIALIZING_SPARKCODE_V10...</div>
          <div className="line">CORE_STATUS: STABLE</div>
          <div className="line">ENCRYPTION: AES-256-GCM</div>
          <div className="line">SENTINEL_SYNC: ACTIVE</div>
        </div>
        <div className="telemetry-block top-right">
          <div className="line">DRIVE_STATUS: LOCAL_MOUNT</div>
          <div className="line">LATENCY: 1ms</div>
          <div className="line">IP: 127.0.0.1 (LOCAL)</div>
          <div className="line">MODE: ARCHITECT_ELITE</div>
        </div>
        <div className="telemetry-block bottom-left">
          <div className="line title">ARCHITECT_BOOT_LOGS v10.0</div>
          <div className="line">{'>'} Loading structural vakt...</div>
          <div className="line">{'>'} Calibrating logic scanners...</div>
          <div className="line">{'>'} Enabling Pulse debugger...</div>
          <div className="line">{'>'} System Ready.</div>
        </div>
        <div className="telemetry-block bottom-right">
          <div className="line">RADAR_SWEEP: COMPLETED</div>
          <div className="line">DOM_NODES: 0 (STANDBY)</div>
          <div className="line">PROJECT_INDEX: ENCRYPTED</div>
          <div className="line blink">_LISTENING_FOR_OPERATOR_</div>
        </div>
      </div>

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

        .telemetry-layout {
          position: fixed;
          inset: 0;
          pointer-events: none;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          z-index: 1;
          opacity: 0.5;
        }

        .telemetry-block {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--accent-primary);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .telemetry-block .line {
          margin-bottom: 5px;
        }

        .telemetry-block.top-left { border-left: 1px solid var(--accent-primary); padding-left: 10px; }
        .telemetry-block.top-right { text-align: right; border-right: 1px solid var(--accent-primary); padding-right: 10px; }
        .telemetry-block.bottom-left { max-width: 250px; }
        .telemetry-block .title { font-weight: 900; background: rgba(0,255,65,0.1); padding: 2px 5px; margin-bottom: 10px; }

        .telemetry-block .active { color: #fff; background: var(--accent-primary); color: #000; padding: 0 4px; }
        
        .blink { animation: auth-blink 1s infinite; }
        @keyframes auth-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .auth-card {
          position: relative;
          z-index: 10;
        }

        @media (max-width: 768px) {
          .telemetry-layout { display: none; }
        }
      `}</style>
    </div>
  );
};
