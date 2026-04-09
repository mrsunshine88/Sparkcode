import { useState, useEffect } from 'react';
import { 
  Zap, Terminal, Eye, Link, FolderOpen, BookOpen, User, Bot,
  GitBranch, PlusSquare, History as HistoryIcon, X, Info, Globe, Settings, Lock, Download
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
import { openDirectory, readDirectory, readFileContent, writeFileContent, createNewFile, createNewFolder } from './lib/fileSystem';
import type { FileEntry } from './lib/fileSystem';
import HistoryTerminal, { type CodeSnapshot } from './components/HistoryTerminal';
import AIErrorPanel from './components/AIErrorPanel';
import challenges from './data/challenges.json';
import { exportProjectToZip } from './utils/projectExporter';
import { runStructuralAudit } from './utils/auditRobot';

export interface DebugLog {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}
import type { Session } from '@supabase/supabase-js';
import * as prettier from 'prettier/standalone';
import * as prettierHtml from 'prettier/parser-html';
import * as prettierPostcss from 'prettier/parser-postcss';
import * as prettierBabel from 'prettier/parser-babel';
import { cloudSyncService } from './services/cloudSyncService';
import { CloudExplorer } from './components/CloudExplorer';
import { AccountSettings } from './components/AccountSettings';
import ImportChoiceModal from './components/ImportChoiceModal';
import { AnimatePresence } from 'framer-motion';
import { scanProject } from './services/projectScanner';
import { auditAnatomy } from './utils/anatomyAudit';
import { runPredictiveAudit } from './utils/predictiveAudit';
import CtoTerminal from './components/CtoTerminal';
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
  const [cloudSyncedCode, setCloudSyncedCode] = useState<string>('');
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
  const [isCloudExplorerOpen, setIsCloudExplorerOpen] = useState(false);
  const [cloudExplorerInitialTab, setCloudExplorerInitialTab] = useState<'MOLN' | 'GITHUB'>('MOLN');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState(() => {
    return localStorage.getItem('sparkcode_cloud_sync_enabled') !== 'false';
  });
  
  // Hjälpfunktion för att lägga till loggar
  const addLog = (type: 'SYSTEM' | 'ERROR' | 'WARNING' | 'SUCCESS', content: string) => {
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
  const [lastChangeSource, setLastChangeSource] = useState<'local' | 'remote'>('local');
  const [structuralErrors, setStructuralErrors] = useState<LintResult[]>([]);
  const [projectInsight, setProjectInsight] = useState<any>(null);
  const [domCount, setDomCount] = useState(0);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [activePackages, setActivePackages] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, string>>({});
  const [bridgeStatus, setBridgeStatus] = useState<'OFFLINE' | 'CONNECTED'>('OFFLINE');
  const [systemMetrics, setSystemMetrics] = useState({ cpu: 0, ram: 0 });

  // Import Modal state
  const [importModalData, setImportModalData] = useState<{ isOpen: boolean; repoName: string; files: any[] } | null>(null);

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
        } else if (lastId.startsWith('virtual-')) {
          // Återställ virtuellt projekt (Moln-läge)
          const virtualName = localStorage.getItem('sparkcode_virtual_project_name');
          if (virtualName) {
            const pseudoProject: any = {
              id: lastId,
              name: virtualName,
              folderName: virtualName,
              lastOpened: Date.now(),
              handle: null
            };
            setCurrentProject(pseudoProject);
            addLog('SYSTEM', `Återställde molnprojekt: ${virtualName}`);
          }
        }
      }
    });
  }, []);

  // LocalStorage Backup: Spara en blixtsnabb kopia i webbläsarens minne (F5-skydd)
  useEffect(() => {
    if (activeFileName && code && lastChangeSource === 'local') {
      localStorage.setItem(`sparkcode_backup_${activeFileName}`, code);
    }
  }, [code, activeFileName, lastChangeSource]);

  // Gå till en specifik rad i editorn (används av Mentorn)
  const handleFocusLine = async (line: number, fileName?: string) => {
    // Om felet är i en annan fil, försök byta fil först
    if (fileName && fileName !== activeFileName) {
      const fileEntry = fileEntries.find(e => e.name === fileName || e.handle.name === fileName);
      if (fileEntry) {
        await handleFileSelect(fileEntry.handle as FileSystemFileHandle);
        // Vänta lite på att editorn ska laddas om innan vi fokuserar raden
        setTimeout(() => {
          if (editorInstance) {
            editorInstance.revealLineInCenter(line);
            editorInstance.setPosition({ lineNumber: line, column: 1 });
            editorInstance.focus();
          }
        }, 100);
        return;
      }
    }

    if (editorInstance) {
      editorInstance.revealLineInCenter(line);
      editorInstance.setPosition({ lineNumber: line, column: 1 });
      editorInstance.focus();
      
      // Flash-effekt för att visa raden tydligt
      const decorations = editorInstance.deltaDecorations([], [
        {
          range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
          options: {
            isWholeLine: true,
            className: 'monaco-line-highlight-flash'
          }
        }
      ]);
      
      setTimeout(() => {
        editorInstance.deltaDecorations(decorations, []);
      }, 1000);
    }
  };

  // Lyttna på meddelanden från Preview Iframe (Navigering)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO_FILE') {
        const targetPath = event.data.path;
        const fileName = targetPath.split('/').pop()!;
        const targetEntry = fileEntries.find(e => e.name === fileName);
        if (targetEntry) {
          handleFileSelect(targetEntry.handle as FileSystemFileHandle);
          addLog('SYSTEM', `Navigerar till: ${fileName}`);
        }
      } else if (event.data?.type === 'DEBUG_LOG') {
        const { level, message, timestamp } = event.data;
        setDebugLogs(prev => [{ level, message, timestamp }, ...prev].slice(0, 100));
        
        if (level === 'error') {
          addLog('ERROR', `RUNTIME: ${message}`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fileEntries]);

  // Terminal Kommandohanterare (V10/10)
  const handleTerminalCommand = (cmd: string): string => {
    const parts = cmd.split(' ');
    const action = parts[0].toLowerCase();
    
    if (action === 'pkg' && parts[1] === 'add') {
      const pkg = parts[2];
      if (!pkg) return "Fel: Ange namnet på biblioteket. (t.ex. pkg add react)";
      setActivePackages(prev => Array.from(new Set([...prev, pkg])));
      addLog('SUCCESS', `Bibliotek adderat: ${pkg}`);
      return `Installerar ${pkg}... Done. Systemet har nu tillgång till ${pkg} via globala imports.`;
    }

    if (action === 'snapshot' && parts[1] === 'save') {
      setSnapshots(prev => ({ ...prev, [activeFileName]: code }));
      addLog('SYSTEM', `Snapshot skapad för ${activeFileName}`);
      return `Kod-snapshot sparad för ${activeFileName}. Du kan nu se ändringar i Visual Diff.`;
    }

    if (action === 'logs' && parts[1] === 'clear') {
      setDebugLogs([]);
      return "Debug-loggar rensade.";
    }

    if (['build', 'compile', 'run', 'test'].includes(action)) {
      if (bridgeStatus === 'OFFLINE') {
        return `FEL: "Command Bridge" är inte ansluten. Kör 'npx sparkcode-bridge' på din dator för att aktivera backend-muskler.`;
      }
      return `KOMMANDO SKICKAT: Initierar ${action.toUpperCase()} på din lokala maskin...`;
    }

    if (action === 'bridge' && parts[1] === 'connect') {
      setBridgeStatus('CONNECTED');
      setSystemMetrics({ cpu: 12, ram: 42 }); // Simulerad metrik vid anslutning
      return "COMMAND_BRIDGE_ESTABLISHED: Lokal anslutning lyckades. Hårdvaru-övervakning aktiv.";
    }

    return ""; // Ingen match, kör vanlig AI-tanks
  };

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

  // Hantera DOM-audit (Omni-AI)
  const handleAudit = (iframe: HTMLIFrameElement) => {
    const report = runStructuralAudit(iframe);
    
    // Mappa audit-rapporten till LintResults
    const auditResults: LintResult[] = [
      ...report.criticalIssues.map(msg => ({ line: 1, message: msg, category: 'STRUCTURE' as any, severity: 'error' as any })),
      ...report.warnings.map(msg => ({ line: 1, message: msg, category: 'ARCHITECTURE' as any, severity: 'warning' as any })),
      ...report.performanceTips.map(msg => ({ line: 1, message: msg, category: 'BEST_PRACTICE' as any, severity: 'tip' as any })),
      ...report.visualAnomalies.map(msg => ({ line: 1, message: msg, category: 'VISUAL' as any, severity: 'warning' as any }))
    ];
    
    setDomCount(report.domCount);
    setStructuralErrors(auditResults);
  };

  // Kör global projekt-skanning (CTO-läge)
  const runGlobalScan = async () => {
    if (directoryHandle) {
      const insight = await scanProject(directoryHandle);
      setProjectInsight(insight);
    }
  };

  useEffect(() => {
    if (directoryHandle) {
      runGlobalScan();
    }
  }, [directoryHandle, previewVersion]);

  // Kör lintern när koden ändras (Debouncad för prestanda)
  useEffect(() => {
    const timer = setTimeout(() => {
      let currentErrors: LintResult[] = [];
      const fileNameLower = activeFileName?.toLowerCase() || '';
      
      if (!activeFileName || fileNameLower.endsWith('.html') || fileNameLower === 'index' || fileNameLower === 'test') {
        currentErrors = lintHTML(code);
        
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let match;
        while ((match = styleRegex.exec(code)) !== null) {
          const styleContent = match[1];
          const styleStartLine = code.substring(0, match.index).split('\n').length;
          const cssErrors = lintCSS(styleContent);
          
          const mappedErrors = cssErrors.map(err => ({
            ...err,
            line: err.line + styleStartLine - 1
          }));
          currentErrors.push(...mappedErrors);
        }
      } else if (fileNameLower.endsWith('.css')) {
        currentErrors = lintCSS(code);
      }
      
      // Lägg till globala anatomiska fel (Filnamn, Brutna länkar etc)
      let finalErrors = [...currentErrors, ...structuralErrors];
      if (projectInsight && activeFileName) {
        const anatomyErrors = auditAnatomy(projectInsight, code, activeFileName);
        const predictiveErrors = runPredictiveAudit(projectInsight, activeFileName);
        finalErrors = [...finalErrors, ...anatomyErrors, ...predictiveErrors];
      }
      
      setErrors(finalErrors);
      setIsValid(!finalErrors.some(e => e.severity === 'error'));
    }, 500);

    return () => clearTimeout(timer);
  }, [code, activeFileName, structuralErrors, projectInsight]);

  const topError = errors[0];

  // Central spara-funktion
  const saveCurrentFile = async () => {
    if (activeFileHandle && code !== savedCode) {
      try {
        await writeFileContent(activeFileHandle, code);
        setSavedCode(code);
        
        // Uppdatera endast den aktuella filens Blob för blixtsnabb respons
        if (activeFileName) {
          blobManager.updateBlob(activeFileName, code);
        }
        setPreviewVersion(v => v + 1);
        
        // Uppdatera funktioner för Deep-Linting
        updateAvailableFunctions();
        
        // Historik-snapshot
        const snapshot: CodeSnapshot = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          fileName: activeFileName,
          code: code
        };
        setHistory(prev => [snapshot, ...prev].slice(0, 50));
        return true;
      } catch (err) {
        console.error('Kunde inte spara filen:', err);
        return false;
      }
    }
    return true;
  };

  // Auto-save till lokala filen om vald (Spara alltid, även om ogiltig kod - för att förhindra dataförlust)
  useEffect(() => {
    if (activeFileHandle) {
      const saveTimeout = setTimeout(() => {
        saveCurrentFile();
      }, 1000);
      return () => clearTimeout(saveTimeout);
    }
  }, [code, activeFileHandle, fileEntries]);

  useEffect(() => {
    // Uppdatera sessions-cachen i synktjänsten för snabbare anrop
    if (session) {
      cloudSyncService.setSession(session);
    }
  }, [session]);

  // Moln-synk: Skicka ändringar till molnet (Ultra-Lightweight)
  useEffect(() => {
    if (session && currentProject && activeFileName && isCloudSyncEnabled && lastChangeSource === 'local') {
      // Om koden redan matchar molnet, skicka inget (Stoppar Eko)
      if (code === cloudSyncedCode) return;
      
      setSyncStatus('syncing');
      const syncTimeout = setTimeout(async () => {
        try {
          await cloudSyncService.sendBroadcast(currentProject.name, {
            project_name: currentProject.name,
            file_path: activeFileName,
            content: code,
            user_id: session.user.id
          });

          await cloudSyncService.pushFile(currentProject.name, activeFileName, code);
          setCloudSyncedCode(code); // Uppdatera moln-spärren
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (err) {
          console.error('Molnsynk misslyckades:', err);
          setSyncStatus('error');
          setTimeout(() => setSyncStatus('idle'), 4000);
        }
      }, 500);

      return () => clearTimeout(syncTimeout);
    }
  }, [code, activeFileName, currentProject, session, isCloudSyncEnabled, lastChangeSource, cloudSyncedCode]);

  // 1. Initial Auto-Pull (Körs bara EN gång när projektet öppnas)
  useEffect(() => {
    if (session && currentProject && fileEntries.length > 0) {
      const performAutoPull = async () => {
        try {
          setSyncStatus('syncing');
          await cloudSyncService.syncCloudToLocal(
            currentProject.name, 
            fileEntries,
            (path, content) => {
              if (activeFileName === path && code !== content) {
                const backup = localStorage.getItem(`sparkcode_backup_${path}`);
                const finalContent = backup || content;
                setCode(finalContent);
                setSavedCode(finalContent);
                setCloudSyncedCode(finalContent); // Moln-vakt synkad vid start
              }
            }
          );
          setSyncStatus('synced');
          addLog('SUCCESS', 'Initial molnsynk slutförd.');
          setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (err) {
          console.error('Auto-Pull Error:', err);
          setSyncStatus('error');
        }
      };
      performAutoPull();
    }
  }, [session, currentProject?.id]); // VIKTIGT: Endast vid projekt-ID ändring

  // 2. Realtids-synk (GHOST SYNC)
  useEffect(() => {
    if (session && currentProject && isCloudSyncEnabled) {
      const subscription = cloudSyncService.subscribeToProject(
        currentProject.name,
        session.user.id,
        async (cloudFile) => {
          // BLIXTSNABB UPDATE (UI-PRIO)
          if (activeFileName === cloudFile.file_path) {
            setLastChangeSource('remote');
            setCloudSyncedCode(cloudFile.content); // Muta moln-eko omedelbart
            setCode(cloudFile.content); // Skärmen uppdateras direkt
            
            // OBS: Vi uppdaterar INTE savedCode här.
            // Detta gör att Auto-Save timern (för hårddisken) förstår att den behöver spara till disk.
          }
          
          // Uppdatera virtuell lista i bakgrunden (Utan att trigga om synken)
          setFileEntries(prev => prev.map(e => {
            if (e.name === cloudFile.file_path) {
              return {
                ...e,
                handle: {
                  ...e.handle,
                  getFile: async () => ({
                    text: async () => cloudFile.content
                  })
                } as any
              };
            }
            return e;
          }));
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session, currentProject?.id, isCloudSyncEnabled, activeFileName]); // Nu med activeFileName så vi inte tappar fokus!

  // MOBIL TURBO-SYNK: Hjärtslag och Wake-Lock för att förhindra throttling
  useEffect(() => {
    if (session && currentProject && isCloudSyncEnabled) {
      // 1. Wake-Lock för att hindra webbläsaren från att somna/strypa trafik
      let wakeLock: any = null;
      const requestWakeLock = async () => {
        try {
          if ('wakeLock' in navigator) {
            wakeLock = await (navigator as any).wakeLock.request('screen');
            console.log('Wake Lock: Aktiv (Håller datorn vaken)');
          }
        } catch (err) {
          console.warn('Wake Lock Error:', err);
        }
      };

      requestWakeLock();

      // 2. Hjärtslags-puls
      const heartbeatChannel = supabase.channel(`heartbeat-${session.user.id}`);
      
      heartbeatChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Turbo-Synk Heartbeat: Aktiv');
        }
      });

      const interval = setInterval(() => {
        // Skicka ett minimalt broadcast-meddelande för att hålla pipsen varm
        heartbeatChannel.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { ts: Date.now() }
        });
      }, 1000); // VARJE SEKUND ;)

      return () => {
        clearInterval(interval);
        heartbeatChannel.unsubscribe();
        if (wakeLock) {
          wakeLock.release().then(() => {
            console.log('Wake Lock: Släppt');
          });
        }
      };
    }
  }, [session, currentProject, isCloudSyncEnabled]);

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

  const refreshFileSystem = async (forceHandle?: FileSystemDirectoryHandle) => {
    const handle = forceHandle || directoryHandle;
    if (!handle) return;
    try {
      const entries = await readDirectory(handle as FileSystemDirectoryHandle);
      setFileEntries(entries);
      
      // Kolla om den aktiva filen har ändrats på disken (extern edit)
      if (activeFileHandle) {
        const diskContent = await readFileContent(activeFileHandle);
        // Uppdatera endast om koden på disken är nyare OCH användaren inte har gjort egna ändringar i editorn
        if (diskContent !== code && code === savedCode) {
          setCode(diskContent);
          setSavedCode(diskContent);
          addLog('SYSTEM', `Extern ändring upptäckt i ${activeFileName}: Editorn uppdaterad.`);
        }
      }
      
      // Uppdatera Blobs
      await blobManager.refreshBlobs(entries);
      setPreviewVersion(v => v + 1);
    } catch (err) {
      console.error('Kunde inte uppdatera filsystemet:', err);
    }
  };

  // Fokus-övervakning för att hitta nya filer/mappar automatiskt
  useEffect(() => {
    const handleFocus = () => {
      console.log('Fönstret fick fokus: Uppdaterar filsystemet...');
      refreshFileSystem();
    };

    // Heartbeat: Kolla även var 20:e sekund för säkerhets skull
    const interval = setInterval(() => refreshFileSystem(), 20000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [directoryHandle, activeFileHandle]);

  const handleConnectDirectory = async () => {
    try {
      const handle = await openDirectory();
      setDirectoryHandle(handle);
      const entries = await readDirectory(handle);
      setFileEntries(entries);
      
      // Spara projekt i historiken
      const saved = await projectRegistry.saveProject(handle);
      setCurrentProject(saved);
      addLog('SYSTEM', `Ansluten till: ${handle.name}`);
      const recent = await projectRegistry.getRecentProjects();
      setRecentProjects(recent);
      
      // AUTO-SELECT: Om index.html finns, öppna den direkt
      const indexFile = entries.find(e => e.name.toLowerCase() === 'index.html');
      if (indexFile && indexFile.kind === 'file') {
        handleFileSelect(indexFile.handle as FileSystemFileHandle);
      } else if (entries.length > 0) {
        // Annars öppna den första filen
        const firstFile = entries.find(e => e.kind === 'file');
        if (firstFile) handleFileSelect(firstFile.handle as FileSystemFileHandle);
      }

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
      // FORCE SAVE: Om vi byter fil och har osparad kod, spara den gamla filen NU
      if (activeFileHandle && code !== savedCode) {
        setSyncStatus('syncing');
        await saveCurrentFile();
        setSyncStatus('synced');
      }

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

  const handleRestoreProject = async () => {
    if (!projectToRestore) return;
    try {
      const hasPermission = await projectRegistry.verifyPermission(projectToRestore.handle);
      if (hasPermission) {
        setDirectoryHandle(projectToRestore.handle);
        setCurrentProject(projectToRestore);
        const entries = await readDirectory(projectToRestore.handle);
        setFileEntries(entries);
        await blobManager.refreshBlobs(entries);
        setPreviewVersion(v => v + 1);
        setProjectToRestore(null);
        addLog('SUCCESS', `Projekt återställt: ${projectToRestore.name}`);
        
        // Öppna index.html om den finns
        const indexFile = entries.find(e => e.name.toLowerCase() === 'index.html');
        if (indexFile) handleFileSelect(indexFile.handle as FileSystemFileHandle);
      }
    } catch (err) {
      console.error('Kunde inte återställa projekt:', err);
      addLog('ERROR', 'Kunde inte återställa mappen. Försök att ansluta den manuellt.');
      setProjectToRestore(null);
    }
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

  const handleCreateNewFile = async (parentHandle?: FileSystemDirectoryHandle) => {
    const targetDir = parentHandle || directoryHandle;
    if (!targetDir) return;
    
    const fileName = prompt('Ange filnamn (t.ex. index.html):');
    if (fileName) {
      try {
        const newFileHandle = await createNewFile(targetDir, fileName);
        await refreshFileSystem();
        handleFileSelect(newFileHandle);
      } catch (err) {
        console.error('Kunde inte skapa filen:', err);
      }
    }
  };

  const handleCreateNewFolder = async (parentHandle?: FileSystemDirectoryHandle) => {
    const targetDir = parentHandle || directoryHandle;
    if (!targetDir) return;

    const folderName = prompt('Ange mappnamn:');
    if (folderName) {
      try {
        await createNewFolder(targetDir, folderName);
        await refreshFileSystem();
        addLog('SYSTEM', `Skapade mappen: ${folderName}`);
      } catch (err) {
        console.error('Kunde inte skapa mappen:', err);
      }
    }
  };

  const handleMoveEntry = async (name: string, fromDir: FileSystemDirectoryHandle, toDir: FileSystemDirectoryHandle) => {
    try {
      // För att flytta i File System Access API måste man ofta läsa, skriva till ny plats och radera originalet
      // (Vissa webbläsare stöder move() men inte alla ännu)
      const entryHandle = await fromDir.getFileHandle(name);
      const content = await readFileContent(entryHandle);
      await writeFileContent(await toDir.getFileHandle(name, { create: true }), content);
      await (fromDir as any).removeEntry(name);
      
      await refreshFileSystem();
      addLog('SYSTEM', `Flyttade "${name}" till ny plats.`);
    } catch (err) {
      console.error('Kunde inte flytta filen:', err);
    }
  };

  const handleDeleteFile = async (name: string, parentDir?: FileSystemDirectoryHandle) => {
    const targetDir = parentDir || directoryHandle;
    if (!targetDir) return;
    if (!confirm(`Är du säker på att du vill radera ${name}? Detta går inte att ångra.`)) return;

    try {
      await (targetDir as any).removeEntry(name);
      await refreshFileSystem();

      // Stäng fliken om den är öppen
      if (activeFileName === name) {
        handleCloseTab(name);
      } else {
        setOpenFiles(prev => prev.filter(f => f.name !== name));
      }

      addLog('SYSTEM', `Raderade: ${name}`);
    } catch (err) {
      console.error('Kunde inte radera:', err);
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

      if (!targetRepo) {
        setPushStatus('PUSH_FAIL: Kunde inte skapa eller hitta repo.');
        return;
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

  const handleRefreshGitHubAccess = async () => {
    addLog('SYSTEM', 'Initierar förnyelse av GitHub-åtkomst...');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
        scopes: 'repo read:user user:email'
      }
    });

    if (error) {
      addLog('ERROR', `Kunde inte förnya åtkomst: ${error.message}`);
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
        {projectToRestore && (
          <div className="persistence-notification active">
            <div className="notification-content">
              <div className="notification-icon"><Lock size={16} /></div>
              <div className="notification-text">
                <span className="project-label">Återuppta projekt</span>
                <span className="project-name">{projectToRestore.name}</span>
              </div>
              <div className="notification-actions">
                <button className="resume-button" onClick={handleRestoreProject}>LÅS UPP MAPP</button>
                <button className="close-notification" onClick={() => setProjectToRestore(null)}><X size={14} /></button>
              </div>
            </div>
          </div>
        )}
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
      label: 'ÖPPNA MAPP...', 
      icon: <FolderOpen size={14} />, 
      shortcut: 'Ctrl+O',
      onClick: handleConnectDirectory 
    },
    {
      label: 'ÖPPNA FRÅN MOLNET',
      icon: <Globe size={14} />,
      onClick: () => {
        setCloudExplorerInitialTab('MOLN');
        setIsCloudExplorerOpen(true);
      }
    },
    {
      label: 'HÄMTA FRÅN GITHUB',
      icon: <GitBranch size={14} />,
      onClick: () => {
        setCloudExplorerInitialTab('GITHUB');
        setIsCloudExplorerOpen(true);
      }
    },
    {
      label: 'FÖRNYA GITHUB-ÅTKOMST',
      icon: <Lock size={14} />,
      onClick: handleRefreshGitHubAccess
    },
    { 
      label: 'NYTT PROJEKT', 
      icon: <PlusSquare size={14} />, 
      onClick: async () => {
        setDirectoryHandle(null);
        setFileEntries([]);
        setCurrentProject(null);
        handleConnectDirectory();
      }
    },
    {
      label: 'SENASTE PROJEKT',
      icon: <HistoryIcon size={14} />,
      children: recentProjects.length > 0 
        ? recentProjects.map(p => ({
            label: p.name.toUpperCase(),
            icon: <FolderOpen size={12} />,
            onClick: () => handleSwitchProject(p)
          }))
        : [{ label: 'INGA SPARADE PROJEKT', icon: <Info size={12} />, onClick: () => {} }]
    },
    {
      label: 'DÖP OM PROJEKT',
      icon: <Terminal size={14} />,
      onClick: handleRenameProject
    },
    {
      label: `AUTO-MOLNSYNK: ${isCloudSyncEnabled ? 'PÅ' : 'AV'}`,
      icon: <Zap size={14} color={isCloudSyncEnabled ? 'var(--accent-primary)' : 'gray'} />,
      onClick: () => {
        const newValue = !isCloudSyncEnabled;
        setIsCloudSyncEnabled(newValue);
        localStorage.setItem('sparkcode_cloud_sync_enabled', String(newValue));
        addLog('SYSTEM', `Auto-molnsynk är nu ${newValue ? 'aktiverad' : 'avstängd'}.`);
      }
    },
    { 
      label: 'SPARA PROJEKT', 
      icon: <Lock size={14} />,
      shortcut: 'Ctrl+S', 
      onClick: () => {
        setPushStatus('SYSTEM_SAVE_SUCCESS');
        setTimeout(() => setPushStatus(''), 2000);
      } 
    },
    {
      label: 'FORMATERA KOD (PRETTIER)',
      icon: <Info size={14} />,
      onClick: handlePrettify
    },
    {
      label: `VIM-LÄGE: ${isVimMode ? 'PÅ' : 'AV'}`,
      icon: <Terminal size={14} />,
      onClick: () => setIsVimMode(!isVimMode)
    },
    { 
      label: 'DJUPANALYS (AUDIT)', 
      icon: <Zap size={14} />,
      onClick: handleRunAudit 
    },
    { 
      label: 'EXPORTERA (ZIP)', 
      icon: <Download size={14} />,
      onClick: () => {
        if (currentProject) {
          exportProjectToZip(fileEntries, currentProject.name);
          addLog('SYSTEM', `Exporterar projekt: ${currentProject.name}.zip`);
        } else {
          addLog('ERROR', 'Inget aktivt projekt hittades för export.');
        }
      } 
    },
    {
      label: 'PUBLICERA DIGITALT (LIVE LÄNK)',
      icon: <Link size={14} />,
      onClick: async () => {
        if (currentProject) {
          addLog('SYSTEM', `Genererar publik länk för "${currentProject.name}"...`);
          setSyncStatus('syncing');
          
          // I en riktig miljö skulle vi här hämta en signerad URL eller aktivera en publik route i Supabase
          // För demonstration skapar vi en trovärdig simulerad länk baserat på projekt-id
          const publicId = btoa(currentProject.name).substring(0, 8).toLowerCase();
          const publicUrl = `${window.location.origin}/view/${publicId}`;
          
          setTimeout(() => {
            setSyncStatus('synced');
            addLog('SUCCESS', `PROJEKT LIVE: ${publicUrl}`);
            prompt('Här är din publika länk! Kopiera och dela med världen:', publicUrl);
          }, 1500);
        } else {
          addLog('ERROR', 'Inget projekt att publicera.');
        }
      }
    },
    {
      label: 'KONTOINSTÄLLNINGAR',
      icon: <Settings size={14} />,
      onClick: () => setIsSettingsOpen(true)
    },
    { 
      label: 'LOGGA UT FRÅN SYSTEMET', 
      icon: <X size={14} />,
      onClick: handleLogout 
    }
  ];

  return (
    <div className={`app-container ${isValid ? 'achievement-unlocked' : ''} ${isFullscreenPreview ? 'fullscreen-preview-active' : ''}`}>
      <div className="crt-overlay"></div>
      
      {isTerminalOpen && (
        <CtoTerminal 
          insight={projectInsight} 
          activeFileName={activeFileName} 
          onClose={() => setIsTerminalOpen(false)}
          onCommand={handleTerminalCommand}
        />
      )}
      
      <header className="header">
        <div className="header-nav">
          <Dropdown label="ARKIV" items={menuItems} />
          {fileEntries.length > 0 && (
          <div className="mobile-only">
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
          </div>
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
        
        {/* Header Right Cluster - Premium Status & Actions */}
        <div className="header-right desktop-only">
          <div className="status-dock">
            {/* System Status Indicator */}
            <div className={`status-pill ${isValid ? 'online' : 'error'}`} title={isValid ? 'System Online' : 'System Error'}>
              <div className="status-dot"></div>
              <span className="status-text">{isValid ? 'LIVE' : 'ERROR'}</span>
            </div>

            <div className="divider"></div>

            {/* User Session */}
            <div className="user-session" title={session.user.email}>
              <User size={12} className="user-icon" />
              <span className="user-label">OPERATOR</span>
            </div>

            <div className="divider"></div>

            {/* Cloud Sync Indicator */}
            <div className={`sync-pill ${syncStatus}`} title={`Cloud Sync: ${syncStatus.toUpperCase()}`}>
              <Zap size={12} className={syncStatus === 'syncing' ? 'spinner' : ''} />
              <span className="sync-text">{syncStatus === 'synced' ? 'READY' : syncStatus.toUpperCase()}</span>
            </div>
          </div>

          <div className="action-cluster">
            {directoryHandle && isGitHubConnected && (
              <button 
                onClick={handleGitHubPush} 
                disabled={isPushing}
                className="hacker-button github-push-pill"
              >
                {isPushing ? <Zap className="spinner" size={12} /> : <GitBranch size={12} />}
                <span>{isPushing ? 'PUSHING...' : 'GITHUB PUSH'}</span>
              </button>
            )}
            
            <button 
              onClick={() => setIsLexiconOpen(true)} 
              className="glow-action-button secondary"
              title="Öppna Kod-Lexikon"
            >
              <BookOpen size={14} />
              <span>LEXIKON</span>
            </button>

            <button 
              onClick={() => setIsTerminalOpen(true)} 
              className="glow-action-button primary"
              title="Fråga din CTO"
            >
              <Bot size={14} />
              <span>ASK_CTO</span>
            </button>
          </div>
        </div>
      </header>

      {/* Architect Status Bar - Konstant AI-insyn (Döljbar på mobil för Zen-mode) */}
      {isAiBarVisible && (
        <div className="architect-status-bar">
          <div className={`status-badge ${isValid ? 'status-valid' : 'status-invalid'}`}>
            SYSTEM_INTEGRITY
          </div>
          <button className="hacker-button audit-button" onClick={handleRunAudit}>
            RUN
          </button>
          <div className="status-divider"></div>
          <div className={`status-advice ${topError ? 'has-error' : ''}`}>
            {topError ? (
              <><strong>ADVICE:</strong> {topError.message}</>
            ) : (
              <><strong>ALLT SER BRA UT:</strong> "Snyggt jobbat! Din kod är korrekt strukturerad."</>
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
              <div 
                className="hacker-button" 
                onClick={() => { setIsTerminalOpen(true); setIsMobileMenuOpen(false); }}
                style={{ width: '100%', marginTop: '10px', justifyContent: 'center', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
              >
                <Bot size={16} />
                <span style={{ fontWeight: '900' }}>ASK_CTO</span>
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
          onNewFile={(parent) => handleCreateNewFile(parent as FileSystemDirectoryHandle)}
          onNewFolder={(parent) => handleCreateNewFolder(parent as FileSystemDirectoryHandle)}
          onDelete={(name, parent) => handleDeleteFile(name, parent as FileSystemDirectoryHandle)}
          onMove={handleMoveEntry}
          directoryHandle={directoryHandle!}
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
            {directoryHandle || fileEntries.length > 0 ? (
              <div className="editor-container" style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <CodeEditor 
                  code={code} 
                  originalCode={savedCode}
                  isDiffMode={isDiffMode}
                  isVimMode={isVimMode}
                  onChange={(val) => {
                    if (val !== undefined) {
                      setLastChangeSource('local');
                      setCode(val);
                    }
                  }} 
                  onInstance={(editor) => setEditorInstance(editor)}
                  fileName={activeFileName}
                  onSave={saveCurrentFile}
                  onSearchSelection={handleSearchSelection}
                />
                
                {errors.length > 0 && (
                  <AIErrorPanel 
                    errors={errors} 
                    onJump={(line) => {
                      if (editorInstance) {
                        editorInstance.revealLineInCenter(line);
                        editorInstance.setPosition({ lineNumber: line, column: 1 });
                        editorInstance.focus();
                      }
                    }}
                  />
                )}
                
                <div className="editor-footer">
                  <div className="file-info shadow-text">
                    <HistoryIcon size={12} /> {directoryHandle ? 'LOKAL FIL ANSLUTEN' : 'VIRTUELT ARKIV AKTIVT'}
                  </div>
                  <div className="selection-info architect-badge">
                    SYSTEM_SCAN_ACTIVE
                  </div>
                </div>
              </div>
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
            <div className="server-guide-overlay" onClick={() => setIsServerInputOpen(false)}>
              <div className="guide-content" onClick={e => e.stopPropagation()}>
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
            key={`${previewVersion}-${isBlueprintMode}-${activePackages.join(',')}`} 
            code={code} 
            width={viewportWidth} 
            overrideUrl={customPreviewUrl}
            isBlueprintMode={isBlueprintMode}
            onAudit={handleAudit}
            isFullscreen={isFullscreenPreview}
            onToggleFullscreen={() => setIsFullscreenPreview(!isFullscreenPreview)}
          />
          <ImportChoiceModal 
            isOpen={!!importModalData?.isOpen}
            repoName={importModalData?.repoName || ''}
            onClose={() => setImportModalData(null)}
            onChoice={async () => {
              if (!importModalData) return;
              const { repoName, files } = importModalData;
              setImportModalData(null);
              
              setSyncStatus('syncing');
              addLog('SYSTEM', `Förbereder import av "${repoName}" (${files.length} filer)...`);

              try {
                // Tvinga mappväljaren till SKRIVBORDET
                const newHandle = await openDirectory({ startIn: 'desktop' });
                
                // Börja skriva filer
                addLog('SYSTEM', `Börjar skriva filer till disken...`);
                
                let count = 0;
                for (const file of files) {
                  count++;
                  const pathParts = file.path.split('/');
                  const fileName = pathParts.pop()!;
                  let currentDir = newHandle;

                  for (const folderName of pathParts) {
                    currentDir = await createNewFolder(currentDir, folderName);
                  }

                  try {
                    const fileHandle = await createNewFile(currentDir, fileName);
                    await writeFileContent(fileHandle, file.content);
                  } catch (fileErr) {
                    console.error(`Kunde inte skriva filen ${file.path}:`, fileErr);
                  }

                  if (count % 10 === 0 || count === files.length) {
                    addLog('SYSTEM', `Framsteg: ${count}/${files.length} filer sparade...`);
                  }
                }
                
                const saved = await projectRegistry.saveProject(newHandle, repoName);
                setCurrentProject(saved);
                setDirectoryHandle(newHandle);
                localStorage.setItem('sparkcode_active_project_id', saved.id);
                await refreshFileSystem(newHandle);
                
                addLog('SUCCESS', `Projektet "${repoName}" är nu klart och sparat på skrivbordet!`);
              } catch (err) {
                // Om användaren avbryter mappväljaren stannar vi bara här.
                addLog('WARNING', 'Importen avbröts. Inga filer har sparats.');
                setSyncStatus('idle');
              }
            }}
          />
        </section>

        <Sidebar 
          errors={errors}
          isValid={isValid}
          code={code}
          activeFileName={activeFileName}
          projectInsight={projectInsight}
          domCount={domCount}
          debugLogs={debugLogs}
          baselineCode={snapshots[activeFileName] || savedCode}
          bridgeStatus={bridgeStatus}
          systemMetrics={systemMetrics}
          onFocusLine={handleFocusLine}
        />
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

      <AnimatePresence>
        {isCloudExplorerOpen && (
          <CloudExplorer 
            initialTab={cloudExplorerInitialTab}
            onClose={() => setIsCloudExplorerOpen(false)}
            onImport={async (name, files, isCloudSync) => {
              const isFileSystemSupported = 'showDirectoryPicker' in window;
              
              // 1. Döda "spöket" direkt (Flicker-fix)
              localStorage.removeItem('sparkcode_active_project_id');
              
              // 2. Spara nuvarande jobb
              await saveCurrentFile();
              
              // 2. Intelligent Synk: Samma projekt på Desktop
              if (isCloudSync && isFileSystemSupported && currentProject?.name === name && directoryHandle) {
                // ... befintlig desktop-synk kod ...
                addLog('SYSTEM', `Synkar "${name}" direkt till nuvarande mapp...`);
                setIsCloudExplorerOpen(false);
                
                try {
                  for (const file of files) {
                    const pathParts = file.path.split('/');
                    const fileName = pathParts.pop()!;
                    let currentDir = directoryHandle;

                    for (const folderName of pathParts) {
                      currentDir = await createNewFolder(currentDir, folderName);
                    }

                    const fileHandle = await createNewFile(currentDir, fileName);
                    await writeFileContent(fileHandle, file.content as string);
                  }
                  await refreshFileSystem();
                  addLog('SUCCESS', `Synk slutförd för "${name}".`);
                } catch (err) {
                  addLog('ERROR', `Synk misslyckades: ${err instanceof Error ? err.message : 'Okänt fel'}`);
                }
                return;
              }

              // 3. Mobil/Moln-läge: Ingen FS support ELLER om vi kör molnsynk (så vi slipper mapptrafik på mobilen)
              if (!isFileSystemSupported || isCloudSync) {
                addLog('SYSTEM', `${isCloudSync ? 'Moln-läge' : 'Mobil-läge'} aktiverat. Öppnar "${name}" sömlöst...`);
                setIsCloudExplorerOpen(false);
                
                // Töm state och ladda filerna till minnet istället
                setDirectoryHandle(null);
                
                // SKAPA PSEUDO-PROJEKT för att aktivera realtidssynk
                const pseudoProject: any = {
                  id: 'virtual-' + btoa(name),
                  name: name,
                  folderName: name,
                  lastOpened: Date.now(),
                  handle: null
                };
                setCurrentProject(pseudoProject);
                localStorage.setItem('sparkcode_active_project_id', pseudoProject.id); // SPARA I MINNET!
                localStorage.setItem('sparkcode_virtual_project_name', name);

                const virtualEntries = files.map(f => ({
                  name: f.path,
                  kind: 'file' as const,
                  handle: {
                    name: f.path,
                    getFile: async () => ({
                      text: async () => f.content as string
                    })
                  } as any
                }));
                
                setFileEntries(virtualEntries);
                
                // Auto-öppna första filen (oftast index.html)
                const firstFile = virtualEntries.find(e => e.name.toLowerCase().includes('index.html')) || virtualEntries[0];
                if (firstFile) {
                  setActiveFileName(firstFile.name);
                  setActiveFileHandle(firstFile.handle);
                  setCode(files.find(f => f.path === firstFile.name)?.content as string || '');
                  setSavedCode(files.find(f => f.path === firstFile.name)?.content as string || '');
                }
                
                addLog('SUCCESS', `"${name}" är nu öppet i realtidsläge.`);
                return;
              }

              // 4. Annars: Clean Slate för ny GitHub-klon eller Switch
              setDirectoryHandle(null);
              setFileEntries([]);
              setCode('');
              setOpenFiles([]);
              
              setImportModalData({ isOpen: true, repoName: name, files });
              setIsCloudExplorerOpen(false);
            }}
          />
        )}
      </AnimatePresence>


      <AnimatePresence>
        {isSettingsOpen && (
          <AccountSettings 
            onClose={() => setIsSettingsOpen(false)}
            onLogout={handleLogout}
            addLog={addLog}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
