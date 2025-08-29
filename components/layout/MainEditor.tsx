"use client";

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableOfContents } from '@/components/features/TableOfContents';
import { Eye, Code, Split } from 'lucide-react';

interface MainEditorProps {
  mode: 'wysiwyg' | 'source' | 'split';
  setMode: (mode: 'wysiwyg' | 'source' | 'split') => void;
}

export function MainEditor({ mode, setMode }: MainEditorProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Editor Mode Tabs */}
      <div className="h-10 bg-card border-b border-border flex items-center px-4 shrink-0">
        <Tabs value={mode} onValueChange={(value) => setMode(value as any)} className="flex-1">
          <TabsList className="h-8">
            <TabsTrigger value="wysiwyg" className="flex items-center gap-1 text-xs">
              <Eye className="w-3 h-3" />
              所见即所得
            </TabsTrigger>
            <TabsTrigger value="source" className="flex items-center gap-1 text-xs">
              <Code className="w-3 h-3" />
              源码模式
            </TabsTrigger>
            <TabsTrigger value="split" className="flex items-center gap-1 text-xs">
              <Split className="w-3 h-3" />
              分屏模式
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          {mode === 'wysiwyg' && (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              所见即所得模式（编辑器已移除）
            </div>
          )}
          {mode === 'source' && (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              源码模式（编辑器已移除）
            </div>
          )}
          {mode === 'split' && (
            <div className="w-full h-full grid grid-cols-2 divide-x divide-border">
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                左侧：源码（编辑器已移除）
              </div>
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                右侧：所见即所得（编辑器已移除）
              </div>
            </div>
          )}
        </div>
        
        {/* Table of Contents */}
        <TableOfContents />
      </div>
    </div>
  );
}