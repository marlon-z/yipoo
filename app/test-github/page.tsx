"use client";

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestGitHubPage() {
  const { data: session, status } = useSession();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Session:', session);
      console.log('Access Token:', session?.accessToken);
      
      const response = await fetch('/api/github/repositories?per_page=5');
      const data = await response.json();
      
      console.log('Response Status:', response.status);
      console.log('Response Data:', data);
      
      if (response.ok) {
        setRepositories(data.repositories || []);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">GitHub API 测试</h1>
      
      <div className="mb-4">
        <p><strong>登录状态:</strong> {status}</p>
        <p><strong>用户:</strong> {session?.user?.name || 'N/A'}</p>
        <p><strong>Access Token:</strong> {session?.accessToken ? '已获取' : '未获取'}</p>
      </div>
      
      <Button onClick={testAPI} disabled={loading || status !== 'authenticated'}>
        {loading ? '测试中...' : '测试 GitHub API'}
      </Button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          错误: {error}
        </div>
      )}
      
      {repositories.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">仓库列表 ({repositories.length}):</h2>
          <ul className="space-y-2">
            {repositories.map((repo) => (
              <li key={repo.id} className="p-2 border rounded">
                <strong>{repo.name}</strong> - {repo.description || '无描述'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
