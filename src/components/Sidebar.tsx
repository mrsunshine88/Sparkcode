import { Zap } from 'lucide-react';
import SmartCoach from './SmartCoach';
import type { LintResult } from '../utils/linter';

interface SidebarProps {
  errors: LintResult[];
  isValid: boolean;
  code: string;
}

const Sidebar: React.FC<SidebarProps> = ({ errors, isValid, code }) => {
  return (
    <aside className="sidebar-right">
      <div className="section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Zap size={20} className="glow-text" />
          <h2 style={{ fontSize: '1rem', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Smart Coach</h2>
        </div>
        <SmartCoach errors={errors} isValid={isValid} code={code} />
      </div>

      <div className="mentor-shortcut-tips" style={{ marginTop: 'auto', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, letterSpacing: '1px' }}>
          TIPS: AI:n vägleder dig i realtid. Fokusera på de instruktioner som dyker upp ovan för att bygga en professionell kodbas.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
