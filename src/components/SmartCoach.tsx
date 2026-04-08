import React from 'react';
import type { LintResult } from '../utils/linter';
import { Terminal, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface SmartCoachProps {
  errors: LintResult[];
  isValid: boolean;
  code: string;
}

const SmartCoach: React.FC<SmartCoachProps> = ({ errors, isValid, code }) => {
  const isCodeEmpty = !code.trim() || code.includes('Välj en fil för att börja koda');

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle size={18} color="var(--error-color)" />;
      case 'warning': return <Info size={18} color="var(--accent-secondary)" />;
      default: return <Info size={18} color="var(--accent-primary)" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'STRUCTURE': return 'STRUKTUR';
      case 'A11Y': return 'TILLGÄNGLIGHET';
      case 'SEMANTIC': return 'MENING';
      case 'BEST_PRACTICE': return 'BÄSTA PRAXIS';
      default: return 'SYSTEM';
    }
  };

  if (isCodeEmpty) {
    return (
      <div className="coach-panel empty">
        <div className="coach-header">
          <Terminal size={18} />
          <span>MENTOR_STANDBY</span>
        </div>
        <p className="coach-message">
          "Jag är redo att vägleda dig. Öppna en fil eller börja skriva så hjälper jag dig att göra rätt."
        </p>
      </div>
    );
  }

  if (isValid && errors.length === 0) {
    return (
      <div className="coach-panel success">
        <div className="coach-header">
          <CheckCircle2 size={18} />
          <span>ALLT SER BRA UT</span>
        </div>
        <p className="coach-message">
          "Snyggt jobbat! Din kod är korrekt strukturerad och följer standarderna. Du kan fortsätta bygga vidare."
        </p>
      </div>
    );
  }

  // Visa den mest kritiska mentors-instruktionen först
  const mainError = errors[0];

  return (
    <div className="coach-panel active">
      <div className="coach-header">
        <Terminal size={18} className="glow-icon" />
        <span>DIN MENTOR</span>
      </div>

      <div className="mentor-main-guidance">
        <p className="mentor-speech">
          {mainError.message}
        </p>
      </div>

      {errors.length > 1 && (
        <div className="remaining-tips">
          <p className="tips-title">ANDRA SAKER ATT TÄNKA PÅ:</p>
          {errors.slice(1, 4).map((err, idx) => (
            <div key={idx} className="mini-tip">
              {getSeverityIcon(err.severity)}
              <div className="tip-content">
                <span className="tip-cat">{getCategoryLabel(err.category)}</span>
                <p className="tip-msg">{err.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .coach-panel {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .coach-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 2px;
          color: var(--text-muted);
          margin-bottom: 16px;
          text-transform: uppercase;
        }

        .active .coach-header {
          color: var(--accent-primary);
        }

        .coach-message {
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--text-main);
          font-style: italic;
          margin: 0;
        }

        .mentor-main-guidance {
          background: rgba(0, 255, 65, 0.05);
          border-left: 3px solid var(--accent-primary);
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 0 4px 4px 0;
        }

        .mentor-speech {
          margin: 0;
          font-size: 1rem;
          line-height: 1.5;
          color: #fff;
          font-weight: 500;
        }

        .tips-title {
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--text-muted);
          margin-bottom: 12px;
          letter-spacing: 1px;
        }

        .mini-tip {
          display: flex;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mini-tip:last-child {
          border-bottom: none;
        }

        .tip-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tip-cat {
          font-size: 0.6rem;
          font-weight: 900;
          opacity: 0.5;
        }

        .tip-msg {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.4;
          color: var(--text-secondary);
        }

        .success {
          border-color: var(--accent-primary);
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.1);
        }

        .success .coach-header {
          color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
};

export default SmartCoach;
