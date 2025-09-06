"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Code, Eye, Copy, Download } from "lucide-react";

interface CodeMirrorSourceEditorProps {
  content: string;
  onChange: (content: string) => void;
  onToggleMode: () => void;
  isSourceMode: boolean;
}

export function CodeMirrorSourceEditor({ 
  content, 
  onChange, 
  onToggleMode, 
  isSourceMode 
}: CodeMirrorSourceEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [localContent, setLocalContent] = useState(content);
  const [lineCount, setLineCount] = useState(1);
  const [charCount, setCharCount] = useState(0);
  const debounceTimerRef = useRef<number | null>(null);

  // 同步外部内容到本地状态
  useEffect(() => {
    if (content !== localContent) {
      setLocalContent(content);
      updateStats(content);
    }
  }, [content]);

  // 更新统计信息
  const updateStats = (text: string) => {
    setLineCount(text.split('\n').length);
    setCharCount(text.length);
  };

  // 防抖保存
  const debouncedOnChange = (value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      onChange(value);
    }, 300);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    updateStats(newContent);
    debouncedOnChange(newContent);
  };

  // 处理特殊按键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (e.shiftKey) {
        // Shift+Tab: 减少缩进
        const lines = textarea.value.split('\n');
        const startLine = textarea.value.substring(0, start).split('\n').length - 1;
        const endLine = textarea.value.substring(0, end).split('\n').length - 1;
        
        for (let i = startLine; i <= endLine; i++) {
          if (lines[i].startsWith('  ')) {
            lines[i] = lines[i].substring(2);
          } else if (lines[i].startsWith('\t')) {
            lines[i] = lines[i].substring(1);
          }
        }
        
        const newValue = lines.join('\n');
        setLocalContent(newValue);
        debouncedOnChange(newValue);
      } else {
        // Tab: 增加缩进
        if (start === end) {
          // 单行缩进
          const newValue = 
            textarea.value.substring(0, start) + 
            '  ' + 
            textarea.value.substring(end);
          
          setLocalContent(newValue);
          debouncedOnChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          }, 0);
        } else {
          // 多行缩进
          const lines = textarea.value.split('\n');
          const startLine = textarea.value.substring(0, start).split('\n').length - 1;
          const endLine = textarea.value.substring(0, end).split('\n').length - 1;
          
          for (let i = startLine; i <= endLine; i++) {
            lines[i] = '  ' + lines[i];
          }
          
          const newValue = lines.join('\n');
          setLocalContent(newValue);
          debouncedOnChange(newValue);
        }
      }
    }
    
    // Ctrl/Cmd + S: 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onChange(localContent);
    }
    
    // Ctrl/Cmd + /: 切换注释
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      toggleComment(textarea);
    }
  };

  // 切换注释
  const toggleComment = (textarea: HTMLTextAreaElement) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lines = textarea.value.split('\n');
    const startLine = textarea.value.substring(0, start).split('\n').length - 1;
    const endLine = textarea.value.substring(0, end).split('\n').length - 1;
    
    // 检查是否所有选中行都已注释
    let allCommented = true;
    for (let i = startLine; i <= endLine; i++) {
      if (lines[i].trim() && !lines[i].trim().startsWith('<!--')) {
        allCommented = false;
        break;
      }
    }
    
    // 切换注释状态
    for (let i = startLine; i <= endLine; i++) {
      if (lines[i].trim()) {
        if (allCommented) {
          // 移除注释
          lines[i] = lines[i].replace(/^\s*<!--\s?/, '').replace(/\s?-->\s*$/, '');
        } else {
          // 添加注释
          lines[i] = `<!-- ${lines[i]} -->`;
        }
      }
    }
    
    const newValue = lines.join('\n');
    setLocalContent(newValue);
    debouncedOnChange(newValue);
  };

  // 复制内容
  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(localContent);
      // 可以添加一个 toast 提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 下载文件
  const downloadFile = () => {
    const blob = new Blob([localContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isSourceMode) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          <span className="text-sm font-medium">Markdown 源码</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyContent}
            className="h-8 px-2"
            title="复制内容"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadFile}
            className="h-8 px-2"
            title="下载文件"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMode}
            className="h-8 px-2"
          >
            <Eye className="h-4 w-4 mr-1" />
            预览
          </Button>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 行号 */}
        <div className="w-12 bg-muted/30 border-r flex flex-col text-xs text-muted-foreground font-mono">
          <div className="px-2 py-4 sticky top-0">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} className="h-6 flex items-center justify-end leading-6">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* 编辑器 */}
        <div className="flex-1 relative">
          <textarea
            ref={editorRef}
            value={localContent}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-4 bg-background resize-none focus:outline-none text-sm font-mono leading-6 border-0"
            placeholder="在此输入 Markdown 源码..."
            style={{
              tabSize: 2,
              whiteSpace: 'pre',
              wordWrap: 'break-word',
              lineHeight: '1.5',
            }}
            spellCheck={false}
          />
        </div>
      </div>

      {/* 状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>行数: {lineCount}</span>
          <span>字符数: {charCount}</span>
          <span>字节数: {new Blob([localContent]).size}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>Markdown</span>
        </div>
      </div>
    </div>
  );
} 