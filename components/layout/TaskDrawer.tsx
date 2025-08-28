"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { subscribe, getTasks, Task } from '@/lib/task-bus';
import { Button } from '@/components/ui/button';

export function TaskDrawer() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(getTasks());

  useEffect(() => {
    const unsub = subscribe(setTasks);
    const onOpen = () => setOpen(true);
    window.addEventListener('open-task-drawer', onOpen as any);
    return () => { unsub(); window.removeEventListener('open-task-drawer', onOpen as any); };
  }, []);

  const onClose = useCallback(() => setOpen(false), []);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>任务与错误</DrawerTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>关闭</Button>
        </DrawerHeader>
        <div className="p-4 space-y-3 max-h-[50vh] overflow-auto">
          {tasks.length === 0 && (
            <div className="text-sm text-muted-foreground">暂无任务</div>
          )}
          {tasks.map((t) => (
            <div key={t.id} className="border rounded-md p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(t.updatedAt).toLocaleTimeString()}</div>
              </div>
              <div className="mt-1 text-xs">状态：{t.status}（{t.progress ?? 0}%）</div>
              {t.error && <div className="mt-1 text-xs text-destructive break-all">错误：{t.error}</div>}
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
