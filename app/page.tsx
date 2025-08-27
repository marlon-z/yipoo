"use client";

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { MainEditor } from '@/components/layout/MainEditor';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BottomStatusBar } from '@/components/layout/BottomStatusBar';
import { cn } from '@/lib/utils';

export default function Home() {
  const [sidebarMode, setSidebarMode] = useState<'files' | 'git'>('files');
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'source' | 'split'>('wysiwyg');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden", isDarkMode ? "dark" : "")}>
      <div className="bg-background text-foreground flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isRightSidebarOpen={isRightSidebarOpen}
          setIsRightSidebarOpen={setIsRightSidebarOpen}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <LeftSidebar 
            mode={sidebarMode}
            setMode={setSidebarMode}
          />
          
          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            <MainEditor 
              mode={editorMode}
              setMode={setEditorMode}
            />
            
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