"use client";

import { githubService } from './github';
import { dwLoadTree, dwWriteContent, dwSaveTree } from './dw';

export interface RollbackOptions {
  commitSha: string;
  filePaths?: string[]; // If not provided, rollback all files
  createNewCommit?: boolean; // Whether to create a new commit for the rollback
  commitMessage?: string;
}

export interface RollbackResult {
  success: boolean;
  filesRolledBack: string[];
  newCommitSha?: string;
  error?: string;
}

class VersionRollbackService {
  
  async rollbackToCommit(options: RollbackOptions): Promise<RollbackResult> {
    const result: RollbackResult = {
      success: false,
      filesRolledBack: []
    };

    try {
      const currentRepo = githubService.getCurrentRepository();
      if (!currentRepo) {
        result.error = '没有设置GitHub仓库';
        return result;
      }

      // Get commit details to see what files were changed
      const commitDetails = await githubService.getCommitDetails(options.commitSha);
      
      // Determine which files to rollback
      const filesToRollback = options.filePaths || 
        commitDetails.files.map(f => f.filename);

      // Load local DW tree
      const dwTree = await dwLoadTree();
      if (!dwTree) {
        result.error = '无法加载本地文件树';
        return result;
      }

      // Find repository folder
      const repoFolderName = `${currentRepo.owner}-${currentRepo.repo}`;
      const repoFolder = this.findRepoFolder(dwTree, repoFolderName);
      if (!repoFolder) {
        result.error = '找不到仓库文件夹';
        return result;
      }

      // Rollback each file
      for (const filePath of filesToRollback) {
        try {
          await this.rollbackSingleFile(filePath, options.commitSha, repoFolder);
          result.filesRolledBack.push(filePath);
        } catch (error) {
          console.warn(`Failed to rollback file ${filePath}:`, error);
        }
      }

      // Save updated tree
      await dwSaveTree(dwTree);

      // Create new commit if requested
      if (options.createNewCommit && result.filesRolledBack.length > 0) {
        const commitMessage = options.commitMessage || 
          `Rollback to ${options.commitSha.substring(0, 7)}`;
        
        try {
          const commitResult = await this.createRollbackCommit(
            result.filesRolledBack, 
            commitMessage
          );
          result.newCommitSha = commitResult.commitSha;
        } catch (error) {
          console.warn('Failed to create rollback commit:', error);
        }
      }

      result.success = result.filesRolledBack.length > 0;
      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : '回滚失败';
      return result;
    }
  }

  async rollbackSingleFile(
    filePath: string, 
    commitSha: string, 
    repoFolder: any
  ): Promise<void> {
    // Get file content at the specified commit
    const fileContent = await githubService.getFileAtCommit(filePath, commitSha);
    
    // Find the file in the local tree
    const fileNode = this.findFileInTree(repoFolder, filePath);
    
    if (fileNode) {
      // Update existing file
      await dwWriteContent(fileNode.id, fileContent);
    } else {
      // Create new file if it doesn't exist locally
      await this.createFileInTree(repoFolder, filePath, fileContent);
    }
  }

