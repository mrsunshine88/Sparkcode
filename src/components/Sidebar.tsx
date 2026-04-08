import { BookOpen, Zap } from 'lucide-react';
import AIErrorPanel from './AIErrorPanel';
import challenges from '../data/challenges.json';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Zap size={20} className="glow-text" />
          <h2 style={{ fontSize: '1rem', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Senior Architect</h2>
        </div>
        <AIErrorPanel errors={errors} isValid={isValid} code={code} />
      </div>

      <div className="section" style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BookOpen size={20} color="var(--accent-secondary)" />
          <h1 style={{ fontSize: '1rem', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-secondary)' }}>Missions</h1>
        </div>
        
        {challenges.map((challenge) => (
          <div key={challenge.id} className="challenge-card" style={{ marginBottom: '12px' }}>
            <h3 className="challenge-title">{challenge.title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {challenge.description}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
