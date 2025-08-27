"use client";

export function SourceEditor() {
  const sampleMarkdown = `# Welcome to MarkdownIDE

这是一个现代化的 Markdown 编辑器，具有类似 VSCode 的专业界面设计。

## 功能特色

- 所见即所得编辑模式
- 源码编辑模式  
- 分屏预览模式
- Git 版本控制集成

### 代码高亮

\`\`\`javascript
function hello() {
  console.log("Hello, MarkdownIDE!");
}
\`\`\`

### 表格支持

| 功能 | 状态 | 优先级 |
|------|------|--------|
| 编辑器 | ✅ | 高 |
| Git集成 | 🔄 | 高 |
| 导出功能 | 📋 | 中 |

> 简洁、专业、现代化的 Markdown 编辑体验`;

  return (
    <div className="h-full bg-background font-mono text-sm">
      <div className="h-full p-4 overflow-auto">
        <div className="relative">
          {/* Line Numbers */}
          <div className="absolute left-0 top-0 w-12 text-right text-muted-foreground text-xs leading-6 select-none">
            {sampleMarkdown.split('\n').map((_, index) => (
              <div key={index} className="px-2">
                {index + 1}
              </div>
            ))}
          </div>
          
          {/* Content */}
          <div className="ml-12 pl-4">
            <pre className="leading-6 whitespace-pre-wrap text-foreground">
              {sampleMarkdown}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}