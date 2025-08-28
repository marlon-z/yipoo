"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GitBranch, ArrowUp, ArrowDown, Plus, Minus, FileText } from 'lucide-react';

/* live changes */ const mockChangedFiles = [
  { name: 'README.md', status: 'modified', staged: false },
  { name: 'src/index.md', status: 'untracked', staged: false },
  { name: 'docs/guide.md', status: 'modified', staged: true },
];

export function GitOverview() {
  return (
    <div className="space-y-4">
      {/* Branch Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            分支状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">main</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 text-xs">
                <ArrowUp className="w-3 h-3 mr-1" />
                2
              </Badge>
              <Badge variant="outline" className="h-5 text-xs">
                <ArrowDown className="w-3 h-3 mr-1" />
                1
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
              拉取
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
              推送
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Changed Files */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">更改的文件</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(() => { try { const git = require('@/lib/git-sim'); const changes = git.rwChanges(); return changes.map((file: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm group">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="flex-1">{file.name}</span>
              <Badge 
                variant={file.status === 'modified' ? 'destructive' : 'secondary'} 
                className="h-4 text-xs px-1"
              >
                {file.status === 'modified' ? 'M' : 'U'}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => { try { const git = require('@/lib/git-sim'); (file.staged ? git.rwUnstage : git.rwStage)(file.path); } catch {} }}
              >
                {file.staged ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              </Button>
            </div>
          )) } catch { return null } })()}
        </CardContent>
      </Card>

      {/* Commit */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">提交更改</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input 
            placeholder="提交消息标题" 
            className="h-8 text-sm"
          />
          <Textarea 
            placeholder="详细描述（可选）" 
            className="h-16 text-sm resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => { try { const git = require('@/lib/git-sim'); git.commit('chore: commit via UI'); } catch {} }}>
              提交
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
              提交并推送
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}