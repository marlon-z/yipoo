"use client";

import { useState } from 'react';
import { ActivityBarView } from './ActivityBar';
import { FileExplorer } from '@/components/features/FileExplorer';
import { SearchView } from '@/components/features/SearchView';
import { SourceControlView } from '@/components/features/SourceControlView';
import { HistoryView } from '@/components/features/HistoryView';
import { BranchesView } from '@/components/features/BranchesView';
import { GitHubCloneView } from '@/components/features/GitHubCloneView';
import { SettingsView } from '@/components/features/SettingsView';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrimarySidebarProps {
  activeView: ActivityBarView;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  width: number;
  onWidthChange: (width: number) => void;
}

const VIEW_TITLES: Record<ActivityBarView, string> = {
  explorer: '资源管理器',
  search: '搜索',
  'source-control': '源代码管理',
  history: '历史版本',
  branches: '分支管理',
  'github-clone': 'GitHub 克隆',
  settings: '设置',
};

export function PrimarySidebar({ 
  activeView, 
  isCollapsed, 
  onToggleCollapse, 
  width,
  onWidthChange 
}: PrimarySidebarProps) {
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(600, startWidth + (e.clientX - startX)));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderView = () => {
    switch (activeView) {
      case 'explorer':
        return <FileExplorer />;
      case 'search':
        return <SearchView />;
      case 'source-control':
        return <SourceControlView />;
      case 'history':
        return <HistoryView />;
      case 'branches':
        return <BranchesView />;
      case 'github-clone':
        return <GitHubCloneView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <FileExplorer />;
    }
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div 
      className="bg-card border-r border-border flex flex-col shrink-0 relative"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="h-10 border-b border-border flex items-center justify-between px-3 bg-muted/30">
        <h2 className="text-sm font-medium text-foreground">
          {VIEW_TITLES[activeView]}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggleCollapse}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>

      {/* Resize handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors",
          isResizing && "bg-primary/30"
        )}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
