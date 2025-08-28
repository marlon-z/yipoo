"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* live toc */ const mockTOC = [
  { level: 1, title: 'Welcome to MarkdownIDE', id: 'welcome' },
  { level: 2, title: '功能特色', id: 'features' },
  { level: 3, title: '代码高亮', id: 'code-highlight' },
  { level: 3, title: '表格支持', id: 'table-support' },
  { level: 2, title: '开始使用', id: 'getting-started' },
  { level: 3, title: '安装', id: 'installation' },
  { level: 3, title: '配置', id: 'configuration' },
];

export function TableOfContents() {
  try {
    const { useEditorContext } = require('@/contexts/EditorContext');
    const { extractHeadings } = require('@/lib/markdown');
    const { editorState } = useEditorContext();
    const heads = extractHeadings(editorState.content || "");
    return (
      <div className="w-64 bg-card border-l border-border shrink-0">
        <div className="h-10 border-b border-border flex items-center px-3">
          <span className="text-sm font-medium text-muted-foreground">大纲</span>
        </div>
        <div className="p-3">
          <div className="space-y-1">
            {heads.map((item: any, index: number) => (
              <div key={index} className={(
                (item.level === 1 ? "font-medium" : item.level === 2 ? "text-muted-foreground ml-4" : "text-muted-foreground ml-8") + 
                " flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer rounded text-sm"
              )}>
                <span className="truncate">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } catch {

  return (
    <div className="w-64 bg-card border-l border-border shrink-0">
      <div className="h-10 border-b border-border flex items-center px-3">
        <span className="text-sm font-medium text-muted-foreground">大纲</span>
      </div>
      
      <div className="p-3">
        <div className="space-y-1">
          {mockTOC.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer rounded text-sm",
                item.level === 1 && "font-medium",
                item.level === 2 && "text-muted-foreground ml-4",
                item.level === 3 && "text-muted-foreground ml-8"
              )}
            >
              {item.level === 1 && <ChevronDown className="w-3 h-3" />}
              {item.level === 2 && <ChevronRight className="w-3 h-3" />}
              {item.level === 3 && <div className="w-3 h-3" />}
              
              <span className="truncate">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
  }