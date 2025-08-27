"use client";

export function WysiwygEditor() {
  return (
    <div className="h-full bg-background p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Demo Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Welcome to MarkdownIDE</h1>
          
          <p className="text-muted-foreground leading-relaxed">
            这是一个现代化的 Markdown 编辑器，具有类似 VSCode 的专业界面设计。
            您可以在这里编写、预览和管理您的 Markdown 文档。
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">功能特色</h2>
          
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2.5 shrink-0" />
              <span>所见即所得编辑模式</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2.5 shrink-0" />
              <span>源码编辑模式</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2.5 shrink-0" />
              <span>分屏预览模式</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2.5 shrink-0" />
              <span>Git 版本控制集成</span>
            </li>
          </ul>
          
          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mt-6">
            "简洁、专业、现代化的 Markdown 编辑体验"
          </blockquote>
        </div>
      </div>
    </div>
  );
}