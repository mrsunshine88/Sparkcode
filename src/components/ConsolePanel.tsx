import React from 'react';
import { Terminal as TerminalIcon, XCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';

export interface LogEntry {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  content: string;
  timestamp: number;
}

interface ConsolePanelProps {
  logs: LogEntry[];
  onClear: () => void;
  onClose: () => void;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs, onClear, onClose }) => {
  return (
    <div className="console-panel glass-panel hacker-border">
      <div className="console-header">
        <div className="console-title">
          <TerminalIcon size={14} className="glow-text" />
          <span>DEBUG_CONSOLE</span>
        </div>
        <div className="console-actions">
          <button onClick={onClear} className="icon-button" title="Rensa loggar">
            <Trash2 size={14} />
          </button>
          <button onClick={onClose} className="icon-button" title="Stäng">
            <XCircle size={14} />
          </button>
        </div>
      </div>
      
      <div className="console-content">
        {logs.length === 0 ? (
          <div className="console-empty">
            <p className="glow-text-muted">// Inga loggmeddelanden än...</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className={`console-entry ${log.type}`}>
              <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className="log-icon">
                {log.type === 'error' && <XCircle size={12} />}
                {log.type === 'warn' && <AlertTriangle size={12} />}
                {log.type === 'info' && <Info size={12} />}
              </span>
              <span className="log-message">{log.content}</span>
            </div>
          ))
        )}
      </div>

      <style>{`
        .console-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: rgba(5, 5, 5, 0.95) !important;
          font-family: 'JetBrains Mono', monospace;
        }

        .console-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-dark);
          border-bottom: 1px solid var(--border-color);
        }

        .console-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .console-actions {
          display: flex;
          gap: 10px;
        }

        .console-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .console-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.5;
          font-size: 0.8rem;
        }

        .console-entry {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.8rem;
          padding: 2px 0;
          border-bottom: 1px solid rgba(0, 255, 65, 0.05);
        }

        .log-time {
          color: var(--text-muted);
          min-width: 80px;
        }

        .log-icon {
          display: flex;
          align-items: center;
          margin-top: 2px;
        }

        .console-entry.log .log-message { color: var(--text-main); }
        .console-entry.error { background: rgba(255, 51, 51, 0.05); }
        .console-entry.error .log-message, .console-entry.error .log-icon { color: var(--error-color); }
        .console-entry.warn .log-message, .console-entry.warn .log-icon { color: var(--accent-secondary); }
        .console-entry.info .log-message, .console-entry.info .log-icon { color: #0088ff; }

        .log-message {
          word-break: break-all;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default ConsolePanel;
