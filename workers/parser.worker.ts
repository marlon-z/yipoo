/// <reference lib="webworker" />

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

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
});
