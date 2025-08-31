// Minimal DW storage helper backed by IndexedDB
// Stores file tree under key "dw:tree" and file contents under key "file:<id>".

export type DWNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: DWNode[];
};

const DB_NAME = 'markdown-ide';
const DB_VERSION = 1;
const STORE = 'kv';
const TREE_KEY = 'dw:tree';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const rq = store.get(key);
    rq.onsuccess = () => resolve((rq.result && rq.result.value) ?? null);
    rq.onerror = () => reject(rq.error);
  });
}

async function kvSet<T = unknown>(key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const rq = store.put({ key, value });
    rq.onsuccess = () => resolve();
    rq.onerror = () => reject(rq.error);
  });
}

async function kvDel(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const rq = store.delete(key);
    rq.onsuccess = () => resolve();
    rq.onerror = () => reject(rq.error);
  });
}

const fileKey = (id: string) => `file:${id}`;

export async function dwLoadTree(): Promise<DWNode[] | null> {
  return kvGet<DWNode[]>(TREE_KEY);
}

export async function dwSaveTree(tree: DWNode[]): Promise<void> {
  await kvSet<DWNode[]>(TREE_KEY, tree);
}

export async function dwReadContent(id: string): Promise<string> {
  const v = await kvGet<string>(fileKey(id));
  return v ?? '';
}

export async function dwWriteContent(id: string, content: string): Promise<void> {
  await kvSet<string>(fileKey(id), content);
}

export async function dwDeleteContentRecursive(nodes: DWNode[]): Promise<void> {
  const tasks: Promise<void>[] = [];
  const walk = (list: DWNode[]) => {
    for (const n of list) {
      if (n.type === 'file') tasks.push(kvDel(fileKey(n.id)));
      if (n.children && n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  await Promise.all(tasks);
}

// Ensure an empty tree exists by default
export async function dwEnsureSeed(): Promise<DWNode[]> {
  const existing = await dwLoadTree();
  if (existing) return existing;
  const seed: DWNode[] = [];
  await dwSaveTree(seed);
  return seed;
}

// Drop the DW database for a clean slate
export async function dwReset(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

// Global save bridge: listen for 'dw-save-file' events
export function installDwSaveBridge() {
  const handler = (e: Event) => {
    const ce = e as CustomEvent<{ id: string; content: string }>;
    if (!ce.detail) return;
    void dwWriteContent(ce.detail.id, ce.detail.content);
  };
  window.addEventListener('dw-save-file', handler as EventListener);
  return () => window.removeEventListener('dw-save-file', handler as EventListener);
} 