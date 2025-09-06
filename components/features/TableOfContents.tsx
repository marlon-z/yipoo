"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TocItem = {
  id: string;
  title: string;
  level: number; // 1..6
};

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return base || 'section';
}

export function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [maxLevel, setMaxLevel] = useState<3 | 6>(3);
  const [autoCollapse, setAutoCollapse] = useState<boolean>(true);
  const [showToc, setShowToc] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mutationRef = useRef<MutationObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 监听来自右侧栏的目录设置变更
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (typeof detail.maxLevel === 'number') {
        setMaxLevel(detail.maxLevel <= 3 ? 3 : 6);
      }
      if (typeof detail.autoCollapse === 'boolean') {
        setAutoCollapse(detail.autoCollapse);
      }
      if (typeof detail.showToc === 'boolean') {
        setShowToc(detail.showToc);
      }
    };
    window.addEventListener('toc-settings-change', handler as EventListener);
    return () => window.removeEventListener('toc-settings-change', handler as EventListener);
  }, []);

  // 初始化本地 TOC 偏好
  useEffect(() => {
    try {
      const tl = localStorage.getItem('pref:tocLevel');
      const tv = localStorage.getItem('pref:tocVisible');
      const ta = localStorage.getItem('pref:tocAutoCollapse');
      if (tl) setMaxLevel(Number(tl) <= 3 ? 3 : 6);
      if (tv !== null) setShowToc(tv === '1');
      if (ta !== null) setAutoCollapse(ta === '1');
    } catch {}
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem('pref:tocLevel', String(maxLevel));
      localStorage.setItem('pref:tocVisible', showToc ? '1' : '0');
      localStorage.setItem('pref:tocAutoCollapse', autoCollapse ? '1' : '0');
    } catch {}
  }, [maxLevel, showToc, autoCollapse]);

  // 改进的DOM查询函数
  const findEditorRoot = (): HTMLElement | null => {
    // 尝试多种可能的选择器
    const selectors = [
      '.milkdown .ProseMirror',
      '.ProseMirror',
      '.milkdown [contenteditable="true"]',
      '.milkdown .editor',
      '.milkdown .crepe-editor',
      '.milkdown div[data-testid="editor"]',
      '.milkdown .cm-editor',
      '.milkdown .milkdown-editor'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        console.log('TableOfContents: Found editor with selector:', selector);
        return element;
      }
    }

    // 备用方案：查找所有可能的编辑器容器
    const milkdownContainer = document.querySelector('.milkdown') as HTMLElement;
    if (milkdownContainer) {
      // 查找包含标题的元素
      const editableElements = Array.from(milkdownContainer.querySelectorAll('[contenteditable], .editor, div'));
      for (const el of editableElements) {
        if (el.querySelector('h1, h2, h3, h4, h5, h6')) {
          console.log('TableOfContents: Found editor via fallback method');
          return el as HTMLElement;
        }
      }
    }

    console.warn('TableOfContents: No editor root found');
    return null;
  };

  // Build TOC from editor DOM
  const rebuild = () => {
    console.log('TableOfContents: Rebuilding...');
    setIsLoading(true);
    
    // 清除之前的观察器
    observerRef.current?.disconnect();
    
    const editorRoot = findEditorRoot();
    if (!editorRoot) {
      console.warn('TableOfContents: Editor root not found');
      setItems([]);
      setIsLoading(false);
      return;
    }

    console.log('TableOfContents: Editor root found:', editorRoot);

    // 查找所有标题元素
    const headingEls = Array.from(editorRoot.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'));
    console.log('TableOfContents: Found headings:', headingEls.length);

    if (headingEls.length === 0) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const used = new Set<string>();
    const nextItems: TocItem[] = headingEls.map((el, index) => {
      const level = Number(el.tagName.substring(1));
      const title = (el.textContent || el.innerText || '').trim();
      let id = el.getAttribute('id') || slugify(title) || `heading-${index}`;
      
      // 确保ID唯一性
      let finalId = id;
      let i = 2;
      while (used.has(finalId)) {
        finalId = `${id}-${i++}`;
      }
      used.add(finalId);
      
      // 设置元素ID（如果没有的话）
      if (!el.id) {
        el.id = finalId;
      }
      
      return { id: finalId, title: title || `标题 ${index + 1}`, level };
    });

    console.log('TableOfContents: Generated items:', nextItems);
    setItems(nextItems);

    // 设置IntersectionObserver来追踪当前标题
    const container = document.querySelector('.milkdown') as HTMLElement | null;
    if (container && nextItems.length > 0) {
      const io = new IntersectionObserver(
        (entries) => {
          const visibleEntries = entries.filter(entry => entry.isIntersecting);
          
          if (visibleEntries.length > 0) {
            // 选择最靠近顶部的可见标题
            const sortedEntries = visibleEntries.sort((a, b) => {
              return a.boundingClientRect.top - b.boundingClientRect.top;
            });
            const activeElement = sortedEntries[0].target as HTMLElement;
            setActiveId(activeElement.id);
          } else {
            // 如果没有可见的标题，找到最接近顶部的标题
            const headingPositions = nextItems.map(item => {
              const element = document.getElementById(item.id);
              if (!element) return { id: item.id, top: Infinity };
              
              const rect = element.getBoundingClientRect();
              return { id: item.id, top: rect.top };
            });
            
            // 找到在视窗上方且最接近顶部的标题
            const aboveViewport = headingPositions
              .filter(pos => pos.top <= 100)
              .sort((a, b) => b.top - a.top);
              
            if (aboveViewport.length > 0) {
              setActiveId(aboveViewport[0].id);
            }
          }
        },
        {
          root: container,
          rootMargin: '-20% 0px -60% 0px',
          threshold: [0, 0.1, 0.5, 1]
        }
      );

      // 观察所有标题元素
      headingEls.forEach(el => {
        if (el.id) {
          io.observe(el);
        }
      });
      
      observerRef.current = io;
    }

    setIsLoading(false);
  };

  // 手动刷新
  const handleRefresh = () => {
    rebuild();
  };

  useEffect(() => {
    console.log('TableOfContents: Initial mount');
    
    // 延迟执行，确保编辑器已渲染
    const initialDelay = setTimeout(() => {
      rebuild();
    }, 1000);

    // 监听编辑器DOM变化
    const setupMutationObserver = () => {
      const editorRoot = findEditorRoot();
      if (editorRoot) {
        const mo = new MutationObserver((mutations) => {
          let shouldRebuild = false;
          
          mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
              // 检查是否有标题元素被添加或删除
              mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  if (element.matches?.('h1, h2, h3, h4, h5, h6') || 
                      element.querySelector?.('h1, h2, h3, h4, h5, h6')) {
                    shouldRebuild = true;
                  }
                }
              });
              
              mutation.removedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  if (element.matches?.('h1, h2, h3, h4, h5, h6') || 
                      element.querySelector?.('h1, h2, h3, h4, h5, h6')) {
                    shouldRebuild = true;
                  }
                }
              });
            } else if (mutation.type === 'characterData') {
              // 检查文本变化是否在标题元素中
              const target = mutation.target.parentElement;
              if (target?.matches?.('h1, h2, h3, h4, h5, h6')) {
                shouldRebuild = true;
              }
            }
          });
          
          if (shouldRebuild) {
            // 防抖：避免频繁重建
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(rebuild, 500);
          }
        });

        mo.observe(editorRoot, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['id']
        });
        
        mutationRef.current = mo;
        console.log('TableOfContents: MutationObserver setup complete');
      }
    };

    // 延迟设置监听器
    const observerDelay = setTimeout(setupMutationObserver, 1500);

    // 监听窗口尺寸变化
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(rebuild, 300);
    };
    
    window.addEventListener('resize', handleResize);

    // 监听文件打开事件
    const handleFileOpen = () => {
      setTimeout(rebuild, 1000);
    };
    window.addEventListener('open-file', handleFileOpen);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(observerDelay);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      observerRef.current?.disconnect();
      mutationRef.current?.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('open-file', handleFileOpen);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => 
      it.level <= maxLevel && 
      (q === '' || it.title.toLowerCase().includes(q))
    );
  }, [items, maxLevel, query]);

  // 自动折叠：仅展开当前章节（基于最近的 H1/H2 分段）
  const displayed = useMemo(() => {
    if (!autoCollapse) return filtered;
    const idxActive = filtered.findIndex(it => it.id === activeId);
    if (idxActive === -1) {
      // 未能确定当前标题，仅展示 H1/H2
      return filtered.filter(it => it.level <= 2);
    }
    // 找到当前章节的范围（上一个 <=H2 到下一个 <=H2 之间）
    let start = 0;
    for (let i = idxActive; i >= 0; i--) {
      if (filtered[i].level <= 2) { start = i; break; }
    }
    let end = filtered.length;
    for (let i = idxActive + 1; i < filtered.length; i++) {
      if (filtered[i].level <= 2) { end = i; break; }
    }
    return filtered.filter((_, i) => filtered[i].level <= 2 || (i >= start && i < end));
  }, [filtered, autoCollapse, activeId]);

  const handleJump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn('TableOfContents: Element not found for id:', id);
      return;
    }

    // 尝试多种滚动容器
    const containers = [
      document.querySelector('.milkdown'),
      document.querySelector('.ProseMirror'),
      document.documentElement
    ];

    let scrolled = false;
    for (const container of containers) {
      if (container && !scrolled) {
        try {
          el.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          scrolled = true;
          
          // 临时高亮目标元素
          el.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          setTimeout(() => {
            el.style.backgroundColor = '';
          }, 1000);
          
          break;
        } catch (error) {
          console.warn('TableOfContents: Scroll failed for container:', container, error);
        }
      }
    }

    if (!scrolled) {
      console.warn('TableOfContents: Failed to scroll to element');
    }
  };

  if (!showToc) return null;

  return (
    <div className="w-64 bg-card border-l border-border shrink-0">
      <div className="h-10 border-b border-border flex items-center justify-between px-3">
        <span className="text-sm font-medium text-muted-foreground">大纲</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
        </Button>
      </div>

      <div className="p-3 space-y-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题..."
          className="h-7 text-xs"
        />
        <Select value={`h1-${maxLevel}`} onValueChange={(v) => setMaxLevel(v === 'h1-3' ? 3 : 6)}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="显示层级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="h1-3">H1 - H3</SelectItem>
            <SelectItem value="h1-6">H1 - H6</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-xs text-muted-foreground px-2 py-4 text-center">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
              加载中...
            </div>
          ) : displayed.length > 0 ? (
            displayed.map((item) => (
              <div
                key={item.id}
                onClick={() => handleJump(item.id)}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer rounded text-sm transition-colors',
                  item.level === 1 && 'font-medium',
                  item.level === 2 && 'text-muted-foreground ml-4',
                  item.level === 3 && 'text-muted-foreground ml-6',
                  item.level === 4 && 'text-muted-foreground ml-8',
                  item.level === 5 && 'text-muted-foreground ml-10',
                  item.level === 6 && 'text-muted-foreground ml-12',
                  activeId === item.id && 'bg-accent text-foreground font-medium'
                )}
                title={item.title}
              >
                <ChevronRight className={cn(
                  "w-3 h-3 opacity-50 transition-transform",
                  activeId === item.id && "opacity-100"
                )} />
                <span className="truncate">{item.title}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground px-2 py-4 text-center">
              {items.length === 0 ? '无匹配标题' : '暂无标题'}
              {items.length === 0 && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-6 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    刷新
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}