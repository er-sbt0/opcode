"use client";

import { cn } from "@/lib/utils";
import type { ValueState } from "@/lib/schemas/trace-spec";
import type { ViewRenderProps } from "../types";

/**
 * ValueView — a scalar readout ("best so far", running sums, counters). Tints the
 * number by role and shows a subtle +/- badge when the step reports a `delta`.
 */
export function ValueView({
  state,
  decl,
  roleToken,
  reducedMotion,
}: ViewRenderProps<ValueState>) {
  const color = roleToken(state.role);
  const delta = state.delta;
  const move = reducedMotion ? "" : "transition-colors duration-300";

  return (
    <div className="flex h-full min-h-16 flex-col justify-center rounded-lg border border-border bg-card px-4 py-2">
      {decl.label ? (
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {decl.label}
        </span>
      ) : null}
      <div className="flex items-baseline gap-2">
        <span
          className={cn("text-2xl font-semibold tabular-nums", move)}
          style={{ color: state.role ? color : undefined }}
        >
          {state.value}
        </span>
        {delta ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              delta > 0
                ? "bg-[var(--viz-result)]/15 text-[var(--viz-result)]"
                : "bg-muted text-muted-foreground",
            )}
          >
            {delta > 0 ? `▲ +${delta}` : `▼ ${delta}`}
          </span>
        ) : null}
      </div>
    </div>
  );
}
