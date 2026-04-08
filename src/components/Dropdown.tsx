import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  children?: MenuItem[];
}

interface DropdownProps {
  label: string;
  items: MenuItem[];
}

const Dropdown: React.FC<DropdownProps> = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown-container" ref={containerRef}>
      <button 
        className={`dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop som fångar klick överallt (även över iframes) */}
            <div 
              className="dropdown-backdrop" 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999, /* Extremt högt för att täcka allt */
                background: 'transparent'
              }}
            />
            <motion.div 
            initial={{ opacity: 0, y: -10, scaleY: 0 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ originY: 0 }}
            className="dropdown-menu hacker-border glass-panel"
          >
            {items.map((item, idx) => (
              <div 
                key={idx} 
                className="dropdown-item-wrapper"
                onMouseEnter={() => item.children ? setActiveSubMenu(idx) : setActiveSubMenu(null)}
              >
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="item-content">
                    {item.icon && <span className="item-icon">{item.icon}</span>}
                    <span className="item-label">{item.label}</span>
                  </div>
                  {item.shortcut && <span className="item-shortcut">{item.shortcut}</span>}
                  {item.children && <ChevronRight size={14} className="submenu-icon" />}
                </button>

                {/* Submenu */}
                <AnimatePresence>
                  {item.children && activeSubMenu === idx && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="dropdown-submenu hacker-border glass-panel"
                    >
                      {item.children.map((subItem, sIdx) => (
                        <button 
                          key={sIdx}
                          className="dropdown-item"
                          onClick={() => {
                            if (subItem.onClick) {
                              subItem.onClick();
                              setIsOpen(false);
                            }
                          }}
                        >
                          <span className="item-label">{subItem.label}</span>
                          {subItem.shortcut && <span className="item-shortcut">{subItem.shortcut}</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
