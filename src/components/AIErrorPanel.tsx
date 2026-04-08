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
      case 'STRUCTURE': return 'STRUKTUR';
      case 'A11Y': return 'TILLGÄNGLIGHET';
      case 'SEMANTIC': return 'SEMANTIK';
      case 'BEST_PRACTICE': return 'PRO-TIPS';
      default: return 'SYSTEM';
    }
  };

  // Beräkna kod-kvalitet (enkel poängsättning)
  const calculateQuality = () => {
    if (errors.length === 0) return 100;
    
    let penalty = 0;
    let hasStructuralError = false;

    errors.forEach(err => {
      if (err.severity === 'error') penalty += 40; // Tuffare straff för errors
      if (err.severity === 'warning') penalty += 15;
      if (err.severity === 'tip') penalty += 5;
      if (err.category === 'STRUCTURE' && err.severity === 'error') hasStructuralError = true;
    });

    // Om grundstukturen saknas är det ett kritiskt fel - tvinga till 0%
    if (hasStructuralError) return 0;

    return Math.max(0, 100 - penalty);
  };

  const quality = calculateQuality();

  if (isCodeEmpty) {
    return (
      <div className="challenge-card" style={{ borderColor: 'var(--border-color)', opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Terminal size={18} />
          <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>System: Standby</span>
        </div>
        <div className="quality-meter" style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '5px' }}>
            <span>INITIATING...</span>
            <span>0%</span>
          </div>
          <div style={{ height: '4px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '0%', height: '100%', background: 'var(--accent-primary)' }}></div>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
          Väntar på kodsekvens... Skriv något för att starta arkitekt-analysen.
        </p>
      </div>
    );
  }

  if (isValid && errors.length === 0) {
    return (
      <div className="challenge-card" style={{ borderColor: 'var(--accent-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
          <CheckSquare size={18} />
          <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>Senior Status: MASTER</span>
        </div>
        <div className="quality-meter" style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '5px' }}>
            <span>KOD-KVALITET</span>
            <span>100%</span>
          </div>
          <div style={{ height: '4px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }}></div>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
          Perfekt struktur! Din kod följer seniora arkitektur-principer.
        </p>
      </div>
    );
  }

  return (
    <div className="senior-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div className="challenge-card" style={{ background: '#080808' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
          <Activity size={18} />
          <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>Architect Dashboard</span>
        </div>
        
        <div className="quality-meter" style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '5px' }}>
            <span>KVALITETS-INDEX</span>
            <span style={{ color: quality > 70 ? 'var(--accent-primary)' : quality > 40 ? 'var(--accent-secondary)' : 'var(--error-color)' }}>
              {quality}%
            </span>
          </div>
          <div style={{ height: '4px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${quality}%`, 
              height: '100%', 
              background: quality > 70 ? 'var(--accent-primary)' : quality > 40 ? 'var(--accent-secondary)' : 'var(--error-color)',
              transition: 'width 0.5s ease-out'
            }}></div>
          </div>
        </div>
      </div>

      <div className="tips-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {errors.map((err, idx) => (
          <div key={idx} className="error-bubble" style={{ borderLeftColor: getSeverityColor(err.severity) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: getSeverityColor(err.severity) }}>
                {getCategoryLabel(err.category)}
              </span>
              <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>RAD {err.line}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>{err.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIErrorPanel;
