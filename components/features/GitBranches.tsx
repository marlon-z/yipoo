"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Check, Plus } from 'lucide-react';

const mockBranches = [
  { name: 'main', type: 'local', current: true, upstream: 'origin/main' },
  { name: 'feature/new-ui', type: 'local', current: false },
  { name: 'develop', type: 'remote', current: false },
  { name: 'hotfix/bug-123', type: 'remote', current: false },
];

export function GitBranches() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">分支管理</CardTitle>
          <Button size="sm" variant="outline" className="h-6 text-xs px-2">
            <Plus className="w-3 h-3 mr-1" />
            新建
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockBranches.map((branch, index) => (
            <div key={index} className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer text-sm group">
              <GitBranch className={`w-4 h-4 ${branch.current ? 'text-green-500' : 'text-muted-foreground'}`} />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={branch.current ? 'text-green-500 font-medium' : ''}>
                    {branch.name}
                  </span>
                  {branch.current && <Check className="w-3 h-3 text-green-500" />}
                </div>
                {branch.upstream && (
                  <div className="text-xs text-muted-foreground">
                    → {branch.upstream}
                  </div>
                )}
              </div>
              
              <Badge 
                variant={branch.type === 'local' ? 'default' : 'outline'} 
                className="h-4 text-xs px-1"
              >
                {branch.type === 'local' ? '本地' : '远端'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">快捷操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            合并到 main
          </Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            从 main 拉取更新
          </Button>
          <Button variant="destructive" size="sm" className="w-full h-7 text-xs">
            删除分支
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}