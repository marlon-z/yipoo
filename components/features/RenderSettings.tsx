"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Palette, Code, Hash, Image } from 'lucide-react';

export function RenderSettings() {
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
          <div className="space-y-2">
            <Label className="text-xs">编辑器主题</Label>
            <Select defaultValue="nord-dark">
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nord-dark">Nord Dark</SelectItem>
                <SelectItem value="material-dark">Material Dark</SelectItem>
                <SelectItem value="github-light">GitHub Light</SelectItem>
                <SelectItem value="custom">自定义主题</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">字体大小</Label>
            <Select defaultValue="14">
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
            <Code className="w-4 h-4" />
            渲染选项
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs">代码高亮</Label>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">数学公式</Label>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">Mermaid 图表</Label>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">自动目录</Label>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">图片懒加载</Label>
            <Switch defaultChecked />
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
          <div className="space-y-2">
            <Label className="text-xs">显示层级</Label>
            <Select defaultValue="3">
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
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}