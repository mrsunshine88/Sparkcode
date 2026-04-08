import React from 'react';
import { GitCommit, RotateCcw, Clock, Hash } from 'lucide-react';

export interface CodeSnapshot {
  id: string;
  timestamp: number;
  fileName: string;
  code: string;
}

interface HistoryTerminalProps {
  history: CodeSnapshot[];
  onRollback: (snapshot: CodeSnapshot) => void;
}

const HistoryTerminal: React.FC<HistoryTerminalProps> = ({ history, onRollback }) => {
  return (
    <div className="history-terminal">
      <div className="history-header">
        <GitCommit size={14} className="glow-text" />
        <span>PROJECT_COMMIT_LOG (HACKER-GIT v1.0)</span>
      </div>
      
      <div className="history-list">
        {history.length === 0 ? (
          <div className="history-empty">
            <p className="glow-text-muted">// Inga sparade versioner detekterade...</p>
            <p className="small-text">Spara ändringar för att generera en arkitektur-hash.</p>
          </div>
        ) : (
          [...history].reverse().map((snapshot) => (
            <div key={snapshot.id} className="history-item">
              <div className="history-meta">
                <span className="hash-tag"><Hash size={10} /> {snapshot.id.substring(0, 7)}</span>
                <span className="timestamp"><Clock size={10} /> {new Date(snapshot.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="history-info">
                <span className="file-name">{snapshot.fileName}</span>
                <span className="action-tag">COMMIT_AUTO_SAVE</span>
              </div>
              <button 
                onClick={() => onRollback(snapshot)}
                className="rollback-btn"
                title="Återställ denna version"
              >
                <RotateCcw size={12} />
                <span>ROLLBACK</span>
              </button>
            </div>
          ))
        )}
      </div>

      <style>{`
        .history-terminal {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #050505;
          font-family: 'JetBrains Mono', monospace;
        }

        .history-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #0a0a0a;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.7rem;
          font-weight: bold;
          color: var(--accent-primary);
        }

        .history-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0.5;
          text-align: center;
        }

        .small-text {
          font-size: 0.65rem;
          margin-top: 5px;
        }

        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          position: relative;
          transition: all 0.2s;
        }

        .history-item:hover {
          border-color: var(--accent-primary);
          background: rgba(0, 255, 65, 0.03);
          transform: translateX(4px);
        }

        .history-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hash-tag {
          font-size: 0.65rem;
          color: var(--accent-secondary);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .timestamp {
          font-size: 0.65rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .history-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .file-name {
          font-size: 0.8rem;
          color: var(--text-main);
          font-weight: bold;
        }

        .action-tag {
          font-size: 0.6rem;
          color: var(--accent-primary);
          background: rgba(0, 255, 65, 0.1);
          padding: 1px 4px;
          width: fit-content;
        }

        .rollback-btn {
          background: rgba(0, 255, 65, 0.1);
          border: 1px solid var(--accent-primary);
          color: var(--accent-primary);
          padding: 4px 10px;
          font-size: 0.65rem;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rollback-btn:hover {
          background: var(--accent-primary);
          color: black;
          box-shadow: 0 0 10px var(--accent-primary);
        }
      `}</style>
    </div>
  );
};

export default HistoryTerminal;
