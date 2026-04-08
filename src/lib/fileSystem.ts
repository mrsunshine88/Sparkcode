/**
 * Utility för att hantera File System Access API.
 */

export interface FileEntry {
  name: string;
  kind: 'file' | 'directory';
  handle: FileSystemHandle;
  children?: FileEntry[];
}

/**
 * Öppnar en mappväljare och returnerar en DirectoryHandle.
 */
export const openDirectory = async (): Promise<FileSystemDirectoryHandle> => {
  return await (window as any).showDirectoryPicker();
};

/**
 * Läser rekursivt innehållet i en mapp.
 */
export const readDirectory = async (directoryHandle: FileSystemDirectoryHandle): Promise<FileEntry[]> => {
  const entries: FileEntry[] = [];
  
  for await (const entry of (directoryHandle as any).values()) {
    const fileEntry: FileEntry = {
      name: entry.name,
      kind: entry.kind,
      handle: entry,
    };

    if (entry.kind === 'directory') {
      fileEntry.children = await readDirectory(entry);
    }

    entries.push(fileEntry);
  }

  // Sortera: Mappar först, sen filer i bokstavsordning
  return entries.sort((a, b) => {
    if (a.kind === b.kind) return a.name.localeCompare(b.name);
    return a.kind === 'directory' ? -1 : 1;
  });
};

/**
 * Läser innehållet i en fil.
 */
export const readFileContent = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  const file = await fileHandle.getFile();
  return await file.text();
};

/**
 * Sparar innehåll till en fil.
 */
export const writeFileContent = async (fileHandle: FileSystemFileHandle, content: string | Blob): Promise<void> => {
  const writable = await (fileHandle as any).createWritable();
  await writable.write(content);
  await writable.close();
};

/**
 * Skapar en ny fil i en specifik mapp.
 */
export const createNewFile = async (directoryHandle: FileSystemDirectoryHandle, fileName: string): Promise<FileSystemFileHandle> => {
  return await directoryHandle.getFileHandle(fileName, { create: true });
};

/**
 * Skapar en ny mapp i en specifik mapp.
 */
export const createNewFolder = async (directoryHandle: FileSystemDirectoryHandle, folderName: string): Promise<FileSystemDirectoryHandle> => {
  return await directoryHandle.getDirectoryHandle(folderName, { create: true });
};
