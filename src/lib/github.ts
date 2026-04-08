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
}

export const githubService = new GitHubService();
