import React, { useEffect, useRef } from 'react';
import { blobManager } from '../lib/blobManager';

interface PreviewProps {
  code: string;
  width?: string;
  overrideUrl?: string | null;
  isBlueprintMode?: boolean;
}

const Preview: React.FC<PreviewProps> = ({ code, width = '100%', overrideUrl = null, isBlueprintMode = false }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && !overrideUrl) {
      let finalHtml = code;
      
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
      padding: width === '100%' ? 0 : '20px'
    }}>
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
        />
      </div>
    </div>
  );
};

export default Preview;
