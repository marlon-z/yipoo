"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitOverview } from '@/components/features/GitOverview';
import { GitBranches } from '@/components/features/GitBranches';
import { GitHistory } from '@/components/features/GitHistory';
import { GitRemote } from '@/components/features/GitRemote';
import { GitBranch, History, Globe, BarChart3, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function GitPanel() {
  const { status } = useSession();
  const authed = status === 'authenticated';

  if (!authed) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          请先在右上角登录 GitHub 后使用 Git 功能
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 h-8 mx-3 mt-3">
          <TabsTrigger value="overview" className="text-xs p-1">
            <BarChart3 className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="branches" className="text-xs p-1">
            <GitBranch className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs p-1">
            <History className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="remote" className="text-xs p-1">
            <Globe className="w-3 h-3" />
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-auto p-3">
          <TabsContent value="overview" className="mt-0">
            <GitOverview />
          </TabsContent>
          
          <TabsContent value="branches" className="mt-0">
            <GitBranches />
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            <GitHistory />
          </TabsContent>
          
          <TabsContent value="remote" className="mt-0">
            <GitRemote />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}