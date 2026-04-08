import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, ListPlus, X, HelpCircle, AlertCircle } from 'lucide-react';

interface ImportChoiceModalProps {
  isOpen: boolean;
  repoName: string;
  currentProjectName: string;
  onChoice: (choice: 'NEW' | 'MERGE') => void;
  onClose: () => void;
}

const ImportChoiceModal: React.FC<ImportChoiceModalProps> = ({
  isOpen,
  repoName,
  currentProjectName,
  onChoice,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <motion.div 
            className="modal-content import-choice-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="modal-header">
              <div className="header-title">
                <HelpCircle size={20} className="glow-icon" />
                <h2>IMPORT VAL</h2>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="import-info">
                <p>Du håller på att hämta <span className="highlight">"{repoName}"</span> från GitHub.</p>
                <div className="current-context">
                  <AlertCircle size={16} />
                  <span>Nuvarande projekt: <strong>{currentProjectName || 'Inget öppet'}</strong></span>
                </div>
              </div>

              <div className="choice-grid">
                <button 
                  className="choice-card new-project"
                  onClick={() => onChoice('NEW')}
                >
                  <div className="card-icon">
                    <FolderPlus size={32} />
                  </div>
                  <div className="card-content">
                    <h3>SKAPA NYTT PROJEKT</h3>
                    <p>Öppna en helt ny mapp. Rekommenderas för att hålla dina filer separerade och snygga.</p>
                  </div>
                  <div className="card-badge">PROFFSVAL</div>
                </button>

                <button 
                  className="choice-card merge-project"
                  onClick={() => onChoice('MERGE')}
                >
                  <div className="card-icon">
                    <ListPlus size={32} />
                  </div>
                  <div className="card-content">
                    <h3>LÄGG TILL HÄR</h3>
                    <p>Importera filerna direkt in i ditt nuvarande projekt. Använd om du vill slå ihop kod.</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <p className="footer-note">Valet du gör påverkar var filerna sparas på din hårddisk.</p>
              <button className="cancel-text-btn" onClick={onClose}>AVBRYT</button>
            </div>
          </motion.div>

          <style>{`
            .import-choice-modal {
              max-width: 650px;
              background: rgba(10, 15, 10, 0.95);
              border: 1px solid var(--accent-primary);
              box-shadow: 0 0 30px rgba(0, 255, 136, 0.2);
              padding: 0;
            }

            .import-info {
              margin-bottom: 24px;
              color: var(--text-secondary);
              font-size: 1.1rem;
            }

            .highlight {
              color: var(--accent-secondary);
              font-weight: bold;
              text-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
            }

            .current-context {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-top: 12px;
              padding: 8px 12px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
              font-size: 0.9rem;
            }

            .choice-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 24px;
            }

            .choice-card {
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 24px;
              text-align: left;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              flex-direction: column;
              gap: 16px;
              position: relative;
              overflow: hidden;
            }

            .choice-card:hover {
              background: rgba(255, 255, 255, 0.07);
              transform: translateY(-4px);
            }

            .new-project:hover {
              border-color: var(--accent-primary);
              box-shadow: 0 0 20px rgba(0, 255, 136, 0.15);
            }

            .merge-project:hover {
              border-color: var(--accent-secondary);
              box-shadow: 0 0 20px rgba(0, 204, 255, 0.15);
            }

            .card-icon {
              color: var(--text-secondary);
              transition: color 0.3s ease;
            }

            .choice-card:hover .card-icon {
              color: var(--accent-primary);
            }

            .merge-project:hover .card-icon {
              color: var(--accent-secondary);
            }

            .card-content h3 {
              color: #fff;
              margin: 0 0 8px 0;
              font-size: 1.1rem;
              letter-spacing: 1px;
            }

            .card-content p {
              color: var(--text-secondary);
              font-size: 0.85rem;
              line-height: 1.4;
              margin: 0;
            }

            .card-badge {
              position: absolute;
              top: 12px;
              right: -25px;
              background: var(--accent-primary);
              color: #000;
              font-size: 0.6rem;
              font-weight: bold;
              padding: 2px 30px;
              transform: rotate(45deg);
            }

            .modal-footer {
              padding: 16px 24px;
              background: rgba(0, 0, 0, 0.3);
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid rgba(255, 255, 255, 0.05);
            }

            .footer-note {
              font-size: 0.75rem;
              color: var(--text-secondary);
              margin: 0;
              font-style: italic;
            }

            .cancel-text-btn {
              background: transparent;
              border: none;
              color: var(--text-secondary);
              font-size: 0.8rem;
              cursor: pointer;
              letter-spacing: 1px;
            }

            .cancel-text-btn:hover {
              color: #ff4444;
            }

            @media (max-width: 600px) {
              .choice-grid {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ImportChoiceModal;
