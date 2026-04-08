import React, { useState } from 'react';
import { Folder, File, FileCode, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import type { FileEntry } from '../lib/fileSystem';

interface FileExplorerProps {
  entries: FileEntry[];
  onFileSelect: (handle: FileSystemFileHandle) => void;
  onNewFile: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ entries, onFileSelect, onNewFile }) => {
  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <span>EXPLORER</span>
        <button className="icon-button" onClick={onNewFile} title="New File">
          <Plus size={14} />
        </button>
      </div>
      <div className="explorer-content">
        {entries.map((entry) => (
          <FileNode key={entry.name} entry={entry} onFileSelect={onFileSelect} />
        ))}
      </div>
    </div>
  );
};

interface FileNodeProps {
  entry: FileEntry;
  onFileSelect: (handle: FileSystemFileHandle) => void;
  depth?: number;
}

const FileNode: React.FC<FileNodeProps> = ({ entry, onFileSelect, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (entry.kind === 'directory') {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(entry.handle as FileSystemFileHandle);
    }
  };

  const getIcon = () => {
    if (entry.kind === 'directory') {
      return isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />;
    }
    if (entry.name.endsWith('.html')) return <FileCode size={14} color="#e34c26" />;
    if (entry.name.endsWith('.css')) return <FileCode size={14} color="#264de4" />;
    if (entry.name.endsWith('.js')) return <FileCode size={14} color="#f7df1e" />;
    return <File size={14} />;
  };

  return (
    <div className="tree-node-container">
      <div 
        className={`tree-node ${entry.kind}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        <span className="node-icon">{getIcon()}</span>
        {entry.kind === 'directory' && <Folder size={14} className="folder-icon" />}
        <span className="node-name">{entry.name}</span>
      </div>
      
      {entry.kind === 'directory' && isExpanded && entry.children && (
        <div className="node-children">
          {entry.children.map((child) => (
            <FileNode 
              key={child.name} 
              entry={child} 
              onFileSelect={onFileSelect} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
