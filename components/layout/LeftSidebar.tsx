"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileExplorer } from '@/components/features/FileExplorer';
import { GitPanel } from '@/components/features/GitPanel';
import { File, GitBranch } from 'lucide-react';

interface LeftSidebarProps {
  mode: 'files' | 'git';
  setMode: (mode: 'files' | 'git') => void;
}

export function LeftSidebar({ mode, setMode }: LeftSidebarProps) {
  return (
    <div className="w-80 bg-card border-r border-border flex flex-col shrink-0">
      <div className="h-10 border-b border-border flex items-center px-3">
        <Tabs value={mode} onValueChange={(value) => setMode(value as 'files' | 'git')} className="flex-1">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="files" className="flex items-center gap-1 text-xs">
              <File className="w-3 h-3" />
              文件
            </TabsTrigger>
            <TabsTrigger value="git" className="flex items-center gap-1 text-xs">
              <GitBranch className="w-3 h-3" />
              Git
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {mode === 'files' ? <FileExplorer /> : <GitPanel />}
      </div>
    </div>
  );
}