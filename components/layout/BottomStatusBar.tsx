"use client";

import { Badge } from '@/components/ui/badge';
import { GitBranch, Zap, MapPin, Type, Clock } from 'lucide-react';

export function BottomStatusBar() {
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
      </div>
    </div>
  );
}