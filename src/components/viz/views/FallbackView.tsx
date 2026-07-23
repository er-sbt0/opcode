"use client";

import type { ViewRenderProps } from "../types";

/**
 * Diagnostic renderer for view kinds that don't have a real renderer yet (array,
 * grid, graph, tree land in later Phase 2 slices). Keeps an unknown or
 * not-yet-built primitive from crashing the whole stage.
 */
export function FallbackView({ state, decl }: ViewRenderProps) {
  return (
    <div className="flex h-full min-h-24 items-center justify-center rounded-lg border border-dashed border-border p-4 text-center">
      <p className="text-xs text-muted-foreground">
        No renderer for <code className="font-mono">{decl.kind}</code>
        {decl.label ? ` (“${decl.label}”)` : ""} yet
        <span className="sr-only">: {JSON.stringify(state)}</span>
      </p>
    </div>
  );
}
