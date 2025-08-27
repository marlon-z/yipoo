"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitCommit, Clock, User, FileText } from 'lucide-react';

const mockCommits = [
  {
    id: 'abc123',
    title: '添加新的文档结构',
    description: '重新组织项目文档，增加快速开始指南',
    author: 'John Doe',
    time: '2 小时前',
    files: ['README.md', 'docs/guide.md'],
    changes: '+45 -12'
  },
  {
    id: 'def456',
    title: '修复样式问题',
    description: '',
    author: 'Jane Smith',
    time: '1 天前',
    files: ['src/styles.css'],
    changes: '+8 -3'
  },
  {
    id: 'ghi789',
    title: '初始化项目',
    description: '创建基础项目结构和配置文件',
    author: 'John Doe',
    time: '3 天前',
    files: ['package.json', '.gitignore', 'README.md'],
    changes: '+127 -0'
  },
];

export function GitHistory() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">提交历史</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockCommits.map((commit, index) => (
            <div key={commit.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="font-medium text-sm">{commit.title}</div>
                    {commit.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {commit.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {commit.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {commit.time}
                    </div>
                    <Badge variant="outline" className="h-4 px-1">
                      {commit.changes}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    {commit.files.map((file, fileIndex) => (
                      <div key={fileIndex} className="flex items-center gap-2 text-xs">
                        <FileText className="w-3 h-3 text-blue-400" />
                        <span className="text-muted-foreground">{file}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                      查看详情
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                      恢复文件
                    </Button>
                  </div>
                </div>
              </div>
              
              {index < mockCommits.length - 1 && (
                <div className="w-px h-6 bg-border ml-1" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}