"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Github,
  Download,
  GitBranch,
  Folder,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { githubService } from '@/lib/github';
import { githubIntegration } from '@/lib/github-integration';
import { RepositorySelector, Repository } from './RepositorySelector';
import { useSession } from 'next-auth/react';

interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
  url: string;
}

export function GitHubCloneView() {
  const { data: session, status } = useSession();
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showRepositorySelector, setShowRepositorySelector] = useState(false);
  const [cloneProgress, setCloneProgress] = useState<{
    status: 'idle' | 'analyzing' | 'downloading' | 'complete' | 'error';
    message: string;
    progress?: number;
  }>({ status: 'idle', message: '' });

  // Set GitHub token when session changes
  React.useEffect(() => {
    if (session?.accessToken) {
      githubService.setAuthToken(session.accessToken);
    }
  }, [session]);

  const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
      /^([^\/]+)\/([^\/]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    }
    return null;
  };

  const analyzeRepository = async () => {
    if (!repoUrl.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const parsed = parseGitHubUrl(repoUrl.trim());
      if (!parsed) {
        throw new Error('无效的GitHub仓库URL或格式');
      }

      const success = await githubService.setRepository(parsed.owner, parsed.repo);
      if (!success) {
        throw new Error('无法访问该仓库，请检查仓库是否存在或您是否有访问权限');
      }

      const branchList = await githubService.getBranches();
      setBranches(branchList);
      setSelectedBranch(branchList.includes('main') ? 'main' : branchList[0] || 'main');

      setRepoInfo({
        owner: parsed.owner,
        repo: parsed.repo,
        branch: selectedBranch,
        url: repoUrl
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : '分析仓库时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const startClone = async () => {
    if (!repoInfo) return;

    setShowCloneDialog(true);
    setCloneProgress({ status: 'analyzing', message: '正在分析仓库结构...' });

    try {
      // Update repository with selected branch
      await githubService.setRepository(repoInfo.owner, repoInfo.repo, selectedBranch);

      setCloneProgress({ status: 'downloading', message: '正在下载文件...', progress: 0 });

      // Simulate progress for better UX
      const progressSteps = [20, 40, 60, 80, 100];
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setCloneProgress({ 
          status: 'downloading', 
          message: `正在下载文件... (${progressSteps[i]}%)`,
          progress: progressSteps[i]
        });
      }

      const result = await githubIntegration.cloneRepositoryToLocal({
        maxFileSize: 1024 * 1024, // 1MB limit
        excludePatterns: [
          '*.png', '*.jpg', '*.jpeg', '*.gif', '*.svg',
          '*.pdf', '*.zip', '*.tar.gz',
          'package-lock.json', 'yarn.lock'
        ]
      });
      
      if (result.success) {
        setCloneProgress({ 
          status: 'complete', 
          message: `仓库克隆完成！已克隆 ${result.filesCloned} 个文件` 
        });
        
        if (result.errors.length > 0) {
          console.warn('Clone completed with some errors:', result.errors);
        }
        
        setTimeout(() => {
          setShowCloneDialog(false);
          // Trigger file explorer refresh
          window.dispatchEvent(new CustomEvent('refresh-file-explorer'));
        }, 2000);
      } else {
        throw new Error(`克隆失败: ${result.errors.join(', ')}`);
      }

    } catch (err) {
      setCloneProgress({ 
        status: 'error', 
        message: err instanceof Error ? err.message : '克隆失败' 
      });
    }
  };

  const handleRepositorySelect = async (repository: Repository) => {
    try {
      setIsLoading(true);
      setError(null);

      // Set repository info
      setRepoInfo({
        owner: repository.owner.login,
        repo: repository.name,
        branch: repository.default_branch,
        url: repository.html_url
      });

      // Set repository in GitHub service
      const success = await githubService.setRepository(
        repository.owner.login, 
        repository.name, 
        repository.default_branch
      );

      if (!success) {
        throw new Error('无法设置仓库');
      }

      // Get branches
      const branchList = await githubService.getBranches();
      setBranches(branchList);
      setSelectedBranch(repository.default_branch);

    } catch (err) {
      setError(err instanceof Error ? err.message : '选择仓库时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = status === 'authenticated';

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub 克隆
          </h2>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              请先在右上角登录 GitHub 后使用仓库克隆功能
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
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Github className="w-4 h-4" />
          GitHub 克隆
        </h2>
      </div>

      {/* Repository Selection */}
      <div className="p-3 space-y-3">
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowRepositorySelector(true)}
            className="flex-1"
            variant="default"
          >
            <Github className="w-4 h-4 mr-2" />
            选择我的仓库
          </Button>
        </div>

        <Separator />

        <div>
          <label className="text-sm font-medium">或输入仓库地址</label>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="https://github.com/owner/repo 或 owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && analyzeRepository()}
            />
            <Button 
              onClick={analyzeRepository}
              disabled={!repoUrl.trim() || isLoading}
              size="sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '分析'}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {repoInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Github className="w-4 h-4" />
                {repoInfo.owner}/{repoInfo.repo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">选择分支</label>
                <select 
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  {branches.map(branch => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selectedBranch}</span>
                <Badge variant="outline" className="h-4 text-xs px-1">
                  {branches.length} 个分支
                </Badge>
              </div>

              <Button 
                onClick={startClone}
                className="w-full"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                克隆到本地
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Repositories */}
      <div className="flex-1 overflow-auto">
        <div className="p-3">
          <h3 className="text-sm font-medium mb-3">最近访问的仓库</h3>
          <div className="space-y-2">
            {/* TODO: Implement recent repositories */}
            <div className="text-sm text-muted-foreground text-center py-4">
              暂无最近访问的仓库
            </div>
          </div>
        </div>
      </div>

      {/* Clone Progress Dialog */}
      <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>克隆仓库</DialogTitle>
            <DialogDescription>
              正在从 GitHub 克隆仓库到本地
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {cloneProgress.status === 'complete' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : cloneProgress.status === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
              <span className="text-sm">{cloneProgress.message}</span>
            </div>

            {cloneProgress.progress !== undefined && (
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${cloneProgress.progress}%` }}
                />
              </div>
            )}
          </div>

          {(cloneProgress.status === 'complete' || cloneProgress.status === 'error') && (
            <DialogFooter>
              <Button onClick={() => setShowCloneDialog(false)}>
                关闭
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Repository Selector */}
      <RepositorySelector
        open={showRepositorySelector}
        onOpenChange={setShowRepositorySelector}
        onSelectRepository={handleRepositorySelect}
      />
    </div>
  );
}
