import { useState, useEffect } from 'react';
import { 
  Zap, Terminal, Eye, Link, FolderOpen, BookOpen, User, 
  GitBranch, PlusSquare, History as HistoryIcon, X, Info
} from 'lucide-react';
import CodeEditor from './components/Editor';
import Preview from './components/Preview';
import Sidebar from './components/Sidebar';
import FileExplorer from './components/FileExplorer';
import PwaPrompt from './components/PwaPrompt';
import LexiconOverlay from './components/LexiconOverlay';
import Dropdown from './components/Dropdown';
import DeviceToggle from './components/DeviceToggle';
import { AuthForm } from './components/AuthForm';
import ConsolePanel from './components/ConsolePanel';
import type { LogEntry } from './components/ConsolePanel';
import { supabase } from './lib/supabase';
import { githubService } from './lib/github';
import { blobManager } from './lib/blobManager';
import { projectRegistry } from './lib/projectRegistry';
import type { ProjectMetadata } from './lib/projectRegistry';
import { lintHTML, type LintResult } from './utils/linter';
import { lintCSS } from './utils/cssLinter';
import { openDirectory, readDirectory, readFileContent, writeFileContent, createNewFile } from './lib/fileSystem';
import type { FileEntry } from './lib/fileSystem';
import HistoryTerminal, { type CodeSnapshot } from './components/HistoryTerminal';
import AIErrorPanel from './components/AIErrorPanel';
import challenges from './data/challenges.json';
import { exportProjectToZip } from './utils/projectExporter';
import { runStructuralAudit } from './utils/auditRobot';
import type { Session } from '@supabase/supabase-js';
import * as prettier from 'prettier/standalone';
import * as prettierHtml from 'prettier/parser-html';
import * as prettierPostcss from 'prettier/parser-postcss';
import * as prettierBabel from 'prettier/parser-babel';
import { cloudSyncService } from './services/cloudSyncService';
import './App.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  
  // Filsystem-state
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [activeFileHandle, setActiveFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>('');
  
  // Kod-state
  const [code, setCode] = useState<string>('<!-- Välj en fil för att börja koda -->');
  const [errors, setErrors] = useState<LintResult[]>([]);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'terminal' | 'output'>('terminal');

  // Preview-synk (för att tvinga fram uppdateringar när andra filer ändras)
  const [previewVersion, setPreviewVersion] = useState(0);

  // GitHub-state
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState('');

  // Lexikon-state
  const [isLexiconOpen, setIsLexiconOpen] = useState(false);

  // Projekt-historik
  const [recentProjects, setRecentProjects] = useState<ProjectMetadata[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectMetadata | null>(null);

  // Debug & Pro-features state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [isVimMode, setIsVimMode] = useState(false);
  const [savedCode, setSavedCode] = useState<string>('');
  const [projectToRestore, setProjectToRestore] = useState<ProjectMetadata | null>(null);

  // Learn from Scratch state
  const [openFiles, setOpenFiles] = useState<FileSystemFileHandle[]>([]);
  const [viewportWidth, setViewportWidth] = useState('100%');
  const [editorInstance, setEditorInstance] = useState<any>(null);
  
  // Framework Support state
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null);
  const [detectedFramework, setDetectedFramework] = useState<string | null>(null);
  const [isServerInputOpen, setIsServerInputOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiBarVisible, setIsAiBarVisible] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  
  // Hjälpfunktion för att lägga till loggar
  const addLog = (type: 'SYSTEM' | 'ERROR' | 'WARNING', content: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      type: type === 'SYSTEM' ? 'info' : type.toLowerCase() as any,
      content,
      timestamp: Date.now()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };
  
  // Senior Architect Upgrades state
  const [isBlueprintMode, setIsBlueprintMode] = useState(false);
  const [history, setHistory] = useState<CodeSnapshot[]>([]);
  const [activeBottomTab, setActiveBottomTab] = useState<'console' | 'history'>('console');

  // Hantera autentisering
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsGitHubConnected(!!session?.provider_token);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsGitHubConnected(!!session?.provider_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ladda projekt-historik och kolla efter senaste aktiva projekt vid start
  useEffect(() => {
    projectRegistry.getRecentProjects().then(projects => {
      setRecentProjects(projects);
      
      const lastId = localStorage.getItem('sparkcode_active_project_id');
      if (lastId) {
        const lastProject = projects.find(p => p.id === lastId);
        if (lastProject) {
          setProjectToRestore(lastProject);
        }
      }
    });
  }, []);

  // Registrera Service Worker för PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('SW_REGISTERED', reg.scope))
          .catch(err => console.error('SW_REG_FAIL', err));
      });
    }
  }, []);

  // Kör lintern när koden ändras (Ska alltid döma, även utan vald fil)
  useEffect(() => {
    let currentErrors: LintResult[] = [];
    const fileNameLower = activeFileName?.toLowerCase() || '';
    
    // Om ingen fil är aktiv, kör vi standard HTML-linter på editorn
    if (!activeFileName || fileNameLower.endsWith('.html') || fileNameLower === 'index' || fileNameLower === 'test') {
      currentErrors = lintHTML(code);
    } else if (fileNameLower.endsWith('.css')) {
      currentErrors = lintCSS(code);
    }
    
    setErrors(currentErrors);
    setIsValid(!currentErrors.some(e => e.severity === 'error'));
  }, [code, activeFileName]);

  // Kvalitets-index beräkning för status-raden
  // Kvalitets-index (Viktat för stenhård bedömning)
  const calculateQuality = () => {
    if (errors.length === 0) return 100;
    const hasGibberish = errors.some(e => e.message.includes("Vad är det här") || e.message.includes("ARKITEKTONISKT FUNDAMENT"));
    if (hasGibberish) return 0;
    const penalty = errors.reduce((acc, err) => acc + (err.severity === 'error' ? 35 : err.severity === 'warning' ? 15 : 5), 0);
    return Math.max(0, 100 - penalty);
  };
  const qualityScore = calculateQuality();
  const topError = errors[0];

  // Auto-save till lokala filen om vald
  useEffect(() => {
    if (activeFileHandle && isValid) {
      const saveTimeout = setTimeout(() => {
        writeFileContent(activeFileHandle, code)
          .then(async () => {
            // Uppdatera Blobs för projektet så att Preview hänger med
            await blobManager.refreshBlobs(fileEntries);
            setPreviewVersion(v => v + 1);
            
            // Uppdatera tillgängliga funktioner för Deep-Linting
            updateAvailableFunctions();

            // Spara historik-snapshot (max 50)
            const snapshot: CodeSnapshot = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              fileName: activeFileName,
              code: code
            };
            setHistory(prev => [snapshot, ...prev].slice(0, 50));
          })
          .catch(console.error);
      }, 1000);
      return () => clearTimeout(saveTimeout);
    }
  }, [code, activeFileHandle, isValid, fileEntries]);

  // Helautomatisk Cloud Sync (Auto-Push)
  useEffect(() => {
    if (session && currentProject && activeFileName && code.trim()) {
      setSyncStatus('syncing');
      const syncTimeout = setTimeout(async () => {
        try {
          await cloudSyncService.pushFile(currentProject.name, activeFileName, code);
          setSyncStatus('synced');
        } catch (err) {
          console.error('Cloud Sync Error:', err);
          setSyncStatus('error');
        }
      }, 2000); // Tyst auto-push efter 2 sekunder
      return () => clearTimeout(syncTimeout);
    }
  }, [code, activeFileName, currentProject, session]);

  // Helautomatisk Cloud Sync (Auto-Pull vid start/session-ändring)
  useEffect(() => {
    if (session && currentProject && fileEntries.length > 0) {
      const performAutoPull = async () => {
        try {
          setSyncStatus('syncing');
          await cloudSyncService.syncCloudToLocal(
            currentProject.name, 
            fileEntries,
            (path, content) => {
              if (activeFileName === path) setCode(content);
            }
          );
          setSyncStatus('synced');
          addLog('SYSTEM', 'Sömlös molnsynk slutförd: Lokala filer uppdaterade.');
        } catch (err) {
            console.error('Auto-Pull Error:', err);
            setSyncStatus('error');
        }
      };
      
      performAutoPull();
    }
  }, [session, currentProject?.id]); // Körs när projektet eller sessionen ändras

  const updateAvailableFunctions = async () => {
    const functions: string[] = [];
    
    const scanFiles = async (entries: FileEntry[]) => {
      for (const entry of entries) {
        if (entry.kind === 'file' && entry.name.endsWith('.js')) {
          const content = await readFileContent(entry.handle as FileSystemFileHandle);
          // Matcha function name() eller const name = () =>
          const matches = content.matchAll(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*(?:=|[\n\r\s]*\()/g);
          for (const match of matches) {
            functions.push(match[1]);
          }
        } else if (entry.kind === 'directory' && entry.children) {
          await scanFiles(entry.children);
        }
      }
    };
    
    scanFiles(fileEntries);
  };

  const handleRollback = (snapshot: CodeSnapshot) => {
    if (confirm(`Vill du återställa ${snapshot.fileName} till versionen från ${new Date(snapshot.timestamp).toLocaleTimeString()}?`)) {
      setCode(snapshot.code);
      setPushStatus(`RESTORED: ${snapshot.id.substring(0, 7)}`);
      setTimeout(() => setPushStatus(''), 2000);
    }
  };

  // Lyssna på debug-loggar från preview-fönstret
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SPARKCODE_LOG') {
        const newLog: LogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          type: event.data.logType,
          content: event.data.content,
          timestamp: Date.now()
        };
        setLogs(prev => [newLog, ...prev].slice(0, 100)); // Spara de 100 senaste
        if (event.data.logType === 'error') setIsConsoleOpen(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Kortkommandon (Senior Developer Workflows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        setPushStatus('SYSTEM_SAVE_SUCCESS');
        setTimeout(() => setPushStatus(''), 2000);
      }
      // Ctrl + O (Open Folder)
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        handleConnectDirectory();
      }
      // Ctrl + L (Lexicon)
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setIsLexiconOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [directoryHandle]);

  const handleConnectDirectory = async () => {
    try {
      const handle = await openDirectory();
      setDirectoryHandle(handle);
      const entries = await readDirectory(handle);
      setFileEntries(entries);
      
      // Spara projekt i historiken
      const saved = await projectRegistry.saveProject(handle);
      setCurrentProject(saved);
      projectRegistry.getRecentProjects().then(setRecentProjects);

      // Initiera Blobs för hela projektet
      await blobManager.refreshBlobs(entries);
      setPreviewVersion(v => v + 1);

      // Spara som aktivt projekt
      localStorage.setItem('sparkcode_active_project_id', saved.id);
      setProjectToRestore(null);

      // Kolla efter ramverk
      const isAstro = entries.some(e => e.name === 'astro.config.mjs');
      if (isAstro) setDetectedFramework('Astro');
      
      const savedUrl = localStorage.getItem(`sparkcode_server_${saved.id}`);
      if (savedUrl) setCustomPreviewUrl(savedUrl);
    } catch (err) {
      console.error('Kunde inte öppna mappen:', err);
    }
  };

  const handleFileSelect = async (handle: FileSystemFileHandle) => {
    try {
      const content = await readFileContent(handle);
      setActiveFileHandle(handle);
      setActiveFileName(handle.name);
      setCode(content);
      setSavedCode(content); 
      setActiveTab('terminal');
      setIsDiffMode(false); 
      
      // Lägg till i öppna filer om den inte redan finns
      setOpenFiles(prev => {
        if (prev.find(f => f.name === handle.name)) return prev;
        return [...prev, handle];
      });

      localStorage.setItem('sparkcode_active_file_name', handle.name);
    } catch (err) {
      console.error('Kunde inte läsa filen:', err);
    }
  };

  const handleCloseTab = (fileName: string) => {
    setOpenFiles(prev => {
      const nextFiles = prev.filter(f => f.name !== fileName);
      if (activeFileName === fileName && nextFiles.length > 0) {
        handleFileSelect(nextFiles[nextFiles.length - 1]);
      } else if (nextFiles.length === 0) {
        setActiveFileHandle(null);
        setActiveFileName('');
        setCode('<!-- Välj en fil för att börja koda -->');
      }
      return nextFiles;
    });
  };

  const handleSearchSelection = () => {
    if (editorInstance) {
      const selection = editorInstance.getSelection();
      const text = editorInstance.getModel().getValueInRange(selection);
      if (text) {
        setIsLexiconOpen(true);
        // Vi kan skicka med texten till LexiconOverlay via en ny prop framöver
        // För nu triggar vi bara sökningen visuellt om möjligt
        (window as any).__sparkcode_search = text;
      } else {
        setIsLexiconOpen(true);
      }
    }
  };

  const handleCreateNewFile = async () => {
    if (!directoryHandle) return;
    const fileName = prompt('Ange filnamn (t.ex. index.html):');
    if (fileName) {
      try {
        const newFileHandle = await createNewFile(directoryHandle, fileName);
        const entries = await readDirectory(directoryHandle);
        setFileEntries(entries);
        
        // Uppdatera Blobs
        await blobManager.refreshBlobs(entries);
        setPreviewVersion(v => v + 1);
        
        handleFileSelect(newFileHandle);
      } catch (err) {
        console.error('Kunde inte skapa filen:', err);
      }
    }
  };

  const handleGitHubPush = async () => {
    if (!directoryHandle || !session) return;
    
    setIsPushing(true);
    setPushStatus('Initializing GitHub Protocol...');
    
    try {
      const repoName = directoryHandle.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      setPushStatus(`Checking repository: ${repoName}...`);
      
      let repos = await githubService.listRepos();
      let targetRepo = repos.find(r => r.name === repoName);
      
      if (!targetRepo) {
        setPushStatus(`Creating new repository: ${repoName}...`);
        targetRepo = await githubService.createRepo(repoName);
      }

      const [owner, repo] = targetRepo.full_name.split('/');
      
      const uploadRecursive = async (entries: FileEntry[], currentPath: string = '') => {
        for (const entry of entries) {
          const path = currentPath ? `${currentPath}/${entry.name}` : entry.name;
          
          if (entry.kind === 'file') {
            setPushStatus(`Uploading: ${path}...`);
            const content = await readFileContent(entry.handle as FileSystemFileHandle);
            await githubService.uploadFile(owner, repo, path, content, `Update ${path} via SparkCode`);
          } else if (entry.kind === 'directory' && entry.children) {
            await uploadRecursive(entry.children, path);
          }
        }
      };

      await uploadRecursive(fileEntries);
      setPushStatus('PUSH_SUCCESS: Project is live on GitHub!');
      setTimeout(() => setPushStatus(''), 5000);
      
    } catch (err: any) {
      setPushStatus(`PUSH_FAIL: ${err.message}`);
      console.error(err);
    } finally {
      setIsPushing(false);
    }
  };

  const handleSwitchProject = async (project: ProjectMetadata) => {
    try {
      const hasPermission = await projectRegistry.verifyPermission(project.handle);
      if (hasPermission) {
        setDirectoryHandle(project.handle);
        const entries = await readDirectory(project.handle);
        setFileEntries(entries);
        setCurrentProject(project);
        setOpenFiles([]);
        setPreviewVersion(v => v + 1);
        setPushStatus(`PROJECT_SWITCH: ${project.name}`);
        localStorage.setItem('sparkcode_active_project_id', project.id);
        setProjectToRestore(null);

        // Kolla efter ramverk och sparad server
        const isAstro = entries.some(e => e.name === 'astro.config.mjs');
        setDetectedFramework(isAstro ? 'Astro' : null);
        const savedUrl = localStorage.getItem(`sparkcode_server_${project.id}`);
        setCustomPreviewUrl(savedUrl);

        setTimeout(() => setPushStatus(''), 3000);
      }
    } catch (err) {
      console.error('Kunde inte växla projekt:', err);
    }
  };
  
  const handleRenameProject = async () => {
    if (!currentProject) return;
    const newName = prompt('Ange nytt namn för projektet:', currentProject.name);
    if (newName) {
      const updated = await projectRegistry.saveProject(currentProject.handle, newName);
      setCurrentProject(updated);
      projectRegistry.getRecentProjects().then(setRecentProjects);
    }
  };

  const handlePrettify = async () => {
    try {
      const parser = activeFileName?.endsWith('.css') ? 'css' : 
                     activeFileName?.endsWith('.js') ? 'babel' : 'html';
      
      const plugins = [prettierHtml, prettierPostcss, prettierBabel];
      
      const formatted = await prettier.format(code, {
        parser,
        plugins,
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
      });
      
      setCode(formatted);
      setPushStatus('CODE_FORMATTED');
      setTimeout(() => setPushStatus(''), 2000);
    } catch (err: any) {
      console.error('Prettify failed:', err);
      setPushStatus(`FORMAT_ERROR: ${err.message}`);
      setTimeout(() => setPushStatus(''), 4000);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('sparkcode_active_project_id');
    localStorage.removeItem('sparkcode_active_file_name');
    setCustomPreviewUrl(null);
    setDetectedFramework(null);
    await supabase.auth.signOut();
  };


  if (!session) {
    return (
      <div className="app-container">
        <div className="crt-overlay"></div>
        <AuthForm />
      </div>
    );
  }

  const handleRunAudit = () => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      addLog('SYSTEM', 'Arkitekten: Påbörjar djupstruktur-audit...');
      const report = runStructuralAudit(iframe);
      
      addLog('SYSTEM', `Audit resultat: ${report.score}/100 QUALITY.`);
      
      if (report.criticalIssues.length > 0) {
        report.criticalIssues.forEach(issue => addLog('ERROR', `KRITISK: ${issue}`));
      }
      if (report.warnings.length > 0) {
        report.warnings.forEach(w => addLog('WARNING', `VARNING: ${w}`));
      }
      if (report.performanceTips.length > 0) {
        report.performanceTips.forEach(p => addLog('SYSTEM', `TIPS: ${p}`));
      }
      
      if (report.score === 100) {
        addLog('SYSTEM', 'PERFEKTION! Inga arkitektoniska brister funna. Chefen kommer bli imponerad.');
      }
      
      setIsConsoleOpen(true);
    }
  };

  const menuItems = [
    { 
      label: 'Öppna mapp...', 
      icon: <FolderOpen size={14} />, 
      shortcut: 'Ctrl+O',
      onClick: handleConnectDirectory 
    },
    { 
      label: 'Nytt projekt', 
      icon: <PlusSquare size={14} />, 
      onClick: async () => {
        setDirectoryHandle(null);
        setFileEntries([]);
        setCurrentProject(null);
        handleConnectDirectory();
      }
    },
    {
      label: 'Senaste projekt',
      icon: <HistoryIcon size={14} />,
      children: recentProjects.length > 0 
        ? recentProjects.map(p => ({
            label: p.name,
            onClick: () => handleSwitchProject(p)
          }))
        : [{ label: 'Inga sparade projekt', onClick: () => {} }]
    },
    {
      label: 'Döp om projekt',
      onClick: handleRenameProject
    },
    { 
      label: 'Spara', 
      shortcut: 'Ctrl+S', 
      onClick: () => {
        setPushStatus('SYSTEM_SAVE_SUCCESS');
        setTimeout(() => setPushStatus(''), 2000);
      } 
    },
    {
      label: 'Format Kod (Prettier)',
      icon: <Info size={14} />,
      onClick: handlePrettify
    },
    {
      label: `Vim-läge: ${isVimMode ? 'PÅ' : 'AV'}`,
      icon: <Terminal size={14} />,
      onClick: () => setIsVimMode(!isVimMode)
    },
    { 
      label: 'RUN AUDIT (DJUPANALYS)', 
      icon: <Zap size={14} />,
      onClick: handleRunAudit 
    },
    { 
      label: 'EXPORTERA PROJEKT (ZIP)', 
      onClick: () => {
        if (currentProject) {
          exportProjectToZip(fileEntries, currentProject.name);
          addLog('SYSTEM', `Exporterar projekt: ${currentProject.name}.zip`);
        } else {
          addLog('ERROR', 'Inget aktivt projekt hittades för export.');
        }
      } 
    },
    { label: 'LOGGA UT', onClick: handleLogout }
  ];

  return (
    <div className={`app-container ${qualityScore === 100 ? 'achievement-unlocked' : ''}`}>
      <div className="crt-overlay"></div>
      
      <header className="header">
        <div className="header-nav">
          <Dropdown label="ARKIV" items={menuItems} />
          {fileEntries.length > 0 && (
            <Dropdown 
              label="FILER" 
              items={fileEntries
                .filter(e => e.kind === 'file')
                .map(e => ({
                  label: e.name.toUpperCase(),
                  onClick: () => handleFileSelect(e.handle as FileSystemFileHandle)
                }))
              } 
            />
          )}

          {/* Mobile Menu Toggle - Bredvid ARKIV på mobilen */}
          <button 
            className="hacker-button mobile-only menu-toggle" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ marginLeft: '5px' }}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Terminal size={18} />}
            <span>MENY</span>
          </button>
        </div>

        <div className="logo">
          <Zap className="glow-text" size={24} />
          <span className="glow-text desktop-only">SPARKCODE {currentProject ? `| ${currentProject.name}` : ''}</span>
          <span className="glow-text mobile-only">SC</span>
        </div>
        
        {/* Desktop Header Info */}
        <div className="header-info desktop-only">
          <span style={{ color: isValid ? 'var(--accent-primary)' : 'var(--error-color)' }}>
             ● {isValid ? 'ONLINE' : 'SYSTEM_ERROR'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={14} />
            <span>{session.user.email}</span>
          </div>
          {pushStatus && (
            <div className="push-notification glow-text">
               {pushStatus}
            </div>
          )}
          
          {/* Cloud Sync Status Indicator */}
          {session && (
            <div className={`sync-indicator ${syncStatus}`} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.7rem',
              color: syncStatus === 'synced' ? 'var(--accent-primary)' : syncStatus === 'syncing' ? 'var(--accent-secondary)' : syncStatus === 'error' ? 'var(--error-color)' : 'var(--text-muted)'
            }}>
              <Zap size={10} className={syncStatus === 'syncing' ? 'spinner' : ''} />
              <span style={{ fontWeight: 800 }}>CLOUD_{syncStatus.toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="header-actions">
           {/* Desktop Actions */}
           <div className="desktop-actions desktop-only">
             {directoryHandle && isGitHubConnected && (
                <button 
                  onClick={handleGitHubPush} 
                  disabled={isPushing}
                  className="hacker-button github-push-button"
                >
                  {isPushing ? <Zap className="spinner" size={14} /> : <GitBranch size={14} />}
                  {isPushing ? 'PUSHING...' : 'PUSH TO GITHUB'}
                </button>
             )}
             <button 
               onClick={() => setIsLexiconOpen(true)} 
               className="hacker-button lexicon-button"
               title="Öppna Kod-Lexikon"
             >
               <BookOpen size={14} />
               LEXIKON
             </button>
           </div>
        </div>
      </header>

      {/* Architect Status Bar - Konstant AI-insyn (Döljbar på mobil för Zen-mode) */}
      {isAiBarVisible && (
        <div className="architect-status-bar">
          <div className={`status-badge ${isValid ? 'status-valid' : 'status-invalid'}`}>
            {qualityScore}% QUALITY
          </div>
          <button className="hacker-button audit-button" onClick={handleRunAudit}>
            RUN
          </button>
          <div className="status-divider"></div>
          <div className={`status-advice ${topError ? 'has-error' : ''}`}>
            {topError ? (
              <><strong>ADVICE:</strong> {topError.message}</>
            ) : (
              <><strong>STATUS:</strong> ARCHITECTURE STABLE. PROCEED.</>
            )}
          </div>
          <button 
            className="close-ai-button mobile-only" 
            onClick={() => setIsAiBarVisible(false)}
            title="Dölj AI (Zen-mode)"
          >
            <X size={14} />
          </button>
          <div className="desktop-only" style={{ marginLeft: 'auto', opacity: 0.5 }}>
            FILE: {activeFileName || 'STANDBY'}
          </div>
        </div>
      )}

      {/* Mobile Overflow Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-content" onClick={e => e.stopPropagation()}>
            <div className="menu-header">
              <Zap size={20} className="glow-text" />
              <h3>SPARKCODE MENU</h3>
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={20}/></button>
            </div>
            
            <div className="menu-section">
              <div className="user-profile">
                <User size={16} />
                <span>{session.user.email}</span>
              </div>
              <div className="system-status">
                <span style={{ color: isValid ? 'var(--accent-primary)' : 'var(--error-color)' }}>
                  ● {isValid ? 'SYSTEM_ONLINE' : 'SYSTEM_ERROR'}
                </span>
              </div>
            </div>

            <div className="menu-section architect-status">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} className="glow-text" />
                  <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent-primary)' }}>SENIOR ARCHITECT</h4>
                </div>
                {!isAiBarVisible && (
                  <button 
                    className="hacker-button mini" 
                    onClick={() => setIsAiBarVisible(true)}
                    style={{ fontSize: '0.6rem', padding: '2px 6px' }}
                  >
                    VISA I HEADER
                  </button>
                )}
              </div>
              <AIErrorPanel errors={errors} isValid={isValid} code={code} />
            </div>

            <div className="menu-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <BookOpen size={16} color="var(--accent-secondary)" />
                <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>ACTIVE MISSIONS</h4>
              </div>
              <div className="mobile-challenges">
                {challenges.map(c => (
                  <div key={c.id} className="challenge-card mini">
                    <span className="challenge-title">{c.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="menu-items">
              <button className="menu-item" onClick={() => { setIsLexiconOpen(true); setIsMobileMenuOpen(false); }}>
                <BookOpen size={18} />
                <span>KOD-LEXIKON</span>
                <span className="shortcut">CTRL+L</span>
              </button>

              {directoryHandle && (
                <button className="menu-item" onClick={() => { handleGitHubPush(); setIsMobileMenuOpen(false); }}>
                  <GitBranch size={18} />
                  <span>PUSH TO GITHUB</span>
                  {isPushing && <Zap className="spinner" size={12} />}
                </button>
              )}

              <button className="menu-item" onClick={() => { handleConnectDirectory(); setIsMobileMenuOpen(false); }}>
                <FolderOpen size={18} />
                <span>ANDRA MAPPAR...</span>
              </button>
            </div>

            {pushStatus && (
              <div className="menu-notification glow-text">
                {pushStatus}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="main-content">
        <FileExplorer 
          entries={fileEntries} 
          onFileSelect={handleFileSelect} 
          onNewFile={handleCreateNewFile}
        />

        <section className={`editor-pane ${activeTab === 'terminal' ? 'active' : ''}`}>
          <div className="pane-tabs">
            {openFiles.map(file => (
              <div 
                key={file.name} 
                className={`pane-tab ${activeFileName === file.name ? 'active' : ''}`}
                onClick={() => handleFileSelect(file)}
              >
                <span>{file.name}</span>
                <button 
                  className="close-tab" 
                  onClick={(e) => { e.stopPropagation(); handleCloseTab(file.name); }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>

          <div className="pane-header active">
            <Terminal size={14} />
            <span>{activeFileName || 'Välj en fil...'}</span>
            
            {activeFileHandle && (
              <div className="pane-header-actions">
                <button 
                  className="pane-button"
                  onClick={handleSearchSelection}
                  title="Sök markerad text i lexikon"
                >
                  Sök
                </button>
                <button 
                  className={`pane-button ${isDiffMode ? 'active' : ''}`}
                  onClick={() => setIsDiffMode(!isDiffMode)}
                  title="Visa skillnader mot sparad fil"
                >
                  Diff
                </button>
                <button 
                  className="pane-button"
                  onClick={handlePrettify}
                  title="Formatera kod (Prettier)"
                >
                  Format
                </button>
              </div>
            )}
          </div>
          
          <div className="editor-container-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {directoryHandle ? (
              <CodeEditor 
                code={code} 
                originalCode={savedCode}
                isDiffMode={isDiffMode}
                isVimMode={isVimMode}
                onChange={(val) => val !== undefined && setCode(val)} 
                options={{
                  onMount: (editor: any) => setEditorInstance(editor)
                }}
              />
            ) : (
              <div className="connect-prompt">
                {projectToRestore ? (
                  <>
                    <HistoryIcon size={48} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
                    <h2 className="glow-text">ÅTERSTÄLL PROJEKT?</h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                      Du jobbade senast med <strong style={{ color: 'var(--accent-primary)' }}>{projectToRestore.name}</strong>.<br/>
                      Vill du fortsätta där du slutade?
                    </p>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                      <button className="connect-button" onClick={() => handleSwitchProject(projectToRestore)}>
                        ÅTERSTÄLL SENASTE
                      </button>
                      <button 
                        className="hacker-button" 
                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                        onClick={() => {
                          setProjectToRestore(null);
                          localStorage.removeItem('sparkcode_active_project_id');
                        }}
                      >
                        VÄLJ ANNAN MAPP
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <FolderOpen size={48} color="var(--accent-primary)" />
                    <h2 className="glow-text">INGA FILER ANSLUTNA</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Välj en mapp på din dator för att börja koda direkt i dina lokala filer.</p>
                    <button className="connect-button" onClick={handleConnectDirectory}>
                      ANSLUT LOKAL MAPP
                    </button>
                  </>
                )}
              </div>
            )}

            {(isConsoleOpen || activeBottomTab === 'history') && (
              <div className="bottom-panel">
                <div className="bottom-tabs">
                  <div 
                    className={`bottom-tab ${activeBottomTab === 'console' ? 'active' : ''}`}
                    onClick={() => setActiveBottomTab('console')}
                  >
                    CONSOLE ({logs.length})
                  </div>
                  <div 
                    className={`bottom-tab ${activeBottomTab === 'history' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveBottomTab('history');
                      setIsConsoleOpen(true);
                    }}
                  >
                    HACKER-GIT ({history.length})
                  </div>
                  <div className="pane-header-actions" style={{ marginLeft: 'auto', paddingRight: '10px' }}>
                    <button onClick={() => setIsConsoleOpen(false)} className="close-tab"><X size={12} /></button>
                  </div>
                </div>
                
                {activeBottomTab === 'console' ? (
                  <ConsolePanel 
                    logs={logs} 
                    onClear={() => setLogs([])}
                    onClose={() => setIsConsoleOpen(false)}
                  />
                ) : (
                  <HistoryTerminal 
                    history={history}
                    onRollback={handleRollback}
                  />
                )}
              </div>
            )}
          </div>
        </section>

        <section className={`preview-pane ${activeTab === 'output' ? 'active' : ''}`}>
          <div className="pane-header">
            <Eye size={14} />
            <DeviceToggle currentWidth={viewportWidth} onWidthChange={setViewportWidth} />
            
            <div className="pane-header-actions">
              {detectedFramework && (
                <span className="framework-badge">{detectedFramework.toUpperCase()} FOUND</span>
              )}
              
              <button 
                className={`pane-button ${isBlueprintMode ? 'active' : ''}`}
                onClick={() => setIsBlueprintMode(!isBlueprintMode)}
                title="Blueprint Mode: Visualisera Box-modellen och arkitektur"
              >
                BLUEPRINT
              </button>

              <button 
                className={`pane-button ${customPreviewUrl ? 'active' : ''}`}
                onClick={() => setIsServerInputOpen(!isServerInputOpen)}
                title="Pro Server Bridge: Anslut till din lokala dev-server"
              >
                <Link size={12} />
                SERVER
              </button>

              <button 
                className={`pane-button ${isConsoleOpen ? 'active' : ''}`}
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              >
                Debug ({logs.length})
              </button>
            </div>
          </div>

          {isServerInputOpen && (
            <div className="server-guide-overlay">
              <div className="guide-content">
                <h3><Link size={16} /> PRO SERVER BRIDGE INITIALIZATION</h3>
                <p className="guide-subtitle">Följ stegen för att ansluta ditt {detectedFramework || 'projekt'} till SparkCode:</p>
                
                <div className="guide-steps">
                  <div className="step">
                    <span className="step-num">01</span>
                    <div className="step-text">
                      <strong>Starta Servern</strong>
                      <p>Öppna din terminal och kör följande kommando i projektmappen:</p>
                      <code className="hacker-code">cd "{directoryHandle?.name}" && npm run dev</code>
                    </div>
                  </div>
                  
                  <div className="step">
                    <span className="step-num">02</span>
                    <div className="step-text">
                      <strong>Kopiera Adressen</strong>
                      <p>Leta efter adressen i terminalen (oftast <span className="highlight">http://localhost:4321</span>).</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <span className="step-num">03</span>
                    <div className="step-text">
                      <strong>Anslut Bryggan</strong>
                      <p>Klistra in adressen här nedanför för att se din sajt live:</p>
                      <div className="server-input-group">
                        <input 
                          type="text" 
                          placeholder="http://localhost:4321" 
                          value={customPreviewUrl || ''}
                          autoFocus
                          onChange={(e) => {
                            const url = e.target.value;
                            setCustomPreviewUrl(url || null);
                            if (currentProject) {
                              localStorage.setItem(`sparkcode_server_${currentProject.id}`, url);
                            }
                          }}
                        />
                        <button className="connect-btn" onClick={() => setIsServerInputOpen(false)}>ANSLUT SERVER</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="close-guide" onClick={() => setIsServerInputOpen(false)}>AVBRYT</button>
              </div>
            </div>
          )}

          <Preview 
            key={`${previewVersion}-${isBlueprintMode}`} 
            code={code} 
            width={viewportWidth} 
            overrideUrl={customPreviewUrl}
            isBlueprintMode={isBlueprintMode}
          />
        </section>

        <Sidebar errors={errors} isValid={isValid} code={code} />
      </main>

      <nav className="mobile-tabs">
        <button 
          className={`tab-button ${activeTab === 'terminal' ? 'active' : ''}`}
          onClick={() => setActiveTab('terminal')}
        >
          <Terminal size={18} />
          TERMINAL
        </button>
        <button 
          className={`tab-button ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          <Eye size={18} />
          OUTPUT
          {!isValid && <div className="notification-dot" />}
        </button>
      </nav>

      <PwaPrompt />
      <LexiconOverlay 
        isOpen={isLexiconOpen} 
        onClose={() => setIsLexiconOpen(false)} 
      />
    </div>
  );
}

export default App;
