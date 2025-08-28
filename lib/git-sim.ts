'use client';

// Simple Git simulation for UI stage using localStorage
// DW (Document Workspace) and RW (Git working tree) are separated

export type FileType = 'file' | 'folder';
export interface FsEntry { type: FileType; content?: string; }
export type FsMap = Record<string, FsEntry>; // path -> entry (folders have no content)

const KEYS = {
  DW: 'sim:dw:fs',
  WORKING: 'sim:rw:working',
  HEAD: 'sim:rw:head',
  STAGED: 'sim:rw:staged',
  COMMITS: 'sim:rw:commits',
  AHEAD: 'sim:rw:ahead',
  BEHIND: 'sim:rw:behind',
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function write<T>(key: string, value: T) { if (typeof window === "undefined") return; try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function bump() { try { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent('git-sim-updated')); } catch {} }

function ensureDefaults() {
  const dw = read<FsMap>(KEYS.DW, {});
  if (Object.keys(dw).length === 0) {
    dw['untitled-1.md'] = { type: 'file', content: '# Welcome to MarkdownIDE\n\n这是一个现代化的 Markdown 编辑器。' };
    write(KEYS.DW, dw);
  }
  const working = read<FsMap>(KEYS.WORKING, {});
  if (!localStorage.getItem(KEYS.WORKING)) write(KEYS.WORKING, working);
  const head = read<FsMap>(KEYS.HEAD, {});
  if (!localStorage.getItem(KEYS.HEAD)) write(KEYS.HEAD, head);
  const staged = read<string[]>(KEYS.STAGED, []);
  if (!localStorage.getItem(KEYS.STAGED)) write(KEYS.STAGED, staged);
  if (!localStorage.getItem(KEYS.COMMITS)) write(KEYS.COMMITS, [] as any);
  if (!localStorage.getItem(KEYS.AHEAD)) write(KEYS.AHEAD, 0 as any);
  if (!localStorage.getItem(KEYS.BEHIND)) write(KEYS.BEHIND, 0 as any);
}

if (typeof window !== "undefined") ensureDefaults();

// ---------- DW operations ----------
export function dwList(): FsMap { return read(KEYS.DW, {} as FsMap); }
export function dwWrite(path: string, content: string) {
  const fs = dwList(); fs[path] = { type: 'file', content }; write(KEYS.DW, fs); bump();
}
export function dwCreateFolder(path: string) {
  const fs = dwList(); fs[path] = { type: 'folder' }; write(KEYS.DW, fs); bump();
}
export function dwDelete(path: string) {
  const fs = dwList();
  for (const p of Object.keys(fs)) if (p === path || p.startsWith(path + '/')) delete fs[p];
  write(KEYS.DW, fs); bump();
}
export function dwRename(oldPath: string, newPath: string) {
  const fs = dwList();
  const updates: [string, FsEntry][] = [];
  for (const [p, e] of Object.entries(fs)) {
    if (p === oldPath || p.startsWith(oldPath + '/')) {
      const np = p.replace(oldPath, newPath);
      updates.push([np, e]);
      delete fs[p];
    }
  }
  for (const [p, e] of updates) fs[p] = e;
  write(KEYS.DW, fs); bump();
}

// ---------- RW (Git working tree) ----------
function rwWorking(): FsMap { return read(KEYS.WORKING, {} as FsMap); }
function rwHead(): FsMap { return read(KEYS.HEAD, {} as FsMap); }
function setWorking(fs: FsMap) { write(KEYS.WORKING, fs); bump(); }
function setHead(fs: FsMap) { write(KEYS.HEAD, fs); bump(); }
function getStaged(): string[] { return read(KEYS.STAGED, [] as string[]); }
function setStaged(list: string[]) { write(KEYS.STAGED, list); bump(); }

export interface ChangeItem { path: string; status: 'modified' | 'added' | 'deleted' | 'untracked'; staged: boolean; }

export function rwChanges(): ChangeItem[] {
  const working = rwWorking();
  const head = rwHead();
  const staged = new Set(getStaged());
  const paths = Array.from(new Set<string>([...Object.keys(working), ...Object.keys(head)]));
  const out: ChangeItem[] = [];
  for (const p of paths) {
    const w = working[p];
    const h = head[p];
    let status: ChangeItem['status'] | undefined;
    if (w && !h) status = 'untracked';
    else if (!w && h) status = 'deleted';
    else if (w && h) status = (w.content !== h.content || w.type !== h.type) ? 'modified' : undefined;
    if (status) out.push({ path: p, status, staged: staged.has(p) });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

export function rwStage(path: string) {
  const list = new Set(getStaged()); list.add(path); setStaged(Array.from(list));
}
export function rwUnstage(path: string) {
  const list = new Set(getStaged()); list.delete(path); setStaged(Array.from(list));
}
export function rwRestore(path: string) {
  const working = rwWorking(); const head = rwHead();
  if (head[path]) working[path] = { ...head[path] }; else delete working[path];
  setWorking(working);
}

export function commit(message: string) {
  const working = rwWorking();
  const head = rwHead();
  const staged = new Set(getStaged());
  // Only commit staged paths
  const newHead = { ...head } as FsMap;
  if (staged.size === 0) return false;
  for (const p of Array.from(staged)) {
    const w = working[p];
    if (w) newHead[p] = { ...w }; else delete newHead[p];
  }
  setHead(newHead);
  setStaged([]);
  const commits = read<any[]>(KEYS.COMMITS, []);
  commits.unshift({ id: Date.now().toString(36), message, date: new Date().toISOString(), files: newHead });
  write(KEYS.COMMITS, commits);
  const ahead = read<number>(KEYS.AHEAD, 0) + 1; write(KEYS.AHEAD, ahead);
  bump();
  return true;
}

export function getCommits() { return read<any[]>(KEYS.COMMITS, []); }
export function getAheadBehind() { return { ahead: read<number>(KEYS.AHEAD, 0), behind: read<number>(KEYS.BEHIND, 0) }; }
export function push() { write(KEYS.AHEAD, 0 as any); bump(); }
export function fetch() { /* no-op in sim */ bump(); }
export function pull() { write(KEYS.BEHIND, 0 as any); bump(); }

// ---------- Cross area moves ----------
export function dwToRw(paths: string[], strategy: 'keep-both' | 'overwrite' | 'skip' = 'keep-both') {
  const dw = dwList(); const working = rwWorking();
  for (const p of paths) {
    for (const [dp, ent] of Object.entries(dw)) {
      if (dp === p || dp.startsWith(p + '/')) {
        let target = dp;
        if (strategy === 'keep-both' && working[target]) {
          const ext = target.includes('.') ? target.slice(target.lastIndexOf('.')) : '';
          const base = ext ? target.slice(0, -ext.length) : target;
          let i = 1; let candidate = `${base} (copy)` + (ext || '');
          while (working[candidate]) { i++; candidate = `${base} (copy ${i})` + (ext || ''); }
          target = candidate;
        }
        if (strategy === 'skip' && working[target]) continue;
        working[target] = { ...ent };
      }
    }
  }
  setWorking(working);
}

export function rwToDw(paths: string[]) {
  const working = rwWorking(); const dw = dwList();
  for (const p of paths) {
    const ent = working[p]; if (!ent) continue;
    let target = p;
    if (dw[target]) {
      const ext = target.includes('.') ? target.slice(target.lastIndexOf('.')) : '';
      const base = ext ? target.slice(0, -ext.length) : target;
      let i = 1; let candidate = `${base} (copy)` + (ext || '');
      while (dw[candidate]) { i++; candidate = `${base} (copy ${i})` + (ext || ''); }
      target = candidate;
    }
    dw[target] = { ...ent };
  }
  write(KEYS.DW, dw); bump();
}

// ---------- Utilities ----------
export function listTree(fs: FsMap) {
  // Convert flat map to tree nodes for UI
  type Node = { id: string; name: string; type: FileType; children?: Node[]; };
  const root: Record<string, Node> = {};
  const ensure = (parts: string[]): Node => {
    let current = root;
    let pathAcc = '';
    let parentNode: Node | undefined;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      pathAcc = pathAcc ? pathAcc + '/' + part : part;
      if (!current[part]) current[part] = { id: pathAcc, name: part, type: 'folder', children: {} as any } as any;
      parentNode = current[part];
      current = (current[part].children as any) || (current[part].children = {} as any);
    }
    return parentNode!;
  };
  for (const p of Object.keys(fs)) {
    const parts = p.split('/');
    if (fs[p].type === 'folder') { ensure(parts); continue; }
    const fname = parts.pop()!; const parent = ensure(parts);
    const bucket = (parent.children as any) as Record<string, Node>;
    bucket[fname] = { id: (parts.length ? parts.join('/') + '/' : '') + fname, name: fname, type: 'file' } as any;
  }
  const toArray = (m: Record<string, Node>): Node[] => Object.values(m).map(n => n.children ? ({...n, children: toArray(n.children as any)}) : n);
  return toArray(root);
}

export function setWorkingFileContent(path: string, content: string) {
  const w = rwWorking();
  if (w[path]) { w[path] = { ...w[path], content }; setWorking(w); }
}
