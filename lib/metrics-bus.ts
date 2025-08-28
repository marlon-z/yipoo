'use client';

export interface MetricsState {
  parseMs?: number;
  renderMs?: number;
  endToEndMs?: number;
}

type Listener = (s: MetricsState) => void;

let state: MetricsState = {};
const listeners = new Set<Listener>();

export function getMetrics(): MetricsState { return state; }

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => { listeners.delete(listener); };
}

export function updateMetrics(patch: Partial<MetricsState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}
