'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { updateMetrics } from '@/lib/metrics-bus';

interface ParseResult {
  headings: { level: number; title: string }[];
  parseMs: number;
  renderMs?: number;
  html?: string;
}

export function useParserWorker(markdown: string, options?: { math?: boolean; highlight?: boolean; mode?: 'parse' | 'render' }) {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<ParseResult>({ headings: [], parseMs: 0 });

  useEffect(() => {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/parser.worker.ts', import.meta.url) as any, { type: 'module' } as any);
      workerRef.current.addEventListener('message', (e: MessageEvent) => {
        const { type, payload } = e.data || {};
        if (type === 'result') {
          setResult(payload);
          updateMetrics({ parseMs: payload.parseMs, renderMs: payload.renderMs, endToEndMs: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0 });
        }
      });
    }
    const w = workerRef.current;
    const mode = options?.mode || 'parse';
    w?.postMessage({ type: mode, payload: { markdown, options } });
    return () => {
      // keep worker alive for reuse
    };
  }, [markdown]);

  return result;
}
