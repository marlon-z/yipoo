"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  FileText, 
  Search, 
  GitBranch, 
  History, 
  GitFork,
  Github,
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActivityBarView = 'explorer' | 'search' | 'source-control' | 'history' | 'branches' | 'github-clone' | 'settings';

interface ActivityBarItem {
  id: ActivityBarView;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  shortcut: string;
  badge?: number;
  position?: 'top' | 'bottom';
}

interface ActivityBarProps {
  activeView: ActivityBarView;
  onViewChange: (view: ActivityBarView) => void;
  badges?: {
    sourceControl?: number;
    search?: number;
    history?: number;
  };
}

const activityBarItems: ActivityBarItem[] = [
  {
    id: 'explorer',
    icon: FileText,
    title: '资源管理器',
    shortcut: 'Ctrl+Shift+E',
    position: 'top',
  },
  {
    id: 'search',
    icon: Search,
    title: '搜索',
    shortcut: 'Ctrl+Shift+F',
    position: 'top',
  },
  {
    id: 'source-control',
    icon: GitBranch,
    title: '源代码管理',
    shortcut: 'Ctrl+Shift+G',
    position: 'top',
  },
  {
    id: 'history',
    icon: History,
    title: '历史版本',
    shortcut: 'Ctrl+Shift+H',
    position: 'top',
  },
  {
    id: 'branches',
    icon: GitFork,
    title: '分支管理',
    shortcut: 'Ctrl+Shift+B',
    position: 'top',
  },
  {
    id: 'github-clone',
    icon: Github,
    title: 'GitHub 克隆',
    shortcut: 'Ctrl+Shift+C',
    position: 'top',
  },
  {
    id: 'settings',
    icon: Settings,
    title: '设置',
    shortcut: 'Ctrl+,',
    position: 'bottom',
  },
];

export function ActivityBar({ activeView, onViewChange, badges }: ActivityBarProps) {
  const topItems = activityBarItems.filter(item => item.position !== 'bottom');
  const bottomItems = activityBarItems.filter(item => item.position === 'bottom');

  const renderActivityBarItem = (item: ActivityBarItem) => {
    const isActive = activeView === item.id;
    const badge = badges?.[item.id as keyof typeof badges];
    const Icon = item.icon;

    return (
      <TooltipProvider key={item.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative w-12 h-12 rounded-none border-l-2 border-transparent hover:bg-accent/50 transition-colors",
                isActive && "bg-accent border-l-primary text-accent-foreground"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="w-6 h-6" />
              {badge && badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[20px]"
                >
                  {badge > 99 ? '99+' : badge}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            <div className="text-sm">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.shortcut}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="w-12 bg-card border-r border-border flex flex-col shrink-0">
      {/* Top items */}
      <div className="flex flex-col">
        {topItems.map(renderActivityBarItem)}
      </div>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Bottom items */}
      <div className="flex flex-col">
        {bottomItems.map(renderActivityBarItem)}
      </div>
    </div>
  );
}
