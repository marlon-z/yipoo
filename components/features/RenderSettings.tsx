"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Palette, Hash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 将目录设置通过全局事件广播给大纲组件
function dispatchTocSettings(maxLevelStr: string, autoCollapse: boolean, showToc: boolean) {
  const maxLevelNum = Number(maxLevelStr);
  window.dispatchEvent(
    new CustomEvent('toc-settings-change', {
      detail: {
        maxLevel: isNaN(maxLevelNum) ? 3 : maxLevelNum, // 1/2/3/6
        autoCollapse,
        showToc,
      },
    })
  );
}

export function RenderSettings() {
  const getBool = (k: string, def: boolean) => {
    if (typeof window === 'undefined') return def;
    const v = localStorage.getItem(k);
    return v === null ? def : v === '1';
  };
  const getStr = (k: string, def: string) => {
    if (typeof window === 'undefined') return def;
    return localStorage.getItem(k) || def;
  };

  // 首次从本地初始化，避免首渲染覆盖用户偏好
  const [tocLevel, setTocLevel] = useState<string>(() => getStr('pref:tocLevel', '3'));
  const [tocAutoCollapse, setTocAutoCollapse] = useState<boolean>(() => getBool('pref:tocAutoCollapse', true));
  const [tocVisible, setTocVisible] = useState<boolean>(() => getBool('pref:tocVisible', true));

  // 主题/模式/排版
  const [isDark, setIsDark] = useState<boolean>(() => getBool('pref:isDark', false));
  const [isSource, setIsSource] = useState<boolean>(() => getBool('pref:isSource', false));
  const [fontSize, setFontSize] = useState<string>(() => getStr('pref:fontSize', '14')); // px

  // 应用目录设置
  useEffect(() => {
    dispatchTocSettings(tocLevel, tocAutoCollapse, tocVisible);
    try {
      localStorage.setItem('pref:tocLevel', tocLevel);
      localStorage.setItem('pref:tocVisible', tocVisible ? '1' : '0');
      localStorage.setItem('pref:tocAutoCollapse', tocAutoCollapse ? '1' : '0');
    } catch {}
  }, [tocLevel, tocAutoCollapse, tocVisible]);

  // 应用排版CSS变量
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--editor-font-size', `${fontSize}px`);
    try { localStorage.setItem('pref:fontSize', fontSize); } catch {}
  }, [fontSize]);

  // 主题切换（全局）
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { isDark } }));
    try { localStorage.setItem('pref:isDark', isDark ? '1' : '0'); } catch {}
  }, [isDark]);

  // 源码模式切换（通知编辑器）
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('set-source-mode', { detail: { isSource } }));
    try { localStorage.setItem('pref:isSource', isSource ? '1' : '0'); } catch {}
  }, [isSource]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4" />
            主题设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs">暗色模式</Label>
            <Switch checked={isDark} onCheckedChange={(v) => setIsDark(!!v)} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs whitespace-nowrap">模式</Label>
            <Tabs value={isSource ? 'source' : 'preview'} onValueChange={(v) => setIsSource(v === 'source')}>
              <TabsList className="h-8 bg-muted/30 p-0.5 rounded-md border border-border">
                <TabsTrigger value="preview" className="px-3 h-8 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-sm">预览</TabsTrigger>
                <TabsTrigger value="source" className="px-3 h-8 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground rounded-sm">源码</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">源码字体大小</Label>
            <Select value={fontSize} onValueChange={(v) => setFontSize(v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12px</SelectItem>
                <SelectItem value="14">14px</SelectItem>
                <SelectItem value="16">16px</SelectItem>
                <SelectItem value="18">18px</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="w-4 h-4" />
            目录设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs">显示大纲</Label>
            <Switch checked={tocVisible} onCheckedChange={(v) => setTocVisible(!!v)} />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">显示层级</Label>
            <Select value={tocLevel} onValueChange={(v) => setTocLevel(v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">仅 H1</SelectItem>
                <SelectItem value="2">H1 - H2</SelectItem>
                <SelectItem value="3">H1 - H3</SelectItem>
                <SelectItem value="6">全部层级</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">自动折叠</Label>
            <Switch checked={tocAutoCollapse} onCheckedChange={(v) => setTocAutoCollapse(!!v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}