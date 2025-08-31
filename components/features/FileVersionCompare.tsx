"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GitCommit,
  FileText,
  ArrowLeft,
  ArrowRight,
  Copy,
  Download,
  RotateCcw,
  Eye,
  Code,
  Loader2
} from 'lucide-react';
import { githubService, GitHubCommit } from '@/lib/github';
import { cn } from '@/lib/utils';

interface FileVersionCompareProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  initialCommitSha?: string;
}

interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export function FileVersionCompare({ 
  open, 
  onOpenChange, 
  filePath, 
  initialCommitSha 
}: FileVersionCompareProps) {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [selectedCommit1, setSelectedCommit1] = useState<string>('');
  const [selectedCommit2, setSelectedCommit2] = useState<string>('');
  const [fileContent1, setFileContent1] = useState<string>('');
  const [fileContent2, setFileContent2] = useState<string>('');
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  useEffect(() => {
    if (open) {
      loadFileHistory();
    }
  }, [open, filePath]);

  useEffect(() => {
    if (initialCommitSha && commits.length > 0) {
      setSelectedCommit1(initialCommitSha);
      if (commits.length > 1) {
        const currentIndex = commits.findIndex(c => c.sha === initialCommitSha);
        if (currentIndex > 0) {
          setSelectedCommit2(commits[currentIndex - 1].sha);
        }
      }
    }
  }, [initialCommitSha, commits]);

  useEffect(() => {
    if (selectedCommit1 && selectedCommit2) {
      loadFileContents();
    }
  }, [selectedCommit1, selectedCommit2]);

  const loadFileHistory = async () => {
    setIsLoading(true);
    try {
      const history = await githubService.getFileHistory(filePath, {
        per_page: 50
      });
      setCommits(history);
      
      if (history.length > 0) {
        setSelectedCommit1(history[0].sha);
        if (history.length > 1) {
          setSelectedCommit2(history[1].sha);
        }
      }
    } catch (error) {
      console.error('Failed to load file history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFileContents = async () => {
    setIsLoadingContent(true);
    try {
      const [content1, content2] = await Promise.all([
        githubService.getFileAtCommit(filePath, selectedCommit1),
        githubService.getFileAtCommit(filePath, selectedCommit2)
      ]);
      
      setFileContent1(content1);
      setFileContent2(content2);
      generateDiff(content1, content2);
    } catch (error) {
      console.error('Failed to load file contents:', error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const generateDiff = (content1: string, content2: string) => {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const diff: DiffLine[] = [];

    // Simple diff algorithm (for production, consider using a proper diff library)
    let i = 0, j = 0;
    let lineNum1 = 1, lineNum2 = 1;

    while (i < lines1.length || j < lines2.length) {
      if (i >= lines1.length) {
        // Only lines2 remaining (additions)
        diff.push({
          type: 'add',
          newLineNumber: lineNum2,
          content: lines2[j]
        });
        j++;
        lineNum2++;
      } else if (j >= lines2.length) {
        // Only lines1 remaining (deletions)
        diff.push({
          type: 'remove',
          oldLineNumber: lineNum1,
          content: lines1[i]
        });
        i++;
        lineNum1++;
      } else if (lines1[i] === lines2[j]) {
        // Lines are the same (context)
        diff.push({
          type: 'context',
          oldLineNumber: lineNum1,
          newLineNumber: lineNum2,
          content: lines1[i]
        });
        i++;
        j++;
        lineNum1++;
        lineNum2++;
      } else {
        // Lines are different
        diff.push({
          type: 'remove',
          oldLineNumber: lineNum1,
          content: lines1[i]
        });
        diff.push({
          type: 'add',
          newLineNumber: lineNum2,
          content: lines2[j]
        });
        i++;
        j++;
        lineNum1++;
        lineNum2++;
      }
    }

    setDiffLines(diff);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCommitTitle = (sha: string) => {
    const commit = commits.find(c => c.sha === sha);
    return commit ? `${commit.message.split('\n')[0]} (${sha.substring(0, 7)})` : sha.substring(0, 7);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            文件版本对比
          </DialogTitle>
          <DialogDescription>
            {filePath}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">加载文件历史...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Version Selectors */}
            <div className="flex items-center gap-4 p-4 border-b">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">版本 1 (旧版本)</label>
                <Select value={selectedCommit1} onValueChange={setSelectedCommit1}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择版本..." />
                  </SelectTrigger>
                  <SelectContent>
                    {commits.map((commit) => (
                      <SelectItem key={commit.sha} value={commit.sha}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {commit.message.split('\n')[0]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {commit.author.name} • {formatDate(commit.author.date)} • {commit.sha.substring(0, 7)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ArrowRight className="w-4 h-4 text-muted-foreground" />

              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">版本 2 (新版本)</label>
                <Select value={selectedCommit2} onValueChange={setSelectedCommit2}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择版本..." />
                  </SelectTrigger>
                  <SelectContent>
                    {commits.map((commit) => (
                      <SelectItem key={commit.sha} value={commit.sha}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {commit.message.split('\n')[0]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {commit.author.name} • {formatDate(commit.author.date)} • {commit.sha.substring(0, 7)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="split">分屏</SelectItem>
                    <SelectItem value="unified">统一</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            {isLoadingContent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">加载文件内容...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                {viewMode === 'split' ? (
                  <div className="flex h-full">
                    {/* Left Panel - Version 1 */}
                    <div className="flex-1 flex flex-col border-r">
                      <div className="p-3 border-b bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">旧版本</Badge>
                            <span className="text-sm font-medium">
                              {getCommitTitle(selectedCommit1)}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(fileContent1)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile(fileContent1, `${filePath}.${selectedCommit1.substring(0, 7)}`)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <ScrollArea className="flex-1">
                        <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                          {fileContent1}
                        </pre>
                      </ScrollArea>
                    </div>

                    {/* Right Panel - Version 2 */}
                    <div className="flex-1 flex flex-col">
                      <div className="p-3 border-b bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">新版本</Badge>
                            <span className="text-sm font-medium">
                              {getCommitTitle(selectedCommit2)}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(fileContent2)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile(fileContent2, `${filePath}.${selectedCommit2.substring(0, 7)}`)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <ScrollArea className="flex-1">
                        <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                          {fileContent2}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  /* Unified Diff View */
                  <div className="flex flex-col h-full">
                    <div className="p-3 border-b bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">差异对比</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            新增
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            删除
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-300 rounded"></div>
                            上下文
                          </span>
                        </div>
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="font-mono text-sm">
                        {diffLines.map((line, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center px-4 py-0.5 border-l-2",
                              line.type === 'add' && "bg-green-50 border-green-500",
                              line.type === 'remove' && "bg-red-50 border-red-500",
                              line.type === 'context' && "bg-gray-50 border-gray-300"
                            )}
                          >
                            <div className="w-12 text-xs text-muted-foreground text-right mr-4">
                              {line.oldLineNumber || ''}
                            </div>
                            <div className="w-12 text-xs text-muted-foreground text-right mr-4">
                              {line.newLineNumber || ''}
                            </div>
                            <div className="w-4 text-center mr-2">
                              {line.type === 'add' && <span className="text-green-600">+</span>}
                              {line.type === 'remove' && <span className="text-red-600">-</span>}
                              {line.type === 'context' && <span className="text-gray-400"> </span>}
                            </div>
                            <pre className="flex-1 whitespace-pre-wrap">{line.content}</pre>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
