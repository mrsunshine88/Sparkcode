import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Search, Code, BookOpen } from 'lucide-react';
import { lexiconData } from '../data/lexicon';
import { motion, AnimatePresence } from 'framer-motion';

interface LexiconOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const LexiconOverlay: React.FC<LexiconOverlayProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-fokus på sökfältet när den öppnas + hantera markerad sökning
  useEffect(() => {
    if (isOpen) {
      // Kolla om vi har en sökning från editorn
      const globalSearch = (window as any).__sparkcode_search;
      if (globalSearch) {
        setSearchTerm(globalSearch);
        delete (window as any).__sparkcode_search;
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredEntries = lexiconData.filter(entry => {
    const term = searchTerm.toLowerCase();
    return (
      entry.term.toLowerCase().includes(term) ||
      entry.swedishTerms.some(sw => sw.toLowerCase().includes(term))
    );
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="lexicon-overlay"
        onClick={onClose}
      >
        <div className="lexicon-content glass-panel hacker-border" onClick={e => e.stopPropagation()}>
          <header className="lexicon-header">
            <div className="title">
              <BookOpen size={20} className="glow-text" />
              <h2 className="glow-text">HACKER_LEXIKON</h2>
            </div>
            <button className="close-button" onClick={onClose}>
              <X size={24} />
            </button>
          </header>

          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Vad vill du bygga? (t.ex. 'rundade hörn' eller 'textstorlek')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="lexicon-results">
            {filteredEntries.map((entry, idx) => (
              <motion.div 
                key={entry.term}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="entry-card"
              >
                <div className="entry-info">
                  <div className="entry-title">
                    <span className={`category-tag ${entry.category}`}>{entry.category.toUpperCase()}</span>
                    <h3>{entry.term}</h3>
                  </div>
                  <p className="swedish-desc">{entry.description}</p>
                  
                  <div className="code-block">
                    <Code size={14} />
                    <code>{entry.code}</code>
                  </div>
                </div>

                <div className="entry-actions">
                  <a href={entry.links.mdn} target="_blank" rel="noopener noreferrer" className="doc-link mdn">
                    MDN <ExternalLink size={12} />
                  </a>
                  <a href={entry.links.w3s} target="_blank" rel="noopener noreferrer" className="doc-link w3s">
                    W3S <ExternalLink size={12} />
                  </a>
                  <a href={entry.links.dev} target="_blank" rel="noopener noreferrer" className="doc-link dev">
                    DEV <ExternalLink size={12} />
                  </a>
                </div>
              </motion.div>
            ))}

            {filteredEntries.length === 0 && (
              <div className="no-results">
                <p className="glow-text-muted">Inga lokala träffar hittades för "{searchTerm}".</p>
                <div style={{ marginTop: '20px' }}>
                  <a 
                    href={`https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(searchTerm)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hacker-button"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      textDecoration: 'none',
                      background: 'var(--accent-primary)',
                      color: 'black'
                    }}
                  >
                    SÖK PÅ MDN WEB DOCS (PROFFS)
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LexiconOverlay;
