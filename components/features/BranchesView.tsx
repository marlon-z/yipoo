"use client";

import { useState } from 'react';
import { useGitBranches } from '@/hooks/use-git';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  GitBranch,
  GitFork,
  Check,
  Plus,
  Trash2,
  GitMerge,
  Download,
  Upload,
  RefreshCw,
  Globe,
  Laptop
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Using GitBranch interface from lib/git.ts

// Remove mock data - now using real Git data

export function BranchesView() {
  const [newBranchName, setNewBranchName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBaseBranch, setSelectedBaseBranch] = useState('main');

  // Use real Git data
  const { 
    branches: gitBranches, 
    isLoading, 
    error, 
    refreshBranches,
    createBranch: gitCreateBranch,
    switchBranch: gitSwitchBranch,
    deleteBranch: gitDeleteBranch
  } = useGitBranches();

  const localBranches = gitBranches.filter(branch => branch.type === 'local');
  const remoteBranches = gitBranches.filter(branch => branch.type === 'remote');
  const currentBranch = gitBranches.find(branch => branch.current);

  const createBranch = async () => {
    if (!newBranchName.trim()) return;
    
    const success = await gitCreateBranch(newBranchName, selectedBaseBranch);
    if (success) {
      setNewBranchName('');
      setShowCreateDialog(false);
    }
  };

  const switchToBranch = async (branchName: string) => {
    await gitSwitchBranch(branchName);
  };

  const deleteBranch = async (branchName: string) => {
    const confirmed = window.confirm(`确定要删除分支 "${branchName}" 吗？`);
    if (confirmed) {
      await gitDeleteBranch(branchName);
    }
  };

  const mergeBranch = (branchName: string) => {
    // TODO: Implement merge functionality
    console.log('Merging branch:', branchName);
  };

  const pullBranch = (branchName: string) => {
    // TODO: Implement pull functionality
    console.log('Pulling branch:', branchName);
  };

  const pushBranch = (branchName: string) => {
    // TODO: Implement push functionality
    console.log('Pushing branch:', branchName);
  };

  const renderBranchItem = (branch: any) => {
    const isRemote = branch.type === 'remote';
    const displayName = isRemote ? branch.name.replace('origin/', '') : branch.name;

    return (
      <ContextMenu key={branch.name}>
        <ContextMenuTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-3 p-3 hover:bg-accent rounded-md cursor-pointer group transition-colors",
              branch.current && "bg-accent/50 border border-primary/20"
            )}
            onDoubleClick={() => !branch.current && !isRemote && switchToBranch(branch.name)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {isRemote ? (
                  <Globe className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Laptop className="w-4 h-4 text-blue-500" />
                )}
                {branch.current && <Check className="w-3 h-3 text-green-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm truncate",
                    branch.current && "font-medium text-green-600 dark:text-green-400"
                  )}>
                    {displayName}
                  </span>
                  {branch.upstream && !isRemote && (
                    <span className="text-xs text-muted-foreground">
                      → {branch.upstream.replace('origin/', '')}
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground truncate">
                  {branch.lastCommit.message} · {branch.lastCommit.author} · {branch.lastCommit.time}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {branch.ahead !== undefined && branch.ahead > 0 && (
                <Badge variant="outline" className="h-4 text-xs px-1">
                  ↑{branch.ahead}
                </Badge>
              )}
              {branch.behind !== undefined && branch.behind > 0 && (
                <Badge variant="outline" className="h-4 text-xs px-1">
                  ↓{branch.behind}
                </Badge>
              )}
              
              <Badge 
                variant={isRemote ? "secondary" : "default"} 
                className="h-4 text-xs px-1"
              >
                {isRemote ? '远程' : '本地'}
              </Badge>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          {!branch.current && !isRemote && (
            <ContextMenuItem onClick={() => switchToBranch(branch.name)}>
              <GitBranch className="w-4 h-4 mr-2" />
              切换到此分支
            </ContextMenuItem>
          )}
          
          {!isRemote && (
            <>
              <ContextMenuItem onClick={() => mergeBranch(branch.name)}>
                <GitMerge className="w-4 h-4 mr-2" />
                合并到当前分支
              </ContextMenuItem>
              
              {branch.upstream && (
                <ContextMenuItem onClick={() => pullBranch(branch.name)}>
                  <Download className="w-4 h-4 mr-2" />
                  拉取更新
                </ContextMenuItem>
              )}
              
              <ContextMenuItem onClick={() => pushBranch(branch.name)}>
                <Upload className="w-4 h-4 mr-2" />
                推送分支
              </ContextMenuItem>
            </>
          )}
          
          <ContextMenuSeparator />
          
          {!branch.current && (
            <ContextMenuItem 
              onClick={() => deleteBranch(branch.name)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除分支
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">分支管理</h2>
          <div className="flex gap-1">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>创建新分支</DialogTitle>
                  <DialogDescription>
                    从现有分支创建一个新的分支
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">分支名称</label>
                    <Input
                      placeholder="feature/new-feature"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">基于分支</label>
                    <Select value={selectedBaseBranch} onValueChange={setSelectedBaseBranch}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {localBranches.map(branch => (
                          <SelectItem key={branch.name} value={branch.name}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={createBranch} disabled={!newBranchName.trim()}>
                    创建分支
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={refreshBranches}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {currentBranch && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="w-4 h-4 text-green-500" />
                <span className="font-medium">当前分支: {currentBranch.name}</span>
              </div>
              {currentBranch.upstream && (
                <div className="text-xs text-muted-foreground mt-1">
                  跟踪: {currentBranch.upstream}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Branch lists */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <RefreshCw className="w-12 h-12 mb-4 opacity-50 animate-spin" />
            <p className="text-sm">正在加载分支信息...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <GitBranch className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={refreshBranches}
            >
              重试
            </Button>
          </div>
        ) : gitBranches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <GitBranch className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">没有找到分支</p>
          </div>
        ) : (
          <>
            {/* Local branches */}
            {localBranches.length > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Laptop className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-medium">本地分支 ({localBranches.length})</h3>
                </div>
                <div className="space-y-1">
                  {localBranches.map(renderBranchItem)}
                </div>
              </div>
            )}

            {localBranches.length > 0 && remoteBranches.length > 0 && <Separator />}

            {/* Remote branches */}
            {remoteBranches.length > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">远程分支 ({remoteBranches.length})</h3>
                </div>
                <div className="space-y-1">
                  {remoteBranches.map(renderBranchItem)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="p-3 border-t border-border">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full h-7 text-xs">
              <GitMerge className="w-3 h-3 mr-1" />
              合并到 main
            </Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-xs">
              <Download className="w-3 h-3 mr-1" />
              从 main 拉取更新
            </Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-xs">
              <GitFork className="w-3 h-3 mr-1" />
              创建 Pull Request
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
