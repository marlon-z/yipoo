"use client";

import { Button } from '@/components/ui/button';
import { 
  Menu, 
  FileText, 
  Eye, 
  Settings, 
  GitBranch, 
  Download, 
  Moon, 
  Sun,
  PanelRight,
  Users
} from 'lucide-react';
import { startTask, updateTask, completeTask, failTask } from '@/lib/task-bus';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (value: boolean) => void;
}

export function TopBar({ isDarkMode, setIsDarkMode, isRightSidebarOpen, setIsRightSidebarOpen }: TopBarProps) {
  const { editorState, saveContent } = require('@/contexts/EditorContext');
  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg">MarkdownIDE</span>
        </div>
        
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                文件
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>新建文件</DropdownMenuItem>
              <DropdownMenuItem>打开文件</DropdownMenuItem>
              <DropdownMenuItem>保存</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>导入</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                编辑
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>撤销</DropdownMenuItem>
              <DropdownMenuItem>重做</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>查找</DropdownMenuItem>
              <DropdownMenuItem>替换</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                视图
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>所见即所得</DropdownMenuItem>
              <DropdownMenuItem>源码模式</DropdownMenuItem>
              <DropdownMenuItem>分屏模式</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>全屏</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>untitled-1.md</span>
        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <GitBranch className="w-4 h-4 mr-1" />
          同步
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={async () => {
              let id: any;
              try {
                const { useEditorContext } = require('@/contexts/EditorContext');
                const { downloadAsFile } = require('@/hooks/use-file-system');
                const { editorState, saveContent } = useEditorContext();
                id = startTask('导出 Markdown', 5);
                await saveContent();
                updateTask(id, { progress: 60 });
                await downloadAsFile('untitled-1.md', editorState.content, 'text/markdown');
                completeTask(id);
              } catch (e: any) {
                try { failTask?.(id, e?.message || '导出失败'); } catch {}
                console.error(e);
              }
            }}>Markdown (.md)</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => {
              let id: any;
              try {
                const { useEditorContext } = require('@/contexts/EditorContext');
                const { useExportSettings } = require('@/contexts/ExportContext');
                const { renderHtml } = require('@/lib/exporters');
                const { downloadAsFile } = require('@/hooks/use-file-system');
                const { editorState, saveContent } = useEditorContext();
                id = startTask('导出 HTML', 5);
                await saveContent();
                const opts = useExportSettings().settings;
                updateTask(id, { progress: 40 });
                const html = await renderHtml(editorState.content, { title: '导出', math: opts.math, highlight: opts.highlight });
                updateTask(id, { progress: 80 });
                await downloadAsFile('untitled-1.html', html, 'text/html');
                completeTask(id);
              } catch (e: any) {
                try { failTask?.(id, e?.message || '导出失败'); } catch {}
                console.error(e);
              }
            }}>HTML (.html)</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => {
              let id: any;
              try {
                const { useEditorContext } = require('@/contexts/EditorContext');
                const { renderPdf } = require('@/lib/exporters');
                const { downloadAsFile } = require('@/hooks/use-file-system');
                const { editorState, saveContent } = useEditorContext();
                id = startTask('导出 PDF', 5);
                await saveContent();
                updateTask(id, { progress: 40 });
                const bytes = await renderPdf(editorState.content);
                updateTask(id, { progress: 80 });
                await downloadAsFile('untitled-1.pdf', new Uint8Array(bytes), 'application/pdf');
                completeTask(id);
              } catch (e: any) {
                try { failTask?.(id, e?.message || '导出失败'); } catch {}
                console.error(e);
              }
            }}>PDF (.pdf)</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => {
              let id: any;
              try {
                const { useEditorContext } = require('@/contexts/EditorContext');
                const { renderDocx } = require('@/lib/exporters');
                const { downloadAsFile } = require('@/hooks/use-file-system');
                const { editorState, saveContent } = useEditorContext();
                id = startTask('导出 DOCX', 5);
                await saveContent();
                updateTask(id, { progress: 40 });
                const blob = await renderDocx(editorState.content);
                updateTask(id, { progress: 80 });
                await downloadAsFile('untitled-1.docx', blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                completeTask(id);
              } catch (e: any) {
                try { failTask?.(id, e?.message || '导出失败'); } catch {}
                console.error(e);
              }
            }}>DOCX (.docx)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm">
          <Users className="w-4 h-4 mr-1" />
          协作
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        >
          <PanelRight className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}