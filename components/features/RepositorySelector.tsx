"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Github,
  Search,
  Star,
  GitFork,
  Eye,
  Calendar,
  Lock,
  Globe,
  Loader2,
  RefreshCw,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language?: string;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  default_branch: string;
  topics: string[];
  visibility: string;
  html_url: string;
  clone_url: string;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
}

interface RepositorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRepository: (repo: Repository) => void;
}

export function RepositorySelector({ 
  open, 
  onOpenChange, 
  onSelectRepository 
}: RepositorySelectorProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // CRUD 相关状态
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [crudLoading, setCrudLoading] = useState(false);

  const fetchRepositories = async (reset = false) => {
    if (!session?.accessToken) {
      console.log('No access token available');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        per_page: '50',
        sort: sortBy,
        type: filterType,
        ...(searchQuery && { search: searchQuery })
      });

      console.log('Fetching repositories with params:', params.toString());
      const response = await fetch(`/api/github/repositories?${params}`);
      const data = await response.json();

      console.log('API Response:', { 
        status: response.status, 
        repositoriesCount: data.repositories?.length || 0,
        totalRepositories: repositories.length + (data.repositories?.length || 0),
        hasMore: (data.repositories || []).length === 50
      });

      if (response.ok) {
        if (reset) {
          setRepositories(data.repositories || []);
          setPage(1);
        } else {
          setRepositories(prev => [...prev, ...(data.repositories || [])]);
        }
        setHasMore((data.repositories || []).length === 50);
      } else {
        console.error('Failed to fetch repositories:', data.error);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && session?.accessToken) {
      fetchRepositories(true);
    }
  }, [open, session, sortBy, filterType]);

  useEffect(() => {
    if (searchQuery) {
      const debounceTimer = setTimeout(() => {
        fetchRepositories(true);
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else if (open) {
      fetchRepositories(true);
    }
  }, [searchQuery]);

  // Handle page changes for load more
  useEffect(() => {
    if (page > 1 && open && session?.accessToken) {
      fetchRepositories(false);
    }
  }, [page]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleSelectRepository = (repo: Repository) => {
    onSelectRepository(repo);
    onOpenChange(false);
  };

  // 创建仓库
  const handleCreateRepository = async () => {
    if (!session?.accessToken || !newRepoName.trim()) return;
    
    setCrudLoading(true);
    try {
      const response = await fetch('/api/github/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRepoName.trim(),
          description: newRepoDescription.trim(),
          private: newRepoPrivate,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowCreateDialog(false);
        setNewRepoName('');
        setNewRepoDescription('');
        setNewRepoPrivate(false);
        fetchRepositories(true); // 重新加载仓库列表
        toast({
          title: "创建成功",
          description: `仓库 "${newRepoName}" 已成功创建`,
        });
      } else {
        const error = await response.json();
        console.error('创建仓库失败:', error.error);
        toast({
          title: "创建失败",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('创建仓库错误:', error);
      toast({
        title: "创建失败",
        description: "网络错误或服务器异常",
        variant: "destructive",
      });
    } finally {
      setCrudLoading(false);
    }
  };

  // 编辑仓库
  const handleEditRepository = async () => {
    if (!session?.accessToken || !selectedRepo || !newRepoName.trim()) return;
    
    setCrudLoading(true);
    try {
      const response = await fetch(`/api/github/repositories/${selectedRepo.name}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRepoName.trim(),
          description: newRepoDescription.trim(),
          private: newRepoPrivate,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowEditDialog(false);
        setSelectedRepo(null);
        setNewRepoName('');
        setNewRepoDescription('');
        fetchRepositories(true); // 重新加载仓库列表
        toast({
          title: "编辑成功",
          description: `仓库 "${selectedRepo?.name}" 已成功更新`,
        });
      } else {
        const error = await response.json();
        console.error('编辑仓库失败:', error.error);
        toast({
          title: "编辑失败",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('编辑仓库错误:', error);
      toast({
        title: "编辑失败",
        description: "网络错误或服务器异常",
        variant: "destructive",
      });
    } finally {
      setCrudLoading(false);
    }
  };

  // 删除仓库
  const handleDeleteRepository = async () => {
    if (!session?.accessToken || !selectedRepo) return;
    
    setCrudLoading(true);
    try {
      // URL编码仓库名称以处理特殊字符
      const encodedRepoName = encodeURIComponent(selectedRepo.name);
      console.log('删除仓库:', selectedRepo.name, '编码后:', encodedRepoName);
      
      const response = await fetch(`/api/github/repositories/${encodedRepoName}`, {
        method: 'DELETE',
      });

      console.log('删除请求响应状态:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('删除成功响应:', result);
        setShowDeleteDialog(false);
        setSelectedRepo(null);
        fetchRepositories(true); // 重新加载仓库列表
        toast({
          title: "删除成功",
          description: `仓库 "${selectedRepo?.name}" 已成功删除`,
        });
      } else {
        const error = await response.json();
        console.error('删除仓库失败:', { 
          status: response.status, 
          error: error.error,
          repoName: selectedRepo?.name 
        });
        toast({
          title: "删除失败",
          description: `${error.error} (状态码: ${response.status})`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('删除仓库错误:', error);
      toast({
        title: "删除失败",
        description: "网络错误或服务器异常",
        variant: "destructive",
      });
    } finally {
      setCrudLoading(false);
    }
  };

  // 打开编辑对话框
  const openEditDialog = (repo: Repository) => {
    setSelectedRepo(repo);
    setNewRepoName(repo.name);
    setNewRepoDescription(repo.description || '');
    setNewRepoPrivate(repo.private);
    setShowEditDialog(true);
  };

  // 打开删除对话框
  const openDeleteDialog = (repo: Repository) => {
    setSelectedRepo(repo);
    setShowDeleteDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      C: '#555555',
      'C#': '#239120',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      Rust: '#dea584',
      Swift: '#ffac45',
      Kotlin: '#F18E33',
      Dart: '#00B4AB',
      HTML: '#e34c26',
      CSS: '#1572B6',
      Vue: '#4FC08D',
      React: '#61DAFB',
    };
    return colors[language] || '#8b949e';
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            选择仓库
          </DialogTitle>
          <DialogDescription>
            从您的GitHub仓库中选择要克隆的仓库
            {repositories.length > 0 && (
              <span className="ml-2 text-sm font-medium text-primary">
                (已加载 {repositories.length} 个仓库{hasMore ? ', 可加载更多' : ''})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex justify-start pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建仓库
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-3 py-3 flex-shrink-0">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索仓库..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">最近更新</SelectItem>
                <SelectItem value="created">创建时间</SelectItem>
                <SelectItem value="pushed">最近推送</SelectItem>
                <SelectItem value="full_name">名称</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="owner">拥有的</SelectItem>
                <SelectItem value="public">公开的</SelectItem>
                <SelectItem value="private">私有的</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Repository List */}
        <div className="h-96 overflow-y-auto">
          <div className="space-y-3 p-4">
            {repositories.map((repo, index) => (
              <Card 
                key={repo.id} 
                className="hover:bg-accent transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer" 
                      onClick={() => handleSelectRepository(repo)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm truncate">
                          {repo.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          {repo.private ? (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <Globe className="w-3 h-3 text-muted-foreground" />
                          )}
                          {repo.fork && (
                            <GitFork className="w-3 h-3 text-muted-foreground" />
                          )}
                          {repo.archived && (
                            <Badge variant="secondary" className="h-4 text-xs px-1">
                              已归档
                            </Badge>
                          )}
                        </div>
                      </div>

                      {repo.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {repo.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {repo.language && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            />
                            {repo.language}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {repo.stargazers_count}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          {repo.forks_count}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(repo.updated_at)}
                        </div>
                      </div>

                      {repo.topics && repo.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {repo.topics.slice(0, 3).map((topic) => (
                            <Badge 
                              key={topic} 
                              variant="outline" 
                              className="h-4 text-xs px-1"
                            >
                              {topic}
                            </Badge>
                          ))}
                          {repo.topics.length > 3 && (
                            <Badge variant="outline" className="h-4 text-xs px-1">
                              +{repo.topics.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 操作菜单 */}
                    <div className="flex-shrink-0 ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSelectRepository(repo)}>
                            <Github className="w-4 h-4 mr-2" />
                            选择此仓库
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditDialog(repo)}>
                            <Edit className="w-4 h-4 mr-2" />
                            编辑仓库
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(repo)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除仓库
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  加载中...
                </span>
              </div>
            )}

            {!loading && repositories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Github className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>没有找到仓库</p>
              </div>
            )}

            {!loading && hasMore && repositories.length > 0 && (
              <div className="flex justify-center py-4">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  加载更多
                </Button>
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* 创建仓库对话框 */}
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            创建新仓库
          </DialogTitle>
          <DialogDescription>
            在您的GitHub账户中创建一个新的仓库
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">仓库名称</label>
            <Input
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
              placeholder="输入仓库名称"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">描述 (可选)</label>
            <Input
              value={newRepoDescription}
              onChange={(e) => setNewRepoDescription(e.target.value)}
              placeholder="简短描述您的仓库"
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="private"
              checked={newRepoPrivate}
              onChange={(e) => setNewRepoPrivate(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="private" className="text-sm">
              设为私有仓库
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            取消
          </Button>
          <Button 
            onClick={handleCreateRepository}
            disabled={!newRepoName.trim() || crudLoading}
          >
            {crudLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            创建仓库
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* 编辑仓库对话框 */}
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            编辑仓库
          </DialogTitle>
          <DialogDescription>
            修改仓库 "{selectedRepo?.name}" 的信息
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">仓库名称</label>
            <Input
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
              placeholder="输入仓库名称"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">描述</label>
            <Input
              value={newRepoDescription}
              onChange={(e) => setNewRepoDescription(e.target.value)}
              placeholder="简短描述您的仓库"
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-private"
              checked={newRepoPrivate}
              onChange={(e) => setNewRepoPrivate(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="edit-private" className="text-sm">
              设为私有仓库
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setShowEditDialog(false)}>
            取消
          </Button>
          <Button 
            onClick={handleEditRepository}
            disabled={!newRepoName.trim() || crudLoading}
          >
            {crudLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            保存更改
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* 删除仓库确认对话框 */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            删除仓库
          </AlertDialogTitle>
          <AlertDialogDescription>
            您确定要删除仓库 "<strong>{selectedRepo?.name}</strong>" 吗？
            <br />
            <span className="text-destructive font-medium">
              此操作无法撤销，仓库中的所有数据将永久丢失。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteRepository}
            disabled={crudLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {crudLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
             </AlertDialogContent>
     </AlertDialog>
   </>
   );
 }
