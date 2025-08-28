"use client";

import { Button } from '@/components/ui/button';
import { startTask, updateTask, completeTask, failTask } from '@/lib/task-bus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, FileText, Image, BookOpen } from 'lucide-react';

export function ExportPanel() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出格式
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-start" onClick={async () => { let id:any; try { const { useEditorContext } = require('@/contexts/EditorContext'); const { downloadAsFile } = require('@/hooks/use-file-system'); const { renderHtml } = require('@/lib/exporters'); const { editorState, saveContent } = useEditorContext(); id = startTask('导出 PDF', 5); await saveContent(); updateTask(id, { progress: 30 }); const html = await renderHtml(editorState.content); const { renderPdf } = require('@/lib/exporters'); const bytes = await renderPdf(editorState.content); await downloadAsFile('untitled-1.pdf', new Uint8Array(bytes), 'application/pdf'); completeTask(id); } catch(e:any) { try { failTask?.(id, e?.message || '导出失败'); } catch {} console.error(e); } }} >
            <FileText className="w-4 h-4 mr-2" />
            导出为 PDF
          </Button>
          
          <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-start" onClick={async () => { let id:any; try { const { useEditorContext } = require('@/contexts/EditorContext'); const { downloadAsFile } = require('@/hooks/use-file-system'); const { editorState, saveContent } = useEditorContext(); id = startTask('导出 DOCX', 5); await saveContent(); updateTask(id, { progress: 30 }); const { renderDocx } = require('@/lib/exporters'); const blob = await renderDocx(editorState.content); await downloadAsFile('untitled-1.docx', blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); completeTask(id); } catch(e:any) { try { failTask?.(id, e?.message || '导出失败'); } catch {} console.error(e); } }} >
            <BookOpen className="w-4 h-4 mr-2" />
            导出为 DOCX
          </Button>
          
          <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-start" onClick={async () => { let id:any; try { const { useEditorContext } = require('@/contexts/EditorContext'); const { downloadAsFile } = require('@/hooks/use-file-system'); const { editorState, saveContent } = useEditorContext(); id = startTask('导出 Markdown', 5); await saveContent(); updateTask(id, { progress: 60 }); await downloadAsFile('untitled-1.md', editorState.content, 'text/markdown'); completeTask(id); } catch(e:any) { try { failTask?.(id, e?.message || '导出失败'); } catch {} console.error(e); } }}>
            <FileText className="w-4 h-4 mr-2" />
            导出为 Markdown
          </Button>
          
          <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-start" onClick={async () => { let id:any; try { const { useEditorContext } = require('@/contexts/EditorContext'); const { downloadAsFile } = require('@/hooks/use-file-system'); const { renderHtml } = require('@/lib/exporters'); const { editorState, saveContent } = useEditorContext(); id = startTask('导出 HTML', 5); await saveContent(); updateTask(id, { progress: 50 }); const html = await renderHtml(editorState.content); await downloadAsFile('untitled-1.html', html, 'text/html'); completeTask(id); } catch(e:any) { try { failTask?.(id, e?.message || '导出失败'); } catch {} console.error(e); } }} >
            <Image className="w-4 h-4 mr-2" />
            导出为 HTML
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">导出选项</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs">包含目录</Label>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">页面编号</Label>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">语法高亮</Label>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">数学公式</Label>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">图表渲染</Label>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">快捷导出</CardTitle>
        </CardHeader>
        <CardContent>
          <Button size="sm" className="w-full h-8 text-xs">
            <Download className="w-3 h-3 mr-2" />
            一键导出 PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}