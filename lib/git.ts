import git from 'isomorphic-git';

// Git configuration
const GIT_CONFIG = {
  dir: '/git-repo', // This will be configured based on the actual project structure
  author: {
    name: 'User',
    email: 'user@example.com'
  }
};

export interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
  additions?: number;
  deletions?: number;
}

export interface GitCommit {
  id: string;
  shortHash: string;
  message: string;
  description?: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  timestamp: Date;
  relativeTime: string;
  files: {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    additions: number;
    deletions: number;
  }[];
  stats: {
    files: number;
    additions: number;
    deletions: number;
  };
  branch?: string;
  tags?: string[];
  parents: string[];
}

export interface GitBranch {
  name: string;
  type: 'local' | 'remote';
  current: boolean;
  upstream?: string;
  lastCommit: {
    hash: string;
    message: string;
    author: string;
    time: string;
  };
  ahead?: number;
  behind?: number;
}

export interface GitRepositoryInfo {
  currentBranch: string;
  ahead: number;
  behind: number;
  remote?: string;
  hasChanges: boolean;
  isInitialized: boolean;
}

class GitService {
  private isInitialized: boolean = false;
  private mockData = {
    initialized: false,
    currentBranch: 'main',
    branches: ['main'],
    commits: [] as GitCommit[],
    fileStatus: [] as GitFileStatus[]
  };

  constructor() {
    // For now, we'll use mock data until we can properly implement browser-based Git
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with some sample data to demonstrate functionality
    this.mockData.commits = [
      {
        id: 'abc123def456',
        shortHash: 'abc123d',
        message: '初始化项目',
        description: '创建基础项目结构和配置文件',
        author: {
          name: '用户',
          email: 'user@example.com',
          avatar: undefined,
        },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        relativeTime: '1天前',
        files: [
          { path: 'README.md', status: 'added', additions: 10, deletions: 0 },
          { path: 'package.json', status: 'added', additions: 25, deletions: 0 },
        ],
        stats: { files: 2, additions: 35, deletions: 0 },
        branch: 'main',
        tags: [],
        parents: [],
      }
    ];

    // Add some sample file status
    this.mockData.fileStatus = [
      {
        path: 'components/features/NewFeature.tsx',
        status: 'modified',
        staged: false,
        additions: 15,
        deletions: 3
      },
      {
        path: 'docs/api.md',
        status: 'added',
        staged: true,
        additions: 20,
        deletions: 0
      }
    ];
  }

  async initRepository(): Promise<boolean> {
    try {
      this.mockData.initialized = true;
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Git repository:', error);
      return false;
    }
  }

  async getRepositoryInfo(): Promise<GitRepositoryInfo | null> {
    if (!this.isInitialized) {
      await this.initRepository();
    }

    return {
      currentBranch: this.mockData.currentBranch,
      ahead: 0,
      behind: 0,
      remote: 'origin',
      hasChanges: this.mockData.fileStatus.length > 0,
      isInitialized: this.mockData.initialized
    };
  }

  async getFileStatus(): Promise<GitFileStatus[]> {
    return this.mockData.fileStatus;
  }

  async getCommitHistory(limit: number = 50): Promise<GitCommit[]> {
    return this.mockData.commits.slice(0, limit);
  }

  async getBranches(): Promise<GitBranch[]> {
    const branches: GitBranch[] = [];
    
    // Add local branches
    for (const branchName of this.mockData.branches) {
      branches.push({
        name: branchName,
        type: 'local',
        current: branchName === this.mockData.currentBranch,
        lastCommit: {
          hash: 'abc123d',
          message: '初始化项目',
          author: '用户',
          time: '1天前'
        },
        ahead: 0,
        behind: 0
      });
    }
    
    return branches;
  }

