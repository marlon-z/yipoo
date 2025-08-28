'use client';

// 轻量占位实现：IndexedDB 恢复层 + OPFS/FS Access 伪实现（先写 localStorage 兜底）
// 后续可替换为真正的 OPFS/FS Access 与 idb 封装

export function useFileSystem() {
  const recoveryKey = (name: string) => `recovery:${name}`;
  const dwKey = (name: string) => `dw:${name}`;

  async function saveToRecovery(name: string, content: string): Promise<void> {
    try {
      localStorage.setItem(recoveryKey(name), content);
    } catch {
      // 忽略
    }
  }

  async function saveToDW(name: string, content: string): Promise<void> {
    try {
      localStorage.setItem(dwKey(name), content);
    } catch {
      // 忽略
    }
  }

  async function loadFromRecovery(name: string): Promise<string | undefined> {
    try {
      const v = localStorage.getItem(recoveryKey(name));
      return v === null ? undefined : v;
    } catch {
      return undefined;
    }
  }

  async function loadFromDW(name: string): Promise<string | undefined> {
    try {
      const v = localStorage.getItem(dwKey(name));
      return v === null ? undefined : v;
    } catch {
      return undefined;
    }
  }

  async function downloadAsFile(name: string, content: string, mime = 'text/markdown'): Promise<void> {
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return { saveToRecovery, saveToDW, loadFromRecovery, loadFromDW, downloadAsFile };
}
