# Yipoo Markdown IDE

一个基于 Next.js + Milkdown 的所见即所得/源码双模编辑器，内置 Git 视图、历史版本、文件资源管理等工作区能力，适合个人知识库与文档写作。

- 在线演示: https://www.yipoo.org
- 联系邮箱: marlonzhang677@gmail.com

## 主要功能
- 所见即所得编辑（Milkdown Crepe）
- 源码模式（CodeMirror 样式文本编辑）并可一键切换
- 右侧栏：主题与模式、目录（TOC）设置、导出/协作占位
- 左侧栏：资源管理器、搜索、Git/历史/分支等视图（示例实现）
- 顶部工具栏：文件操作、主题切换、右侧栏开关、导出入口

> 说明：导出格式与协作面板当前为“开发中”，界面会显示提示但不执行真实逻辑。

## 快速开始

1. 克隆代码并安装依赖
```bash
npm install
```

2. 开发模式
```bash
npm run dev
```

3. 构建与启动
```bash
npm run build
npm run start
```

## 可用脚本
- `npm run dev`: 本地开发（默认 3000 端口）
- `npm run build`: 生产构建
- `npm run start`: 生产启动
- `npm run lint`: 代码检查（当前构建跳过 lint，可按需启用）

## 配置与环境
- 环境变量示例见 `env.example`
- NextAuth、GitHub API 等集成位于 `app/api` 与 `lib/*`

## 技术栈
- 应用框架: Next.js 13 (App Router)
- 富文本: Milkdown Crepe + 主题化样式
- 源码编辑:  CodeMirror6 
- UI 组件: Radix UI + TailwindCSS（shadcn 风格组件）
- 其它: isomorphic-git、octokit、mermaid、katex、prismjs

## 目录结构（节选）
```
app/
  api/                # 接口（auth/docs/github）
  layout.tsx
  page.tsx            # 应用入口
components/
  features/           # 功能组件（编辑器、视图面板等）
  layout/             # 布局组件（TopBar/Sidebars/MainEditor）
  ui/                 # UI 基础组件
docs/                 # 内置帮助文档
lib/                  # 工具与集成（git/github/upload 等）
```

## 开发提示
- 模式切换：右侧栏“模式”Tab 与编辑器右上角按钮均可切换；从“源码”回到“预览”会自动同步内容。
- 字体大小：右侧栏“源码字体大小”通过 CSS 变量作用于编辑区域。
- 目录（TOC）：可设置显示层级、开关大纲、自动折叠当前章节。

## 许可
本项目为演示用途，未附带额外开源许可证，如需在生产中使用请按需补充 License。

---
如需商务合作或功能定制，欢迎邮件联系：marlonzhang677@gmail.com 