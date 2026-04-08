import React, { useState } from 'react';
import { Folder, File, FileCode, Plus, ChevronRight, ChevronDown, Trash2, FolderPlus, FilePlus, Image as ImageIcon } from 'lucide-react';
import type { FileEntry } from '../lib/fileSystem';

interface FileExplorerProps {
  entries: FileEntry[];
  onFileSelect: (handle: FileSystemFileHandle) => void;
  onNewFile: (parent?: FileSystemHandle) => void;
  onNewFolder: (parent?: FileSystemHandle) => void;
  onDelete: (name: string, parent?: FileSystemHandle) => void;
  onMove: (name: string, from: FileSystemDirectoryHandle, to: FileSystemDirectoryHandle) => void;
  directoryHandle: FileSystemDirectoryHandle;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  entries, 
  onFileSelect, 
  onNewFile, 
  onNewFolder, 
  onDelete, 
  onMove,
  directoryHandle 
}) => {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  return (
    <div className="file-explorer">
      <div className="explorer-header" style={{ position: 'relative' }}>
        <span>EXPLORER</span>
        <div className="explorer-actions">
          <button 
            className="icon-button" 
            onClick={() => setShowCreateMenu(!showCreateMenu)} 
            title="Skapa..."
          >
            <Plus size={14} />
          </button>
          
          {showCreateMenu && (
            <div className="create-dropdown" style={{ 
              position: 'absolute', 
              top: '100%', 
              right: 0, 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              zIndex: 100,
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              minWidth: '150px'
            }}>
              <button 
                onClick={() => { onNewFile(); setShowCreateMenu(false); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'white', 
                  fontSize: '10px', 
                  textAlign: 'left',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <FilePlus size={12} color="var(--accent-primary)" /> NYTT DOKUMENT
              </button>
              <button 
                onClick={() => { onNewFolder(); setShowCreateMenu(false); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'white', 
                  fontSize: '10px', 
                  textAlign: 'left',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <FolderPlus size={12} color="var(--accent-secondary)" /> NY MAPP
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="explorer-content">
        {entries.map((entry) => (
          <FileNode 
            key={entry.name} 
            entry={entry} 
            onFileSelect={onFileSelect} 
            onDelete={(name) => onDelete(name, directoryHandle)}
            onNewFile={onNewFile}
            onNewFolder={onNewFolder}
            onMove={onMove}
            parentHandle={directoryHandle}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
};

interface FileNodeProps {
  entry: FileEntry;
  onFileSelect: (handle: FileSystemFileHandle) => void;
  onDelete: (name: string, parent?: FileSystemHandle) => void;
  onNewFile: (parent?: FileSystemHandle) => void;
  onNewFolder: (parent?: FileSystemHandle) => void;
  onMove: (name: string, from: FileSystemDirectoryHandle, to: FileSystemDirectoryHandle) => void;
  parentHandle: FileSystemDirectoryHandle;
  depth?: number;
}

const FileNode: React.FC<FileNodeProps> = ({ 
  entry, 
  onFileSelect, 
  onDelete, 
  onNewFile, 
  onNewFolder,
  onMove,
  parentHandle,
  depth = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const handleClick = () => {
    if (entry.kind === 'directory') {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(entry.handle as FileSystemFileHandle);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(entry.name, parentHandle);
  };

  const handleAddFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNewFile(entry.handle);
    setIsExpanded(true);
  };

  const handleAddFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNewFolder(entry.handle);
    setIsExpanded(true);
  };

  // Drag & Drop Handlers
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('fileName', entry.name);
  };

  const onDragOver = (e: React.DragEvent) => {
    if (entry.kind === 'directory') {
      e.preventDefault();
      setIsOver(true);
    }
  };

  const onDragLeave = () => {
    setIsOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const fileName = e.dataTransfer.getData('fileName');
    if (fileName && fileName !== entry.name) {
      onMove(fileName, parentHandle, entry.handle as FileSystemDirectoryHandle);
    }
  };

  const getIcon = () => {
    if (entry.kind === 'directory') {
      return isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />;
    }
    if (entry.name.endsWith('.html')) return <FileCode size={14} color="#e34c26" />;
    if (entry.name.endsWith('.css')) return <FileCode size={14} color="#264de4" />;
    if (entry.name.endsWith('.js')) return <FileCode size={14} color="#f7df1e" />;
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
    if (imageExtensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
      return <ImageIcon size={14} color="var(--accent-secondary)" />;
    }
    return <File size={14} />;
  };

  return (
    <div className="tree-node-container">
      <div 
        className={`tree-node ${entry.kind} ${isOver ? 'drag-over' : ''}`}
        style={{ 
          paddingLeft: `${depth * 12 + 8}px`,
          border: isOver ? '1px dashed var(--accent-primary)' : 'none'
        }}
        onClick={handleClick}
        draggable={entry.kind === 'file'}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className="node-icon">{getIcon()}</span>
        {entry.kind === 'directory' && <Folder size={14} className="folder-icon" />}
        <span className="node-name">{entry.name}</span>
        
        <div className="node-actions">
          {entry.kind === 'directory' && (
            <>
              <button className="node-action-btn" onClick={handleAddFile} title="Ny fil här">
                <FilePlus size={12} />
              </button>
              <button className="node-action-btn" onClick={handleAddFolder} title="Ny mapp här">
                <FolderPlus size={12} />
              </button>
            </>
          )}
          <button className="node-action-btn delete" onClick={handleDelete} title="Radera">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      {entry.kind === 'directory' && isExpanded && entry.children && (
        <div className="node-children">
          {entry.children.map((child) => (
            <FileNode 
              key={child.name} 
              entry={child} 
              onFileSelect={onFileSelect} 
              onDelete={onDelete}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
              onMove={onMove}
              parentHandle={entry.handle as FileSystemDirectoryHandle}
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
