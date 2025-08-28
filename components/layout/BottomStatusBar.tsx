"use client";

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Zap, MapPin, Type, Clock, ListTodo, AlertCircle, Activity } from 'lucide-react';

export function BottomStatusBar() {
  const [taskSummary, setTaskSummary] = useState<{ running: number; errors: number }>({ running: 0, errors: 0 });

  useEffect(() => {
    try {
      const { subscribe } = require('@/lib/task-bus') as typeof import('@/lib/task-bus');
      const unsubscribe = subscribe((tasks) => {
        const running = tasks.filter((t) => t.status === 'running').length;
        const errors = tasks.filter((t) => t.status === 'error').length;
        setTaskSummary({ running, errors });
      });
      return () => unsubscribe();
    } catch {
      return () => void 0;
    }
  }, []);

  return (
    <div className="h-6 bg-card border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
          <Badge variant="outline" className="h-4 text-xs px-1">
            同步
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          <span>行 1, 列 1</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Type className="w-3 h-3" />
          {(() => { try { const { useEditorContext } = require('@/contexts/EditorContext'); const { countWords } = require('@/lib/markdown'); const { editorState } = useEditorContext(); return `${countWords(editorState.content)} 字`; } catch { return "-"; } })()}
        </div>
        
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {(() => { try { const { useEditorContext } = require('@/contexts/EditorContext'); const { editorState } = useEditorContext(); return editorState.isDirty ? "未保存" : "已保存"; } catch { return "已保存"; } })()}
        </div>
        
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>60 FPS</span>
        </div>

        {/* Parse metrics */}
        <div className="flex items-center gap-1">
          {(() => { try { const { subscribe, getMetrics } = require('@/lib/metrics-bus'); const [ms, setMs] = (require('react') as any).useState(getMetrics().parseMs || 0); (require('react') as any).useEffect(() => { const unsub = subscribe((m:any) => setMs(m.parseMs || 0)); return () => unsub(); }, []); return <span>解析 {ms}ms</span>; } catch { return null; } })()}
        </div>

        {/* Tasks & Errors */}
        {(taskSummary.running > 0 || taskSummary.errors > 0) && (
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
            try { const ev = new CustomEvent('open-task-drawer'); window.dispatchEvent(ev); } catch {}
          }}>
            {taskSummary.running > 0 && (
              <div className="flex items-center gap-1">
                <ListTodo className="w-3 h-3" />
                <span>{taskSummary.running} 进行中</span>
              </div>
            )}
            {taskSummary.errors > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-3 h-3" />
                <span>{taskSummary.errors} 错误</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
