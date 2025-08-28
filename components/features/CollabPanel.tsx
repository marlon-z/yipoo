"use client";

import { Button } from '@/components/ui/button';
import { useCollab } from '@/contexts/CollabContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Share, Link, UserPlus } from 'lucide-react';

const mockCollaborators = [
  { name: 'John Doe', initials: 'JD', status: 'online', cursor: true },
  { name: 'Jane Smith', initials: 'JS', status: 'editing', cursor: false },
  { name: 'Bob Wilson', initials: 'BW', status: 'offline', cursor: false },
];

export function CollabPanel() {
  const { state, toggleEnabled, setReadOnly, setShowCursors, setOfflineSync } = (() => { try { return useCollab(); } catch { return {
    state: { enabled: false, readOnly: false, showCursors: true, offlineSync: false, connection: 'online', members: [] },
    toggleEnabled: () => {}, setReadOnly: () => {}, setShowCursors: () => {}, setOfflineSync: () => {}
  } as any; } })();
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            协作状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs">实时协作</Label>
            <Switch checked={state.enabled} onCheckedChange={toggleEnabled} />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">光标同步</Label>
            <Switch checked={state.showCursors} onCheckedChange={setShowCursors} />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">离线同步</Label>
            <Switch checked={state.offlineSync} onCheckedChange={setOfflineSync} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">只读模式</Label>
            <Switch checked={state.readOnly} onCheckedChange={setReadOnly} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">在线协作者</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(state.members?.length ? state.members : mockCollaborators).map((user, index) => (
            <div key={index} className="flex items-center gap-3">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={user.status === 'online' ? 'default' : 
                            user.status === 'editing' ? 'secondary' : 'outline'} 
                    className="h-4 text-xs px-1"
                  >
                    {user.status === 'online' ? '在线' : 
                     user.status === 'editing' ? '编辑中' : '离线'}
                  </Badge>
                  {user.cursor && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Label className="text-xs">只读模式</Label>
            <Switch checked={state.readOnly} onCheckedChange={setReadOnly} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">分享文档</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            <Share className="w-3 h-3 mr-2" />
            生成分享链接
          </Button>
          
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            <UserPlus className="w-3 h-3 mr-2" />
            邀请协作者
          </Button>
          
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            <Link className="w-3 h-3 mr-2" />
            复制链接
          </Button>
          <div className="flex items-center justify-between">
            <Label className="text-xs">只读模式</Label>
            <Switch checked={state.readOnly} onCheckedChange={setReadOnly} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}