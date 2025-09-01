"use client";

import { dwLoadTree, dwReadContent } from './dw';
import { githubService } from './github';

export interface ModifiedFile {
  path: string;
  relativePath: string;
  status: 'modified' | 'added' | 'deleted';
  localContent?: string;
  remoteContent?: string;
  remoteSha?: string;
  staged: boolean;
}

export interface CommitOperation {
  files: ModifiedFile[];
  message: string;
  author?: {
    name: string;
    email: string;
  };
}

class GitIntegration {
  private stagedFiles: Set<string> = new Set();
  private fileCache: Map<string, { content: string; sha: string }> = new Map();

  async detectModifiedFiles(repoFolderName: string): Promise<ModifiedFile[]> {
    const modifiedFiles: ModifiedFile[] = [];
    
    try {
      // Load local DW tree
      const dwTree = await dwLoadTree();
      if (!dwTree) return [];

      // Find the repository folder
      const repoFolder = this.findRepoFolder(dwTree, repoFolderName);
      if (!repoFolder) return [];

      // Get all local files recursively
      const localFiles = await this.getLocalFilesRecursive(repoFolder);
      
      // Get remote files for comparison
      const remoteFiles = await this.getRemoteFilesMap();

      // Compare local vs remote files
      console.log(`Comparing files - Local: ${localFiles.length}, Remote: ${remoteFiles.size}`);
      
      for (const localFile of localFiles) {
        const relativePath = localFile.path.replace(`${repoFolderName}/`, '');
        const remoteFile = remoteFiles.get(relativePath);
        
        console.log(`Checking file: ${relativePath}`);
        console.log(`- Local exists: true`);
        console.log(`- Remote exists: ${!!remoteFile}`);
        
        if (!remoteFile) {
          // New file (added)
          console.log(`- Status: ADDED`);
          modifiedFiles.push({
            path: localFile.path,
            relativePath,
            status: 'added',
            localContent: localFile.content,
            staged: this.stagedFiles.has(relativePath)
          });
        } else {
          // Normalize content for comparison (handle line endings and whitespace)
          const normalizedLocal = this.normalizeContent(localFile.content);
          const normalizedRemote = this.normalizeContent(remoteFile.content);
          
          console.log(`- Local content length: ${normalizedLocal.length}`);
          console.log(`- Remote content length: ${normalizedRemote.length}`);
          console.log(`- Contents equal: ${normalizedLocal === normalizedRemote}`);
          
          if (normalizedLocal !== normalizedRemote) {
            // Modified file
            console.log(`- Status: MODIFIED`);
            modifiedFiles.push({
              path: localFile.path,
              relativePath,
              status: 'modified',
              localContent: localFile.content,
              remoteContent: remoteFile.content,
              remoteSha: remoteFile.sha,
              staged: this.stagedFiles.has(relativePath)
            });
          } else {
            console.log(`- Status: UNCHANGED`);
          }
        }
      }

      // Check for deleted files (exist remotely but not locally)
      for (const [relativePath, remoteFile] of Array.from(remoteFiles.entries())) {
        const localExists = localFiles.some(f => 
          f.path.replace(`${repoFolderName}/`, '') === relativePath
        );
        
        if (!localExists) {
          modifiedFiles.push({
            path: `${repoFolderName}/${relativePath}`,
            relativePath,
            status: 'deleted',
            remoteContent: remoteFile.content,
            remoteSha: remoteFile.sha,
            staged: this.stagedFiles.has(relativePath)
          });
        }
      }

    } catch (error) {
      console.error('Failed to detect modified files:', error);
    }

    return modifiedFiles;
  }

  async stageFile(relativePath: string): Promise<boolean> {
    try {
      this.stagedFiles.add(relativePath);
      return true;
    } catch (error) {
      console.error('Failed to stage file:', error);
      return false;
    }
  }

  async unstageFile(relativePath: string): Promise<boolean> {
    try {
      this.stagedFiles.delete(relativePath);
      return true;
    } catch (error) {
      console.error('Failed to unstage file:', error);
      return false;
    }
  }

  async stageAllFiles(files: ModifiedFile[]): Promise<boolean> {
    try {
      files.forEach(file => this.stagedFiles.add(file.relativePath));
      return true;
    } catch (error) {
      console.error('Failed to stage all files:', error);
      return false;
    }
  }

