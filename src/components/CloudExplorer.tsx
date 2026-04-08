import React, { useState, useEffect } from 'react';
import { cloudSyncService } from '../services/cloudSyncService';
import { githubService, type GitHubRepo } from '../lib/github';
import { Zap, X, Download, Clock, Globe, Terminal, GitBranch, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface CloudExplorerProps {
  initialTab?: 'MOLN' | 'GITHUB';
  onClose: () => void;
  onImport: (projectName: string, files: {path: string, content: string | Blob}[]) => void;
}

export const CloudExplorer: React.FC<CloudExplorerProps> = ({ initialTab = 'MOLN', onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState<'MOLN' | 'GITHUB'>(initialTab);
  const [projects, setProjects] = useState<{name: string, updated_at: string}[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'MOLN') {
      loadProjects();
    } else {
      loadRepos();
    }
  }, [activeTab]);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cloudSyncService.listProjects();
      setProjects(data);
    } catch (err) {
      setError('Kunde inte hämta molnprojekt.');
    } finally {
      setLoading(false);
    }
  };

  const loadRepos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await githubService.listRepos();
      setRepos(data);
    } catch (err) {
      setError('Kunde inte hämta GitHub-repos. Se till att du är inloggad med GitHub.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (name: string) => {
    setLoading(true);
    try {
      const cloudFiles = await cloudSyncService.fetchProjectFiles(name);
      // Konvertera till standardformat {path, content}
      const files = cloudFiles.map(f => ({ path: f.file_path, content: f.content }));
      onImport(name, files);
      onClose();
    } catch (err) {
      setError('Import misslyckades.');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubImport = async (repo: GitHubRepo) => {
    setLoading(true);
    setError('');
    try {
      const files = await githubService.fetchRepoContents(
        repo.full_name.split('/')[0],
        repo.name
      );
      onImport(repo.name, files);
      onClose();
    } catch (err) {
      setError('Import från GitHub misslyckades.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectName: string) => {
    if (!confirm(`Är du säker på att du vill radera "${projectName}" från molnet permanent? Detta kan inte ångras.`)) {
      return;
    }

    setLoading(true);
    try {
      await cloudSyncService.deleteProject(projectName);
      await loadProjects(); // Ladda om listan
    } catch (err) {
      setError('Kunde inte radera projektet.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRepos = repos.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="hacker-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="hacker-modal cloud-explorer"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="title-logo">
            <Zap className="glow-text" size={20} />
            <h2 className="glow-text">ARKIV-BRYGGA</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'MOLN' ? 'active' : ''}`}
            onClick={() => setActiveTab('MOLN')}
          >
            <Globe size={14} /> MOLN-SYNK
          </button>
          <button 
            className={`tab-btn ${activeTab === 'GITHUB' ? 'active' : ''}`}
            onClick={() => setActiveTab('GITHUB')}
          >
            <GitBranch size={14} /> GITHUB REPOS
          </button>
        </div>

        <div className="modal-body">
          <div className="search-bar">
            <Terminal size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder={`SÖK ${activeTab === 'MOLN' ? 'PROJEKT' : 'REPOS'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="project-list-container">
            {loading ? (
              <div className="loading-container">
                <Zap className="spinner glow-text" size={32} />
                <p>ANSLUTER TILL {activeTab}...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <p>{error}</p>
                {activeTab === 'GITHUB' && <button onClick={loadRepos} className="retry-btn">FÖRSÖK IGEN</button>}
              </div>
            ) : activeTab === 'MOLN' ? (
              // MOLNSYNK-VY
              filteredProjects.length === 0 ? (
                <div className="empty-state">
                  <Globe size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                  <p>INGA MOLNPROJEKT HITTADES.</p>
                  <span>Spara ett projekt på din dator för att se det här.</span>
                </div>
              ) : (
                <div className="projects-grid">
                  {filteredProjects.map((p) => (
                    <div key={p.name} className="project-card hacker-border-pulse">
                      <div className="project-info">
                        <h3 className="project-name">{p.name}</h3>
                        <div className="project-meta">
                          <Clock size={12} />
                          <span>{new Date(p.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button className="import-btn" onClick={() => handleImport(p.name)}>
                          <Download size={16} /> SYNKA
                        </button>
                        <button className="delete-cloud-btn" onClick={() => handleDelete(p.name)} title="Radera från molnet">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // GITHUB-VY
              filteredRepos.length === 0 ? (
                <div className="empty-state">
                  <GitBranch size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                  <p>INGA REPOS HITTADES.</p>
                  <span>Du har inga publika repon på GitHub.</span>
                </div>
              ) : (
                <div className="projects-grid">
                  {filteredRepos.map((repo) => (
                    <div key={repo.full_name} className="project-card hacker-border-pulse">
                      <div className="project-info">
                        <h3 className="project-name">{repo.name}</h3>
                        <div className="project-meta">
                          <span>{repo.full_name}</span>
                        </div>
                      </div>
                      <button className="import-btn github" onClick={() => handleGitHubImport(repo)}>
                        <GitBranch size={16} /> KLONA
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        <div className="modal-footer">
          <p>Dina projekt synkas krypterat via Supabase-molnet.</p>
        </div>
      </motion.div>

      <style>{`
        .hacker-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20000;
          padding: 20px;
        }

        .hacker-modal {
          background: #050505;
          border: 1px solid var(--accent-primary);
          width: 100%;
          max-width: 600px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 30px rgba(0, 255, 65, 0.1);
        }

        .modal-header {
          padding: 15px 20px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tabs-header {
          display: flex;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-color);
        }

        .tab-btn {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .tab-btn.active {
          color: var(--accent-primary);
          background: rgba(0, 255, 65, 0.05);
          box-shadow: inset 0 -2px 0 var(--accent-primary);
        }

        .tab-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.03);
          color: white;
        }

        .modal-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 450px;
        }

        .search-bar {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .search-bar input {
          background: transparent;
          border: none;
          color: white;
          width: 100%;
          outline: none;
          font-family: var(--font-mono);
          font-size: 0.9rem;
        }

        .project-list-container {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }

        .projects-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .project-card {
          padding: 15px;
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .project-card:hover {
          background: rgba(0, 255, 65, 0.05);
          border-color: var(--accent-primary);
        }

        .project-name {
          color: var(--accent-primary);
          margin: 0 0 5px 0;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .project-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .import-btn {
          background: var(--accent-primary);
          color: black;
          border: none;
          padding: 8px 15px;
          font-family: var(--font-mono);
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          border-radius: 2px;
        }

        .import-btn:hover {
          box-shadow: 0 0 15px var(--accent-primary);
        }

        .import-btn.github {
          background: #333;
          color: white;
          border: 1px solid #444;
        }

        .import-btn.github:hover {
          background: #444;
          box-shadow: 0 0 15px rgba(255,255,255,0.1);
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .delete-cloud-btn {
          background: rgba(255, 68, 68, 0.1);
          color: #ff4444;
          border: 1px solid rgba(255, 68, 68, 0.2);
          padding: 8px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-cloud-btn:hover {
          background: #ff4444;
          color: white;
          border-color: #ff4444;
          box-shadow: 0 0 15px rgba(255, 68, 68, 0.4);
        }

        .retry-btn {
          background: transparent;
          border: 1px solid var(--accent-primary);
          color: var(--accent-primary);
          padding: 5px 15px;
          margin-top: 10px;
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: 0.7rem;
        }

        .loading-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          color: var(--text-muted);
        }

        .modal-footer {
          padding: 10px 20px;
          border-top: 1px solid var(--border-color);
          color: var(--text-muted);
          font-size: 0.65rem;
          text-align: center;
        }

        .hacker-border-pulse {
          animation: subtle-pulse 4s infinite ease-in-out;
        }

        @keyframes subtle-pulse {
          0%, 100% { border-color: transparent; }
          50% { border-color: rgba(0, 255, 65, 0.2); }
        }
      `}</style>
    </div>
  );
};
