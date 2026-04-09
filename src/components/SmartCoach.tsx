import React from 'react';
import type { LintResult } from '../utils/linter';
import { Terminal, CheckCircle2, AlertCircle, Info, Activity, History } from 'lucide-react';
import type { DebugLog } from '../App';

interface SmartCoachProps {
  errors: LintResult[];
  isValid: boolean;
  code: string;
  activeFileName?: string;
  projectInsight?: any;
  domCount?: number;
  debugLogs?: DebugLog[];
  baselineCode?: string;
  bridgeStatus?: 'OFFLINE' | 'CONNECTED';
  systemMetrics?: { cpu: number; ram: number };
  onFocusLine?: (line: number, fileName?: string) => void;
}

const SmartCoach: React.FC<SmartCoachProps> = ({ errors, isValid, code, activeFileName, projectInsight, domCount, debugLogs = [], baselineCode = '', bridgeStatus = 'OFFLINE', systemMetrics = { cpu: 0, ram: 0 }, onFocusLine }) => {
  const [activeBlueprint, setActiveBlueprint] = React.useState<{ title: string; code: string } | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'REPORT' | 'LOGS' | 'DIFF'>('REPORT');
  const isCodeEmpty = !code.trim() || code.includes('Välj en fil för att börja koda');
  
  const lineCount = code.split('\n').length;
  const isSketching = lineCount < 25 && !code.includes('<body');
  const level = projectInsight?.experienceLevel || 'JUNIOR';

  // Blueprint bibliotek för vanliga fel
  const BLUEPRINTS: Record<string, { title: string; code: string }> = {
    'SEO': {
      title: 'IDEAL SEO STRUKTUR',
      code: '<head>\n  <title>Min Proffsiga Sida</title>\n  <meta name="description" content="Kort beskrivning...">\n</head>'
    },
    'DESIGN_SYSTEM': {
      title: 'CSS VARIABLER (EXEMPEL)',
      code: ':root {\n  --primary-color: #00ff41;\n  --bg-dark: #0a0a0a;\n  --text-main: #e0e0e0;\n}'
    },
    'SÄKERHET': {
      title: 'SÄKER TEXT-HANTERING',
      code: '// Istället för innerHTML\nelement.textContent = "Säkert innehåll";'
    },
    'Bilder behöver en \'alt\'-text': {
      title: 'TILLGÄNGLIG BILD',
      code: '<img src="image.jpg" alt="Beskrivande text här">'
    },
    'PREDICTIVE_RISK': {
      title: 'MODULÄR STRUKTUR (GHOST)',
      code: '// Bryt ut logiken i mindre filer\nexport const helper = () => { ... };\n// Importera där det behövs\nimport { helper } from "./utils";'
    },
    'SCENARIO_SIMULATION': {
      title: 'MOBILE OPTIMIZATION',
      code: '<!-- Använd bild-srcset för mobiler -->\n<img srcset="small.jpg 500w, large.jpg 1000w"\n     src="large.jpg" alt="...">'
    }
  };

  const getBlueprintForError = (msg: string) => {
    const key = Object.keys(BLUEPRINTS).find(k => msg.includes(k));
    return key ? BLUEPRINTS[key] : null;
  };

  const calculateTotalWeight = () => {
    if (!projectInsight?.assetSizes) return '0 KB';
    let total = 0;
    projectInsight.assetSizes.forEach((s: number) => total += s);
    return total > 1024 * 1024 ? `${(total / (1024 * 1024)).toFixed(1)} MB` : `${(total / 1024).toFixed(0)} KB`;
  };

  const getWeightStatus = () => {
    if (!projectInsight?.assetSizes) return 'normal';
    let total = 0;
    projectInsight.assetSizes.forEach((s: number) => total += s);
    return total > 2 * 1024 * 1024 ? 'warning' : 'normal';
  };

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
          <span>SYSTEM_READY</span>
        </div>
        <p className="coach-message">
          "Systemet är parkerat. Öppna en fil för att initiera arkitektur-skanning."
        </p>
      </div>
    );
  }

  if (isValid && errors.length === 0) {
    return (
      <div className="coach-panel success">
        <div className="coach-header">
          <CheckCircle2 size={18} />
          <span>{isSketching ? 'SKISS_GODKÄND' : 'INTEGRITY_VERIFIED'}</span>
        </div>
        <div className="wisdom-section">
          <span className="wisdom-label">ARCHITECT_LOG | {level}_LEVEL</span>
          <p className="coach-message">
            {isSketching 
              ? '"Snygg start på din nät-arkitektur. Jag håller koll på detaljerna i bakgrunden medan du skapar."'
              : '"Inga strukturella avvikelser detekterade. Systemet är stabilt och redo för produktion."'}
          </p>
        </div>
      </div>
    );
  }

  // Visa den mest kritiska mentors-instruktionen först
  const mainError = errors[0];

  return (
    <div className="coach-panel active">
      <div className="performance-radar">
        <div className="radar-item">
          <span className="radar-label">WEIGHT</span>
          <span className={`radar-value ${getWeightStatus()}`}>{calculateTotalWeight()}</span>
        </div>
        <div className="radar-item">
          <span className="radar-label">NODES</span>
          <span className={`radar-value ${domCount && domCount > 1000 ? 'warning' : ''}`}>{domCount || 0}</span>
        </div>
        <div className="radar-item">
          <span className="radar-label">CPU_LOAD</span>
          <span className={`radar-value ${systemMetrics.cpu > 80 ? 'warning' : ''}`}>{systemMetrics.cpu}%</span>
        </div>
        <div className="radar-item">
          <span className="radar-label">RAM_USE</span>
          <span className={`radar-value ${systemMetrics.ram > 80 ? 'warning' : ''}`}>{systemMetrics.ram}%</span>
        </div>
      </div>

      <div className="coach-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          <Terminal size={18} className="glow-icon" />
          <span style={{ whiteSpace: 'nowrap' }}>{isSketching ? 'CREATIVE_SKETCH' : 'LEAD ARCHITECT'}</span>
          <span className={`bridge-badge level-${level.toLowerCase()}`}>
            {level}
          </span>
          <span className={`bridge-badge ${bridgeStatus.toLowerCase()}`}>
            {bridgeStatus}
          </span>
        </div>
        <button 
          className="hacker-button mini" 
          onClick={() => setIsExpanded(true)}
          style={{ fontSize: '0.6rem', padding: '2px 6px' }}
        >
          EXPAND_REPORT
        </button>
      </div>

      <div className="mentor-main-guidance">
        <p className="mentor-speech">
          {mainError.message}
        </p>
        {mainError.line > 0 && onFocusLine && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="mentor-tips-btn" 
              onClick={() => onFocusLine(mainError.line, mainError.fileName)}
            >
              FOKUSERA FEL ({mainError.fileName || 'AKTIV FIL'})
            </button>
            {getBlueprintForError(mainError.message) && (
              <button 
                className="mentor-tips-btn blueprint-btn" 
                onClick={() => setActiveBlueprint(getBlueprintForError(mainError.message))}
              >
                VISA BLUEPRINT
              </button>
            )}
          </div>
        )}
      </div>

      {activeBlueprint && (
        <div className="blueprint-viewer">
          <div className="blueprint-header">
            <span>{activeBlueprint.title}</span>
            <button onClick={() => setActiveBlueprint(null)}>STÄNG</button>
          </div>
          <pre className="blueprint-code">
            {activeBlueprint.code}
          </pre>
        </div>
      )}

      {isExpanded && (
        <div className="audit-expanded-overlay">
          <div className="audit-expanded-container">
            <div className="expanded-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={20} color="var(--accent-primary)" />
                <h2 style={{ margin: 0, fontSize: '1rem', letterSpacing: '2px' }}>PROJECT_ARCHITECT_REPORT</h2>
              </div>
              <button className="hacker-button" onClick={() => setIsExpanded(false)}>CLOSE_REPORT</button>
            </div>
            
            <div className="expanded-tabs">
              <button className={activeTab === 'REPORT' ? 'active' : ''} onClick={() => setActiveTab('REPORT')}>
                <Terminal size={12} /> AUDIT_REPORT
              </button>
              <button className={activeTab === 'LOGS' ? 'active' : ''} onClick={() => setActiveTab('LOGS')}>
                <Activity size={12} /> LIVE_LOGS
              </button>
              <button className={activeTab === 'DIFF' ? 'active' : ''} onClick={() => setActiveTab('DIFF')}>
                <History size={12} /> VISUAL_DIFF
              </button>
            </div>

            {activeTab === 'REPORT' && (
              <>
                <div className="expanded-stats">
                  <div className="stat-box">
                    <span className="stat-label">CRITICAL_ERRORS</span>
                    <span className="stat-value" style={{ color: 'var(--error-color)' }}>
                      {errors.filter(e => e.severity === 'error').length}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">WARNINGS</span>
                    <span className="stat-value" style={{ color: 'var(--warning-color)' }}>
                      {errors.filter(e => e.severity === 'warning').length}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">IMPROVEMENT_TIPS</span>
                    <span className="stat-value" style={{ color: 'var(--accent-secondary)' }}>
                      {errors.filter(e => e.severity === 'tip').length}
                    </span>
                  </div>
                </div>

                <div className="expanded-list">
                  {errors.map((err, idx) => (
                    <div key={idx} className={`expanded-item ${err.severity}`}>
                      <div className="item-meta">
                        <span className="item-cat">{getCategoryLabel(err.category)}</span>
                        <span className="item-file">{err.fileName || 'GLOBAL'}</span>
                        {err.line > 0 && <span className="item-line">LINE {err.line}</span>}
                      </div>
                      <p className="item-msg">{err.message}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'LOGS' && (
              <div className="expanded-list logs-list">
                {debugLogs.length === 0 && <p className="empty-msg">Väntar på system-puls... Kör din sajt för att se loggar.</p>}
                {debugLogs.map((log, idx) => (
                  <div key={idx} className={`log-item ${log.level}`}>
                    <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="log-level">[{log.level.toUpperCase()}]</span>
                    <span className="log-msg">{log.message}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'DIFF' && (
              <div className="expanded-list diff-list">
                <p className="diff-header info">Jämför {activeFileName} med sparad version:</p>
                {baselineCode === code ? (
                  <p className="empty-msg">Inga ändringar detekterade. Koden är identisk med sparad version.</p>
                ) : (
                  <div className="diff-viewer">
                    {code.split('\n').map((line, idx) => {
                      const baseLines = baselineCode.split('\n');
                      const type = !baseLines.includes(line) ? 'added' : 'unchanged';
                      return (
                        <div key={idx} className={`diff-line ${type}`}>
                          <span className="line-num">{idx + 1}</span>
                          <span className="line-code">{line}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {errors.length > 1 && (
        <div className="remaining-tips">
          <p className="tips-title">AKTIVA SYSTEM-AVVIKELSER:</p>
          {errors.slice(1, 4).map((err, idx) => (
            <div key={idx} className={`mini-tip ${err.message.includes('PREDICTIVE') ? 'predictive-item' : ''}`}>
              {getSeverityIcon(err.severity)}
              <div className="tip-content">
                <span className="tip-cat">
                  {getCategoryLabel(err.category)} 
                  {err.fileName && err.fileName !== activeFileName && ` | [${err.fileName}]`}
                </span>
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
          justify-content: space-between;
          flex-wrap: wrap;
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
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mentor-tips-btn {
          align-self: flex-start;
          background: transparent;
          border: 1px solid var(--accent-primary);
          color: var(--accent-primary);
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mentor-tips-btn:hover {
          background: var(--accent-primary);
          color: #000;
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.4);
        }

        .blueprint-btn {
          border-color: #3b82f6;
          color: #3b82f6;
        }
        
        .blueprint-btn:hover {
          background: #3b82f6;
          color: #fff;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
        }

        .blueprint-viewer {
          background: #000;
          border: 1px solid #3b82f6;
          border-radius: 4px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .blueprint-header {
          background: rgba(59, 130, 246, 0.2);
          padding: 6px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.6rem;
          font-weight: 900;
          color: #3b82f6;
        }

        .blueprint-header button {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 0.55rem;
          cursor: pointer;
          opacity: 0.7;
        }

        .blueprint-code {
          padding: 12px;
          margin: 0;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: #fff;
          background: #050505;
        }

        .predictive-item {
          border-left: 2px solid #a855f7;
          background: rgba(168, 85, 247, 0.05);
        }

        .predictive-item .tip-cat {
          color: #a855f7 !important;
        }

        .performance-radar {
          display: flex;
          justify-content: space-around;
          padding: 12px;
          background: rgba(0, 255, 65, 0.03);
          border-bottom: 1px solid rgba(0, 255, 65, 0.1);
          margin-bottom: 15px;
        }

        .radar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .radar-label {
          font-size: 0.5rem;
          font-weight: 900;
          color: var(--text-muted);
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .radar-value {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          font-weight: 900;
          color: var(--accent-primary);
        }

        .radar-value.warning {
          color: var(--error-color);
          text-shadow: 0 0 10px rgba(255, 65, 54, 0.5);
        }

        .audit-expanded-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(10px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .audit-expanded-container {
          width: 100%;
          max-width: 900px;
          height: 80vh;
          background: #050505;
          border: 1px solid var(--accent-primary);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 40px rgba(0, 255, 65, 0.1);
        }

        .expanded-header {
          padding: 20px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .expanded-stats {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border-color);
        }

        .expanded-tabs {
          display: flex;
          background: rgba(255,255,255,0.02);
          padding: 0 20px;
          border-bottom: 1px solid var(--border-color);
          gap: 20px;
          flex-wrap: wrap;
        }

        .expanded-tabs button {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 15px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
        }

        .expanded-tabs button.active {
          color: var(--accent-primary);
        }

        .expanded-tabs button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-primary);
        }

        .empty-msg {
          text-align: center;
          color: var(--text-muted);
          padding: 40px;
          font-style: italic;
        }

        .log-item {
          display: flex;
          gap: 10px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .log-time { color: var(--text-muted); opacity: 0.5; }
        .log-level { font-weight: 900; }
        .log-item.error .log-level { color: var(--error-color); }
        .log-item.warn .log-level { color: var(--warning-color); }
        .log-item.info .log-level { color: var(--accent-primary); }

        .diff-line {
          display: flex;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          padding: 2px 0;
        }

        .diff-line.added { background: rgba(0, 255, 65, 0.1); border-left: 2px solid var(--accent-primary); }
        .diff-line.removed { background: rgba(255, 65, 54, 0.1); border-left: 2px solid var(--error-color); }

        .line-num { width: 40px; text-align: right; padding-right: 15px; color: var(--text-muted); opacity: 0.4; }
        
        .stat-box {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.6rem;
          color: var(--text-muted);
          font-weight: 800;
        }

        .stat-value {
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--accent-primary);
        }

        .expanded-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .expanded-item {
          background: rgba(255,255,255,0.03);
          border-left: 3px solid #ccc;
          padding: 15px;
          border-radius: 4px;
        }

        .expanded-item.error { border-color: var(--error-color); }
        .expanded-item.warning { border-color: var(--warning-color); }
        .expanded-item.tip { border-color: var(--accent-secondary); }

        .item-meta {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 0.65rem;
          font-weight: 800;
        }

        .item-cat { color: var(--accent-primary); }
        .item-file { color: var(--text-muted); }
        .item-msg { margin: 0; font-size: 0.9rem; line-height: 1.5; color: #fff; }

        @media (max-width: 600px) {
          .audit-expanded-overlay { padding: 10px; }
          .audit-expanded-container { height: 95vh; }
          .expanded-stats { gap: 10px; padding: 15px; flex-wrap: wrap; }
          .expanded-tabs { padding: 0 10px; gap: 10px; }
          .expanded-tabs button { font-size: 0.55rem; padding: 10px 0; }
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

        .wisdom-section {
          background: rgba(0, 255, 65, 0.05);
          padding: 12px;
          border-radius: 4px;
        }

        .wisdom-label {
          display: block;
          font-size: 0.55rem;
          font-weight: 900;
          color: var(--accent-primary);
          margin-bottom: 6px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .success .coach-header {
          color: var(--accent-primary);
        }

        .bridge-badge {
          font-size: 0.5rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 900;
          letter-spacing: 0;
          margin-left: 5px;
        }

        .bridge-badge.offline {
          background: rgba(255, 65, 54, 0.1);
          color: var(--error-color);
          border: 1px solid var(--error-color);
        }

        .bridge-badge.connected {
          background: rgba(0, 255, 65, 0.1);
          color: var(--accent-primary);
          border: 1px solid var(--accent-primary);
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
        }

        .level-junior { background: rgba(255, 140, 0, 0.1); color: #ffa500; border: 1px solid #ffa500; }
        .level-mid { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid #3b82f6; }
        .level-senior { background: rgba(168, 85, 247, 0.1); color: #a855f7; border: 1px solid #a855f7; }
        .level-expert { background: rgba(0, 255, 65, 0.1); color: var(--accent-primary); border: 1px solid var(--accent-primary); }
      `}</style>
    </div>
  );
};

export default SmartCoach;