  async stageFile(filepath: string): Promise<boolean> {
    try {
      // Update file status to staged
      const fileIndex = this.mockData.fileStatus.findIndex(f => f.path === filepath);
      if (fileIndex >= 0) {
        this.mockData.fileStatus[fileIndex].staged = true;
      } else {
        // Add new file to status
        this.mockData.fileStatus.push({
          path: filepath,
          status: 'modified',
          staged: true,
          additions: 5,
          deletions: 2
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to stage file:', error);
      return false;
    }
  }

  async unstageFile(filepath: string): Promise<boolean> {
    try {
      const fileIndex = this.mockData.fileStatus.findIndex(f => f.path === filepath);
      if (fileIndex >= 0) {
        this.mockData.fileStatus[fileIndex].staged = false;
      }
      return true;
    } catch (error) {
      console.error('Failed to unstage file:', error);
      return false;
    }
  }

  async commit(message: string, description?: string): Promise<boolean> {
    try {
      // Create new commit
      const newCommit: GitCommit = {
        id: Math.random().toString(36).substring(2, 15),
        shortHash: Math.random().toString(36).substring(2, 9),
        message,
        description,
        author: {
          name: GIT_CONFIG.author.name,
          email: GIT_CONFIG.author.email,
          avatar: undefined
        },
        timestamp: new Date(),
        relativeTime: '刚刚',
        files: this.mockData.fileStatus.filter(f => f.staged).map(f => ({
          path: f.path,
          status: f.status as any,
          additions: f.additions || 0,
          deletions: f.deletions || 0
        })),
        stats: {
          files: this.mockData.fileStatus.filter(f => f.staged).length,
          additions: this.mockData.fileStatus.filter(f => f.staged).reduce((sum, f) => sum + (f.additions || 0), 0),
          deletions: this.mockData.fileStatus.filter(f => f.staged).reduce((sum, f) => sum + (f.deletions || 0), 0)
        },
        branch: this.mockData.currentBranch,
        tags: [],
        parents: this.mockData.commits.length > 0 ? [this.mockData.commits[0].id] : []
      };

      // Add to commits and clear staged files
      this.mockData.commits.unshift(newCommit);
      this.mockData.fileStatus = this.mockData.fileStatus.filter(f => !f.staged);
      
      return true;
    } catch (error) {
      console.error('Failed to commit:', error);
      return false;
    }
  }

  async createBranch(branchName: string, baseBranch: string = 'main'): Promise<boolean> {
    try {
      if (!this.mockData.branches.includes(branchName)) {
        this.mockData.branches.push(branchName);
        this.mockData.currentBranch = branchName;
      }
      return true;
    } catch (error) {
      console.error('Failed to create branch:', error);
      return false;
    }
  }

  async switchBranch(branchName: string): Promise<boolean> {
    try {
      if (this.mockData.branches.includes(branchName)) {
        this.mockData.currentBranch = branchName;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to switch branch:', error);
      return false;
    }
  }

  async deleteBranch(branchName: string): Promise<boolean> {
    try {
      if (branchName !== this.mockData.currentBranch) {
        this.mockData.branches = this.mockData.branches.filter(b => b !== branchName);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete branch:', error);
      return false;
    }
  }

  // Placeholder methods for features that need more complex implementation
  async searchFiles(query: string, options?: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    useRegex?: boolean;
    includePattern?: string;
    excludePattern?: string;
  }): Promise<Array<{
    file: string;
    matches: Array<{
      line: number;
      column: number;
      text: string;
      preview: string;
    }>;
  }>> {
    // Mock search results for demonstration
    if (!query.trim()) return [];
    
    return [
      {
        file: 'components/features/SearchView.tsx',
        matches: [
          {
            line: 15,
            column: 8,
            text: `const searchQuery = '${query}';`,
            preview: `  const searchQuery = '${query}';`
          }
        ]
      }
    ];
  }
}

// Export singleton instance
export const gitService = new GitService();

// Utility functions
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}天前`;
  } else if (diffHours > 0) {
    return `${diffHours}小时前`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟前`;
  } else {
    return '刚刚';
  }
}
