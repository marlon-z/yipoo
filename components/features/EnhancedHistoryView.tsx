"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  History,
  GitCommit,
  GitBranch,
  Calendar,
  User,
  FileText,
  Plus,
  Minus,
  Eye,
  RotateCcw,
  Search,
  Filter,
  Clock,
  Code,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';
import { githubService, GitHubCommit } from '@/lib/github';
import { versionRollbackService } from '@/lib/version-rollback';
import { FileVersionCompare } from './FileVersionCompare';
import { cn } from '@/lib/utils';

interface CommitDetails {
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
}

export function EnhancedHistoryView() {
  const { data: session, status } = useSession();
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<CommitDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'graph' | 'files'>('list');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFileCompare, setShowFileCompare] = useState(false);
  const [compareFilePath, setCompareFilePath] = useState('');
  const [compareCommitSha, setCompareCommitSha] = useState('');
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackCommit, setRollbackCommit] = useState<GitHubCommit | null>(null);
  const [rollbackFiles, setRollbackFiles] = useState<string[]>([]);
  const [rollbackPreview, setRollbackPreview] = useState<any>(null);
  const [isRollbackLoading, setIsRollbackLoading] = useState(false);

  // Set GitHub token when session changes
  useEffect(() => {
    if (session?.accessToken) {
      githubService.setAuthToken(session.accessToken);
      loadCommitHistory(true);
    }
  }, [session]);

  const loadCommitHistory = async (reset = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentRepo = githubService.getCurrentRepository();
      if (!currentRepo) {
        setError('没有设置GitHub仓库');
        return;
      }

      const options: any = {
        page: reset ? 1 : page,
        per_page: 20,
      };

      // Add time filter
      if (timeFilter !== 'all') {
        const now = new Date();
        const since = new Date();
        switch (timeFilter) {
          case 'day':
            since.setDate(now.getDate() - 1);
            break;
          case 'week':
            since.setDate(now.getDate() - 7);
            break;
          case 'month':
            since.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            since.setFullYear(now.getFullYear() - 1);
            break;
        }
        options.since = since.toISOString();
      }

      // Add author filter
      if (authorFilter) {
        options.author = authorFilter;
      }

      const newCommits = await githubService.getCommitHistory(options);
      
      if (reset) {
        setCommits(newCommits);
        setPage(1);
      } else {
        setCommits(prev => [...prev, ...newCommits]);
      }
      
      setHasMore(newCommits.length === 20);
      if (!reset) setPage(prev => prev + 1);

    } catch (err) {
      setError(err instanceof Error ? err.message : '加载提交历史失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommitDetails = async (sha: string) => {
    setIsLoadingDetails(true);
    try {
      const details = await githubService.getCommitDetails(sha);
      setSelectedCommit(details);
    } catch (err) {
      console.error('Failed to load commit details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const filteredCommits = useMemo(() => {
    let filtered = commits;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(commit => 
        commit.message.toLowerCase().includes(query) ||
        commit.author.name.toLowerCase().includes(query) ||
        commit.sha.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [commits, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added': return 'text-green-600';
      case 'removed': return 'text-red-600';
      case 'modified': return 'text-blue-600';
      case 'renamed': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added': return <Plus className="w-3 h-3" />;
      case 'removed': return <Minus className="w-3 h-3" />;
      case 'modified': return <FileText className="w-3 h-3" />;
      case 'renamed': return <RotateCcw className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFileCompare = (filePath: string, commitSha: string) => {
    setCompareFilePath(filePath);
    setCompareCommitSha(commitSha);
    setShowFileCompare(true);
  };

  const handleRollbackCommit = async (commit: GitHubCommit) => {
    setRollbackCommit(commit);
    setIsRollbackLoading(true);
    
    try {
      // Get commit details to show files that will be affected
      const details = await githubService.getCommitDetails(commit.sha);
      setRollbackFiles(details.files.map(f => f.filename));
      
      // Get rollback preview
      const preview = await versionRollbackService.previewRollback({
        commitSha: commit.sha
      });
      setRollbackPreview(preview);
      
      setShowRollbackDialog(true);
    } catch (error) {
      console.error('Failed to prepare rollback:', error);
      setError('准备回滚失败');
    } finally {
      setIsRollbackLoading(false);
    }
  };

  const executeRollback = async (createNewCommit: boolean = true) => {
    if (!rollbackCommit) return;
    
    setIsRollbackLoading(true);
    try {
      const result = await versionRollbackService.rollbackToCommit({
        commitSha: rollbackCommit.sha,
        createNewCommit,
        commitMessage: `Rollback to ${rollbackCommit.sha.substring(0, 7)}: ${rollbackCommit.message.split('\n')[0]}`
      });
      
      if (result.success) {
        setError(null);
        alert(`回滚成功！已回滚 ${result.filesRolledBack.length} 个文件${result.newCommitSha ? `，新提交: ${result.newCommitSha.substring(0, 7)}` : ''}`);
        setShowRollbackDialog(false);
        // Refresh commit history
        loadCommitHistory(true);
      } else {
        setError(result.error || '回滚失败');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '回滚失败');
    } finally {
      setIsRollbackLoading(false);
    }
  };

  if (status !== 'authenticated') {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <History className="w-4 h-4" />
            历史版本
          </h2>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              请先登录 GitHub 后使用历史版本功能
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <History className="w-4 h-4" />
            历史版本
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadCommitHistory(true)}
            disabled={isLoading}
          >
            <RotateCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Repository Info */}
        {githubService.getCurrentRepository() && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <GitBranch className="w-3 h-3" />
            <span>{githubService.getCurrentRepository()?.owner}/{githubService.getCurrentRepository()?.repo}</span>
            <Badge variant="outline" className="text-xs">
              {githubService.getCurrentRepository()?.branch}
            </Badge>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="搜索提交..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部时间</SelectItem>
                <SelectItem value="day">最近一天</SelectItem>
                <SelectItem value="week">最近一周</SelectItem>
                <SelectItem value="month">最近一月</SelectItem>
                <SelectItem value="year">最近一年</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="作者筛选..."
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="px-3 pt-3">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="list" className="text-xs">列表</TabsTrigger>
            <TabsTrigger value="graph" className="text-xs">图表</TabsTrigger>
            <TabsTrigger value="files" className="text-xs">文件</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Commits List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredCommits.map((commit) => (
            <Card 
              key={commit.sha} 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => loadCommitDetails(commit.sha)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {commit.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 mb-1">
                      {commit.message.split('\n')[0]}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{commit.author.name}</span>
                      <span>•</span>
                      <span>{formatDate(commit.author.date)}</span>
                      <span>•</span>
                      <code className="bg-muted px-1 rounded text-xs">
                        {commit.sha.substring(0, 7)}
                      </code>
                    </div>
                    
                    {commit.stats && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-green-600">
                          +{commit.stats.additions}
                        </span>
                        <span className="text-xs text-red-600">
                          -{commit.stats.deletions}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadCommitDetails(commit.sha);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRollbackCommit(commit);
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More */}
          {hasMore && !isLoading && (
            <div className="flex justify-center py-4">
              <Button 
                variant="outline" 
                onClick={() => loadCommitHistory(false)}
                className="text-xs"
              >
                加载更多
              </Button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-4">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">加载中...</p>
            </div>
          )}

          {/* No Commits */}
          {!isLoading && filteredCommits.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>没有找到提交记录</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Commit Details Dialog */}
      {selectedCommit && (
        <Dialog open={!!selectedCommit} onOpenChange={() => setSelectedCommit(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitCommit className="w-5 h-5" />
                提交详情
              </DialogTitle>
              <DialogDescription>
                {selectedCommit.commit.sha.substring(0, 7)} • {selectedCommit.commit.author.name} • {formatDate(selectedCommit.commit.author.date)}
              </DialogDescription>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="overview" className="h-full flex flex-col">
                  <TabsList>
                    <TabsTrigger value="overview">概览</TabsTrigger>
                    <TabsTrigger value="files">文件变更</TabsTrigger>
                    <TabsTrigger value="diff">差异对比</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="flex-1 overflow-auto">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">提交信息</h4>
                        <pre className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                          {selectedCommit.commit.message}
                        </pre>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">作者</h4>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {selectedCommit.commit.author.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{selectedCommit.commit.author.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedCommit.commit.author.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">统计</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>文件数:</span>
                              <span>{selectedCommit.files.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-600">新增:</span>
                              <span className="text-green-600">+{selectedCommit.commit.stats?.additions || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-600">删除:</span>
                              <span className="text-red-600">-{selectedCommit.commit.stats?.deletions || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(selectedCommit.commit.sha)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          复制SHA
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(selectedCommit.commit.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          在GitHub查看
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="files" className="flex-1 overflow-auto">
                    <div className="space-y-2">
                      {selectedCommit.files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded hover:bg-accent">
                          <div className={cn("flex items-center gap-1", getStatusColor(file.status))}>
                            {getStatusIcon(file.status)}
                            <span className="text-xs font-mono uppercase">
                              {file.status}
                            </span>
                          </div>
                          <span className="flex-1 text-sm font-mono">{file.filename}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-600">+{file.additions}</span>
                            <span className="text-red-600">-{file.deletions}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => handleFileCompare(file.filename, selectedCommit.commit.sha)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            对比
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="diff" className="flex-1 overflow-auto">
                    <div className="space-y-4">
                      {selectedCommit.files.map((file, index) => (
                        file.patch && (
                          <div key={index}>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              {getStatusIcon(file.status)}
                              {file.filename}
                            </h4>
                            <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                              {file.patch}
                            </pre>
                          </div>
                        )
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* File Version Compare Dialog */}
      <FileVersionCompare
        open={showFileCompare}
        onOpenChange={setShowFileCompare}
        filePath={compareFilePath}
        initialCommitSha={compareCommitSha}
      />

      {/* Rollback Confirmation Dialog */}
      {rollbackCommit && (
        <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                确认回滚操作
              </DialogTitle>
              <DialogDescription>
                将回滚到提交: {rollbackCommit.sha.substring(0, 7)} • {rollbackCommit.author.name} • {formatDate(rollbackCommit.author.date)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">提交信息</h4>
                <div className="bg-muted p-3 rounded text-sm">
                  {rollbackCommit.message}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">将要回滚的文件 ({rollbackFiles.length})</h4>
                <div className="max-h-32 overflow-auto space-y-1">
                  {rollbackFiles.map((file, index) => (
                    <div key={index} className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {file}
                    </div>
                  ))}
                </div>
              </div>

              {rollbackPreview && rollbackPreview.files.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">预览变更</h4>
                  <div className="text-sm text-muted-foreground">
                    {rollbackPreview.files.filter((f: any) => f.hasChanges).length} 个文件将被修改
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">注意</p>
                    <p className="text-yellow-700">
                      此操作将恢复文件到指定提交的状态。建议创建新提交以保持历史记录完整。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRollbackDialog(false)}
                disabled={isRollbackLoading}
              >
                取消
              </Button>
              <Button
                variant="outline"
                onClick={() => executeRollback(false)}
                disabled={isRollbackLoading}
              >
                {isRollbackLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                仅回滚文件
              </Button>
              <Button
                onClick={() => executeRollback(true)}
                disabled={isRollbackLoading}
              >
                {isRollbackLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <GitCommit className="w-4 h-4 mr-2" />
                )}
                回滚并创建提交
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
