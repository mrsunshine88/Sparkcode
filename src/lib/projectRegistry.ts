/**
 * ProjectRegistry handles persistence of FileSystemDirectoryHandles in IndexedDB.
 * This allows SparkCode to remember projects across sessions.
 */

export interface ProjectMetadata {
  id: string;
  name: string;
  folderName: string;
  lastOpened: number;
  handle: FileSystemDirectoryHandle;
}

const DB_NAME = 'SparkCodeDB';
const STORE_NAME = 'projects';
const DB_VERSION = 1;

class ProjectRegistry {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveProject(handle: FileSystemDirectoryHandle, customName?: string): Promise<ProjectMetadata> {
    if (!this.db) await this.init();

    const id = btoa(handle.name); // Simple ID based on name for now
    const project: ProjectMetadata = {
      id,
      name: customName || handle.name,
      folderName: handle.name,
      lastOpened: Date.now(),
      handle: handle
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(project);

      request.onsuccess = () => resolve(project);
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentProjects(): Promise<ProjectMetadata[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as ProjectMetadata[];
        resolve(results.sort((a, b) => b.lastOpened - a.lastOpened).slice(0, 10));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
    // Check if we already have permission
    const options = { mode: 'readwrite' };
    if ((await (handle as any).queryPermission(options)) === 'granted') {
      return true;
    }
    // Request permission (must be triggered by a user gesture)
    if ((await (handle as any).requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  }
}

export const projectRegistry = new ProjectRegistry();
