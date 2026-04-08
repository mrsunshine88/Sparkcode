import type { LintResult } from '../utils/linter';
import { Activity, CheckSquare, Terminal } from 'lucide-react';

interface AIErrorPanelProps {
  errors: LintResult[];
  isValid: boolean;
  code: string;
}

const AIErrorPanel: React.FC<AIErrorPanelProps> = ({ errors, isValid, code }) => {
  const isCodeEmpty = !code.trim() || code.includes('Välj en fil för att börja koda');
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'var(--error-color)';
      case 'warning': return 'var(--accent-secondary)';
      default: return 'var(--accent-primary)';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'STRUCTURE': return 'ARKITEKTUR';
      case 'A11Y': return 'INKLUDERING';
      case 'SEMANTIC': return 'LOGIK';
      case 'BEST_PRACTICE': return 'VETERAN-TIPS';
      default: return 'SYSTEM';
    }
  };

  // Beräkna kod-kvalitet (Stenhård bedömning)
  const calculateQuality = () => {
    if (errors.length === 0) return 100;
    
    let penalty = 0;
    let hasCriticalError = false;

    errors.forEach(err => {
      if (err.severity === 'error') penalty += 35; // Mycket hårdare straff
      if (err.severity === 'warning') penalty += 15;
      if (err.severity === 'tip') penalty += 5;
      
      // Om man skriver jabbel eller saknar struktur är det 0% direkt
      if (err.message.includes("Vad är det här") || err.message.includes("ARKITEKTONISKT FUNDAMENT")) {
        hasCriticalError = true;
      }
    });

    if (hasCriticalError) return 0;
    return Math.max(0, 100 - penalty);
  };

  const quality = calculateQuality();

  if (isCodeEmpty) {
    return (
      <div className="challenge-card" style={{ borderColor: 'var(--border-color)', opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Terminal size={18} />
          <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>ARCHITECT_STANDBY</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px', fontStyle: 'italic' }}>
          "Jag har kodat sedan 1984. Visa mig något som imponerar mer än en tom skärm..."
        </p>
      </div>
    );
  }

  if (isValid && errors.length === 0) {
    return (
      <div className="challenge-card" style={{ borderColor: 'var(--accent-primary)', boxShadow: '0 0 20px rgba(0, 255, 65, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
          <CheckSquare size={18} />
          <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>LEGENDARY_STATUS: MASTERPIECE</span>
        </div>
        <div className="quality-meter" style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '5px' }}>
            <span>ARKITEKTONISK PRECISION</span>
            <span>100% (GODKÄND)</span>
          </div>
          <div style={{ height: '4px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }}></div>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '12px', fontWeight: 500 }}>
          "Det här... det här är vackert. Det påminner mig om när vi byggde Timelog. Rent, logiskt och arkitektoniskt briljant. Bra jobbat, utvecklare."
        </p>
      </div>
    );
  }

  return (
    <div className="senior-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div className="challenge-card" style={{ background: '#080808', borderLeft: `4px solid ${quality < 40 ? 'var(--error-color)' : 'var(--accent-secondary)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: quality < 40 ? 'var(--error-color)' : 'var(--accent-primary)' }}>
          <Activity size={18} />
          <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>Senior Audit Panel</span>
        </div>
        
        <div className="quality-meter" style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '5px' }}>
            <span>PROFESSIONELL STANDARD</span>
            <span style={{ fontWeight: 900, color: quality > 70 ? 'var(--accent-primary)' : quality > 40 ? 'var(--accent-secondary)' : 'var(--error-color)' }}>
              {quality}%
            </span>
          </div>
          <div style={{ height: '4px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${quality}%`, 
              height: '100%', 
              background: quality > 70 ? 'var(--accent-primary)' : quality > 40 ? 'var(--accent-secondary)' : 'var(--error-color)',
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}></div>
          </div>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {quality < 40 ? '"Gör om helt. Det här skulle en elev på körskolan gjort bättre."' : 
           quality < 100 ? '"Det funkar, men det saknar själ. Arkitekturen svajar."' : ''}
        </p>
      </div>

      <div className="tips-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {errors.map((err, idx) => (
          <div key={idx} className="error-bubble" style={{ borderLeft: `3px solid ${getSeverityColor(err.severity)}`, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: getSeverityColor(err.severity), textTransform: 'uppercase' }}>
                {getCategoryLabel(err.category)}
              </span>
              <span style={{ fontSize: '0.6rem', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>SEGMENT_ERR_{err.line}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{err.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIErrorPanel;
