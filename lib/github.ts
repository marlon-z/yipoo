import { Octokit } from '@octokit/rest';

export interface GitHubRepository {
  owner: string;
  repo: string;
  branch?: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  download_url?: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

class GitHubService {
  private octokit: Octokit | null = null;
  private currentRepo: GitHubRepository | null = null;

  constructor() {
    // Initialize with GitHub token from environment or session
    this.initializeOctokit();
  }

  private initializeOctokit() {
    // Initialize without token initially - will be set when user authenticates
    this.octokit = new Octokit();
  }

  setAuthToken(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  private getSessionToken(): string | null {
    // This would get the token from NextAuth session
    // For now, return null - will be implemented with proper auth
    return null;
  }

  async setRepository(owner: string, repo: string, branch: string = 'main'): Promise<boolean> {
    try {
      if (!this.octokit) {
        throw new Error('GitHub not authenticated');
      }

      // Verify repository exists and is accessible
      await this.octokit.rest.repos.get({ owner, repo });
      
      this.currentRepo = { owner, repo, branch };
      return true;
    } catch (error) {
      console.error('Failed to set repository:', error);
      return false;
    }
  }

  async getRepositoryFiles(path: string = ''): Promise<GitHubFile[]> {
    if (!this.octokit || !this.currentRepo) {
      throw new Error('GitHub not initialized or repository not set');
    }

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        path,
        ref: this.currentRepo.branch,
      });

      const contents = Array.isArray(response.data) ? response.data : [response.data];
      
      return contents.map(item => ({
        path: item.path,
        content: item.type === 'file' && 'content' in item ? 
          Buffer.from(item.content, 'base64').toString('utf-8') : '',
        sha: item.sha,
        size: item.size,
        type: item.type as 'file' | 'dir',
        download_url: 'download_url' in item ? item.download_url : undefined,
      }));
    } catch (error) {
      console.error('Failed to get repository files:', error);
      throw error;
    }
  }

  async getFileContent(path: string): Promise<string> {
    if (!this.octokit || !this.currentRepo) {
      throw new Error('GitHub not initialized or repository not set');
    }

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        path,
        ref: this.currentRepo.branch,
      });

      if (Array.isArray(response.data) || response.data.type !== 'file') {
        throw new Error('Path is not a file');
      }

      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw error;
    }
  }

  async getCommitHistory(page: number = 1, perPage: number = 30): Promise<GitHubCommit[]> {
    if (!this.octokit || !this.currentRepo) {
      throw new Error('GitHub not initialized or repository not set');
    }

    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        sha: this.currentRepo.branch,
        page,
        per_page: perPage,
      });

      return response.data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || '',
          date: commit.commit.author?.date || '',
        },
        url: commit.html_url,
        stats: commit.stats ? {
          additions: commit.stats.additions,
          deletions: commit.stats.deletions,
          total: commit.stats.total,
        } : undefined,
      }));
    } catch (error) {
      console.error('Failed to get commit history:', error);
      throw error;
    }
  }

  async getBranches(): Promise<string[]> {
    if (!this.octokit || !this.currentRepo) {
      throw new Error('GitHub not initialized or repository not set');
    }

    try {
      const response = await this.octokit.rest.repos.listBranches({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
      });

      return response.data.map(branch => branch.name);
    } catch (error) {
      console.error('Failed to get branches:', error);
      throw error;
    }
  }

  async searchInRepository(query: string, options?: {
    path?: string;
    extension?: string;
  }): Promise<Array<{
    path: string;
    matches: Array<{
      line: number;
      preview: string;
    }>;
  }>> {
    if (!this.octokit || !this.currentRepo) {
      throw new Error('GitHub not initialized or repository not set');
    }

    try {
      let searchQuery = `${query} repo:${this.currentRepo.owner}/${this.currentRepo.repo}`;
      
      if (options?.path) {
        searchQuery += ` path:${options.path}`;
      }
      
      if (options?.extension) {
        searchQuery += ` extension:${options.extension}`;
      }

      const response = await this.octokit.rest.search.code({
        q: searchQuery,
      });

      return response.data.items.map(item => ({
        path: item.path,
        matches: [{
          line: 1, // GitHub API doesn't provide line numbers in this format
          preview: item.text_matches?.[0]?.fragment || 'Match found',
        }],
      }));
    } catch (error) {
      console.error('Failed to search in repository:', error);
      throw error;
    }
  }

  async cloneToLocal(targetPath?: string): Promise<boolean> {
    // This would integrate with the DW file system
    // to download and store repository files locally
    if (!this.currentRepo) {
      return false;
    }

    try {
      // Get all files recursively
      const files = await this.getRepositoryFilesRecursive();
      
      // TODO: Integrate with DW file system to save files
      console.log(`Would clone ${files.length} files to local storage`);
      
      return true;
    } catch (error) {
      console.error('Failed to clone repository:', error);
      return false;
    }
  }

  private async getRepositoryFilesRecursive(path: string = ''): Promise<GitHubFile[]> {
    const files: GitHubFile[] = [];
    const items = await this.getRepositoryFiles(path);

    for (const item of items) {
      if (item.type === 'file') {
        files.push(item);
      } else if (item.type === 'dir') {
        const subFiles = await this.getRepositoryFilesRecursive(item.path);
        files.push(...subFiles);
      }
    }

    return files;
  }

  getCurrentRepository(): GitHubRepository | null {
    return this.currentRepo;
  }

  isAuthenticated(): boolean {
    // For demo purposes, always return true for public repositories
    // In production, this would check for valid authentication
    return this.octokit !== null;
  }
}

// Export singleton instance
export const githubService = new GitHubService();
