import { useState, useEffect, useCallback } from 'react';
import { 
  gitService, 
  GitFileStatus, 
  GitCommit, 
  GitBranch, 
  GitRepositoryInfo 
} from '@/lib/git';

export function useGitRepository() {
  const [repositoryInfo, setRepositoryInfo] = useState<GitRepositoryInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeRepository = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await gitService.initRepository();
      if (success) {
        const info = await gitService.getRepositoryInfo();
        setRepositoryInfo(info);
      } else {
        setError('Failed to initialize Git repository');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshRepositoryInfo = useCallback(async () => {
    try {
      const info = await gitService.getRepositoryInfo();
      setRepositoryInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh repository info');
    }
  }, []);

  useEffect(() => {
    initializeRepository();
  }, [initializeRepository]);

  return {
    repositoryInfo,
    isLoading,
    error,
    initializeRepository,
    refreshRepositoryInfo
  };
}

export function useGitFileStatus() {
  const [fileStatus, setFileStatus] = useState<GitFileStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFileStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await gitService.getFileStatus();
      setFileStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get file status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stageFile = useCallback(async (filepath: string) => {
    try {
      const success = await gitService.stageFile(filepath);
      if (success) {
        await refreshFileStatus();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stage file');
      return false;
    }
  }, [refreshFileStatus]);

  const unstageFile = useCallback(async (filepath: string) => {
    try {
      const success = await gitService.unstageFile(filepath);
      if (success) {
        await refreshFileStatus();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unstage file');
      return false;
    }
  }, [refreshFileStatus]);

  const commit = useCallback(async (message: string, description?: string) => {
    try {
      const success = await gitService.commit(message, description);
      if (success) {
        await refreshFileStatus();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit');
      return false;
    }
  }, [refreshFileStatus]);

  useEffect(() => {
    refreshFileStatus();
  }, [refreshFileStatus]);

  return {
    fileStatus,
    isLoading,
    error,
    refreshFileStatus,
    stageFile,
    unstageFile,
    commit
  };
}

export function useGitCommitHistory(limit: number = 50) {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCommitHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const history = await gitService.getCommitHistory(limit);
      setCommits(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get commit history');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refreshCommitHistory();
  }, [refreshCommitHistory]);

  return {
    commits,
    isLoading,
    error,
    refreshCommitHistory
  };
}

export function useGitBranches() {
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const branchList = await gitService.getBranches();
      setBranches(branchList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get branches');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBranch = useCallback(async (branchName: string, baseBranch?: string) => {
    try {
      const success = await gitService.createBranch(branchName, baseBranch);
      if (success) {
        await refreshBranches();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
      return false;
    }
  }, [refreshBranches]);

  const switchBranch = useCallback(async (branchName: string) => {
    try {
      const success = await gitService.switchBranch(branchName);
      if (success) {
        await refreshBranches();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch branch');
      return false;
    }
  }, [refreshBranches]);

  const deleteBranch = useCallback(async (branchName: string) => {
    try {
      const success = await gitService.deleteBranch(branchName);
      if (success) {
        await refreshBranches();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete branch');
      return false;
    }
  }, [refreshBranches]);

  useEffect(() => {
    refreshBranches();
  }, [refreshBranches]);

  return {
    branches,
    isLoading,
    error,
    refreshBranches,
    createBranch,
    switchBranch,
    deleteBranch
  };
}

export function useFileSearch() {
  const [searchResults, setSearchResults] = useState<Array<{
    file: string;
    matches: Array<{
      line: number;
      column: number;
      text: string;
      preview: string;
    }>;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFiles = useCallback(async (
    query: string,
    options?: {
      caseSensitive?: boolean;
      wholeWord?: boolean;
      useRegex?: boolean;
      includePattern?: string;
      excludePattern?: string;
    }
  ) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results = await gitService.searchFiles(query, options);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    searchFiles,
    clearSearch
  };
}
