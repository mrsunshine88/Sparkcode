import { Octokit } from 'octokit';
import { supabase } from './supabase';

export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
}

export class GitHubService {
  private octokit: Octokit | null = null;

  /**
   * Initierar Octokit med provider_token från Supabase-sessionen.
   */
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

  /**
   * Hämtar användarens publika repon.
   */
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

  /**
   * Laddar upp en fil till ett repo.
   */
  async uploadFile(owner: string, repo: string, path: string, content: string, message: string): Promise<void> {
    if (!this.octokit) await this.init();
    if (!this.octokit) throw new Error('GitHub not initialized');

    // Kolla om filen redan finns för att få dess SHA (krävs för uppdatering)
    let sha: string | undefined;
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      if (!Array.isArray(data)) {
        sha = data.sha;
      }
    } catch (e) {
      // Filen finns inte än, det är okej
    }

    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: btoa(unescape(encodeURIComponent(content))), // Base64 encoding som hanterar UTF-8
      sha,
    });
  }

  /**
   * Hämtar rekursivt allt innehåll i ett repo.
   */
  async fetchRepoContents(owner: string, repo: string, path: string = ''): Promise<{path: string, content: string}[]> {
    if (!this.octokit) await this.init();
    if (!this.octokit) throw new Error('GitHub not initialized');

    const { data } = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    const files: {path: string, content: string}[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.type === 'file') {
          const content = await this.fetchFileContent(item.url);
          files.push({ path: item.path, content });
        } else if (item.type === 'dir') {
          const subFiles = await this.fetchRepoContents(owner, repo, item.path);
          files.push(...subFiles);
        }
      }
    }

    return files;
  }

  private async fetchFileContent(url: string): Promise<string> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    
    // Använd Octokit.request istället för manuell fetch för att hantera auth korrekt
    const response = await this.octokit.request(`GET ${url}`);
    const data = response.data;
    
    if (!data.content) {
      throw new Error(`Kunde inte hämta innehåll från: ${url}`);
    }

    // Robust Base64-avkodning som hanterar UTF-8 och svenska tecken
    return decodeURIComponent(
      atob(data.content.replace(/\s/g, ''))
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
}

export const githubService = new GitHubService();
