"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, GitBranch, ExternalLink, Plus } from 'lucide-react';

const mockRemotes = [
  { name: 'origin', url: 'https://github.com/user/markdown-editor.git', type: 'push/pull' },
  { name: 'upstream', url: 'https://github.com/original/markdown-editor.git', type: 'pull' },
];

export function GitRemote() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4" />
            远程仓库
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockRemotes.map((remote, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{remote.name}</span>
                <Badge variant="outline" className="h-4 text-xs px-1">
                  {remote.type}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground break-all">
                {remote.url}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  打开
                </Button>
                <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                  删除
                </Button>
              </div>
            </div>
          ))}
          
          <div className="pt-2 border-t border-border">
            <Button variant="outline" size="sm" className="w-full h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              添加远程仓库
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">快速操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            克隆仓库
          </Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            创建 GitHub 仓库
          </Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            创建 Pull Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}