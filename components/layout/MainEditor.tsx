"use client";

import { TableOfContents } from '@/components/features/TableOfContents';
import { MilkdownEditor } from '@/components/features/MilkdownEditor';

export function MainEditor() {
  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      <div className="flex-1 relative min-h-0 overflow-hidden">
        <MilkdownEditor />
      </div>
      <TableOfContents />
    </div>
  );
}