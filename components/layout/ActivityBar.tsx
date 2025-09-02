"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  FileText, 
  Search, 
  GitBranch, 
  History, 
  Network,
  Cloud,
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
    id: 'source-control',
    icon: Cloud,
    title: '代码仓库',
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
    icon: GitBranch,
    title: '分支网络',
    shortcut: 'Ctrl+Shift+B',
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
                "relative w-12 h-11 rounded-none border-l-2 border-transparent hover:bg-accent/50 transition-all duration-300 group",
                "hover:scale-105 hover:shadow-lg hover:shadow-accent/20",
                "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-accent/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
                isActive && "bg-accent/80 border-l-primary text-accent-foreground shadow-md backdrop-blur-sm scale-105"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="w-5 h-5 stroke-[1.5] transition-all duration-300 group-hover:scale-115 group-hover:rotate-1 group-active:scale-95" />
              {badge && badge > 0 && (
                <div className="absolute -top-1.5 -right-1.5 z-20 animate-in fade-in zoom-in duration-300 drop-shadow-sm">
                  {badge <= 3 ? (
                    <Badge 
                      variant="minimal" 
                      className="h-4 w-auto px-1 py-0 text-xs flex items-center justify-center min-w-[16px] font-semibold leading-none rounded-full"
                    >
                      {badge > 99 ? '99+' : badge}
                    </Badge>
                  ) : badge <= 10 ? (
                    <Badge 
                      variant="modern" 
                      className="h-4 w-auto px-1 py-0 text-xs flex items-center justify-center min-w-[16px] font-semibold leading-none rounded-full"
                    >
                      {badge > 99 ? '99+' : badge}
                    </Badge>
                  ) : badge <= 50 ? (
                <Badge 
                      variant="premium" 
                      className="h-4 w-auto px-1 py-0 text-xs flex items-center justify-center min-w-[16px] font-semibold leading-none animate-pulse rounded-full"
                >
                  {badge > 99 ? '99+' : badge}
                </Badge>
                  ) : (
                    <Badge 
                      variant="elegant" 
                      className="h-5 w-auto px-1.5 py-0 text-xs flex items-center justify-center min-w-[18px] font-bold leading-none border-2 border-red-400/50 rounded-full"
                    >
                      {badge > 999 ? '999+' : badge}
                    </Badge>
                  )}
                </div>
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
    <div className="relative w-12 bg-gradient-to-b from-card via-card/95 to-card/90 border-r border-border/50 flex flex-col shrink-0 backdrop-blur-sm">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      {/* Top items */}
      <div className="relative flex flex-col z-10">
        {topItems.map(renderActivityBarItem)}
      </div>
      
      {/* Spacer with subtle gradient */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/2 to-transparent" />
      </div>
      
      {/* Bottom items */}
      <div className="relative flex flex-col z-10">
        {bottomItems.map(renderActivityBarItem)}
      </div>
      
      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}
