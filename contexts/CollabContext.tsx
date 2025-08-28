"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type MemberStatus = 'online' | 'editing' | 'offline';

export interface Collaborator {
  id: string;
  name: string;
  initials: string;
  status: MemberStatus;
  cursor: boolean;
}

interface CollabState {
  enabled: boolean;
  readOnly: boolean;
  showCursors: boolean;
  offlineSync: boolean;
  connection: 'online' | 'offline';
  members: Collaborator[];
}

interface CollabContextType {
  state: CollabState;
  toggleEnabled: () => void;
  setReadOnly: (v: boolean) => void;
  setShowCursors: (v: boolean) => void;
  setOfflineSync: (v: boolean) => void;
  setMembers: (m: Collaborator[]) => void;
}

const CollabContext = createContext<CollabContextType | undefined>(undefined);

export function useCollab() {
  const ctx = useContext(CollabContext);
  if (!ctx) throw new Error('useCollab must be used within a CollabProvider');
  return ctx;
}

const DEFAULT_MEMBERS: Collaborator[] = [
  { id: '1', name: 'John Doe', initials: 'JD', status: 'online', cursor: true },
  { id: '2', name: 'Jane Smith', initials: 'JS', status: 'editing', cursor: false },
  { id: '3', name: 'Bob Wilson', initials: 'BW', status: 'offline', cursor: false },
];

export function CollabProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CollabState>({
    enabled: false,
    readOnly: false,
    showCursors: true,
    offlineSync: false,
    connection: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
    members: DEFAULT_MEMBERS,
  });

  // Listen to browser online/offline as placeholder of connectivity
  useEffect(() => {
    const onOnline = () => setState((s) => ({ ...s, connection: 'online' }));
    const onOffline = () => setState((s) => ({ ...s, connection: 'offline' }));
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Mock member status jitter while enabled
  useEffect(() => {
    if (!state.enabled) return;
    const timer = setInterval(() => {
      setState((s) => {
        const next = s.members.map((m) => {
          const r = Math.random();
          let status = m.status;
          if (r < 0.2) status = 'online';
          else if (r < 0.5) status = 'editing';
          else if (r < 0.6) status = 'offline';
          return { ...m, status };
        });
        return { ...s, members: next };
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [state.enabled]);

  const api = useMemo<CollabContextType>(() => ({
    state,
    toggleEnabled: () => setState((s) => ({ ...s, enabled: !s.enabled })),
    setReadOnly: (v) => setState((s) => ({ ...s, readOnly: !!v })),
    setShowCursors: (v) => setState((s) => ({ ...s, showCursors: !!v })),
    setOfflineSync: (v) => setState((s) => ({ ...s, offlineSync: !!v })),
    setMembers: (m) => setState((s) => ({ ...s, members: m })),
  }), [state]);

  return <CollabContext.Provider value={api}>{children}</CollabContext.Provider>;
}
