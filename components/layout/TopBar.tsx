"use client";

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
  Save
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TopBarProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (value: boolean) => void;
}

export function TopBar({ isDarkMode, setIsDarkMode, isRightSidebarOpen, setIsRightSidebarOpen }: TopBarProps) {
  const { data: session, status } = useSession();
  const authed = status === 'authenticated';

  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg">MarkdownIDE</span>
        </div>
        
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                文件
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>新建文件</DropdownMenuItem>
              <DropdownMenuItem>打开文件</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => {
                window.dispatchEvent(new CustomEvent('dw-force-save'));
                toast({ title: '已保存到本地' });
              }}>保存</DropdownMenuItem>
              <DropdownMenuSeparator />
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
                视图
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>所见即所得</DropdownMenuItem>
              <DropdownMenuItem>源码模式</DropdownMenuItem>
              <DropdownMenuItem>分屏模式</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>全屏</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>untitled-1.md</span>
        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <GitBranch className="w-4 h-4 mr-1" />
          同步
        </Button>
        
        <Button variant="ghost" size="sm">
          <Download className="w-4 h-4 mr-1" />
          导出
        </Button>

        <Button variant="ghost" size="sm">
          <Users className="w-4 h-4 mr-1" />
          协作
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        >
          <PanelRight className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={() => { window.dispatchEvent(new CustomEvent('dw-force-save')); toast({ title: '已保存到本地' }); }}>
          <Save className="w-4 h-4 mr-1" /> 保存
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

        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}