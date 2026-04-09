import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot } from 'lucide-react';
import type { ProjectInsight } from '../services/projectScanner';
import { lexiconData } from '../data/lexicon';

interface Message {
  id: string;
  sender: 'user' | 'cto';
  text: string;
  timestamp: number;
}

interface CtoTerminalProps {
  insight: ProjectInsight | null;
  activeFileName: string;
  onClose: () => void;
  onCommand?: (cmd: string) => string;
}

const CtoTerminal: React.FC<CtoTerminalProps> = ({ insight, activeFileName, onClose, onCommand }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'cto',
      text: `"Systemet är online. Jag är din Lead Architect. Vad vill du veta om arkitekturen eller din kod?"`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase().trim();
    
    // 1. Sök i Lexikonet först för tekniska frågor
    const lexiconMatch = lexiconData.find(item => 
      q.includes(item.term.toLowerCase()) || 
      item.swedishTerms.some(t => q.includes(t.toLowerCase()))
    );

    if (lexiconMatch) {
      return `Teknisk instruktion identifierad: ${lexiconMatch.term.toUpperCase()}.
"${lexiconMatch.description}"

Exempelkod:
${lexiconMatch.code}

Lycka till med implementeringen!`;
    }

    if (q.includes('fil') || q.includes('mapp')) {
      return `Projektet består av ${insight?.files.length || 0} filer fördelade på ${insight?.folders.length || 0} mappar. Just nu arbetar du i ${activeFileName}.`;
    }
    
    if (q.includes('färg') || q.includes('color')) {
      const colors = insight?.colors.size || 0;
      return `Jag har identifierat ${colors} unika färger i dina CSS-filer. Ett konsekvent design-system bör inte ha mer än 8-10 grundfärger.`;
    }

    if (q.includes('fel') || q.includes('problem')) {
      const issues = insight?.namingViolations.length || 0;
      return `Min skanner har flaggat ${issues} strukturella avvikelser i projektet. Kolla Audit-loggen i sidomenyn för detaljer per fil.`;
    }

    if (q === 'help' || q === 'hjälp' || q === '?') {
      return `SparkCode V10.0 Senior Commands:
- pkg add <namn> : Installera externa bibliotek (t.ex. gsap, react)
- snapshot save : Spara ett tillstånd för Visual Diff
- bridge connect : Aktivera Command Bridge till din dator
- logs clear : Rensa alla debug-loggar
- audit : Kör en djupanalys av projektet

Skriv "lexikon" eller sök i LEXIKON-menyn för detaljerade kodexempel.`;
    }

    return "Jag förstår din fråga. Ur ett arkitektoniskt perspektiv är det viktigt att vi håller koden modulär och konsekvent. Skriv 'hjälp' för att se alla operativa kommandon.";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // V10/10: Kolla om det är ett kommando
    const commandResult = onCommand?.(input);

    // Simulera AI-tanke
    setTimeout(() => {
      const ctoMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'cto',
        text: commandResult || generateResponse(input),
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, ctoMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="cto-terminal-overlay">
      <div className="cto-terminal-container">
        <div className="terminal-header">
          <div className="terminal-title">
            <Bot size={16} className="glow-icon" />
            <span>CTO_COMMAND_CENTER</span>
          </div>
          <button className="terminal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="terminal-body" ref={scrollRef}>
          {messages.map(msg => (
            <div key={msg.id} className={`terminal-msg ${msg.sender}`}>
              <div className="msg-prefix">
                {msg.sender === 'cto' ? '[CHEFEN]>' : '[DU]>' }
              </div>
              <div className="msg-text">{msg.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="terminal-msg cto typing">
              <div className="msg-prefix">[CHEFEN]&gt;</div>
              <div className="typing-indicator"><span>.</span><span>.</span><span>.</span></div>
            </div>
          )}
        </div>

        <div className="terminal-input-area">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Kommando eller fråga..."
            autoFocus
          />
          <button onClick={handleSend} disabled={!input.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .cto-terminal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .cto-terminal-container {
          width: 100%;
          max-width: 650px;
          height: 80vh;
          background: #0a0a0b;
          border: 1px solid var(--accent-primary);
          box-shadow: 0 0 30px rgba(0, 255, 65, 0.15), inset 0 0 10px rgba(0, 255, 65, 0.05);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: terminalOpen 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes terminalOpen {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .terminal-header {
          padding: 12px 16px;
          background: rgba(0, 255, 65, 0.1);
          border-bottom: 1px solid rgba(0, 255, 65, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .terminal-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--accent-primary);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .terminal-close {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: color 0.2s;
        }

        .terminal-close:hover {
          color: var(--error-color);
        }

        .terminal-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          line-height: 1.6;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .terminal-msg {
          display: flex;
          gap: 12px;
          animation: msgAppear 0.2s ease-out;
        }

        @keyframes msgAppear {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .msg-prefix {
          flex-shrink: 0;
          font-weight: 900;
          font-size: 0.75rem;
        }

        .cto .msg-prefix { color: var(--accent-primary); }
        .user .msg-prefix { color: #3b82f6; }

        .msg-text {
          color: #e2e8f0;
          word-break: break-word;
        }

        .cto .msg-text {
          color: var(--accent-primary);
          text-shadow: 0 0 5px rgba(0, 255, 65, 0.3);
        }

        .typing-indicator span {
          display: inline-block;
          animation: blink 1s infinite;
          margin-right: 2px;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .terminal-input-area {
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          gap: 12px;
        }

        .terminal-input-area input {
          flex: 1;
          background: #000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 10px 14px;
          color: var(--accent-primary);
          font-family: var(--font-mono);
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .terminal-input-area input:focus {
          border-color: var(--accent-primary);
        }

        .terminal-input-area button {
          background: var(--accent-primary);
          color: #000;
          border: none;
          border-radius: 4px;
          padding: 0 18px;
          cursor: pointer;
          transition: transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .terminal-input-area button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(0, 255, 65, 0.4);
        }

        .terminal-input-area button:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Mobilanpassning */
        @media (max-width: 600px) {
          .cto-terminal-container {
            height: 90vh;
            border-radius: 12px;
          }
          .terminal-body {
            padding: 15px;
            font-size: 0.8rem;
          }
          .terminal-input-area {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default CtoTerminal;
