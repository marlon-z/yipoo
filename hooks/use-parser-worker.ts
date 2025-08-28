'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { updateMetrics } from '@/lib/metrics-bus';

interface ParseResult {
  headings: { level: number; title: string }[];
  parseMs: number;
}

export function useParserWorker(markdown: string) {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<ParseResult>({ headings: [], parseMs: 0 });

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/parser.worker.ts', import.meta.url) as any, { type: 'module' } as any);
      workerRef.current.addEventListener('message', (e: MessageEvent) => {
        const { type, payload } = e.data || {};
        if (type === 'result') {
          setResult(payload);
          updateMetrics({ parseMs: payload.parseMs });
        }
      });
    }
    const w = workerRef.current;
    w?.postMessage({ type: 'parse', payload: { markdown } });
    return () => {
      // keep worker alive for reuse
    };
  }, [markdown]);

  return result;
}
