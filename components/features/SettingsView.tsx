"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  Palette,
  FileText,
  GitBranch,
  Keyboard,
  Info,
  ExternalLink
} from 'lucide-react';

export function SettingsView() {
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [gitAutoFetch, setGitAutoFetch] = useState(true);

  // 监听全局主题变化
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(isDark);
    };

    // 初始检查
    checkTheme();

    // 监听主题变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // 处理主题切换 - 需要向上通知到全局状态
  const handleDarkModeChange = (checked: boolean) => {
    // 通过事件通知全局状态更改
    window.dispatchEvent(new CustomEvent('theme-change', { 
      detail: { isDark: checked } 
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Settings className="w-4 h-4" />
          设置
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4" />
              外观
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">深色模式</div>
                <div className="text-xs text-muted-foreground">切换到深色主题</div>
              </div>
              <Switch checked={darkMode} onCheckedChange={handleDarkModeChange} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">显示行号</div>
                <div className="text-xs text-muted-foreground">在编辑器中显示行号</div>
              </div>
              <Switch checked={showLineNumbers} onCheckedChange={setShowLineNumbers} />
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              编辑器
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">自动保存</div>
                <div className="text-xs text-muted-foreground">编辑时自动保存文档</div>
              </div>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>
          </CardContent>
        </Card>

        {/* Git */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Git
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">自动获取</div>
                <div className="text-xs text-muted-foreground">定期从远程仓库获取更新</div>
              </div>
              <Switch checked={gitAutoFetch} onCheckedChange={setGitAutoFetch} />
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              键盘快捷键
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>切换侧边栏</span>
                <Badge variant="outline" className="h-4 px-1">Ctrl+B</Badge>
              </div>
              <div className="flex justify-between">
                <span>资源管理器</span>
                <Badge variant="outline" className="h-4 px-1">Ctrl+Shift+E</Badge>
              </div>
              <div className="flex justify-between">
                <span>搜索</span>
                <Badge variant="outline" className="h-4 px-1">Ctrl+Shift+F</Badge>
              </div>
              <div className="flex justify-between">
                <span>源代码管理</span>
                <Badge variant="outline" className="h-4 px-1">Ctrl+Shift+G</Badge>
              </div>
              <div className="flex justify-between">
                <span>历史版本</span>
                <Badge variant="outline" className="h-4 px-1">Ctrl+Shift+H</Badge>
              </div>
              <div className="flex justify-between">
                <span>分支管理</span>
                <Badge variant="outline" className="h-4 px-1">Ctrl+Shift+B</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              关于
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>版本</span>
                <span className="text-muted-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>构建</span>
                <span className="text-muted-foreground">2024.01.15</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                查看更新日志
              </Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                报告问题
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
