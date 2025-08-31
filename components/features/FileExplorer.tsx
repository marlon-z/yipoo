"use client";

import { useEffect, useMemo, useState } from 'react';
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
import { DWNode, dwEnsureSeed, dwLoadTree, dwSaveTree, dwWriteContent, dwReadContent } from '@/lib/dw';

interface FileNode extends DWNode {
  status?: 'modified' | 'untracked' | 'staged';
}

export function FileExplorer() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const t = (await dwLoadTree()) ?? (await dwEnsureSeed());
      if (mounted) setTree(t);
    })();
    return () => { mounted = false; };
  }, []);

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedFolders(next);
  };

  const openFile = async (node: FileNode) => {
    setSelectedFile(node.id);
    const content = await dwReadContent(node.id);
    const event = new CustomEvent('open-file', { detail: { id: node.id, name: node.name, path: node.name, content } });
    window.dispatchEvent(event);
  };

  const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  const findNodeAndParent = (nodes: FileNode[], id: string | null, parent: FileNode | null = null): { node: FileNode | null; parent: FileNode | null } => {
    if (!id) return { node: null, parent: null };
    for (const n of nodes) {
      if (n.id === id) return { node: n, parent };
      if (n.type === 'folder' && n.children && n.children.length) {
        const res = findNodeAndParent(n.children as FileNode[], id, n);
        if (res.node) return res;
      }
    }
    return { node: null, parent: null };
  };

  const insertChild = (nodes: FileNode[], folderId: string | null, child: FileNode): FileNode[] => {
    if (!folderId) return [...nodes, child];
    return nodes.map(n => {
      if (n.id === folderId && n.type === 'folder') {
        const children = (n.children as FileNode[] | undefined) ?? [];
        return { ...n, children: [...children, child] };
      }
      if (n.type === 'folder' && n.children) {
        return { ...n, children: insertChild(n.children as FileNode[], folderId, child) };
      }
      return n;
    });
  };

  const getTargetFolderId = (): string | null => {
    if (!selectedFile) return null;
    const { node, parent } = findNodeAndParent(tree, selectedFile);
    if (!node) return null;
    if (node.type === 'folder') return node.id;
    return parent ? parent.id : null;
  };

  const createFile = async () => {
    const name = window.prompt('文件名', 'untitled.md');
    if (!name) return;
    const id = generateId();
    const folderId = getTargetFolderId();
    const newNode: FileNode = { id, name, type: 'file' };
    const updated = insertChild(tree, folderId, newNode);
    setTree(updated);
    await dwSaveTree(updated);
    await dwWriteContent(id, '');
    setSelectedFile(id);
    if (folderId) {
      const next = new Set(expandedFolders);
      next.add(folderId);
      setExpandedFolders(next);
    }
  };

  const createFolder = async () => {
    const name = window.prompt('文件夹名', '新建文件夹');
    if (!name) return;
    const id = generateId();
    const folderId = getTargetFolderId();
    const newNode: FileNode = { id, name, type: 'folder', children: [] };
    const updated = insertChild(tree, folderId, newNode);
    setTree(updated);
    await dwSaveTree(updated);
    setSelectedFile(id);
    const next = new Set(expandedFolders);
    next.add(id);
    if (folderId) next.add(folderId);
    setExpandedFolders(next);
  };

  const renameNode = async (node: FileNode) => {
    const name = window.prompt('重命名', node.name);
    if (!name || name === node.name) return;
    const update = (nodes: FileNode[]): FileNode[] => nodes.map(n => {
      if (n.id === node.id) return { ...n, name };
      if (n.type === 'folder' && n.children) return { ...n, children: update(n.children as FileNode[]) };
      return n;
    });
    const updated = update(tree);
    setTree(updated);
    await dwSaveTree(updated);
  };

  const deleteNode = async (node: FileNode) => {
    const confirmDel = window.confirm(`确定删除 ${node.name} 吗？`);
    if (!confirmDel) return;
    const remove = (nodes: FileNode[]): FileNode[] => nodes.filter(n => n.id !== node.id).map(n => {
      if (n.type === 'folder' && n.children) return { ...n, children: remove(n.children as FileNode[]) };
      return n;
    });
    const updated = remove(tree);
    setTree(updated);
    await dwSaveTree(updated);
  };

  const copyPath = async (node: FileNode) => {
    // 简单用名称作为路径占位；后续可计算完整层级路径
    await navigator.clipboard.writeText(node.name);
  };

  const filtered = useMemo(() => {
    if (!filter.trim()) return tree;
    const lower = filter.toLowerCase();
    const filterNodes = (nodes: FileNode[]): FileNode[] =>
      nodes
        .map(n => n.type === 'folder'
          ? { ...n, children: n.children ? filterNodes(n.children as FileNode[]) : [] }
          : n)
        .filter(n => n.type === 'folder' ? (n.children && n.children.length > 0) || n.name.toLowerCase().includes(lower) : n.name.toLowerCase().includes(lower));
    return filterNodes(tree);
  }, [tree, filter]);

  const renderFileNode = (node: FileNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFile === node.id;

    return (
      <div key={node.id} title={node.name}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer text-sm",
                isSelected && "bg-accent",
              )}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onDoubleClick={() => node.type === 'file' ? void openFile(node) : toggleFolder(node.id)}
              onClick={() => {
                setSelectedFile(node.id);
                if (node.type === 'folder') {
                  toggleFolder(node.id);
                } else {
                  void openFile(node);
                }
              }}
            >
              {node.type === 'folder' ? (
                isExpanded ? 
                  <FolderOpen className="w-4 h-4 text-blue-400" /> : 
                  <Folder className="w-4 h-4 text-blue-400" />
              ) : (
                <FileText className={cn("w-4 h-4", node.status === 'modified' ? 'text-orange-500' : node.status === 'untracked' ? 'text-green-500' : node.status === 'staged' ? 'text-blue-500' : 'text-muted-foreground')} />
              )}
              
              <span className={cn("flex-1")}>{node.name}</span>
              {node.status && (
                <Badge variant="outline" className="h-4 text-xs px-1">
                  {node.status === 'modified' ? 'M' : node.status === 'untracked' ? 'U' : 'S'}
                </Badge>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={() => void (node.type === 'file' ? openFile(node) : toggleFolder(node.id))}>打开</ContextMenuItem>
            <ContextMenuItem onSelect={() => void renameNode(node)}>重命名</ContextMenuItem>
            <ContextMenuItem onSelect={() => void copyPath(node)}>复制路径</ContextMenuItem>
            <ContextMenuItem onSelect={() => void deleteNode(node)}>删除</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {(node.children as FileNode[]).map(child => renderFileNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">文件浏览器</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={createFile} title="在选中目录下创建文件">
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={createFolder} title="在选中目录下创建文件夹">
              <FolderPlus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input placeholder="搜索文件..." className="h-7 pl-7 text-xs" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.map(node => renderFileNode(node))}
      </div>
    </div>
  );
}