  async createRollbackCommit(
    filePaths: string[], 
    commitMessage: string
  ): Promise<{ success: boolean; commitSha?: string; error?: string }> {
    try {
      // Get current content of rolled back files
      const files = [];
      
      for (const filePath of filePaths) {
        try {
          // Get current content from local storage
          const content = await this.getLocalFileContent(filePath);
          files.push({
            path: filePath,
            content: content,
            operation: 'update' as const
          });
        } catch (error) {
          console.warn(`Failed to get content for ${filePath}:`, error);
        }
      }

      if (files.length === 0) {
        return { success: false, error: 'No files to commit' };
      }

      // Commit to GitHub
      return await githubService.commitMultipleFiles(files, commitMessage);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create commit' 
      };
    }
  }

  async getFileVersions(filePath: string): Promise<Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
    content?: string;
  }>> {
    try {
      const history = await githubService.getFileHistory(filePath, {
        per_page: 20
      });

      const versions = [];
      for (const commit of history) {
        try {
          const content = await githubService.getFileAtCommit(filePath, commit.sha);
          versions.push({
            sha: commit.sha,
            message: commit.message,
            author: commit.author.name,
            date: commit.author.date,
            content
          });
        } catch (error) {
          // File might not exist in this commit
          versions.push({
            sha: commit.sha,
            message: commit.message,
            author: commit.author.name,
            date: commit.author.date
          });
        }
      }

      return versions;
    } catch (error) {
      console.error('Failed to get file versions:', error);
      return [];
    }
  }

  async previewRollback(options: RollbackOptions): Promise<{
    files: Array<{
      path: string;
      currentContent: string;
      rollbackContent: string;
      hasChanges: boolean;
    }>;
    error?: string;
  }> {
    try {
      const currentRepo = githubService.getCurrentRepository();
      if (!currentRepo) {
        return { files: [], error: '没有设置GitHub仓库' };
      }

      const commitDetails = await githubService.getCommitDetails(options.commitSha);
      const filesToCheck = options.filePaths || 
        commitDetails.files.map(f => f.filename);

      const files = [];
      
      for (const filePath of filesToCheck) {
        try {
          const [currentContent, rollbackContent] = await Promise.all([
            this.getLocalFileContent(filePath),
            githubService.getFileAtCommit(filePath, options.commitSha)
          ]);

          files.push({
            path: filePath,
            currentContent,
            rollbackContent,
            hasChanges: currentContent !== rollbackContent
          });
        } catch (error) {
          console.warn(`Failed to preview file ${filePath}:`, error);
        }
      }

      return { files };
    } catch (error) {
      return { 
        files: [], 
        error: error instanceof Error ? error.message : '预览失败' 
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

  private findFileInTree(folder: any, filePath: string): any | null {
    const pathParts = filePath.split('/');
    let current = folder;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      
      if (!current.children) return null;
      
      const found = current.children.find((child: any) => child.name === part);
      if (!found) return null;
      
      if (i === pathParts.length - 1) {
        // This is the file
        return found.type === 'file' ? found : null;
      } else {
        // This should be a folder
        current = found.type === 'folder' ? found : null;
        if (!current) return null;
      }
    }
    
    return null;
  }

  private async createFileInTree(
    repoFolder: any, 
    filePath: string, 
    content: string
  ): Promise<void> {
    const pathParts = filePath.split('/');
    let current = repoFolder;

    // Ensure folder structure exists
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i];
      
      if (!current.children) {
        current.children = [];
      }
      
      let folder = current.children.find((child: any) => 
        child.name === folderName && child.type === 'folder'
      );
      
      if (!folder) {
        folder = {
          id: `folder_${Date.now()}_${Math.random()}`,
          name: folderName,
          type: 'folder',
          children: []
        };
        current.children.push(folder);
      }
      
      current = folder;
    }

    // Create the file
    const fileName = pathParts[pathParts.length - 1];
    const fileId = `file_${Date.now()}_${Math.random()}`;
    
    if (!current.children) {
      current.children = [];
    }
    
    current.children.push({
      id: fileId,
      name: fileName,
      type: 'file'
    });

    // Write content
    await dwWriteContent(fileId, content);
  }

  private async getLocalFileContent(filePath: string): Promise<string> {
    // This would need to be implemented to get content from local DW storage
    // For now, return empty string as placeholder
    try {
      const currentRepo = githubService.getCurrentRepository();
      if (!currentRepo) return '';

      const dwTree = await dwLoadTree();
      if (!dwTree) return '';

      const repoFolderName = `${currentRepo.owner}-${currentRepo.repo}`;
      const repoFolder = this.findRepoFolder(dwTree, repoFolderName);
      if (!repoFolder) return '';

      const fileNode = this.findFileInTree(repoFolder, filePath);
      if (!fileNode) return '';

      // This would read from DW storage
      // For now, return empty string
      return '';
    } catch (error) {
      console.error('Failed to get local file content:', error);
      return '';
    }
  }
}

export const versionRollbackService = new VersionRollbackService();
