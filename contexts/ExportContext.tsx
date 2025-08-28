"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

export interface ExportSettings {
  includeToc: boolean;
  pageNumbers: boolean;
  highlight: boolean;
  math: boolean;
  charts: boolean; // mermaid etc.
}

interface ExportContextType {
  settings: ExportSettings;
  update: (patch: Partial<ExportSettings>) => void;
}

const ExportContext = createContext<ExportContextType | undefined>(undefined);

export function useExportSettings(): ExportContextType {
  const ctx = useContext(ExportContext);
  if (!ctx) throw new Error('useExportSettings must be used within an ExportProvider');
  return ctx;
}

export function ExportProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ExportSettings>({
    includeToc: true,
    pageNumbers: false,
    highlight: true,
    math: true,
    charts: true,
  });

  const update = useCallback((patch: Partial<ExportSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);

  return <ExportContext.Provider value={value}>{children}</ExportContext.Provider>;
}
