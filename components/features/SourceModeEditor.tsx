"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Code, Eye } from "lucide-react";

interface SourceModeEditorProps {
  content: string;
  onChange: (content: string) => void;
  onToggleMode: () => void;
  isSourceMode: boolean;
}

export function SourceModeEditor({ 
  content, 
  onChange, 
  onToggleMode, 
  isSourceMode 
}: SourceModeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localContent, setLocalContent] = useState(content);
  const debounceTimerRef = useRef<number | null>(null);

  // 同步外部内容到本地状态
  useEffect(() => {
    if (content !== localContent) {
      setLocalContent(content);
    }
  }, [content]);

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
    debouncedOnChange(newContent);
  };

  // 自动调整文本区域高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [localContent]);

  // 处理Tab键插入
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = 
        textarea.value.substring(0, start) + 
        '  ' + 
        textarea.value.substring(end);
      
      setLocalContent(newValue);
      debouncedOnChange(newValue);
      
      // 设置光标位置
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
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
          <span className="text-sm font-medium">源码模式</span>
        </div>
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

      {/* 编辑区域 */}
      <div className="flex-1 p-4 overflow-auto">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full min-h-[calc(100vh-200px)] p-4 bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono leading-6"
          placeholder="在此输入 Markdown 源码..."
          style={{
            tabSize: 2,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        />
      </div>

      {/* 状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
        <span>行数: {localContent.split('\n').length}</span>
        <span>字符数: {localContent.length}</span>
      </div>
    </div>
  );
} 