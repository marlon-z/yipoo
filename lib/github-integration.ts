import { githubService, GitHubFile } from './github';
import { dwSaveTree, dwWriteContent, dwLoadTree, DWNode } from './dw';

export interface GitHubIntegrationOptions {
  targetPath?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  maxFileSize?: number; // in bytes
}

class GitHubIntegration {
  private defaultExcludePatterns = [
    '.git/**',
    'node_modules/**',
    '.next/**',
    '.vercel/**',
    'dist/**',
    'build/**',
    '*.log',
    '.env*',
    '.DS_Store',
    'Thumbs.db'
  ];

  async cloneRepositoryToLocal(options: GitHubIntegrationOptions = {}): Promise<{
    success: boolean;
    filesCloned: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      filesCloned: 0,
      errors: [] as string[]
    };

    try {
      const currentRepo = githubService.getCurrentRepository();
      if (!currentRepo) {
        result.errors.push('没有设置GitHub仓库');
        return result;
      }

      // Get all files from repository
      const files = await this.getRepositoryFilesRecursive('', options);
      
      // Load existing DW tree
      let dwTree = await dwLoadTree() || [];
      
      // Create repository folder structure
      const repoFolderName = `${currentRepo.owner}-${currentRepo.repo}`;
      const repoFolder = this.findOrCreateFolder(dwTree, repoFolderName);
      
      // Clone files
      for (const file of files) {
        try {
          await this.cloneFileToLocal(file, repoFolder, options.targetPath);
          result.filesCloned++;
        } catch (error) {
          result.errors.push(`Failed to clone ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Save updated tree
      await dwSaveTree(dwTree);
      
      result.success = result.filesCloned > 0;
      return result;

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error during clone');
      return result;
    }
  }

  private async getRepositoryFilesRecursive(
    path: string = '', 
    options: GitHubIntegrationOptions
  ): Promise<GitHubFile[]> {
    const files: GitHubFile[] = [];
    
    try {
      const items = await githubService.getRepositoryFiles(path);
      
      for (const item of items) {
        // Check exclude patterns
        if (this.shouldExcludeFile(item.path, options)) {
          continue;
        }

        if (item.type === 'file') {
          // Check file size limit
          if (options.maxFileSize && item.size > options.maxFileSize) {
            continue;
          }

          // Get file content
          try {
            const content = await githubService.getFileContent(item.path);
            files.push({ ...item, content });
          } catch (error) {
            console.warn(`Failed to get content for ${item.path}:`, error);
          }
        } else if (item.type === 'dir') {
          // Recursively get files from subdirectory
          const subFiles = await this.getRepositoryFilesRecursive(item.path, options);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      console.error(`Failed to get files from ${path}:`, error);
    }

    return files;
  }

  private shouldExcludeFile(filePath: string, options: GitHubIntegrationOptions): boolean {
    const excludePatterns = [
      ...this.defaultExcludePatterns,
      ...(options.excludePatterns || [])
    ];

    // Check exclude patterns
    for (const pattern of excludePatterns) {
      if (this.matchesPattern(filePath, pattern)) {
        return true;
      }
    }

    // Check include patterns (if specified)
    if (options.includePatterns && options.includePatterns.length > 0) {
      const matches = options.includePatterns.some(pattern => 
        this.matchesPattern(filePath, pattern)
      );
      return !matches;
    }

    return false;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple pattern matching (could be enhanced with proper glob matching)
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  private findOrCreateFolder(tree: DWNode[], folderName: string): DWNode {
    // Find existing folder
    let folder = tree.find(node => node.name === folderName && node.type === 'folder');
    
    if (!folder) {
      // Create new folder
      folder = {
        id: this.generateId(),
        name: folderName,
        type: 'folder',
        children: []
      };
      tree.push(folder);
    }

    return folder;
  }

  private async cloneFileToLocal(
    file: GitHubFile, 
    parentFolder: DWNode,
    targetPath?: string
  ): Promise<void> {
    const pathParts = file.path.split('/');
    let currentFolder = parentFolder;

    // Create folder structure
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i];
      let subFolder = currentFolder.children?.find(
        child => child.name === folderName && child.type === 'folder'
      ) as DWNode;

      if (!subFolder) {
        subFolder = {
          id: this.generateId(),
          name: folderName,
          type: 'folder',
          children: []
        };
        
        if (!currentFolder.children) {
          currentFolder.children = [];
        }
        currentFolder.children.push(subFolder);
      }

      currentFolder = subFolder;
    }

    // Create file
    const fileName = pathParts[pathParts.length - 1];
    const fileId = this.generateId();
    
    const fileNode: DWNode = {
      id: fileId,
      name: fileName,
      type: 'file'
    };

    if (!currentFolder.children) {
      currentFolder.children = [];
    }

    // Check if file already exists
    const existingFileIndex = currentFolder.children.findIndex(
      child => child.name === fileName && child.type === 'file'
    );

    if (existingFileIndex >= 0) {
      // Update existing file
      currentFolder.children[existingFileIndex] = fileNode;
    } else {
      // Add new file
      currentFolder.children.push(fileNode);
    }

    // Save file content
    await dwWriteContent(fileId, file.content);
  }

  private generateId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async syncWithRemote(): Promise<{
    success: boolean;
    updatedFiles: number;
    errors: string[];
  }> {
    // TODO: Implement sync functionality
    // This would compare local files with remote and update changed files
    return {
      success: false,
      updatedFiles: 0,
      errors: ['Sync functionality not yet implemented']
    };
  }

  async getRepositoryInfo() {
    const repo = githubService.getCurrentRepository();
    if (!repo) return null;

    try {
      const branches = await githubService.getBranches();
      const commits = await githubService.getCommitHistory({ per_page: 10 });

      return {
        repository: repo,
        branches,
        recentCommits: commits,
        isAuthenticated: githubService.isAuthenticated()
      };
    } catch (error) {
      console.error('Failed to get repository info:', error);
      return null;
    }
  }
}

export const githubIntegration = new GitHubIntegration();
