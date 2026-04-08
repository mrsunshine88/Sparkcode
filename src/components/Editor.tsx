import React, { useRef, useEffect } from 'react';
import Editor, { DiffEditor, loader } from '@monaco-editor/react';
import { initVimMode } from 'monaco-vim';

// Konfigurera Monaco att använda Hacker-färger
loader.init().then((monaco) => {
  monaco.editor.defineTheme('hacker-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008822', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff9d00' },
      { token: 'string', foreground: '00ff41' },
      { token: 'delimiter', foreground: '00ff41' },
      { token: 'tag', foreground: 'ff9d00', fontStyle: 'bold' },
      { token: 'attribute.name', foreground: '38bdf8' },
      { token: 'attribute.value', foreground: '00ff41' },
    ],
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#00ff41',
      'editorCursor.foreground': '#00ff41',
      'editor.lineHighlightBackground': '#111111',
      'editorLineNumber.foreground': '#004411',
      'editorLineNumber.activeForeground': '#00ff41',
      'editor.selectionBackground': '#004411',
      'diffEditor.insertedTextBackground': '#00ff4122',
      'diffEditor.removedTextBackground': '#ff333322',
    },
  });
});

interface CodeEditorProps {
  code: string;
  originalCode?: string;
  isDiffMode?: boolean;
  isVimMode?: boolean;
  onChange: (value: string | undefined) => void;
  language?: string;
  options?: any;
  fileName?: string;
  onSave?: () => void;
  onSearchSelection?: () => void;
  onInstance?: (editor: any) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  originalCode = '', 
  isDiffMode = false, 
  isVimMode = false,
  onChange, 
  language = 'html', 
  options = {},
  fileName,
  onSave,
  onSearchSelection,
  onInstance
}) => {
  const vimModeRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  // Mappa filändelser till Monaco-språk
  const getLanguage = (lang: string) => {
    if (lang === 'astro') return 'html';
    return lang;
  };

  useEffect(() => {
    if (isVimMode && editorRef.current && !vimModeRef.current) {
      // Aktivera Vim-läge
      const statusNode = document.getElementById('vim-status');
      vimModeRef.current = initVimMode(editorRef.current, statusNode);
    } else if (!isVimMode && vimModeRef.current) {
      // Inaktivera Vim-läge
      vimModeRef.current.dispose();
      vimModeRef.current = null;
    }
  }, [isVimMode]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    if (onInstance) onInstance(editor);
  };

  const commonOptions = {
    minimap: { enabled: false },
    fontSize: 16,
    fontFamily: "'JetBrains Mono', monospace",
    wordWrap: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    padding: { top: 16 },
    renderSideBySide: true,
    ...options
  };

  return (
    <div style={{ flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>
      {isDiffMode ? (
        <DiffEditor
          height="100%"
          language={getLanguage(language)}
          theme="hacker-theme"
          original={originalCode}
          modified={code}
          onMount={handleEditorDidMount}
          options={commonOptions}
        />
      ) : (
        <Editor
          height="100%"
          language={getLanguage(language)}
          theme="hacker-theme"
          value={code}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={commonOptions}
        />
      )}
      
      {isVimMode && (
        <div 
          id="vim-status" 
          style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            background: 'var(--accent-primary)', 
            color: 'black', 
            fontSize: '10px', 
            padding: '2px 8px',
            zIndex: 10,
            fontWeight: 'bold'
          }}
        />
      )}
    </div>
  );
};

export default CodeEditor;
