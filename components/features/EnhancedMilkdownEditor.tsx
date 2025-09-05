"use client";

import { useEffect, useRef, useState } from "react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { Button } from "@/components/ui/button";
import { Code, Eye } from "lucide-react";
import { CodeMirror6SourceEditor } from "./CodeMirror6SourceEditor";
import { milkdownUploader, UploadResult } from "@/lib/upload-handler";
import { Editor } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { upload } from "@milkdown/plugin-upload";

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
  const [uploadProgress, setUploadProgress] = useState<{
    isUploading: boolean;
    progress: number;
    fileName?: string;
  }>({ isUploading: false, progress: 0 });

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
    if (!containerRef.current || isSourceMode) {
      return;
    }
    
    try {
      // destroy old
      editorRef.current?.destroy?.();
    } catch {}
    
    // 使用传入的 markdown 或当前状态中的 markdownContent
    const content = markdown !== undefined ? markdown : markdownContent;
    
    // 配置上传处理器
    const uploadHandler = async (files: FileList): Promise<string> => {
      try {
        const results = await milkdownUploader(files);
        if (results.length > 0) {
          const result = results[0]; // 取第一个文件
          // 根据文件类型返回不同的Markdown格式
          if (result.url.startsWith('data:image/')) {
            return `![${result.alt || ''}](${result.url})`;
          } else {
            return `[${result.title || result.alt || '文件'}](${result.url})`;
          }
        }
        return '';
      } catch (error) {
        console.error('文件上传失败:', error);
        throw error;
      }
    };

    const editor = new Crepe({
      root: containerRef.current,
      defaultValue: content,
      featureConfigs: {
        [CrepeFeature.CodeMirror]: { searchPlaceholder: "搜索语言" },
        [CrepeFeature.Placeholder]: { text: "请输入..." },
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

  // 处理文件上传
  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    setUploadProgress({ isUploading: true, progress: 0, fileName: files[0].name });
    
    try {
      const results = await milkdownUploader(files);
      
      // 模拟上传进度
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(prev => ({ ...prev, progress: i }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (results.length > 0) {
        const result = results[0];
        
        // 插入Markdown格式的内容到编辑器
        let insertText = '';
        if (result.url.startsWith('data:image/')) {
          insertText = `![${result.alt || ''}](${result.url})`;
        } else {
          insertText = `[${result.title || result.alt || '文件'}](${result.url})`;
        }
        
        // 获取当前内容并插入新内容
        const newContent = markdownContent + '\n\n' + insertText;
        
        // 更新状态（useEffect会自动重新创建编辑器）
        setMarkdownContent(newContent);
        
        // 触发保存
        setTimeout(() => {
          dispatchSave();
        }, 500);
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setUploadProgress({ isUploading: false, progress: 0 });
    }
  };

  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
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

      // 监听来自TopBar的文件上传事件
      const onEditorFileUpload = (e: Event) => {
        const ce = e as CustomEvent<{ files: FileList }>;
        if (ce.detail?.files) {
          handleFileUpload(ce.detail.files);
        }
      };

      // 监听获取编辑器内容事件
      const onGetEditorContent = (e: Event) => {
        const ce = e as CustomEvent<{ callback: (content: string) => void }>;
        if (ce.detail?.callback) {
          const content = isSourceMode ? markdownContent : (editorRef.current?.getMarkdown?.() || markdownContent);
          ce.detail.callback(content);
        }
      };

      window.addEventListener('open-file', onOpen as EventListener);
      window.addEventListener('editor-file-upload', onEditorFileUpload as EventListener);
      window.addEventListener('get-editor-content', onGetEditorContent as EventListener);
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
        window.removeEventListener('editor-file-upload', onEditorFileUpload as EventListener);
        window.removeEventListener('get-editor-content', onGetEditorContent as EventListener);
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
  }, [isSourceMode, markdownContent]); // 依赖 isSourceMode 和 markdownContent

  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col">
      {/* 工具栏 - 始终显示切换按钮，上传时显示进度 */}
      {!isSourceMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
          {/* 左侧：上传进度显示（仅在上传时显示） */}
          <div className="flex items-center gap-2">
            {uploadProgress.isUploading && (
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {uploadProgress.fileName} ({uploadProgress.progress}%)
                </span>
              </div>
            )}
          </div>

          {/* 右侧：模式切换 */}
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
          <div 
            className="milkdown h-full w-full min-h-0 overflow-auto bg-background"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div ref={containerRef} className="h-full min-h-full bg-background" />
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