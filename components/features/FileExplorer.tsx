"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { 
  FolderOpen, 
  Folder, 
  FileText, 
  Plus, 
  Search,
  MoreVertical,
  FolderPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  status?: 'modified' | 'untracked' | 'staged';
  children?: FileNode[];
}

const mockFiles: FileNode[] = [
  {
    id: '1',
    name: 'docs',
    type: 'folder',
    children: [
      { id: '2', name: 'README.md', type: 'file', status: 'modified' },
      { id: '3', name: 'CHANGELOG.md', type: 'file' },
    ]
  },
  {
    id: '4',
    name: 'src',
    type: 'folder',
    children: [
      { id: '5', name: 'index.md', type: 'file', status: 'untracked' },
      { id: '6', name: 'guide.md', type: 'file' },
    ]
  },
  { id: '7', name: 'untitled-1.md', type: 'file', status: 'modified' },
];

export function FileExplorer() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '4']));
  const [selectedFile, setSelectedFile] = useState<string>('7');

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'modified': return 'text-orange-500';
      case 'untracked': return 'text-green-500';
      case 'staged': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const renderFileNode = (node: FileNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFile === node.id;

    return (
      <div key={node.id}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer text-sm",
                isSelected && "bg-accent",
              )}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => {
                if (node.type === 'folder') {
                  toggleFolder(node.id);
                } else {
                  setSelectedFile(node.id);
                }
              }}
            >
              {node.type === 'folder' ? (
                isExpanded ? 
                  <FolderOpen className="w-4 h-4 text-blue-400" /> : 
                  <Folder className="w-4 h-4 text-blue-400" />
              ) : (
                <FileText className={cn("w-4 h-4", getStatusColor(node.status))} />
              )}
              
              <span className={cn("flex-1", getStatusColor(node.status))}>
                {node.name}
              </span>
              
              {node.status && (
                <Badge variant="outline" className="h-4 text-xs px-1">
                  {node.status === 'modified' ? 'M' : 
                   node.status === 'untracked' ? 'U' : 'S'}
                </Badge>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>打开</ContextMenuItem>
            <ContextMenuItem>重命名</ContextMenuItem>
            <ContextMenuItem>复制路径</ContextMenuItem>
            <ContextMenuItem>删除</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">文件浏览器</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <FolderPlus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input 
            placeholder="搜索文件..." 
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        {mockFiles.map(node => renderFileNode(node))}
      </div>
    </div>
  );
}