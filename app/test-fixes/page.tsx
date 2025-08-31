"use client";

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { githubService } from '@/lib/github';
import { gitIntegration } from '@/lib/git-integration';

export default function TestFixesPage() {
  const { data: session, status } = useSession();
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [modifiedFiles, setModifiedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      githubService.setAuthToken(session.accessToken);
      
      // Check if repository was restored
      const currentRepo = githubService.getCurrentRepository();
      setRepoInfo(currentRepo);
    }
  }, [session]);

  const testFileDetection = async () => {
    if (!repoInfo) {
      alert('请先选择一个仓库');
      return;
    }

    setLoading(true);
    try {
      const repoFolderName = `${repoInfo.owner}-${repoInfo.repo}`;
      const files = await gitIntegration.detectModifiedFiles(repoFolderName);
      setModifiedFiles(files);
      console.log('检测到的文件:', files);
    } catch (error) {
      console.error('文件检测失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('github-current-repo');
    setRepoInfo(null);
    alert('已清除存储的仓库信息，请刷新页面测试');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">问题修复测试页面</h1>
      
      {/* 问题1测试：仓库持久化 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>问题1：页面刷新后仓库信息丢失</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>登录状态:</strong> {status}</p>
            <p><strong>当前仓库:</strong> {repoInfo ? `${repoInfo.owner}/${repoInfo.repo} (${repoInfo.branch})` : '未设置'}</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()}>
              刷新页面测试
            </Button>
            <Button variant="outline" onClick={clearStorage}>
              清除存储测试
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>测试步骤:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>先在GitHub克隆页面选择一个仓库</li>
              <li>回到这个页面，确认仓库信息显示</li>
              <li>点击"刷新页面测试"</li>
              <li>刷新后仓库信息应该仍然显示</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* 问题2测试：文件对比 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>问题2：克隆后未修改文件显示在更改区</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>检测到的修改文件数:</strong> {modifiedFiles.length}</p>
          </div>
          
          <Button 
            onClick={testFileDetection}
            disabled={!repoInfo || loading}
          >
            {loading ? '检测中...' : '测试文件检测'}
          </Button>
          
          {modifiedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">检测到的文件:</p>
              {modifiedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <Badge variant={
                    file.status === 'added' ? 'default' :
                    file.status === 'modified' ? 'secondary' : 'destructive'
                  }>
                    {file.status}
                  </Badge>
                  <span className="text-sm">{file.relativePath}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p><strong>测试步骤:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>确保已经克隆了一个仓库且未做任何修改</li>
              <li>点击"测试文件检测"</li>
              <li>如果修复成功，应该显示"检测到的修改文件数: 0"</li>
              <li>查看浏览器控制台的详细对比日志</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* 调试信息 */}
      <Card>
        <CardHeader>
          <CardTitle>调试信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>localStorage中的仓库信息:</strong></p>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto">
              {localStorage.getItem('github-current-repo') || '无'}
            </pre>
            
            <p><strong>说明:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>打开浏览器开发者工具查看控制台日志</li>
              <li>文件对比的详细信息会在控制台中显示</li>
              <li>如果仍有问题，请检查控制台中的错误信息</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
