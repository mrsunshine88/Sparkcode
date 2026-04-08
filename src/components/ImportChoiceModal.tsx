import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, X, ShieldCheck } from 'lucide-react';

interface ImportChoiceModalProps {
  isOpen: boolean;
  repoName: string;
  onChoice: (choice: 'NEW') => void;
  onClose: () => void;
}

const ImportChoiceModal: React.FC<ImportChoiceModalProps> = ({
  isOpen,
  repoName,
  onChoice,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="import-workspace-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="import-content-centered">
            <motion.div 
              className="import-setup-card"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="setup-badge">
                <ShieldCheck size={14} />
                <span>SÄKER IMPORT</span>
              </div>

              <div className="setup-header">
                <h1>FÖRBEREDER IMPORT</h1>
                <p>Du hämtar nu <span className="highlight">"{repoName}"</span>. Ditt tidigare projekt har sparats och stängts ner för att garantera att koden aldrig blandas ihop.</p>
              </div>

              <div className="setup-action">
                <button 
                  className="primary-import-btn"
                  onClick={() => onChoice('NEW')}
                >
                  <FolderOpen size={24} />
                  <div className="btn-text">
                    <span className="main-text">VÄLJ MAPP FÖR PROJEKTET</span>
                    <span className="sub-text">Mappväljaren öppnas på ditt skrivbord</span>
                  </div>
                </button>
              </div>

              <div className="setup-footer">
                <button className="cancel-import-link" onClick={onClose}>
                  <X size={16} />
                  AVBRYT IMPORT
                </button>
              </div>
            </motion.div>
          </div>

          <style>{`
            .import-workspace-overlay {
              position: absolute;
              inset: 0;
              background: rgba(0, 0, 0, 0.9);
              backdrop-filter: blur(20px);
              z-index: 5000;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 40px;
            }

            .import-content-centered {
              max-width: 600px;
              width: 100%;
            }

            .import-setup-card {
              background: linear-gradient(145deg, rgba(20, 20, 20, 0.9), rgba(10, 10, 10, 0.95));
              border: 1px solid rgba(0, 255, 65, 0.2);
              border-radius: 12px;
              padding: 48px;
              text-align: center;
              box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 65, 0.05);
              position: relative;
            }

            .setup-badge {
              position: absolute;
              top: -12px;
              left: 50%;
              transform: translateX(-50%);
              background: var(--accent-primary);
              color: #000;
              font-size: 0.65rem;
              font-weight: 900;
              letter-spacing: 2px;
              padding: 4px 16px;
              border-radius: 20px;
              display: flex;
              align-items: center;
              gap: 6px;
              box-shadow: 0 0 15px var(--accent-primary);
            }

            .setup-header h1 {
              font-size: 1.5rem;
              letter-spacing: 4px;
              margin: 0 0 16px 0;
              color: #fff;
              font-weight: 800;
            }

            .setup-header p {
              font-size: 1rem;
              line-height: 1.6;
              color: var(--text-secondary);
              margin-bottom: 40px;
            }

            .highlight {
              color: var(--accent-secondary);
              font-weight: bold;
              text-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
            }

            .primary-import-btn {
              width: 100%;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 20px;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
              color: #fff;
            }

            .primary-import-btn:hover {
              background: var(--accent-primary);
              color: #000;
              transform: translateY(-4px);
              box-shadow: 0 10px 30px rgba(0, 255, 65, 0.2);
              border-color: transparent;
            }

            .btn-text {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              text-align: left;
            }

            .main-text {
              font-size: 1.1rem;
              font-weight: 800;
              letter-spacing: 1px;
            }

            .sub-text {
              font-size: 0.75rem;
              opacity: 0.7;
              font-weight: 500;
            }

            .setup-footer {
              margin-top: 32px;
            }

            .cancel-import-link {
              background: transparent;
              border: none;
              color: var(--text-muted);
              font-size: 0.8rem;
              font-weight: 600;
              letter-spacing: 1.5px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              margin: 0 auto;
              transition: color 0.2s ease;
            }

            .cancel-import-link:hover {
              color: #ff4444;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImportChoiceModal;