  async unstageAllFiles(): Promise<boolean> {
    try {
      this.stagedFiles.clear();
      return true;
    } catch (error) {
      console.error('Failed to unstage all files:', error);
      return false;
    }
  }

  getStagedFiles(files: ModifiedFile[]): ModifiedFile[] {
    return files.filter(file => this.stagedFiles.has(file.relativePath));
  }

  getUnstagedFiles(files: ModifiedFile[]): ModifiedFile[] {
    return files.filter(file => !this.stagedFiles.has(file.relativePath));
  }

  async commitStagedFiles(
    files: ModifiedFile[], 
    commitMessage: string
  ): Promise<{ success: boolean; commitSha?: string; error?: string }> {
    try {
      const stagedFiles = this.getStagedFiles(files);
      
      if (stagedFiles.length === 0) {
        return { success: false, error: 'No files staged for commit' };
      }

      // Prepare files for GitHub API
      const githubFiles = stagedFiles.map(file => ({
        path: file.relativePath,
        content: file.localContent || '',
        operation: file.status === 'deleted' ? 'delete' as const : 
                  file.status === 'added' ? 'create' as const : 'update' as const,
        sha: file.remoteSha
      }));

      // Commit to GitHub
      const result = await githubService.commitMultipleFiles(githubFiles, commitMessage);
      
      if (result.success) {
        // Clear staged files after successful commit
        stagedFiles.forEach(file => this.stagedFiles.delete(file.relativePath));
      }

      return result;
    } catch (error) {
      console.error('Failed to commit staged files:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private findRepoFolder(tree: any[], repoFolderName: string): any | null {
    for (const item of tree) {
      if (item.type === 'folder' && item.name === repoFolderName) {
        return item;
      }
      if (item.type === 'folder' && item.children) {
        const found = this.findRepoFolder(item.children, repoFolderName);
        if (found) return found;
      }
    }
    return null;
  }

  private async getLocalFilesRecursive(folder: any): Promise<Array<{ path: string; content: string }>> {
    const files: Array<{ path: string; content: string }> = [];
    
    if (!folder.children) return files;

    for (const item of folder.children) {
      if (item.type === 'file') {
        try {
          const content = await dwReadContent(item.id);
          files.push({
            path: item.path || item.name,
            content: content || ''
          });
        } catch (error) {
          console.warn(`Failed to read content for ${item.name}:`, error);
        }
      } else if (item.type === 'folder') {
        const subFiles = await this.getLocalFilesRecursive(item);
        files.push(...subFiles);
      }
    }

    return files;
  }

  private async getRemoteFilesMap(): Promise<Map<string, { content: string; sha: string }>> {
    const remoteFiles = new Map<string, { content: string; sha: string }>();
    
    try {
      const currentRepo = githubService.getCurrentRepository();
      if (!currentRepo) return remoteFiles;

      // Recursively get all files from GitHub
      await this.getRemoteFilesRecursive('', remoteFiles);
    } catch (error) {
      console.error('Failed to get remote files:', error);
    }

    return remoteFiles;
  }

  private async getRemoteFilesRecursive(
    path: string, 
    remoteFiles: Map<string, { content: string; sha: string }>
  ): Promise<void> {
    try {
      const files = await githubService.getRepositoryFiles(path);
      
      for (const file of files) {
        if (file.type === 'file') {
          // Get file content if not already included
          let content = file.content;
          if (!content) {
            try {
              content = await githubService.getFileContent(file.path);
            } catch (error) {
              console.warn(`Failed to get content for ${file.path}:`, error);
              content = '';
            }
          }
          
          remoteFiles.set(file.path, {
            content: content,
            sha: file.sha
          });
        } else if (file.type === 'dir') {
          // Recursively get files from subdirectory
          await this.getRemoteFilesRecursive(file.path, remoteFiles);
        }
      }
    } catch (error) {
      console.error(`Failed to get remote files from ${path}:`, error);
    }
  }

  private normalizeContent(content: string): string {
    if (!content) return '';
    
    return content
      // Normalize line endings to \n
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove trailing whitespace from each line
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      // Remove trailing newlines
      .replace(/\n+$/, '');
  }
}

export const gitIntegration = new GitIntegration();
