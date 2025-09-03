"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  Search, 
  Moon, 
  Sun, 
  RotateCcw, 
  RotateCw, 
  FileText, 
  Layers, 
  Zap,
  Eye,
  Palette,
  Keyboard
} from "lucide-react";

export function CodeMirror6Demo() {
  const [activeTab, setActiveTab] = useState<'features' | 'shortcuts' | 'comparison'>('features');

  const features = [
    {
      icon: <Code className="h-5 w-5" />,
      title: "Markdown 语法高亮",
      description: "专业的 Markdown 语法着色，清晰区分标题、粗体、斜体、代码等元素",
      badge: "新功能"
    },
    {
      icon: <Search className="h-5 w-5" />,
      title: "强大的搜索功能",
      description: "支持正则表达式搜索、全局搜索替换，快速定位内容",
      badge: "增强"
    },
    {
      icon: <RotateCcw className="h-5 w-5" />,
      title: "撤销/重做系统",
      description: "完整的历史记录管理，支持多级撤销和重做操作",
      badge: "标准"
    },
    {
      icon: <Layers className="h-5 w-5" />,
      title: "代码折叠",
      description: "支持代码块、列表、引用等内容的折叠，提高编辑效率",
      badge: "新功能"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "智能补全",
      description: "基于上下文的智能提示，快速输入常用 Markdown 语法",
      badge: "智能"
    },
    {
      icon: <Palette className="h-5 w-5" />,
      title: "主题切换",
      description: "支持亮色/暗色主题，适应不同的使用环境和个人偏好",
      badge: "个性化"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "文档格式化",
      description: "一键格式化 Markdown 文档，统一代码风格和缩进",
      badge: "工具"
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: "实时光标定位",
      description: "精确显示当前光标位置（行号、列号），便于精确编辑",
      badge: "信息"
    }
  ];

  const shortcuts = [
    { category: "基本编辑", items: [
      { key: "Ctrl/Cmd + Z", desc: "撤销" },
      { key: "Ctrl/Cmd + Y", desc: "重做" },
      { key: "Ctrl/Cmd + A", desc: "全选" },
      { key: "Ctrl/Cmd + C", desc: "复制" },
      { key: "Ctrl/Cmd + V", desc: "粘贴" }
    ]},
    { category: "搜索替换", items: [
      { key: "Ctrl/Cmd + F", desc: "搜索" },
      { key: "Ctrl/Cmd + H", desc: "替换" },
      { key: "F3", desc: "查找下一个" },
      { key: "Shift + F3", desc: "查找上一个" },
      { key: "Ctrl/Cmd + G", desc: "跳转到行" }
    ]},
    { category: "代码操作", items: [
      { key: "Tab", desc: "增加缩进" },
      { key: "Shift + Tab", desc: "减少缩进" },
      { key: "Ctrl/Cmd + /", desc: "切换注释" },
      { key: "Ctrl/Cmd + [", desc: "折叠代码" },
      { key: "Ctrl/Cmd + ]", desc: "展开代码" }
    ]},
    { category: "导航操作", items: [
      { key: "Ctrl/Cmd + Home", desc: "文档开头" },
      { key: "Ctrl/Cmd + End", desc: "文档结尾" },
      { key: "Ctrl/Cmd + ←", desc: "词向左" },
      { key: "Ctrl/Cmd + →", desc: "词向右" },
      { key: "Alt + ↑/↓", desc: "移动行" }
    ]}
  ];

  const comparison = [
    {
      feature: "语法高亮",
      before: "❌ 无高亮",
      after: "✅ 完整 Markdown 高亮",
      improvement: "专业编辑体验"
    },
    {
      feature: "搜索功能",
      before: "❌ 浏览器基础搜索",
      after: "✅ 正则表达式搜索",
      improvement: "强大搜索能力"
    },
    {
      feature: "代码折叠",
      before: "❌ 不支持",
      after: "✅ 智能折叠",
      improvement: "大文档编辑"
    },
    {
      feature: "自动补全",
      before: "❌ 不支持",
      after: "✅ 上下文感知",
      improvement: "提高输入效率"
    },
    {
      feature: "主题支持",
      before: "✅ 系统主题",
      after: "✅ 专业编辑器主题",
      improvement: "更好的视觉体验"
    },
    {
      feature: "性能表现",
      before: "✅ 轻量级",
      after: "✅ 优化渲染",
      improvement: "大文件处理"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">CodeMirror 6 源码编辑器</h1>
        <p className="text-muted-foreground">
          专业级 Markdown 源码编辑体验，与 Milkdown 官方技术栈一致
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="default">CodeMirror 6</Badge>
          <Badge variant="secondary">语法高亮</Badge>
          <Badge variant="outline">智能补全</Badge>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="flex justify-center space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'features' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('features')}
        >
          <Code className="h-4 w-4 mr-1" />
          新功能
        </Button>
        <Button
          variant={activeTab === 'shortcuts' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('shortcuts')}
        >
          <Keyboard className="h-4 w-4 mr-1" />
          快捷键
        </Button>
        <Button
          variant={activeTab === 'comparison' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('comparison')}
        >
          <Layers className="h-4 w-4 mr-1" />
          升级对比
        </Button>
      </div>

      {/* 新功能展示 */}
      {activeTab === 'features' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
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
        <div className="grid md:grid-cols-2 gap-6">
          {shortcuts.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.items.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">{shortcut.desc}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {shortcut.key}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 升级对比 */}
      {activeTab === 'comparison' && (
        <Card>
          <CardHeader>
            <CardTitle>升级前后对比</CardTitle>
            <CardDescription>
              从基础 textarea 升级到专业 CodeMirror 6 编辑器的改进
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">功能特性</th>
                    <th className="text-left p-3">升级前</th>
                    <th className="text-left p-3">升级后</th>
                    <th className="text-left p-3">改进效果</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{item.feature}</td>
                      <td className="p-3 text-muted-foreground">{item.before}</td>
                      <td className="p-3 text-green-600">{item.after}</td>
                      <td className="p-3">
                        <Badge variant="outline">{item.improvement}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用示例 */}
      <Card>
        <CardHeader>
          <CardTitle>使用示例</CardTitle>
          <CardDescription>
            以下是 CodeMirror 6 编辑器支持的 Markdown 语法示例
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg text-sm font-mono space-y-2">
            <div className="text-blue-600"># 标题 1</div>
            <div className="text-blue-500">## 标题 2</div>
            <div className="text-blue-400">### 标题 3</div>
            <br />
            <div><span className="font-bold">**粗体文本**</span> 和 <span className="italic">*斜体文本*</span></div>
            <br />
            <div className="text-green-600">- 无序列表项 1</div>
            <div className="text-green-600">- 无序列表项 2</div>
            <div className="text-green-600 ml-4">- 嵌套列表项</div>
            <br />
            <div className="text-purple-600">1. 有序列表项 1</div>
            <div className="text-purple-600">2. 有序列表项 2</div>
            <br />
            <div className="bg-gray-200 px-1 rounded">`行内代码`</div>
            <br />
            <div className="text-gray-600">```javascript</div>
            <div className="text-red-500 ml-2">// 代码块</div>
            <div className="text-blue-500 ml-2">const editor = new EditorView({});</div>
            <div className="text-gray-600">```</div>
            <br />
                         <div className="text-yellow-600">&gt; 引用文本</div>
             <div className="text-yellow-600">&gt; 可以多行</div>
            <br />
            <div className="text-indigo-600">[链接文本](https://example.com)</div>
          </div>
        </CardContent>
      </Card>

      {/* 技术细节 */}
      <Card>
        <CardHeader>
          <CardTitle>技术规格</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">核心技术</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• CodeMirror 6.x</li>
                <li>• Lezer 解析器</li>
                <li>• TypeScript</li>
                <li>• React 18</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">性能指标</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 虚拟滚动</li>
                <li>• 增量更新</li>
                <li>• 按需渲染</li>
                <li>• 内存优化</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">扩展能力</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 自定义语言</li>
                <li>• 插件系统</li>
                <li>• 主题定制</li>
                <li>• 命令扩展</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 