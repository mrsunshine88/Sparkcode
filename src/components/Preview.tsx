import React, { useEffect, useRef, useState } from 'react';
import { blobManager } from '../lib/blobManager';

interface PreviewProps {
  code: string;
  width?: string;
  overrideUrl?: string | null;
  isBlueprintMode?: boolean;
  onAudit?: (iframe: HTMLIFrameElement) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  activePackages?: string[];
}

const Preview: React.FC<PreviewProps> = ({ code, width = '100%', overrideUrl = null, isBlueprintMode = false, onAudit, isFullscreen, onToggleFullscreen, activePackages = [] }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [debouncedCode, setDebouncedCode] = useState(code);

  // Debouncing: Vänta 300ms innan vi uppdaterar preview för att spara prestanda och rensa konsolen
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(code);
    }, 300);
    return () => clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    if (iframeRef.current && !overrideUrl) {
      let finalHtml = debouncedCode;
      
      if (!code.toLowerCase().includes('<html')) {
        finalHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
              ${code}
            </body>
          </html>
        `;
      }

      // Blueprint Mode Injection
      if (isBlueprintMode) {
        const blueprintStyles = `
          <style id="sparkcode-blueprint">
            * { 
              outline: 1px dashed rgba(0, 255, 65, 0.3) !important; 
              outline-offset: -1px; 
              position: relative;
            }
            *:hover { 
              outline: 1px solid #00ff41 !important; 
              background: rgba(0, 255, 65, 0.05) !important;
            }
            *:hover::after {
              content: attr(data-spark-tag);
              position: absolute;
              top: 0;
              left: 0;
              background: #00ff41;
              color: #000;
              font-family: monospace;
              font-size: 9px;
              font-weight: bold;
              padding: 1px 4px;
              z-index: 2147483647;
              pointer-events: none;
              text-transform: uppercase;
            }
          </style>
          <script>
            (function() {
              const applyTags = () => {
                document.querySelectorAll('*').forEach(el => {
                  if (!el.getAttribute('data-spark-tag')) {
                    el.setAttribute('data-spark-tag', el.tagName.toLowerCase());
                  }
                });
              };
              applyTags();
              // Re-apply if DOM changes
              const observer = new MutationObserver(applyTags);
              observer.observe(document.body, { childList: true, subtree: true });
            })();
          </script>
        `;
        finalHtml = finalHtml.replace('</head>', `${blueprintStyles}</head>`);
      }

      // 📚 The Librarian (Library Injection)
      if (activePackages.length > 0) {
        const packageScripts = activePackages.map(pkg => 
          `<script type="module">import * as lib from "https://esm.sh/${pkg}"; window.${pkg.replace(/[^a-zA-Z]/g, '')} = lib;</script>`
        ).join('\n');
        finalHtml = finalHtml.replace('</head>', `${packageScripts}</head>`);
      }

      // 🖥️ Sentinel Navigation Injection
      const navScript = `
        <script>
          (function() {
            document.addEventListener('click', function(e) {
              const link = e.target.closest('a');
              if (link && link.getAttribute('href')) {
                const href = link.getAttribute('href');
                // Ignorera externa länkar
                if (href.startsWith('http') || href.startsWith('//')) return;
                
                e.preventDefault();
                window.parent.postMessage({ type: 'NAVIGATE_TO_FILE', path: href }, '*');
              }
            }, true);

            // 🩺 The Pulse (Console Interceptor)
            const captureLog = (type, args) => {
              window.parent.postMessage({ 
                type: 'DEBUG_LOG', 
                level: type, 
                message: Array.from(args).map(a => 
                  typeof a === 'object' ? JSON.stringify(a) : String(a)
                ).join(' '),
                timestamp: Date.now()
              }, '*');
            };

            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;

            console.log = function() { captureLog('info', arguments); originalLog.apply(console, arguments); };
            console.error = function() { captureLog('error', arguments); originalError.apply(console, arguments); };
            console.warn = function() { captureLog('warn', arguments); originalWarn.apply(console, arguments); };

            window.onerror = function(msg, url, line, col, error) {
              captureLog('error', [msg + ' at line ' + line]);
              return false;
            };
          })();
        </script>
      `;
      finalHtml = finalHtml.replace('</body>', `${navScript}</body>`);

      const linkedHtml = blobManager.linkHtml(finalHtml);
      // Flimmer-skydd: Injicera omedelbar bakgrund innan resten av sidan laddas
      const flickerProtectedHtml = linkedHtml.replace('<head>', '<head><style>body { background-color: white; }</style>');
      iframeRef.current.srcdoc = flickerProtectedHtml;
    }
  }, [code, isBlueprintMode]);

  useEffect(() => {
    if (iframeRef.current && overrideUrl) {
      iframeRef.current.src = overrideUrl;
    }
  }, [overrideUrl]);

  return (
    <div style={{ 
      flex: 1, 
      height: '100%', 
      background: 'white', 
      display: 'flex', 
      justifyContent: 'center',
      overflow: 'hidden',
      padding: width === '100%' ? 0 : '20px',
      position: 'relative'
    }}>
      {onToggleFullscreen && (
        <div style={{
          position: 'absolute',
          top: width === '100%' ? '10px' : '20px',
          right: width === '100%' ? '10px' : '20px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px',
          background: 'rgba(0,0,0,0.5)',
          padding: '5px',
          borderRadius: '4px',
          backdropFilter: 'blur(4px)'
        }}>
          <button 
            className="hacker-button mini" 
            onClick={() => {
              const blob = new Blob([blobManager.linkHtml(debouncedCode)], { type: 'text/html' });
              window.open(URL.createObjectURL(blob), '_blank');
            }}
            title="Öppna i ny flik"
            style={{ fontSize: '0.55rem', padding: '4px 8px' }}
          >
            LAUNCH
          </button>
          <button 
            className="hacker-button mini" 
            onClick={onToggleFullscreen}
            style={{ 
              borderColor: isFullscreen ? 'var(--accent-secondary)' : '',
              fontSize: '0.55rem', 
              padding: '4px 8px' 
            }}
          >
            {isFullscreen ? 'EXIT' : 'FOCUS'}
          </button>
        </div>
      )}
      <div style={{
        width: width,
        height: '100%',
        background: 'white',
        transition: 'width 0.3s ease-in-out',
        boxShadow: width === '100%' ? 'none' : '0 10px 30px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        <iframe
          ref={iframeRef}
          title="preview"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'white'
          }}
          src={overrideUrl || undefined}
          sandbox="allow-scripts allow-same-origin allow-forms"
          onLoad={() => iframeRef.current && onAudit?.(iframeRef.current)}
        />
      </div>
    </div>
  );
};

export default Preview;
