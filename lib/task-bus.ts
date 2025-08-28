'use client';

// A tiny in-memory task bus for client-side use
// Used by ExportPanel to report progress and by BottomStatusBar to display status

export type TaskStatus = 'pending' | 'running' | 'success' | 'error';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  progress?: number; // 0-100
  error?: string;
  startedAt: number;
  updatedAt: number;
}

type Listener = (tasks: Task[]) => void;

const listeners: Listener[] = [];
let tasks: Task[] = [];
let idCounter = 0;

function emit() {
  listeners.forEach((l) => l(tasks));
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  // emit current once
  listener(tasks);
  return () => {
    
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function getTasks(): Task[] {
  return tasks;
}

export function startTask(title: string, initProgress = 0): string {
  const id = `${Date.now()}-${++idCounter}`;
  const now = Date.now();
  const task: Task = {
    id,
    title,
    status: 'running',
    progress: Math.max(0, Math.min(100, initProgress)),
    startedAt: now,
    updatedAt: now,
  };
  tasks = [task, ...tasks];
  emit();
  return id;
}

export function updateTask(id: string, patch: Partial<Omit<Task, 'id' | 'startedAt'>>): void {
  tasks = tasks.map((t) =>
    t.id === id
      ? { ...t, ...patch, updatedAt: Date.now() }
      : t
  );
  emit();
}

export function completeTask(id: string): void {
  updateTask(id, { status: 'success', progress: 100 });
}

export function failTask(id: string, error: string): void {
  updateTask(id, { status: 'error', error });
}