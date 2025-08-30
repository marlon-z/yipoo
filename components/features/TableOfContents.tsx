"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mutationRef = useRef<MutationObserver | null>(null);

  // Build TOC from editor DOM
  const rebuild = () => {
    const editorRoot = document.querySelector('.milkdown .ProseMirror') as HTMLElement | null;
    if (!editorRoot) return;
    const headingEls = Array.from(editorRoot.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'));
    const used = new Set<string>();
    const nextItems: TocItem[] = headingEls.map((el) => {
      const level = Number(el.tagName.substring(1));
      const title = (el.textContent || '').trim();
      let id = el.getAttribute('id') || slugify(title);
      // ensure unique id
      let finalId = id;
      let i = 2;
      while (used.has(finalId)) {
        finalId = `${id}-${i++}`;
      }
      used.add(finalId);
      if (!el.id) el.id = finalId;
      return { id: finalId, title, level };
    });
    setItems(nextItems);

    // Set up intersection observer to track current heading
    observerRef.current?.disconnect();
    const container = document.querySelector('.milkdown') as HTMLElement | null;
    if (!container) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Choose the heading closest to the top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top));
        if (visible.length > 0) {
          setActiveId((visible[0].target as HTMLElement).id);
        } else {
          // Fallback: find the last heading above the viewport
          const tops = nextItems
            .map((it) => {
              const el = document.getElementById(it.id);
              if (!el) return { id: it.id, top: Infinity };
              const rect = el.getBoundingClientRect();
              return { id: it.id, top: rect.top };
            })
            .filter((x) => x.top <= 80) // near top
            .sort((a, b) => b.top - a.top);
          if (tops.length > 0) setActiveId(tops[0].id);
        }
      },
      { root: container, rootMargin: '0px 0px -70% 0px', threshold: [0, 1] }
    );
    headingEls.forEach((el) => io.observe(el));
    observerRef.current = io;
  };

  useEffect(() => {
    rebuild();
    // Watch editor DOM changes
    const editorRoot = document.querySelector('.milkdown .ProseMirror') as HTMLElement | null;
    if (editorRoot) {
      const mo = new MutationObserver(() => rebuild());
      mo.observe(editorRoot, { subtree: true, childList: true, characterData: true });
      mutationRef.current = mo;
    }
    window.addEventListener('resize', rebuild);
    return () => {
      observerRef.current?.disconnect();
      mutationRef.current?.disconnect();
      window.removeEventListener('resize', rebuild);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => it.level <= maxLevel && (q === '' || it.title.toLowerCase().includes(q)));
  }, [items, maxLevel, query]);

  const handleJump = (id: string) => {
    const el = document.getElementById(id);
    const container = document.querySelector('.milkdown') as HTMLElement | null;
    if (!el || !container) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="w-64 bg-card border-l border-border shrink-0">
      <div className="h-10 border-b border-border flex items-center px-3">
        <span className="text-sm font-medium text-muted-foreground">大纲</span>
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

        <div className="space-y-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleJump(item.id)}
              className={cn(
                'flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer rounded text-sm',
                item.level === 1 && 'font-medium',
                item.level === 2 && 'text-muted-foreground ml-4',
                item.level >= 3 && 'text-muted-foreground ml-8',
                activeId === item.id && 'bg-accent text-foreground'
              )}
              title={item.title}
            >
              <ChevronRight className="w-3 h-3 opacity-50" />
              <span className="truncate">{item.title}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-xs text-muted-foreground px-2 py-1">无匹配标题</div>
          )}
        </div>
      </div>
    </div>
  );
}