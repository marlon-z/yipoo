"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useFileSystem } from '@/hooks/use-file-system';

interface EditorState {
  content: string;
  cursorPosition?: number;
  scrollPosition?: number;
  lastSaved?: Date;
  isDirty: boolean;
}

interface EditorContextType {
  editorState: EditorState;
  updateContent: (content: string) => void;
  updateCursorPosition: (position: number) => void;
  updateScrollPosition: (position: number) => void;
  markSaved: () => void;
  markDirty: () => void;

  editorMode: 'wysiwyg' | 'source' | 'split';
  setEditorMode: (mode: 'wysiwyg' | 'source' | 'split') => void;

  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;

  saveContent: () => Promise<void>;
  loadContent: (content: string) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function useEditorContext() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditorContext must be used within an EditorProvider');
  return ctx;
}

interface EditorProviderProps {
  children: React.ReactNode;
  initialContent?: string;
  fileName?: string;
}

export function EditorProvider({ children, initialContent = '', fileName = 'untitled-1.md' }: EditorProviderProps) {
  const { saveToRecovery, saveToDW, loadFromDW, loadFromRecovery } = useFileSystem();

  const [editorState, setEditorState] = useState<EditorState>({
    content: initialContent,
    isDirty: false,
    lastSaved: new Date(),
  });
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'source' | 'split'>('wysiwyg');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // 初始化：加载 DW 或恢复层内容
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [dw, rec] = await Promise.all([
          loadFromDW(fileName),
          loadFromRecovery(fileName),
        ]);
        const content = rec ?? dw ?? initialContent;
        if (!alive) return;
        setEditorState(prev => ({ ...prev, content, isDirty: false, lastSaved: new Date() }));
      } catch {}
    })();
    return () => { alive = false };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateContent = useCallback((content: string) => {
    setEditorState(prev => ({ ...prev, content, isDirty: true }));
  }, []);

  const updateCursorPosition = useCallback((position: number) => {
    setEditorState(prev => ({ ...prev, cursorPosition: position }));
  }, []);

  const updateScrollPosition = useCallback((position: number) => {
    setEditorState(prev => ({ ...prev, scrollPosition: position }));
  }, []);

  const markSaved = useCallback(() => {
    setEditorState(prev => ({ ...prev, isDirty: false, lastSaved: new Date() }));
  }, []);

  const markDirty = useCallback(() => {
    setEditorState(prev => ({ ...prev, isDirty: true }));
  }, []);

  const saveContent = useCallback(async () => {
    const content = editorState.content;
    await saveToRecovery(fileName, content);
    await saveToDW(fileName, content);
    markSaved();
  }, [editorState.content, fileName, markSaved, saveToDW, saveToRecovery]);

  const loadContent = useCallback((content: string) => {
    setEditorState({ content, isDirty: false, lastSaved: new Date() });
  }, []);

  // 自动保存：2s 写恢复层、5s 写 DW
  useEffect(() => {
    if (!autoSaveEnabled || !editorState.isDirty) return;
    const content = editorState.content;
    const t1 = setTimeout(() => { saveToRecovery(fileName, content).catch(() => void 0); }, 2000);
    const t2 = setTimeout(() => { saveToDW(fileName, content).then(markSaved).catch(() => void 0); }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [autoSaveEnabled, editorState.isDirty, editorState.content, fileName, saveToRecovery, saveToDW, markSaved]);

  // 页面离开前保存
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editorState.isDirty) {
        const c = editorState.content;
        saveToRecovery(fileName, c).catch(() => void 0);
        saveToDW(fileName, c).catch(() => void 0);
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [editorState.isDirty, editorState.content, fileName, saveToRecovery, saveToDW]);

  const value: EditorContextType = {
    editorState,
    updateContent,
    updateCursorPosition,
    updateScrollPosition,
    markSaved,
    markDirty,
    editorMode,
    setEditorMode,
    autoSaveEnabled,
    setAutoSaveEnabled,
    saveContent,
    loadContent,
  };

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
