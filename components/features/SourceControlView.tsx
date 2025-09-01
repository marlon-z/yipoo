"use client";

import { useState, useEffect } from 'react';
import { useGitRepository, useGitFileStatus } from '@/hooks/use-git';
import { GitFileStatus } from '@/lib/git';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  GitBranch,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  FileText,
  Eye,
  RotateCcw,
  RefreshCw,
  GitCommit,
  Upload,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Remove mock data - now using real Git data

export function SourceControlView() {
  const [commitMessage, setCommitMessage] = useState('');
  const [commitDescription, setCommitDescription] = useState('');
  
  // Use real Git hooks
  const { repositoryInfo, isLoading: repoLoading, error: repoError } = useGitRepository();
  const { 
    fileStatus, 
    isLoading: statusLoading, 
    error: statusError,
    stageFile,
    unstageFile,
    commit
  } = useGitFileStatus();

  const unstagedChanges = fileStatus.filter(change => !change.staged);
  const stagedChanges = fileStatus.filter(change => change.staged);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'modified': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'added': return <Plus className="w-4 h-4 text-green-500" />;
      case 'deleted': return <Minus className="w-4 h-4 text-red-500" />;
      case 'untracked': return <FileText className="w-4 h-4 text-yellow-500" />;
      case 'renamed': return <FileText className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      modified: 'M',
      added: 'A',
      deleted: 'D',
      untracked: 'U',
      renamed: 'R'
    };
    return badges[status as keyof typeof badges] || '?';
  };

  const handleStageFile = async (filePath: string) => {
    await stageFile(filePath);
  };

  const handleUnstageFile = async (filePath: string) => {
    await unstageFile(filePath);
  };

  const discardChanges = (filePath: string) => {
    // TODO: Implement discard changes functionality
    console.log('Discarding changes:', filePath);
  };

  const viewDiff = (filePath: string) => {
    // TODO: Implement diff view functionality
    console.log('Viewing diff for:', filePath);
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    const success = await commit(commitMessage, commitDescription);
    if (success) {
      setCommitMessage('');
      setCommitDescription('');
    }
  };

  const renderFileItem = (file: GitFileStatus, isStaged: boolean) => (
    <ContextMenu key={file.path}>
      <ContextMenuTrigger asChild>
        <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer text-sm group">
          {getStatusIcon(file.status)}
          <span className="flex-1 font-mono text-xs truncate" title={file.path}>
            {file.path}
          </span>
          <Badge variant="outline" className="h-4 text-xs px-1">
            {getStatusBadge(file.status)}
          </Badge>
          {(file.additions !== undefined || file.deletions !== undefined) && (
            <span className="text-xs text-muted-foreground">
              {file.additions ? `+${file.additions}` : ''} {file.deletions ? `-${file.deletions}` : ''}
            </span>
          )}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5"
              onClick={() => viewDiff(file.path)}
            >
              <Eye className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5"
              onClick={() => isStaged ? handleUnstageFile(file.path) : handleStageFile(file.path)}
            >
              {isStaged ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => viewDiff(file.path)}>
          <Eye className="w-4 h-4 mr-2" />
          查看更改
        </ContextMenuItem>
        <ContextMenuItem onClick={() => isStaged ? handleUnstageFile(file.path) : handleStageFile(file.path)}>
          {isStaged ? <Minus className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isStaged ? '取消暂存' : '暂存更改'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => discardChanges(file.path)}>
          <RotateCcw className="w-4 h-4 mr-2" />
          放弃更改
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Repository status */}
      <div className="p-3 border-b border-border">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              {repositoryInfo?.currentBranch || 'main'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">与远程分支同步状态</span>
              <div className="flex items-center gap-2">
                {repositoryInfo && repositoryInfo.ahead > 0 && (
                  <Badge variant="outline" className="h-5 text-xs">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    {repositoryInfo.ahead}
                  </Badge>
                )}
                {repositoryInfo && repositoryInfo.behind > 0 && (
                  <Badge variant="outline" className="h-5 text-xs">
                    <ArrowDown className="w-3 h-3 mr-1" />
                    {repositoryInfo.behind}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
                <Download className="w-3 h-3 mr-1" />
                拉取
              </Button>
              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
                <Upload className="w-3 h-3 mr-1" />
                推送
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Changes */}
      <div className="flex-1 overflow-auto">
        {/* Unstaged changes */}
        {unstagedChanges.length > 0 && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">
                更改 ({unstagedChanges.length})
              </h3>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  title="暂存所有更改"
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  title="放弃所有更改"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              {unstagedChanges.map(file => renderFileItem(file, false))}
            </div>
          </div>
        )}

        {/* Staged changes */}
        {stagedChanges.length > 0 && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">
                已暂存的更改 ({stagedChanges.length})
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                title="取消暂存所有更改"
              >
                <Minus className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {stagedChanges.map(file => renderFileItem(file, true))}
            </div>
          </div>
        )}

        {fileStatus.length === 0 && !statusLoading && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <GitBranch className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">没有更改</p>
          </div>
        )}

        {statusLoading && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <RefreshCw className="w-8 h-8 mb-4 opacity-50 animate-spin" />
            <p className="text-sm">正在加载...</p>
          </div>
        )}

        {(statusError || repoError) && (
          <div className="p-3">
            <div className="text-sm text-destructive">
              {statusError || repoError}
            </div>
          </div>
        )}
      </div>

      {/* Commit section */}
      {stagedChanges.length > 0 && (
        <div className="p-3 border-t border-border">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">提交更改</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input 
                placeholder="提交消息" 
                className="h-8 text-sm"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
              />
              <Textarea 
                placeholder="详细描述（可选）" 
                className="h-16 text-sm resize-none"
                value={commitDescription}
                onChange={(e) => setCommitDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 h-7 text-xs"
                  disabled={!commitMessage.trim() || statusLoading}
                  onClick={handleCommit}
                >
                  <GitCommit className="w-3 h-3 mr-1" />
                  提交
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 h-7 text-xs"
                  disabled={!commitMessage.trim() || statusLoading}
                  onClick={handleCommit}
                >
                  提交并推送
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
