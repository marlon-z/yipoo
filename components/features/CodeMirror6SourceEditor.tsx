"use client";

import { useEffect, useRef, useState } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from "@codemirror/view";
import { EditorState, Extension, StateEffect } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { search, searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { history, defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { foldGutter, indentOnInput, bracketMatching, foldKeymap, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { highlightSelectionMatches as highlightSelMatches } from "@codemirror/search";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  Eye, 
  Copy, 
  Download, 
  Search, 
  RotateCcw,
  RotateCw,
  FileText
} from "lucide-react";

interface CodeMirror6SourceEditorProps {
  content: string;
  onChange: (content: string) => void;
  onToggleMode: () => void;
  isSourceMode: boolean;
}

export function CodeMirror6SourceEditor({ 
  content, 
  onChange, 
  onToggleMode, 
  isSourceMode 
}: CodeMirror6SourceEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [charCount, setCharCount] = useState(0);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const debounceTimerRef = useRef<number | null>(null);

  // 监听全局主题变化
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      console.log('CodeMirror6SourceEditor: 检测到主题变化:', isDark ? '暗色' : '浅色');
      setIsDarkTheme(isDark);
    };

    // 初始检查
    checkTheme();

    // 监听主题变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // 更新统计信息
  const updateStats = (text: string, view?: EditorView) => {
    setLineCount(text.split('\n').length);
    setCharCount(text.length);
    
    if (view) {
      const cursor = view.state.selection.main.head;
      const line = view.state.doc.lineAt(cursor);
      setCursorPos({
        line: line.number,
        col: cursor - line.from + 1
      });
    }
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

  // 创建编辑器扩展
  const createExtensions = (): Extension[] => [
    // 基础功能 (替代 basicSetup)
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    search(),
    
    // Markdown 语言支持
    markdown(),
    syntaxHighlighting(defaultHighlightStyle),
    
    // 主题
    isDarkTheme ? oneDark : [],
    
    // 快捷键
    keymap.of([
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...closeBracketsKeymap,
      indentWithTab,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString();
        updateStats(newContent, update.view);
        debouncedOnChange(newContent);
      }
      if (update.selectionSet) {
        updateStats(update.state.doc.toString(), update.view);
      }
    }),
    EditorView.theme({
      '&': {
        height: '100%',
      },
      '.cm-editor': {
        height: '100%',
        fontSize: '14px',
        fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", "Consolas", monospace',
      },
      '.cm-content': {
        padding: '16px',
        minHeight: '100%',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-line': {
        lineHeight: '1.6',
      },
      '.cm-gutters': {
        backgroundColor: isDarkTheme ? '#1e1e1e' : '#f8f9fa',
        border: 'none',
      },
      '.cm-foldGutter': {
        width: '20px',
      }
    })
  ];

  // 初始化编辑器
  useEffect(() => {
    if (!isSourceMode || !editorRef.current) return;

    // 销毁旧编辑器
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    // 创建新编辑器
    const state = EditorState.create({
      doc: content,
      extensions: createExtensions(),
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    updateStats(content, view);

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [isSourceMode, isDarkTheme]);

  // 同步外部内容变更
  useEffect(() => {
    if (viewRef.current && isSourceMode) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== content) {
        const transaction = viewRef.current.state.update({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: content,
          },
        });
        viewRef.current.dispatch(transaction);
        updateStats(content, viewRef.current);
      }
    }
  }, [content, isSourceMode]);

  // 监听主题变化并重新配置编辑器
  useEffect(() => {
    if (viewRef.current) {
      console.log('CodeMirror6SourceEditor: 重新配置编辑器主题:', isDarkTheme ? '暗色' : '浅色');
      // 重新配置编辑器扩展以应用新主题
      viewRef.current.dispatch({
        effects: StateEffect.reconfigure.of(createExtensions())
      });
    }
  }, [isDarkTheme]);

  // 复制内容
  const copyContent = async () => {
    if (viewRef.current) {
      const content = viewRef.current.state.doc.toString();
      try {
        await navigator.clipboard.writeText(content);
        // 可以添加 toast 提示
      } catch (err) {
        console.error('复制失败:', err);
      }
    }
  };

  // 下载文件
  const downloadFile = () => {
    if (viewRef.current) {
      const content = viewRef.current.state.doc.toString();
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // 打开搜索
  const openSearch = () => {
    if (viewRef.current) {
      viewRef.current.focus();
      // 触发搜索面板
      const searchCommand = searchKeymap.find(k => k.key === 'Mod-f');
      if (searchCommand?.run) {
        searchCommand.run(viewRef.current);
      }
    }
  };

  // 撤销/重做
  const undo = () => {
    if (viewRef.current) {
      const undoCommand = historyKeymap.find(k => k.key === 'Mod-z');
      if (undoCommand?.run) {
        undoCommand.run(viewRef.current);
      }
    }
  };

  const redo = () => {
    if (viewRef.current) {
      const redoCommand = historyKeymap.find(k => k.key === 'Mod-y' || k.key === 'Mod-Shift-z');
      if (redoCommand?.run) {
        redoCommand.run(viewRef.current);
      }
    }
  };

  // 格式化文档
  const formatDocument = () => {
    if (viewRef.current) {
      // 简单的 Markdown 格式化
      const doc = viewRef.current.state.doc.toString();
      const formatted = doc
        .replace(/\n{3,}/g, '\n\n') // 移除多余空行
        .replace(/[ \t]+$/gm, '') // 移除行尾空白
        .replace(/^[ \t]+/gm, (match) => {
          // 保持缩进，但标准化为 2 个空格
          return '  '.repeat(Math.floor(match.length / 2));
        });

      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: formatted,
        },
      });
      viewRef.current.dispatch(transaction);
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
          <span className="text-sm font-medium">Markdown 源码</span>
          <span className="text-xs text-muted-foreground">
            CodeMirror 6
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* 编辑操作 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            className="h-8 px-2"
            title="撤销 (Ctrl+Z)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            className="h-8 px-2"
            title="重做 (Ctrl+Y)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
          {/* 搜索 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={openSearch}
            className="h-8 px-2"
            title="搜索 (Ctrl+F)"
          >
            <Search className="h-4 w-4" />
          </Button>
          
          {/* 格式化 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={formatDocument}
            className="h-8 px-2"
            title="格式化文档"
          >
            <FileText className="h-4 w-4" />
          </Button>
          
          {/* 主题切换 */}
          
          {/* 导出功能 */}
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
          
          {/* 切换模式 */}
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

      {/* 编辑器区域 */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={editorRef} 
          className="h-full w-full"
        />
      </div>

      {/* 状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>行 {cursorPos.line}, 列 {cursorPos.col}</span>
          <span>共 {lineCount} 行</span>
          <span>{charCount} 字符</span>
          <span>{new Blob([content]).size} 字节</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>Markdown</span>
        </div>
      </div>
    </div>
  );
} 