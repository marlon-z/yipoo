"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GitBranch,
  GitCommit,
  Plus,
  Minus,
  FileText,
  Folder,
  MoreHorizontal,
  RefreshCw,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  Github,
  Eye,
  RotateCcw
} from 'lucide-react';
import { gitIntegration, ModifiedFile } from '@/lib/git-integration';
import { githubService } from '@/lib/github';
import { cn } from '@/lib/utils';

export function EnhancedSourceControlView() {
  const { data: session, status } = useSession();
  const [modifiedFiles, setModifiedFiles] = useState<ModifiedFile[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [commitDescription, setCommitDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [commitInProgress, setCommitInProgress] = useState(false);

  // Set GitHub token when session changes
  useEffect(() => {
    if (session?.accessToken) {
      githubService.setAuthToken(session.accessToken);
      
      // Check if repository was restored from storage
      const currentRepo = githubService.getCurrentRepository();
      if (currentRepo) {
        setSuccess(`已恢复仓库: ${currentRepo.owner}/${currentRepo.repo}`);
        // Auto-load files after repository is restored
        setTimeout(() => {
          loadModifiedFiles();
        }, 1000);
      }
    }
  }, [session]);

  // Load modified files
  const loadModifiedFiles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentRepo = githubService.getCurrentRepository();
      if (!currentRepo) {
        setError('没有设置GitHub仓库');
        return;
      }

      const repoFolderName = `${currentRepo.owner}-${currentRepo.repo}`;
      const files = await gitIntegration.detectModifiedFiles(repoFolderName);
      setModifiedFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文件状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadModifiedFiles();
    }
  }, [status]);

  const handleStageFile = async (file: ModifiedFile) => {
    const success = await gitIntegration.stageFile(file.relativePath);
    if (success) {
      setModifiedFiles(prev => 
        prev.map(f => 
          f.relativePath === file.relativePath 
            ? { ...f, staged: true }
            : f
        )
      );
    }
  };

  const handleUnstageFile = async (file: ModifiedFile) => {
    const success = await gitIntegration.unstageFile(file.relativePath);
    if (success) {
      setModifiedFiles(prev => 
        prev.map(f => 
          f.relativePath === file.relativePath 
            ? { ...f, staged: false }
            : f
        )
      );
    }
  };

  const handleStageAll = async () => {
    const success = await gitIntegration.stageAllFiles(modifiedFiles);
    if (success) {
      setModifiedFiles(prev => 
        prev.map(f => ({ ...f, staged: true }))
      );
    }
  };

  const handleUnstageAll = async () => {
    const success = await gitIntegration.unstageAllFiles();
    if (success) {
      setModifiedFiles(prev => 
        prev.map(f => ({ ...f, staged: false }))
      );
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setError('请输入提交消息');
      return;
    }

    setCommitInProgress(true);
    setError(null);
    setSuccess(null);

    try {
      const fullMessage = commitDescription.trim() 
        ? `${commitMessage}\n\n${commitDescription}`
        : commitMessage;

      const result = await gitIntegration.commitStagedFiles(modifiedFiles, fullMessage);
      
      if (result.success) {
        setSuccess(`提交成功！Commit SHA: ${result.commitSha?.substring(0, 8)}`);
        setCommitMessage('');
        setCommitDescription('');
        setShowCommitDialog(false);
        
        // Reload modified files
        await loadModifiedFiles();
      } else {
        setError(result.error || '提交失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setCommitInProgress(false);
    }
  };

  const stagedFiles = modifiedFiles.filter(f => f.staged);
  const unstagedFiles = modifiedFiles.filter(f => !f.staged);

  const getStatusColor = (status: ModifiedFile['status']) => {
    switch (status) {
      case 'added': return 'text-green-600';
      case 'modified': return 'text-blue-600';
      case 'deleted': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: ModifiedFile['status']) => {
    switch (status) {
      case 'added': return <Plus className="w-3 h-3" />;
      case 'modified': return <FileText className="w-3 h-3" />;
      case 'deleted': return <Minus className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getStatusText = (status: ModifiedFile['status']) => {
    switch (status) {
      case 'added': return 'A';
      case 'modified': return 'M';
      case 'deleted': return 'D';
      default: return '?';
    }
  };

  if (status !== 'authenticated') {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            源代码管理
          </h2>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              请先登录 GitHub 后使用源代码管理功能
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            源代码管理
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadModifiedFiles}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {success && (
        <div className="p-3">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Repository Info */}
      {githubService.getCurrentRepository() && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Github className="w-4 h-4" />
            <span>{githubService.getCurrentRepository()?.owner}/{githubService.getCurrentRepository()?.repo}</span>
            <Badge variant="outline" className="text-xs">
              {githubService.getCurrentRepository()?.branch}
            </Badge>
          </div>
        </div>
      )}

      {/* Commit Section */}
      {stagedFiles.length > 0 && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              已暂存的更改 ({stagedFiles.length})
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommitDialog(true)}
                disabled={stagedFiles.length === 0}
              >
                <GitCommit className="w-4 h-4 mr-1" />
                提交
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnstageAll}
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Files List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Staged Files */}
          {stagedFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-600">
                  已暂存的更改 ({stagedFiles.length})
                </span>
              </div>
              <div className="space-y-1">
                {stagedFiles.map((file) => (
                  <div
                    key={file.relativePath}
                    className="flex items-center gap-2 p-2 rounded hover:bg-accent group"
                  >
                    <div className={cn("flex items-center gap-1", getStatusColor(file.status))}>
                      {getStatusIcon(file.status)}
                      <span className="text-xs font-mono">
                        {getStatusText(file.status)}
                      </span>
                    </div>
                    <span className="flex-1 text-sm truncate" title={file.relativePath}>
                      {file.relativePath}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnstageFile(file)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unstaged Files */}
          {unstagedFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  更改 ({unstagedFiles.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStageAll}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {unstagedFiles.map((file) => (
                  <div
                    key={file.relativePath}
                    className="flex items-center gap-2 p-2 rounded hover:bg-accent group"
                  >
                    <div className={cn("flex items-center gap-1", getStatusColor(file.status))}>
                      {getStatusIcon(file.status)}
                      <span className="text-xs font-mono">
                        {getStatusText(file.status)}
                      </span>
                    </div>
                    <span className="flex-1 text-sm truncate" title={file.relativePath}>
                      {file.relativePath}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStageFile(file)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Changes */}
          {!isLoading && modifiedFiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>没有更改</p>
              <p className="text-sm">所有文件都是最新的</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">检查文件状态...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Commit Dialog */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提交更改</DialogTitle>
            <DialogDescription>
              将 {stagedFiles.length} 个文件的更改提交到 GitHub
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">提交消息 *</label>
              <Input
                placeholder="简要描述这次更改..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">详细描述（可选）</label>
              <Textarea
                placeholder="详细描述这次更改的内容和原因..."
                value={commitDescription}
                onChange={(e) => setCommitDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">将要提交的文件：</p>
              <ul className="space-y-1">
                {stagedFiles.map((file) => (
                  <li key={file.relativePath} className="flex items-center gap-2">
                    <span className={cn("text-xs", getStatusColor(file.status))}>
                      {getStatusText(file.status)}
                    </span>
                    <span className="truncate">{file.relativePath}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCommitDialog(false)}
              disabled={commitInProgress}
            >
              取消
            </Button>
            <Button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || commitInProgress}
            >
              {commitInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <GitCommit className="w-4 h-4 mr-2" />
                  提交到 GitHub
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
