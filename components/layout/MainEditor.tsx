"use client";

import { TableOfContents } from '@/components/features/TableOfContents';
import { EnhancedMilkdownEditor } from '@/components/features/EnhancedMilkdownEditor';

export function MainEditor() {
  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      <div className="flex-1 relative min-h-0 overflow-hidden">
        <EnhancedMilkdownEditor />
      </div>
      <TableOfContents />
    </div>
  );
}