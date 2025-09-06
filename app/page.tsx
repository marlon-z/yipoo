"use client";

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { NewLeftSidebar } from '@/components/layout/NewLeftSidebar';
import { MainEditor } from '@/components/layout/MainEditor';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BottomStatusBar } from '@/components/layout/BottomStatusBar';
import { cn } from '@/lib/utils';
import { installDwSaveBridge, dwLoadTree, dwReadContent } from '@/lib/dw';

export default function Home() {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const off = installDwSaveBridge();
    
    // 恢复主题与右侧栏开关、字体大小
    try {
      const d = localStorage.getItem('pref:isDark');
      const r = localStorage.getItem('pref:rightSidebarOpen');
      const f = localStorage.getItem('pref:fontSize');
      if (d !== null) setIsDarkMode(d === '1');
      if (r !== null) setIsRightSidebarOpen(r === '1');
      if (f) document.documentElement.style.setProperty('--editor-font-size', `${f}px`);
    } catch {}
    
    // 监听来自设置面板的主题变更事件
    const handleThemeChange = (e: Event) => {
      const ce = e as CustomEvent<{ isDark: boolean }>;
      if (ce.detail) {
        setIsDarkMode(ce.detail.isDark);
      }
    };

    window.addEventListener('theme-change', handleThemeChange as EventListener);
    const handleToggleRight = () => setIsRightSidebarOpen(prev => !prev);
    window.addEventListener('toggle-right-sidebar', handleToggleRight as EventListener);

    // 恢复上次打开的文件（如果有且存在于DW树中）
    (async () => {
      try {
        const lastId = localStorage.getItem('session:currentFileId');
        if (!lastId) return;
        const tree = await dwLoadTree();
        const findNode = (list: any[]): any | null => {
          for (const n of list) {
            if (n.id === lastId) return n;
            if (n.children) {
              const r = findNode(n.children);
              if (r) return r;
            }
          }
          return null;
        };
        const node = tree ? findNode(tree as any[]) : null;
        if (node) {
          const content = await dwReadContent(lastId);
          window.dispatchEvent(new CustomEvent('open-file', { detail: { id: node.id, name: node.name, path: node.name, content } }));
        }
      } catch {}
    })();
    
    return () => {
      off?.();
      window.removeEventListener('theme-change', handleThemeChange as EventListener);
      window.removeEventListener('toggle-right-sidebar', handleToggleRight as EventListener);
    };
  }, []);

  // 持久化右侧栏开关
  useEffect(() => {
    try { localStorage.setItem('pref:rightSidebarOpen', isRightSidebarOpen ? '1' : '0'); } catch {}
  }, [isRightSidebarOpen]);

  // 持久化主题
  useEffect(() => {
    try { localStorage.setItem('pref:isDark', isDarkMode ? '1' : '0'); } catch {}
  }, [isDarkMode]);

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