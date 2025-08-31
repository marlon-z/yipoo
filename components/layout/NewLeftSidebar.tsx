"use client";

import { useState, useEffect } from 'react';
import { ActivityBar, ActivityBarView } from './ActivityBar';
import { PrimarySidebar } from './PrimarySidebar';

interface NewLeftSidebarProps {
  className?: string;
}

export function NewLeftSidebar({ className }: NewLeftSidebarProps) {
  const [activeView, setActiveView] = useState<ActivityBarView>('explorer');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [badges, setBadges] = useState({
    sourceControl: 3, // Mock: 3 uncommitted changes
    search: 0,
    history: 2, // Mock: 2 commits today
  });

  // Mock data updates (in real app, this would come from actual Git/search state)
  useEffect(() => {
    const interval = setInterval(() => {
      setBadges(prev => ({
        ...prev,
        sourceControl: Math.floor(Math.random() * 5),
        history: Math.floor(Math.random() * 10),
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'E':
            e.preventDefault();
            setActiveView('explorer');
            setIsCollapsed(false);
            break;
          case 'F':
            e.preventDefault();
            setActiveView('search');
            setIsCollapsed(false);
            break;
          case 'G':
            e.preventDefault();
            setActiveView('source-control');
            setIsCollapsed(false);
            break;
          case 'H':
            e.preventDefault();
            setActiveView('history');
            setIsCollapsed(false);
            break;
          case 'B':
            e.preventDefault();
            setActiveView('branches');
            setIsCollapsed(false);
            break;
          case 'C':
            e.preventDefault();
            setActiveView('github-clone');
            setIsCollapsed(false);
            break;
        }
      } else if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setIsCollapsed(!isCollapsed);
      } else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setActiveView('settings');
        setIsCollapsed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  const handleViewChange = (view: ActivityBarView) => {
    if (activeView === view && !isCollapsed) {
      // If clicking the same view and sidebar is open, collapse it
      setIsCollapsed(true);
    } else {
      // Otherwise, switch to the view and ensure sidebar is open
      setActiveView(view);
      setIsCollapsed(false);
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleWidthChange = (width: number) => {
    setSidebarWidth(width);
  };

  return (
    <div className={`flex shrink-0 ${className}`}>
      {/* Activity Bar */}
      <ActivityBar
        activeView={activeView}
        onViewChange={handleViewChange}
        badges={badges}
      />

      {/* Primary Sidebar */}
      <PrimarySidebar
        activeView={activeView}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        width={sidebarWidth}
        onWidthChange={handleWidthChange}
      />
    </div>
  );
}
