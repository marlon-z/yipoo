"use client";

import { useEffect, useRef, useState } from "react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { Button } from "@/components/ui/button";
import { Code, Eye } from "lucide-react";
import { CodeMirror6SourceEditor } from "./CodeMirror6SourceEditor";

const defaultMarkdown = `# Milkdown

欢迎使用 Milkdown（Crepe 方案）。

- 使用左侧 Slash 面板输入命令
- 支持代码、表格、任务列表、图片等
- 现在支持源码模式切换！

## 源码模式功能

点击右上角的源码按钮可以切换到源码编辑模式，在源码模式下你可以：

1. 直接编辑 Markdown 源码
2. 查看完整的文档结构
3. 进行精确的格式控制

## 示例代码

\`\`\`javascript
const editor = new Crepe({
  root: container,
  defaultValue: markdown,
});
\`\`\`

## 表格示例

| 功能 | 描述 | 状态 |
|------|------|------|
| 所见即所得 | WYSIWYG 编辑 | ✅ |
| 源码模式 | Markdown 源码编辑 | ✅ |
| 实时同步 | 双向内容同步 | ✅ |
`;

export function EnhancedMilkdownEditor() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any | null>(null);
  const currentFileIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  
  // 源码模式状态
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [markdownContent, setMarkdownContent] = useState(defaultMarkdown);

  const dispatchSave = () => {
    if (!currentFileIdRef.current) return;
    try {
      const content = isSourceMode ? markdownContent : editorRef.current?.getMarkdown?.();
      if (typeof content === 'string') {
        const ev = new CustomEvent('dw-save-file', { 
          detail: { id: currentFileIdRef.current!, content } 
        });
        window.dispatchEvent(ev);
      }
    } catch {
      // ignore
    }
  };

  const debounceSave = (fn: () => void, wait = 400) => {
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(fn, wait);
  };

  const createEditor = (markdown?: string) => {
    if (!containerRef.current || isSourceMode) return;
    
    try {
      // destroy old
      editorRef.current?.destroy?.();
    } catch {}
    
    // 使用传入的 markdown 或当前状态中的 markdownContent
    const content = markdown !== undefined ? markdown : markdownContent;
    
    const editor = new Crepe({
      root: containerRef.current,
      defaultValue: content,
      featureConfigs: {
        [CrepeFeature.CodeMirror]: { searchPlaceholder: "搜索语言" },
        [CrepeFeature.Placeholder]: { text: "请输入..." },
        [CrepeFeature.Prism]: true, // 启用语法高亮
      },
    });
    
    // Some versions require explicit create
    const maybeCreate = editor?.create?.bind(editor);
    if (maybeCreate) maybeCreate();
    editorRef.current = editor;
  };

  // 切换编辑模式
  const toggleMode = () => {
    if (isSourceMode) {
      // 从源码模式切换到所见即所得模式
      setIsSourceMode(false);
      // 不需要手动创建编辑器，useEffect 会处理
    } else {
      // 从所见即所得模式切换到源码模式
      try {
        const currentMarkdown = editorRef.current?.getMarkdown?.();
        if (typeof currentMarkdown === 'string') {
          setMarkdownContent(currentMarkdown);
        }
      } catch {
        // ignore
      }
      setIsSourceMode(true);
    }
  };

  // 处理源码模式内容变化
  const handleSourceContentChange = (content: string) => {
    setMarkdownContent(content);
    debounceSave(() => dispatchSave(), 400);
  };



  useEffect(() => {
    if (!isSourceMode && containerRef.current) {
      createEditor(); // 不传参数，让 createEditor 使用当前的 markdownContent

      const onOpen = (e: Event) => {
        const ce = e as CustomEvent<{ id: string; name: string; path: string; content: string }>;
        if (!ce.detail) return;
        currentFileIdRef.current = ce.detail.id;
        const content = typeof ce.detail.content === 'string' ? ce.detail.content : '';
        setMarkdownContent(content);
        
        if (!isSourceMode) {
          try {
            if (editorRef.current?.setMarkdown) {
              editorRef.current.setMarkdown(content);
            } else if (editorRef.current?.setContent) {
              editorRef.current.setContent(content);
            } else if (editorRef.current?.replace) {
              editorRef.current.replace(content);
            } else {
              createEditor(content);
            }
          } catch {
            createEditor(content);
          }
        }
      };

      const doSave = () => dispatchSave();
      const onDomInput = () => debounceSave(doSave, 400);

      const onForceSave = () => dispatchSave();

      window.addEventListener('open-file', onOpen as EventListener);
      window.addEventListener('dw-force-save', onForceSave as EventListener);
      
      const el = containerRef.current;
      el.addEventListener('input', onDomInput, true);
      el.addEventListener('keyup', onDomInput, true);
      el.addEventListener('paste', onDomInput, true);
      el.addEventListener('cut', onDomInput, true);
      el.addEventListener('drop', onDomInput, true);

      // Observe PM DOM changes as fallback
      const pm = el.querySelector('.ProseMirror');
      if (pm && 'MutationObserver' in window) {
        const obs = new MutationObserver(() => onDomInput());
        obs.observe(pm, { childList: true, characterData: true, subtree: true });
        observerRef.current = obs;
      }

      return () => {
        window.removeEventListener('open-file', onOpen as EventListener);
        window.removeEventListener('dw-force-save', onForceSave as EventListener);
        el.removeEventListener('input', onDomInput, true);
        el.removeEventListener('keyup', onDomInput, true);
        el.removeEventListener('paste', onDomInput, true);
        el.removeEventListener('cut', onDomInput, true);
        el.removeEventListener('drop', onDomInput, true);
        observerRef.current?.disconnect();
        try {
          editorRef.current?.destroy?.();
        } catch {}
        editorRef.current = null;
      };
    }
  }, [isSourceMode]); // 只依赖 isSourceMode，避免内容更新时重新创建编辑器

  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col">
      {/* 工具栏 */}
      {!isSourceMode && (
        <div className="flex items-center justify-end px-4 py-2 border-b bg-muted/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMode}
            className="h-8 px-2"
          >
            <Code className="h-4 w-4 mr-1" />
            源码
          </Button>
        </div>
      )}

      {/* 编辑器容器 */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {/* Milkdown 编辑器 */}
        {!isSourceMode && (
          <div className="milkdown h-full min-h-0 overflow-auto">
            <div ref={containerRef} className="min-h-full" />
          </div>
        )}

        {/* 源码模式编辑器 */}
        <CodeMirror6SourceEditor
          content={markdownContent}
          onChange={handleSourceContentChange}
          onToggleMode={toggleMode}
          isSourceMode={isSourceMode}
        />
      </div>
    </div>
  );
} 