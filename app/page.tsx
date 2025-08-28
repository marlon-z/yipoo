"use client";

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { MainEditor } from '@/components/layout/MainEditor';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BottomStatusBar } from '@/components/layout/BottomStatusBar';
import { cn } from '@/lib/utils';
import { EditorProvider } from '@/contexts/EditorContext';
import { ExportProvider } from '@/contexts/ExportContext';
import { CollabProvider } from '@/contexts/CollabContext';

export default function Home() {
  const [sidebarMode, setSidebarMode] = useState<'files' | 'git'>('files');
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'source' | 'split'>('wysiwyg');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden", isDarkMode ? "dark" : "")}>
      <EditorProvider initialContent={"# Welcome to MarkdownIDE\n\n这是一个现代化的 Markdown 编辑器，具有类似 VSCode 的专业界面设计。"} fileName="untitled-1.md">
      <ExportProvider>
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
        {/* Task Drawer */}
        {(() => { try { const { TaskDrawer } = require('@/components/layout/TaskDrawer'); return <TaskDrawer /> } catch { return null } })()}
      </div>
      </CollabProvider>
      </ExportProvider>
      </EditorProvider>
    </div>
  );
}