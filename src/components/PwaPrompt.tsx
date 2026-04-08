import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PwaPrompt: React.FC = () => {
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      return;
    }

    const hasDismissed = localStorage.getItem('pwaPromptDismissed');
    if (hasDismissed) {
      setIsDismissed(true);
      return;
    }

    // Android/Chrome Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari Check
    const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase()) && !(window as any).MSStream;
    const isSafari = /safari/.test(navigator.userAgent.toLowerCase()) && !/chrome|crios/.test(navigator.userAgent.toLowerCase());
    
    if (isIos && isSafari) {
      const timer = setTimeout(() => {
        setShowIosPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowIosPrompt(false);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  if (isDismissed || !isMobile) return null;

  return (
    <AnimatePresence>
      {(deferredPrompt || showIosPrompt) && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="pwa-prompt-container"
        >
          <div className="pwa-card glass-panel hacker-border">
            <div className="pwa-header">
              <div className="pwa-icon-wrapper">
                 <img src="/icon-192.png" alt="SparkCode Icon" className="pwa-app-icon" />
              </div>
              <div className="pwa-text">
                <h3 className="glow-text">INSTALL_SPARKCODE</h3>
                <p>Lägg till SparkCode på hemskärmen för den ultimata hacker-upplevelsen.</p>
              </div>
              <button className="close-prompt" onClick={handleDismiss}>
                <X size={18} />
              </button>
            </div>

            {deferredPrompt ? (
              <button className="install-button hacker-button" onClick={handleInstallClick}>
                <Download size={16} />
                LADDA NER APPEN
              </button>
            ) : (
              <div className="ios-instructions">
                <div className="step">
                  <span className="step-num">1</span>
                  <span>Tryck på Dela <Share size={14} className="inline-icon" /> i Safari.</span>
                </div>
                <div className="step">
                  <span className="step-num">2</span>
                  <span>Välj "Lägg till på hemskärmen" <PlusSquare size={14} className="inline-icon" /></span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaPrompt;
