"use client";

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { MainEditor } from '@/components/layout/MainEditor';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BottomStatusBar } from '@/components/layout/BottomStatusBar';
import { cn } from '@/lib/utils';
import { installDwSaveBridge } from '@/lib/dw';

export default function Home() {
  const [sidebarMode, setSidebarMode] = useState<'files' | 'git'>('files');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const off = installDwSaveBridge();
    return () => off?.();
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
          <LeftSidebar 
            mode={sidebarMode}
            setMode={setSidebarMode}
          />
          
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