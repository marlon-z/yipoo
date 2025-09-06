"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  FileText, 
  Eye, 
  Settings, 
  GitBranch, 
  Download, 
  Moon, 
  Sun,
  PanelRight,
  Users,
  Save,
  X,
  Dot,
  FileIcon,
  FolderOpen,
  Upload,
  Copy,
  HelpCircle,
  BookOpen,
  Info,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { dwLoadTree, DWNode } from '@/lib/dw';

interface TopBarProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (value: boolean) => void;
}

interface CurrentFile {
  id: string;
  name: string;
  path: string;
  isModified: boolean;
  lastSaved?: Date;
}

interface FileStatus {
  status: 'saved' | 'saving' | 'modified' | 'error';
  message?: string;
}

export function TopBar({ isDarkMode, setIsDarkMode, isRightSidebarOpen, setIsRightSidebarOpen }: TopBarProps) {
  const { data: session, status } = useSession();
  const authed = status === 'authenticated';
  
  const [currentFile, setCurrentFile] = useState<CurrentFile | null>(null);
  const [fileStatus, setFileStatus] = useState<FileStatus>({ status: 'saved' });
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);

  // 监听文件打开事件
  useEffect(() => {
    const handleFileOpen = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; name: string; path: string; content: string }>;
      if (!ce.detail) return;
      
      setCurrentFile({
        id: ce.detail.id,
        name: ce.detail.name,
        path: ce.detail.path,
        isModified: false,
        lastSaved: new Date()
      });
      setFileStatus({ status: 'saved' });

      // 仅持久化真实文件（存在于DW树中）
      try {
        void dwLoadTree().then((tree) => {
          if (!tree) return;
          const exists = (list: DWNode[]): boolean => {
            for (const n of list) {
              if (n.id === ce.detail.id) return true;
              if (n.children && exists(n.children)) return true;
            }
            return false;
          };
          if (exists(tree)) localStorage.setItem('session:currentFileId', ce.detail.id);
        });
      } catch {}
    };

    // 监听编辑器内容变化
    const handleFileChange = () => {
      if (currentFile) {
        setCurrentFile(prev => prev ? { ...prev, isModified: true } : null);
        setFileStatus({ status: 'modified' });
      }
    };

    // 监听保存事件
    const handleFileSave = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; content: string }>;
      if (!ce.detail || !currentFile || ce.detail.id !== currentFile.id) return;
      
      setFileStatus({ status: 'saving' });
      
      // 模拟保存延迟
      setTimeout(() => {
        setCurrentFile(prev => prev ? { 
          ...prev, 
          isModified: false, 
          lastSaved: new Date() 
        } : null);
        setFileStatus({ status: 'saved' });
      }, 300);
    };

    // 监听强制保存事件
    const handleForceSave = () => {
      if (currentFile?.isModified) {
        setFileStatus({ status: 'saving' });
        window.dispatchEvent(new CustomEvent('dw-save-file', { 
          detail: { id: currentFile.id, content: '' } 
        }));
      }
    };

    window.addEventListener('open-file', handleFileOpen as EventListener);
    window.addEventListener('dw-save-file', handleFileSave as EventListener);
    window.addEventListener('dw-force-save', handleForceSave);
    document.addEventListener('input', handleFileChange, true);
    document.addEventListener('keyup', handleFileChange, true);

    return () => {
      window.removeEventListener('open-file', handleFileOpen as EventListener);
      window.removeEventListener('dw-save-file', handleFileSave as EventListener);
      window.removeEventListener('dw-force-save', handleForceSave);
      document.removeEventListener('input', handleFileChange, true);
      document.removeEventListener('keyup', handleFileChange, true);
    };
  }, [currentFile]);

  // 默认文件信息
  const displayFile = currentFile || {
    id: 'default',
    name: 'untitled-1.md',
    path: 'untitled-1.md',
    isModified: false
  };

  // 获取文件状态指示器
  const getStatusIndicator = () => {
    const baseClasses = "w-2 h-2 rounded-full transition-colors duration-200";
    
    switch (fileStatus.status) {
      case 'saved':
        return currentFile?.isModified ? 
          <Dot className="w-4 h-4 text-orange-500" /> :
          <div className={cn(baseClasses, "bg-green-500")} />;
      case 'saving':
        return <div className={cn(baseClasses, "bg-blue-500 animate-pulse")} />;
      case 'modified':
        return <Dot className="w-4 h-4 text-orange-500" />;
      case 'error':
        return <div className={cn(baseClasses, "bg-red-500")} />;
      default:
        return <div className={cn(baseClasses, "bg-gray-400")} />;
    }
  };

  // 获取状态描述
  const getStatusText = () => {
    switch (fileStatus.status) {
      case 'saved':
        return currentFile?.isModified ? '已修改' : '已保存';
      case 'saving':
        return '保存中...';
      case 'modified':
        return '已修改';
      case 'error':
        return '保存失败';
      default:
        return '未知状态';
    }
  };

  // 新建文件
  const createNewFile = () => {
    const newId = 'file_' + Date.now();
    const newName = `untitled-${Date.now()}.md`;
    
    const event = new CustomEvent('open-file', { 
      detail: { 
        id: newId, 
        name: newName, 
        path: newName, 
        content: '' 
      } 
    });
    window.dispatchEvent(event);
    toast({ title: `已创建新文件: ${newName}` });
  };

  // 关闭文件
  const closeFile = () => {
    if (currentFile?.isModified) {
      if (confirm('文件已修改，是否保存后关闭？')) {
        window.dispatchEvent(new CustomEvent('dw-force-save'));
        setTimeout(() => {
          setCurrentFile(null);
          setFileStatus({ status: 'saved' });
        }, 500);
      }
    } else {
      setCurrentFile(null);
      setFileStatus({ status: 'saved' });
    }
  };

  // 重命名文件
  const renameFile = () => {
    if (!currentFile) return;
    
    const newName = prompt('请输入新的文件名:', currentFile.name);
    if (newName && newName !== currentFile.name) {
      setCurrentFile(prev => prev ? { ...prev, name: newName, path: newName } : null);
      toast({ title: `文件已重命名为: ${newName}` });
    }
  };

  // 获取编辑器内容
  const getEditorContent = (): string => {
    // 通过自定义事件获取编辑器内容
    let content = '';
    const event = new CustomEvent('get-editor-content', { 
      detail: { callback: (editorContent: string) => { content = editorContent; } }
    });
    window.dispatchEvent(event);
    return content || '';
  };

  // 下载为Markdown文件
  const downloadAsMarkdown = (content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile?.name || 'untitled.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: `已下载文件: ${currentFile?.name || 'untitled.md'}` });
  };

  // 复制到剪贴板
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: '内容已复制到剪贴板' });
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({ title: '内容已复制到剪贴板' });
    }
  };

  // 在编辑器中打开帮助文档
  const openHelpInEditor = async (title: string, filename: string) => {
    try {
      const response = await fetch(`/api/docs/help/${filename}`);
      if (response.ok) {
        const content = await response.text();
        // 生成唯一的文件ID
        const fileId = `help_${Date.now()}`;
        const fileName = `${title}.md`;
        
        // 触发文件打开事件，在编辑器中显示帮助文档
        const event = new CustomEvent('open-file', { 
          detail: { 
            id: fileId, 
            name: fileName, 
            path: fileName, 
            content: content 
          } 
        });
        window.dispatchEvent(event);
        toast({ title: `已打开帮助文档: ${title}` });
      } else {
        toast({ title: '无法加载文档', description: '文档文件不存在或无法访问' });
      }
    } catch (error) {
      toast({ title: '加载文档失败', description: '请检查网络连接' });
    }
  };

  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg">yipoo.org</span>
        </div>
        
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                文件
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={createNewFile}>
                <FileIcon className="w-4 h-4 mr-2" />
                新建文件
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                // 触发文件选择器
                window.dispatchEvent(new CustomEvent('switch-activity-view', { 
                  detail: { view: 'explorer' } 
                }));
              }}>
                <FolderOpen className="w-4 h-4 mr-2" />
                打开文件
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                window.dispatchEvent(new CustomEvent('dw-force-save'));
                toast({ title: '已保存到本地' });
              }}>
                <Save className="w-4 h-4 mr-2" />
                保存
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                // 触发文件上传
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*,application/pdf,text/plain,text/markdown';
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && files.length > 0) {
                    window.dispatchEvent(new CustomEvent('editor-file-upload', { 
                      detail: { files } 
                    }));
                  }
                };
                input.click();
              }}>
                <Upload className="w-4 h-4 mr-2" />
                上传文件
              </DropdownMenuItem>
              <DropdownMenuItem>导入</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                编辑
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>撤销</DropdownMenuItem>
              <DropdownMenuItem>重做</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>查找</DropdownMenuItem>
              <DropdownMenuItem>替换</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4 mr-1" />
                帮助
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {
                openHelpInEditor('快速入门指南', '快速入门指南.md');
              }}>
                <BookOpen className="w-4 h-4 mr-2" />
                快速入门指南
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                openHelpInEditor('Markdown语法指南', 'Markdown语法指南.md');
              }}>
                <FileText className="w-4 h-4 mr-2" />
                Markdown 语法指南
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                openHelpInEditor('常见问题解答', '常见问题解答.md');
              }}>
                <HelpCircle className="w-4 h-4 mr-2" />
                常见问题解答
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                // 打开关于页面
                openHelpInEditor('关于 MarkdownIDE', '关于.md');
              }}>
                <Info className="w-4 h-4 mr-2" />
                关于 MarkdownIDE
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* Center Section - File Display */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu open={isFileMenuOpen} onOpenChange={setIsFileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors max-w-xs"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{displayFile.name}</span>
                    {getStatusIndicator()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <div className="px-3 py-2 text-sm border-b">
                    <div className="font-medium">{displayFile.name}</div>
                    <div className="text-muted-foreground text-xs">{getStatusText()}</div>
                    {currentFile?.lastSaved && (
                      <div className="text-muted-foreground text-xs">
                        最后保存: {currentFile.lastSaved.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={renameFile} disabled={!currentFile}>
                    重命名
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      if (currentFile?.isModified) {
                        window.dispatchEvent(new CustomEvent('dw-force-save'));
                      }
                    }}
                    disabled={!currentFile?.isModified}
                  >
                    保存
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={closeFile}
                    disabled={!currentFile}
                    className="text-red-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    关闭文件
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div>文件: {displayFile.name}</div>
                <div>状态: {getStatusText()}</div>
                {currentFile?.lastSaved && (
                  <div>最后保存: {currentFile.lastSaved.toLocaleTimeString()}</div>
                )}
                <div className="mt-1 text-muted-foreground">点击查看更多选项</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* 移除同步 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => {
              // 获取编辑器内容并下载为Markdown文件
              const content = getEditorContent();
              if (content) {
                downloadAsMarkdown(content);
              }
            }}>
              <Download className="w-4 h-4 mr-2" />
              下载为 Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              // 复制编辑器内容到剪贴板
              const content = getEditorContent();
              if (content) {
                copyToClipboard(content);
              }
            }}>
              <Copy className="w-4 h-4 mr-2" />
              复制内容
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 移除协作 */}

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Auth menu */}
        {!authed ? (
          <Button variant="default" size="sm" onClick={() => signIn('github', { callbackUrl: '/' })}>
            登录
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={(session?.user as any)?.image || ''} alt={(session?.user as any)?.name || 'avatar'} />
                  <AvatarFallback className="text-xs">{((session?.user as any)?.name || 'U').slice(0,1)}</AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm">{(session?.user as any)?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 text-sm">
                <div className="font-medium">{(session?.user as any)?.name}</div>
                <div className="text-muted-foreground">{(session?.user as any)?.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>个人资料</DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>设置</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/' })}>退出登录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 右侧栏开关放在最右侧 */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        >
          <PanelRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}