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
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchRepositories = async (reset = false) => {
    if (!session?.accessToken) {
      console.log('No access token available');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        per_page: '20',
        sort: sortBy,
        type: filterType,
        ...(searchQuery && { search: searchQuery })
      });

      console.log('Fetching repositories with params:', params.toString());
      const response = await fetch(`/api/github/repositories?${params}`);
      const data = await response.json();

      console.log('API Response:', { status: response.status, data });

      if (response.ok) {
        if (reset) {
          setRepositories(data.repositories || []);
          setPage(1);
        } else {
          setRepositories(prev => [...prev, ...(data.repositories || [])]);
        }
        setHasMore((data.repositories || []).length === 20);
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

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchRepositories();
  };

  const handleSelectRepository = (repo: Repository) => {
    onSelectRepository(repo);
    onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            选择仓库
          </DialogTitle>
          <DialogDescription>
            从您的GitHub仓库中选择要克隆的仓库
          </DialogDescription>
        </DialogHeader>

        {/* Filters and Search */}
        <div className="flex flex-col gap-4 py-4">
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
        <ScrollArea className="flex-1 max-h-96">
          <div className="space-y-3">
            {repositories.map((repo) => (
              <Card 
                key={repo.id} 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSelectRepository(repo)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
