"use client";

import { useEffect, useRef } from "react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";

const defaultMarkdown = `# Milkdown\n\n欢迎使用 Milkdown（Crepe 方案）。\n\n- 使用左侧 Slash 面板输入命令\n- 支持代码、表格、任务列表、图片等\n`;

export function MilkdownEditor() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any | null>(null);
  const currentFileIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const dispatchSave = () => {
    if (!currentFileIdRef.current) return;
    try {
      // @ts-ignore
      const md: string | undefined = editorRef.current?.getMarkdown?.();
      if (typeof md === 'string') {
        const ev = new CustomEvent('dw-save-file', { detail: { id: currentFileIdRef.current!, content: md } });
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

  const createEditor = (markdown: string) => {
    if (!containerRef.current) return;
    try {
      // destroy old
      // @ts-ignore
      editorRef.current?.destroy?.();
    } catch {}
    const editor = new Crepe({
      root: containerRef.current,
      defaultValue: markdown,
      featureConfigs: {
        [CrepeFeature.CodeMirror]: { searchPlaceholder: "搜索语言" },
        [CrepeFeature.Placeholder]: { text: "请输入..." },
      },
    });
    // Some versions require explicit create
    // @ts-ignore
    const maybeCreate = editor?.create?.bind(editor);
    if (maybeCreate) maybeCreate();
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    createEditor(defaultMarkdown);

    const onOpen = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; name: string; path: string; content: string }>;
      if (!ce.detail) return;
      currentFileIdRef.current = ce.detail.id;
      const content = typeof ce.detail.content === 'string' ? ce.detail.content : '';
      // Try method-based update first; if not working, rebuild instance with new defaultValue
      try {
        // @ts-ignore
        if (editorRef.current?.setMarkdown) {
          // @ts-ignore
          editorRef.current.setMarkdown(content);
        } else if (editorRef.current?.setContent) {
          // @ts-ignore
          editorRef.current.setContent(content);
        } else if (editorRef.current?.replace) {
          // @ts-ignore
          editorRef.current.replace(content);
        } else {
          createEditor(content);
        }
      } catch {
        createEditor(content);
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
        // @ts-ignore
        editorRef.current?.destroy?.();
      } catch {}
      editorRef.current = null;
    };
  }, []);

  return (
    <div className="milkdown h-full min-h-0 overflow-auto">
      <div ref={containerRef} className="min-h-full" />
    </div>
  );
} 