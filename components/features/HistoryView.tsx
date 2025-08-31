"use client";

import { useState, useMemo } from 'react';
import { useGitCommitHistory } from '@/hooks/use-git';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  History,
  Search,
  Filter,
  RefreshCw,
  GitCommit,
  Clock,
  User,
  FileText,
  Eye,
  Copy,
  Download,
  RotateCcw,
  Tag,
  GitCompare,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Using GitCommit interface from lib/git.ts

type ViewMode = 'list' | 'graph' | 'file-history';
type TimeFilter = 'today' | '7days' | '30days' | 'all' | 'custom';

// Remove mock data - now using real Git data

export function HistoryView() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  const [authorFilter, setAuthorFilter] = useState<string>('');

  // Use real Git data
  const { commits: gitCommits, isLoading, error, refreshCommitHistory } = useGitCommitHistory();

  const filteredCommits = useMemo(() => {
    let filtered = gitCommits;

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (timeFilter) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case '7days':
          cutoff.setDate(now.getDate() - 7);
          break;
        case '30days':
          cutoff.setDate(now.getDate() - 30);
          break;
      }
      
      filtered = filtered.filter(commit => commit.timestamp >= cutoff);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(commit => 
        commit.message.toLowerCase().includes(query) ||
        commit.description?.toLowerCase().includes(query) ||
        commit.author.name.toLowerCase().includes(query) ||
        commit.shortHash.toLowerCase().includes(query)
      );
    }

    // Author filter
    if (authorFilter) {
      filtered = filtered.filter(commit => commit.author.name === authorFilter);
    }

    return filtered;
  }, [gitCommits, timeFilter, searchQuery, authorFilter]);

  const uniqueAuthors = useMemo(() => {
    const authors = new Set(gitCommits.map(commit => commit.author.name));
    return Array.from(authors);
  }, [gitCommits]);

  const toggleCommitExpansion = (commitId: string) => {
    const newExpanded = new Set(expandedCommits);
    if (newExpanded.has(commitId)) {
      newExpanded.delete(commitId);
    } else {
      newExpanded.add(commitId);
    }
    setExpandedCommits(newExpanded);
  };

  const toggleCommitSelection = (commitId: string) => {
    const newSelected = new Set(selectedCommits);
    if (newSelected.has(commitId)) {
      newSelected.delete(commitId);
    } else {
      newSelected.add(commitId);
    }
    setSelectedCommits(newSelected);
  };

  const getFileIcon = (status: string) => {
    switch (status) {
      case 'added': return <Plus className="w-3 h-3 text-green-500" />;
      case 'deleted': return <Minus className="w-3 h-3 text-red-500" />;
      case 'modified': return <FileText className="w-3 h-3 text-blue-500" />;
      case 'renamed': return <FileText className="w-3 h-3 text-yellow-500" />;
      default: return <FileText className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const renderCommitItem = (commit: CommitInfo) => {
    const isExpanded = expandedCommits.has(commit.id);
    const isSelected = selectedCommits.has(commit.id);

    return (
      <ContextMenu key={commit.id}>
        <ContextMenuTrigger asChild>
          <Card className={cn(
            "mb-3 transition-colors cursor-pointer",
            isSelected && "ring-2 ring-primary"
          )}>
            <CardContent className="p-4">
              {/* Commit header */}
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={commit.author.avatar} />
                  <AvatarFallback className="text-xs">
                    {commit.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium truncate">
                      {commit.message}
                    </h3>
                    {commit.tags && commit.tags.length > 0 && (
                      <div className="flex gap-1">
                        {commit.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="h-4 text-xs px-1">
                            <Tag className="w-2 h-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {commit.description && isExpanded && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {commit.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {commit.author.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {commit.relativeTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <GitCommit className="w-3 h-3" />
                      {commit.shortHash}
                    </div>
                    <Badge variant="outline" className="h-4 px-1">
                      +{commit.stats.additions} -{commit.stats.deletions}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleCommitExpansion(commit.id)}
                  >
                    {isExpanded ? 
                      <ChevronDown className="w-3 h-3" /> : 
                      <ChevronRight className="w-3 h-3" />
                    }
                  </Button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-3 pl-11">
                  <Separator className="mb-3" />
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      文件更改 ({commit.files.length})
                    </h4>
                    
                    {commit.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs group">
                        {getFileIcon(file.status)}
                        <span className="flex-1 font-mono">{file.path}</span>
                        <span className="text-muted-foreground">
                          +{file.additions} -{file.deletions}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                      <Eye className="w-3 h-3 mr-1" />
                      查看详情
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                      <GitCompare className="w-3 h-3 mr-1" />
                      比较
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      恢复
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem>
            <Eye className="w-4 h-4 mr-2" />
            查看提交详情
          </ContextMenuItem>
          <ContextMenuItem>
            <Copy className="w-4 h-4 mr-2" />
            复制提交哈希
          </ContextMenuItem>
          <ContextMenuItem>
            <Tag className="w-4 h-4 mr-2" />
            创建标签
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <RotateCcw className="w-4 h-4 mr-2" />
            回滚此提交
          </ContextMenuItem>
          <ContextMenuItem>
            <Download className="w-4 h-4 mr-2" />
            导出为补丁
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 border-b border-border space-y-3">
        {/* View mode and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">列表</SelectItem>
                <SelectItem value="graph">图形</SelectItem>
                <SelectItem value="file-history">文件历史</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={refreshCommitHistory}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input 
            placeholder="搜索提交..." 
            className="h-7 pl-7 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
            <SelectTrigger className="w-20 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今天</SelectItem>
              <SelectItem value="7days">7天</SelectItem>
              <SelectItem value="30days">30天</SelectItem>
              <SelectItem value="all">全部</SelectItem>
            </SelectContent>
          </Select>

          <Select value={authorFilter || "all"} onValueChange={(value) => setAuthorFilter(value === "all" ? "" : value)}>
            <SelectTrigger className="w-20 h-6 text-xs">
              <SelectValue placeholder="作者" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部作者</SelectItem>
              {uniqueAuthors.map(author => (
                <SelectItem key={author} value={author}>{author}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <RefreshCw className="w-12 h-12 mb-4 opacity-50 animate-spin" />
            <p className="text-sm">正在加载提交历史...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <History className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={refreshCommitHistory}
            >
              重试
            </Button>
          </div>
        ) : filteredCommits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <History className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">
              {gitCommits.length === 0 ? '没有提交记录' : '没有找到匹配的提交记录'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredCommits.map(renderCommitItem)}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="h-6 px-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
        <span>{filteredCommits.length} 个提交</span>
        {selectedCommits.size > 0 && (
          <span>已选择 {selectedCommits.size} 个</span>
        )}
      </div>
    </div>
  );
}
