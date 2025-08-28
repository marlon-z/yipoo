/// <reference lib="webworker" />

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';

function extractHeadings(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const heads: { level: number; title: string }[] = [];
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (!m) continue;
    heads.push({ level: m[1].length, title: m[2].trim() });
  }
  return heads;
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, payload } = e.data || {};
  if (type === 'parse') {
    const start = performance.now();
    // For now, only extract headings; unified reserved for future
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ast = await unified().use(remarkParse).use(remarkGfm).parse(payload.markdown || '');
    const heads = extractHeadings(payload.markdown || '');
    const ms = performance.now() - start;
    (self as any).postMessage({ type: 'result', payload: { headings: heads, parseMs: Math.round(ms) } });
  }
  if (type === 'render') {
    const t0 = performance.now();
    const md = String(payload.markdown || '');
    let p: any = unified().use(remarkParse).use(remarkGfm);
    if (payload.options?.math) { p = p.use(remarkMath as any); }
    let r: any = (p as any).use(remarkRehype as any, { allowDangerousHtml: true });
    if (payload.options?.math) { r = r.use(rehypeKatex); }
    r = r.use(rehypeSlug).use(rehypeAutolinkHeadings);
    if (payload.options?.highlight) { r = r.use(rehypeHighlight); }
    const t1 = performance.now();
    const file = await r.use(rehypeStringify, { allowDangerousHtml: true }).process(md);
    const htmlBody = String(file);
    const t2 = performance.now();
    const headings = extractHeadings(md);
    (self as any).postMessage({ type: 'result', payload: { html: htmlBody, headings, parseMs: Math.round(t1 - t0), renderMs: Math.round(t2 - t0) } });
  }
});
