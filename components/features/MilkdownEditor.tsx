"use client";

import { useEffect, useRef } from "react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";

const defaultMarkdown = `# Milkdown\n\n欢迎使用 Milkdown（Crepe 方案）。\n\n- 使用左侧 Slash 面板输入命令\n- 支持代码、表格、任务列表、图片等\n`;

export function MilkdownEditor() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = new Crepe({
      root: containerRef.current,
      defaultValue: defaultMarkdown,
      featureConfigs: {
        [CrepeFeature.CodeMirror]: { searchPlaceholder: "搜索语言" },
        [CrepeFeature.Placeholder]: { text: "请输入..." },
      },
    });
    // Some versions require explicit create
    // @ts-ignore
    const maybeCreate = editor?.create?.bind(editor);
    if (maybeCreate) maybeCreate();

    return () => {
      // @ts-ignore - destroy method if available
      editor?.destroy?.();
    };
  }, []);

  return (
    <div className="milkdown h-full min-h-0 overflow-auto">
      <div ref={containerRef} className="min-h-full" />
    </div>
  );
} 