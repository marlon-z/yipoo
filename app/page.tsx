"use client";

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { NewLeftSidebar } from '@/components/layout/NewLeftSidebar';
import { MainEditor } from '@/components/layout/MainEditor';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BottomStatusBar } from '@/components/layout/BottomStatusBar';
import { cn } from '@/lib/utils';
import { installDwSaveBridge } from '@/lib/dw';

export default function Home() {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const off = installDwSaveBridge();
    
    // 监听来自设置面板的主题变更事件
    const handleThemeChange = (e: Event) => {
      const ce = e as CustomEvent<{ isDark: boolean }>;
      if (ce.detail) {
        setIsDarkMode(ce.detail.isDark);
      }
    };

    window.addEventListener('theme-change', handleThemeChange as EventListener);
    
    return () => {
      off?.();
      window.removeEventListener('theme-change', handleThemeChange as EventListener);
    };
  }, []);

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden", isDarkMode ? "dark" : "")}> 
      <div className="bg-background text-foreground flex-1 flex flex-col min-h-0">
        {/* Top Bar */}
        <TopBar 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isRightSidebarOpen={isRightSidebarOpen}
          setIsRightSidebarOpen={setIsRightSidebarOpen}
        />
        
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Sidebar */}
          <NewLeftSidebar />
          
          {/* Main Content */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <MainEditor />
            
            {/* Right Sidebar */}
            {isRightSidebarOpen && (
              <RightSidebar />
            )}
          </div>
        </div>
        
        {/* Bottom Status Bar */}
        <BottomStatusBar />
      </div>
    </div>
  );
}