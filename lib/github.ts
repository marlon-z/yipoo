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
    
    // Try to restore repository from localStorage
    this.restoreRepositoryFromStorage();
  }

  private restoreRepositoryFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const savedRepo = localStorage.getItem('github-current-repo');
        if (savedRepo) {
          this.currentRepo = JSON.parse(savedRepo);
          console.log('Restored repository from storage:', this.currentRepo);
        }
      } catch (error) {
        console.error('Failed to restore repository from storage:', error);
        localStorage.removeItem('github-current-repo');
      }
    }
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
      
      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('github-current-repo', JSON.stringify(this.currentRepo));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to set repository:', error);
      this.currentRepo = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('github-current-repo');
      }
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

  async getCommitHistory(options?: {
    page?: number;
    per_page?: number;
    since?: string;
    until?: string;
    author?: string;
    path?: string;
  }): Promise<GitHubCommit[]> {
    if (!this.octokit || !this.currentRepo) {
      throw new Error('GitHub not initialized or repository not set');
    }

    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        sha: this.currentRepo.branch,
        page: options?.page || 1,
        per_page: options?.per_page || 30,
        since: options?.since,
        until: options?.until,
        author: options?.author,
        path: options?.path,
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

  async getCommitDetails(sha: string): Promise<{
    commit: GitHubCommit;
    files: Array<{
      filename: string;
      status: 'added' | 'removed' | 'modified' | 'renamed';
      additions: number;
      deletions: number;
      changes: number;
      patch?: string;
      previous_filename?: string;
    }>;
  }> {
    if (!this.octokit || !this.currentRepo) {
      throw new Error('GitHub not initialized or repository not set');
    }

    try {
      const response = await this.octokit.rest.repos.getCommit({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        ref: sha,
      });

      const commit: GitHubCommit = {
        sha: response.data.sha,
        message: response.data.commit.message,
        author: {
          name: response.data.commit.author?.name || 'Unknown',
          email: response.data.commit.author?.email || '',
          date: response.data.commit.author?.date || '',
        },
        url: response.data.html_url,
        stats: {
          additions: response.data.stats?.additions || 0,
          deletions: response.data.stats?.deletions || 0,
          total: response.data.stats?.total || 0,
        },
      };

      const files = (response.data.files || []).map(file => ({
        filename: file.filename,
        status: file.status as 'added' | 'removed' | 'modified' | 'renamed',
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        previous_filename: file.previous_filename,
      }));

      return { commit, files };
    } catch (error) {
      console.error('Failed to get commit details:', error);
      throw error;
    }
  }

  async getFileHistory(path: string, options?: {
    page?: number;
    per_page?: number;
  }): Promise<GitHubCommit[]> {
    return this.getCommitHistory({
      ...options,
      path,
    });
  }

  async getFileAtCommit(path: string, sha: string): Promise<string> {
    if (!this.octokit || !this.currentRepo) {
      throw new Error('GitHub not initialized or repository not set');
    }

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        path,
        ref: sha,
      });

      if (!Array.isArray(response.data) && response.data.type === 'file') {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      
      throw new Error('File not found or is not a file');
    } catch (error) {
      console.error('Failed to get file at commit:', error);
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

  async createOrUpdateFile(
    path: string, 
    content: string, 
    message: string, 
    sha?: string
  ): Promise<{ success: boolean; sha?: string; error?: string }> {
    if (!this.octokit || !this.currentRepo) {
      return { success: false, error: 'GitHub not initialized or repository not set' };
    }

    try {
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        path,
        message,
        content: Buffer.from(content, 'utf-8').toString('base64'),
        branch: this.currentRepo.branch,
        ...(sha && { sha })
      });

      return { 
        success: true, 
        sha: response.data.content?.sha 
      };
    } catch (error) {
      console.error('Failed to create/update file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async deleteFile(
    path: string, 
    message: string, 
    sha: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.octokit || !this.currentRepo) {
      return { success: false, error: 'GitHub not initialized or repository not set' };
    }

    try {
      await this.octokit.rest.repos.deleteFile({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        path,
        message,
        sha,
        branch: this.currentRepo.branch
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to delete file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getFileSha(path: string): Promise<string | null> {
    if (!this.octokit || !this.currentRepo) {
      return null;
    }

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        path,
        ref: this.currentRepo.branch,
      });

      if (!Array.isArray(response.data) && response.data.type === 'file') {
        return response.data.sha;
      }
      return null;
    } catch (error) {
      // File doesn't exist
      return null;
    }
  }

  async commitMultipleFiles(
    files: Array<{
      path: string;
      content: string;
      operation: 'create' | 'update' | 'delete';
      sha?: string;
    }>,
    commitMessage: string
  ): Promise<{ success: boolean; commitSha?: string; error?: string }> {
    if (!this.octokit || !this.currentRepo) {
      return { success: false, error: 'GitHub not initialized or repository not set' };
    }

    try {
      // Get the current commit SHA
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        ref: `heads/${this.currentRepo.branch}`
      });

      const currentCommitSha = refData.object.sha;

      // Get the current tree
      const { data: currentCommit } = await this.octokit.rest.git.getCommit({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        commit_sha: currentCommitSha
      });

      // Create tree items for all files
      const treeItems = [];
      for (const file of files) {
        if (file.operation === 'delete') {
          // For deletion, we don't include the file in the tree
          continue;
        } else {
          // Create blob for file content
          const { data: blob } = await this.octokit.rest.git.createBlob({
            owner: this.currentRepo.owner,
            repo: this.currentRepo.repo,
            content: Buffer.from(file.content, 'utf-8').toString('base64'),
            encoding: 'base64'
          });

          treeItems.push({
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha
          });
        }
      }

      // Create new tree
      const { data: newTree } = await this.octokit.rest.git.createTree({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        tree: treeItems,
        base_tree: currentCommit.tree.sha
      });

      // Create new commit
      const { data: newCommit } = await this.octokit.rest.git.createCommit({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        message: commitMessage,
        tree: newTree.sha,
        parents: [currentCommitSha]
      });

      // Update the reference
      await this.octokit.rest.git.updateRef({
        owner: this.currentRepo.owner,
        repo: this.currentRepo.repo,
        ref: `heads/${this.currentRepo.branch}`,
        sha: newCommit.sha
      });

      return { 
        success: true, 
        commitSha: newCommit.sha 
      };
    } catch (error) {
      console.error('Failed to commit multiple files:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
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
