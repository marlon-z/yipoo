"use client";

import { SourceEditor } from './SourceEditor';
import { WysiwygEditor } from './WysiwygEditor';

export function SplitEditor() {
  return (
    <div className="h-full flex">
      <div className="w-1/2 border-r border-border">
        <SourceEditor />
      </div>
      <div className="w-1/2">
        <WysiwygEditor />
      </div>
    </div>
  );
}