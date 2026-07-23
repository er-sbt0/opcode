"use client";

import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import type { VizMode } from "./types";

/**
 * Per-step narration. Renders the step's markdown caption; "explain" mode gives it
 * more prominence (this is the seam the guided "Explain mode" grows from in Phase 4).
 */
export function Caption({ text, mode }: { text?: string; mode: VizMode }) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-border px-4 py-3",
        mode === "explain" && "bg-muted/40",
      )}
    >
      {text ? (
        <Markdown className={cn(mode === "explain" && "text-[15px]")}>
          {text}
        </Markdown>
      ) : (
        <p className="text-sm text-muted-foreground">&nbsp;</p>
      )}
    </div>
  );
}
