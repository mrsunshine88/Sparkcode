import JSZip from 'jszip';
import type { FileEntry } from '../lib/fileSystem';
import { readFileContent } from '../lib/fileSystem';

/**
 * Exporterar ett projekt till en ZIP-fil genom att rekursivt lägga till filer.
 */
export const exportProjectToZip = async (fileEntries: FileEntry[], projectName: string) => {
  const zip = new JSZip();
  const folder = zip.folder(projectName) || zip;

  const addEntriesToZip = async (entries: FileEntry[], currentFolder: JSZip) => {
    for (const entry of entries) {
      if (entry.kind === 'file') {
        const content = await readFileContent(entry.handle as FileSystemFileHandle);
        currentFolder.file(entry.name, content);
      } else if (entry.kind === 'directory' && entry.children) {
        const subFolder = currentFolder.folder(entry.name);
        if (subFolder) {
          await addEntriesToZip(entry.children, subFolder);
        }
      }
    }
  };

  await addEntriesToZip(fileEntries, folder);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}_export_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
