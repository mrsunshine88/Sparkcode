import { Octokit } from 'octokit';
import { supabase } from './supabase';

export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
}

export interface GitHubFile {
  path: string;
  content: string | Blob;
  isBinary: boolean;
}

export class GitHubService {
  private octokit: Octokit | null = null;

  async init(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;

    if (!token) {
      console.warn('Ingen GitHub provider_token hittades. Är du inloggad med GitHub?');
      return false;
    }

    this.octokit = new Octokit({ auth: token });
    return true;
  }

  async listRepos(): Promise<GitHubRepo[]> {
    if (!this.octokit) await this.init();
    if (!this.octokit) return [];

    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    return data.map(repo => ({
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
    }));
  }

  async fetchRepoContents(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    if (!this.octokit) await this.init();
    if (!this.octokit) throw new Error('GitHub not initialized');

    const { data } = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    const files: GitHubFile[] = [];

    if (Array.isArray(data)) {
      // Separera filer och mappar
      const fileItems = data.filter(item => item.type === 'file');
      const dirItems = data.filter(item => item.type === 'dir');

      // Parallell hämtning av filer i denna mapp (Batchad för stabilitet)
      const BATCH_SIZE = 5;
      for (let i = 0; i < fileItems.length; i += BATCH_SIZE) {
        const batch = fileItems.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(item => this.fetchFile(item.url, item.name, (item as any).download_url))
        );
        files.push(...batchResults.filter((f): f is GitHubFile => f !== null));
      }

      // Rekursiv hämtning av undermappar
      for (const dir of dirItems) {
        const subFiles = await this.fetchRepoContents(owner, repo, dir.path);
        files.push(...subFiles);
      }
    }

    return files;
  }

  private async fetchFile(url: string, fileName: string, downloadUrl?: string): Promise<GitHubFile | null> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    
    try {
      const response = await this.octokit.request(`GET ${url}`);
      let b64Content = response.data.content?.replace(/\s/g, '') || '';
      
      // FALLBACK: Om filen är över 1MB returneras inget content via API:et. 
      // Då försöker vi ladda ner den direkt via download_url.
      if (!b64Content) {
        if (!downloadUrl) {
          console.warn(`Inget innehåll i: ${fileName} och ingen download_url hittades. Hoppar över.`);
          return null;
        }

        console.log(`Hämtar stor fil (>1MB) via direktlänk: ${fileName}...`);
        
        try {
          const dlResp = await fetch(downloadUrl);
          if (!dlResp.ok) {
            console.warn(`Kunde inte hämta ${fileName} via direktlänk (Status: ${dlResp.status}). Hoppar över.`);
            return null;
          }
          
          const buffer = await dlResp.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          
          const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.svg', '.webp', '.apk'];
          const isBinary = binaryExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

          if (isBinary) {
            return {
              path: response.data.path,
              content: new Blob([bytes], { type: this.getMimeType(fileName) }),
              isBinary: true
            };
          } else {
            const text = new TextDecoder('utf-8').decode(bytes);
            return {
              path: response.data.path,
              content: text,
              isBinary: false
            };
          }
        } catch (fetchErr) {
          console.warn(`Nätverksfel vid hämtning av ${fileName}:`, fetchErr);
          return null;
        }
      }

      // Kolla om det är en bild/binär fil baserat på filändelsen
      const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.svg', '.webp', '.apk'];
      const isBinary = binaryExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

      if (isBinary) {
        // Hantera som binär Blob
        const binaryString = atob(b64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const mimeType = this.getMimeType(fileName);
        return {
          path: response.data.path,
          content: new Blob([bytes], { type: mimeType }),
          isBinary: true
        };
      } else {
        // Hantera som UTF-8 text (Robust metod med TextDecoder som fixar URI-fel)
        try {
          const binaryString = atob(b64Content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const text = new TextDecoder('utf-8').decode(bytes);
          return {
            path: response.data.path,
            content: text,
            isBinary: false
          };
        } catch (err) {
          console.warn(`TextDecoder misslyckades för ${fileName}, returnerar rå-sträng.`, err);
          return {
            path: response.data.path,
            content: atob(b64Content),
            isBinary: false
          };
        }
      }
    } catch (err) {
      console.error(`Fel vid hämtning av ${fileName}:`, err);
      return null;
    }
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'svg': return 'image/svg+xml';
      case 'webp': return 'image/webp';
      default: return 'application/octet-stream';
    }
  }

  async uploadFile(owner: string, repo: string, path: string, content: string, message: string): Promise<void> {
    if (!this.octokit) await this.init();
    if (!this.octokit) throw new Error('GitHub not initialized');

    let sha: string | undefined;
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      if (!Array.isArray(data)) sha = data.sha;
    } catch (e) {}

    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      // Hantera UTF-8 vid uppladdning med unescape-hacket för btoa
      content: btoa(unescape(encodeURIComponent(content))),
      sha,
    });
  }

  /**
   * Skapar ett nytt repo.
   */
  async createRepo(name: string): Promise<GitHubRepo> {
    if (!this.octokit) await this.init();
    if (!this.octokit) throw new Error('GitHub not initialized');

    const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
      name,
      auto_init: true,
      private: false,
    });

    return {
      name: data.name,
      full_name: data.full_name,
      html_url: data.html_url,
    };
  }
}

export const githubService = new GitHubService();
