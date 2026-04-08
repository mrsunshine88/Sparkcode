import { supabase } from '../lib/supabase';
import { writeFileContent } from '../lib/fileSystem';

export interface CloudFile {
  id: string;
  user_id: string;
  project_name: string;
  file_path: string;
  content: string;
  updated_at: string;
}

export const cloudSyncService = {
  /**
   * Pushar en fil till molnet (Supabase).
   * Använder upsert för att skriva över existerande rader för samma fil.
   */
  async pushFile(projectName: string, filePath: string, content: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('file_sync')
      .upsert({
        user_id: session.user.id,
        project_name: projectName,
        file_path: filePath,
        content: content,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,project_name,file_path'
      })
      .select()
      .single();

    if (error) {
      console.error('CloudSync Push Error:', error);
      throw error;
    }
    return data;
  },

  /**
   * Hämtar alla filer för ett specifikt projekt från molnet.
   */
  async fetchProjectFiles(projectName: string): Promise<CloudFile[]> {
    const { data, error } = await supabase
      .from('file_sync')
      .select('*')
      .eq('project_name', projectName);

    if (error) {
      console.error('CloudSync Fetch Error:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Automatiskt synkroniserar moln-filer till den lokala mappen på datorn.
   * Går igenom alla filer i molnet och skriver ner dem lokalt.
   */
  async syncCloudToLocal(projectName: string, fileEntries: any[], onFileUpdated: (path: string, content: string) => void, singleFile?: CloudFile) {
    const cloudFiles = singleFile ? [singleFile] : await this.fetchProjectFiles(projectName);
    if (!cloudFiles.length) return;

    for (const cloudFile of cloudFiles) {
      // Hitta motsvarande lokal fil
      const findEntry = (entries: any[], pathParts: string[]): any => {
        const currentPart = pathParts[0];
        const entry = entries.find(e => e.name === currentPart);
        if (!entry) return null;
        if (pathParts.length === 1) return entry;
        return findEntry(entry.children || [], pathParts.slice(1));
      };

      const localEntry = findEntry(fileEntries, cloudFile.file_path.split('/'));
      
      if (localEntry && localEntry.kind === 'file') {
        // Skriv ner moln-innehållet till datorns hårddisk
        console.log(`Auto-syncing ${cloudFile.file_path} from cloud to local...`);
        await writeFileContent(localEntry.handle as FileSystemFileHandle, cloudFile.content);
        onFileUpdated(cloudFile.file_path, cloudFile.content);
      }
    }
  },

  /**
   * Prenumererar på realtidsändringar för ett projekt.
   */
  subscribeToProject(projectName: string, userId: string, onUpdate: (file: CloudFile) => void) {
    return supabase
      .channel(`project-sync-${projectName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'file_sync',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const file = payload.new as CloudFile;
          if (file && file.project_name === projectName) {
            onUpdate(file);
          }
        }
      )
      .subscribe();
  },

  /**
   * Hämtar en lista på alla projekt som användaren har i molnet.
   */
  async listProjects() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
      .from('file_sync')
      .select('project_name, updated_at')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('CloudSync List Error:', error);
      return [];
    }

    // Unifiera till unika projektnamn med senaste datumet
    const projectsMap = new Map<string, string>();
    data.forEach(item => {
      if (!projectsMap.has(item.project_name) || new Date(item.updated_at) > new Date(projectsMap.get(item.project_name)!)) {
        projectsMap.set(item.project_name, item.updated_at);
      }
    });

    return Array.from(projectsMap.entries()).map(([name, date]) => ({
      name,
      updated_at: date
    }));
  }
};
