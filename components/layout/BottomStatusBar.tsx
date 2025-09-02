"use client";

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GitBranch, Zap, MapPin, Type, Clock, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { useGitRepository, useGitBranches } from '@/hooks/use-git';
import { cn } from '@/lib/utils';

interface EditorStats {
  line: number;
  column: number;
  wordCount: number;
  charCount: number;
  selection: {
    lines: number;
    chars: number;
  };
}

interface SaveStatus {
  status: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSaved?: Date;
}

interface PerformanceStats {
  fps: number;
  memory: number;
}

export function BottomStatusBar() {
  const { repositoryInfo, isLoading: gitLoading } = useGitRepository();
  const { branches } = useGitBranches();
  
  const [editorStats, setEditorStats] = useState<EditorStats>({
    line: 1,
    column: 1,
    wordCount: 0,
    charCount: 0,
    selection: { lines: 0, chars: 0 }
  });
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    status: 'saved'
  });
  
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    fps: 60,
    memory: 0
  });
  
  const [isOnline, setIsOnline] = useState(true);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  
  // Git分支状态
  const currentBranch = repositoryInfo?.currentBranch || branches.find(b => b.current)?.name || 'main';
  const hasChanges = repositoryInfo?.hasChanges || false;
  const syncStatus = repositoryInfo?.ahead || repositoryInfo?.behind ? 'sync-needed' : 'synced';
  
  // 监听编辑器状态变化
  useEffect(() => {
    const updateEditorStats = () => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.closest('.ProseMirror')) {
        const selection = window.getSelection();
        const content = activeElement.textContent || '';
        
        // 计算光标位置
        const lines = content.split('\n');
        let currentLine = 1;
        let currentColumn = 1;
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textBeforeCursor = content.substring(0, range.startOffset);
          const linesBefore = textBeforeCursor.split('\n');
          currentLine = linesBefore.length;
          currentColumn = linesBefore[linesBefore.length - 1].length + 1;
        }
        
        // 计算字数统计
        const words = content.trim().split(/\s+/).filter(word => word.length > 0);
        const chars = content.length;
        
        // 计算选中内容
        const selectedText = selection?.toString() || '';
        const selectedLines = selectedText.split('\n').length - 1;
        const selectedChars = selectedText.length;
        
        setEditorStats({
          line: currentLine,
          column: currentColumn,
          wordCount: words.length,
          charCount: chars,
          selection: {
            lines: selectedLines,
            chars: selectedChars
          }
        });
      }
    };
    
    // 监听编辑器事件
    const handleEditorChange = () => {
      updateEditorStats();
      setSaveStatus({ status: 'unsaved' });
    };
    
    const handleSave = () => {
      setSaveStatus({ 
        status: 'saved', 
        lastSaved: new Date() 
      });
    };
    
    const handleSaving = () => {
      setSaveStatus({ status: 'saving' });
    };
    
    // 添加事件监听
    document.addEventListener('selectionchange', updateEditorStats);
    document.addEventListener('input', handleEditorChange, true);
    document.addEventListener('keyup', updateEditorStats);
    window.addEventListener('dw-save-file', handleSave);
    window.addEventListener('dw-force-save', handleSaving);
    
    // 初始化
    updateEditorStats();
    
    return () => {
      document.removeEventListener('selectionchange', updateEditorStats);
      document.removeEventListener('input', handleEditorChange, true);
      document.removeEventListener('keyup', updateEditorStats);
      window.removeEventListener('dw-save-file', handleSave);
      window.removeEventListener('dw-force-save', handleSaving);
    };
  }, []);
  
  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // 性能监控
  useEffect(() => {
    let animationFrameId: number;
    
    const updatePerformanceStats = () => {
      const now = performance.now();
      frameCountRef.current++;
      
      // 每秒更新一次FPS
      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        
        // 获取内存使用情况 (如果可用)
        let memory = 0;
        if ('memory' in performance) {
          // @ts-ignore
          memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        
        setPerformanceStats({ fps, memory });
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationFrameId = requestAnimationFrame(updatePerformanceStats);
    };
    
    animationFrameId = requestAnimationFrame(updatePerformanceStats);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
  
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // 小于1分钟
      return '刚刚保存';
    } else if (diff < 3600000) { // 小于1小时
      return `${Math.floor(diff / 60000)}分钟前`;
    } else {
      return date.toLocaleTimeString();
    }
  };
  
  const getSaveStatusIcon = () => {
    switch (saveStatus.status) {
      case 'saved':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'saving':
        return <Clock className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'unsaved':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };
  
  const getSaveStatusText = () => {
    switch (saveStatus.status) {
      case 'saved':
        return saveStatus.lastSaved ? formatLastSaved(saveStatus.lastSaved) : '已保存';
      case 'saving':
        return '保存中...';
      case 'unsaved':
        return '未保存';
      case 'error':
        return '保存失败';
      default:
        return '未知状态';
    }
  };
  
  const getSyncBadgeVariant = () => {
    if (hasChanges) return 'destructive';
    if (syncStatus === 'sync-needed') return 'secondary';
    return 'outline';
  };
  
  const getSyncBadgeText = () => {
    if (hasChanges) return '有变更';
    if (syncStatus === 'sync-needed') return '需同步';
    return '已同步';
  };

  return (
    <div className="h-6 bg-card border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Git Branch */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 px-1 text-xs hover:bg-accent/50"
                onClick={() => {
                  // 切换到分支管理视图
                  window.dispatchEvent(new CustomEvent('switch-activity-view', { 
                    detail: { view: 'branches' } 
                  }));
                }}
              >
                <div className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  <span>{currentBranch}</span>
                  <Badge 
                    variant={getSyncBadgeVariant()} 
                    className="h-4 text-xs px-1 ml-1"
                  >
                    {getSyncBadgeText()}
                  </Badge>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div>当前分支: {currentBranch}</div>
                {repositoryInfo && (
                  <>
                    {repositoryInfo.ahead > 0 && <div>领先 {repositoryInfo.ahead} 个提交</div>}
                    {repositoryInfo.behind > 0 && <div>落后 {repositoryInfo.behind} 个提交</div>}
                    {hasChanges && <div>有未提交的变更</div>}
                  </>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Cursor Position */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-default">
                <MapPin className="w-3 h-3" />
                <span>行 {editorStats.line}, 列 {editorStats.column}</span>
                {editorStats.selection.chars > 0 && (
                  <span className="text-primary">
                    ({editorStats.selection.chars} 个字符选中)
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div>光标位置: 行 {editorStats.line}, 列 {editorStats.column}</div>
                {editorStats.selection.chars > 0 && (
                  <>
                    <div>选中: {editorStats.selection.chars} 个字符</div>
                    <div>选中: {editorStats.selection.lines + 1} 行</div>
                  </>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Network Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1",
                isOnline ? "text-green-600" : "text-red-600"
              )}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? '在线' : '离线'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                网络状态: {isOnline ? '已连接' : '已断开'}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Word Count */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-default">
                <Type className="w-3 h-3" />
                <span>{editorStats.wordCount} 词</span>
                <span className="text-muted-foreground">· {editorStats.charCount} 字符</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div>单词数: {editorStats.wordCount}</div>
                <div>字符数: {editorStats.charCount}</div>
                {editorStats.selection.chars > 0 && (
                  <div>选中字符: {editorStats.selection.chars}</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Save Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 px-1 text-xs hover:bg-accent/50"
                onClick={() => {
                  if (saveStatus.status === 'unsaved') {
                    window.dispatchEvent(new CustomEvent('dw-force-save'));
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  {getSaveStatusIcon()}
                  <span>{getSaveStatusText()}</span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div>保存状态: {getSaveStatusText()}</div>
                {saveStatus.status === 'unsaved' && <div>点击手动保存</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Performance Stats */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-default">
                <Zap className="w-3 h-3" />
                <span>{performanceStats.fps} FPS</span>
                {performanceStats.memory > 0 && (
                  <span className="text-muted-foreground">· {performanceStats.memory}MB</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div>帧率: {performanceStats.fps} FPS</div>
                {performanceStats.memory > 0 && (
                  <div>内存使用: {performanceStats.memory} MB</div>
                )}
                <div>性能状态: {performanceStats.fps >= 55 ? '流畅' : performanceStats.fps >= 30 ? '正常' : '卡顿'}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}