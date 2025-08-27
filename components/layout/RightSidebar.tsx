"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RenderSettings } from '@/components/features/RenderSettings';
import { ExportPanel } from '@/components/features/ExportPanel';
import { CollabPanel } from '@/components/features/CollabPanel';
import { Settings, Download, Users, Palette } from 'lucide-react';

export function RightSidebar() {
  return (
    <div className="w-80 bg-card border-l border-border flex flex-col shrink-0">
      <div className="h-10 border-b border-border flex items-center px-3">
        <span className="text-sm font-medium text-muted-foreground">设置面板</span>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="render" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="render" className="text-xs p-1">
              <Palette className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs p-1">
              <Download className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger value="collab" className="text-xs p-1">
              <Users className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs p-1">
              <Settings className="w-3 h-3" />
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <TabsContent value="render">
              <RenderSettings />
            </TabsContent>
            
            <TabsContent value="export">
              <ExportPanel />
            </TabsContent>
            
            <TabsContent value="collab">
              <CollabPanel />
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">应用设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    更多设置选项即将推出...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}