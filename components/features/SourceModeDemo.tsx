"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Eye, FileText, Download, Copy, Keyboard } from "lucide-react";

export function SourceModeDemo() {
  const [activeTab, setActiveTab] = useState<'features' | 'shortcuts' | 'usage'>('features');

  const features = [
    {
      icon: <Code className="h-5 w-5" />,
      title: "Markdown 源码编辑",
      description: "直接编辑 Markdown 源码，支持完整的 Markdown 语法"
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: "实时预览切换",
      description: "在所见即所得和源码模式之间无缝切换"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "行号显示",
      description: "显示行号，方便定位和编辑代码"
    },
    {
      icon: <Download className="h-5 w-5" />,
      title: "导出功能",
      description: "支持复制内容和下载 Markdown 文件"
    },
    {
      icon: <Keyboard className="h-5 w-5" />,
      title: "快捷键支持",
      description: "支持 Tab 缩进、注释切换等编辑器快捷键"
    },
    {
      icon: <Copy className="h-5 w-5" />,
      title: "智能编辑",
      description: "自动缩进、多行编辑、智能注释等功能"
    }
  ];

  const shortcuts = [
    { key: "Tab", description: "增加缩进" },
    { key: "Shift + Tab", description: "减少缩进" },
    { key: "Ctrl/Cmd + S", description: "保存文档" },
    { key: "Ctrl/Cmd + /", description: "切换注释" },
    { key: "Ctrl/Cmd + A", description: "全选内容" },
    { key: "Ctrl/Cmd + Z", description: "撤销操作" }
  ];

  const usageSteps = [
         {
       step: 1,
       title: "点击源码按钮",
       description: "在编辑器右上角点击「源码」按钮进入源码模式"
     },
    {
      step: 2,
      title: "编辑 Markdown",
      description: "在源码编辑器中直接编辑 Markdown 语法"
    },
    {
      step: 3,
      title: "实时同步",
      description: "内容会自动保存，切换回预览模式查看效果"
    },
    {
      step: 4,
      title: "导出分享",
      description: "使用复制或下载功能分享你的 Markdown 文档"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Milkdown 源码模式</h1>
        <p className="text-muted-foreground">
          强大的 Markdown 源码编辑功能，让你更精确地控制文档格式
        </p>
      </div>

      {/* 标签页导航 */}
      <div className="flex justify-center space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'features' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('features')}
        >
          功能特性
        </Button>
        <Button
          variant={activeTab === 'shortcuts' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('shortcuts')}
        >
          快捷键
        </Button>
        <Button
          variant={activeTab === 'usage' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('usage')}
        >
          使用指南
        </Button>
      </div>

      {/* 功能特性 */}
      {activeTab === 'features' && (
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 快捷键 */}
      {activeTab === 'shortcuts' && (
        <Card>
          <CardHeader>
            <CardTitle>编辑器快捷键</CardTitle>
            <CardDescription>
              这些快捷键可以帮助你更高效地编辑 Markdown 源码
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">{shortcut.description}</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {shortcut.key}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用指南 */}
      {activeTab === 'usage' && (
        <div className="space-y-4">
          {usageSteps.map((step, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 示例代码 */}
      <Card>
        <CardHeader>
          <CardTitle>Markdown 语法示例</CardTitle>
          <CardDescription>
            在源码模式下，你可以直接编辑这些 Markdown 语法
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`# 标题 1
## 标题 2
### 标题 3

**粗体文本** 和 *斜体文本*

- 无序列表项 1
- 无序列表项 2
  - 嵌套列表项

1. 有序列表项 1
2. 有序列表项 2

\`行内代码\`

\`\`\`javascript
// 代码块
const editor = new Crepe({
  root: container,
  defaultValue: markdown
});
\`\`\`

| 表格 | 列 1 | 列 2 |
|------|------|------|
| 行 1 | 数据 | 数据 |
| 行 2 | 数据 | 数据 |

> 引用文本
> 可以多行

[链接文本](https://example.com)

![图片描述](image-url.jpg)`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
} 