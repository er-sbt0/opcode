/**
 * Trace registry — resolves a ProblemSpec's `visualization` binding to a concrete
 * TraceSpec the renderer can play.
 *
 * `ref` traces are looked up here by id; `inline` traces travel with the problem;
 * `derived` traces are produced by running the instrumented reference solution and
 * land in Phase 3 (roadmap principle #3), so they resolve to null for now. Adding a
 * hand-authored trace is one line in TRACES — data, not code.
 */

import type { TraceSpec } from "@/lib/schemas/trace-spec";
import type { VisualizationBinding } from "@/lib/schemas/problem-spec";
import { containerTwoPointerTrace } from "@/content/traces/container-two-pointer";

const TRACES: Record<string, TraceSpec> = {
  [containerTwoPointerTrace.id]: containerTwoPointerTrace,
};

/** Look up a `ref`-mode trace by id. Returns null when unknown. */
export function getTrace(id: string): TraceSpec | null {
  return TRACES[id] ?? null;
}

/** Resolve a problem's visualization binding to a playable trace, or null. */
export function resolveTrace(
  binding: VisualizationBinding | undefined,
): TraceSpec | null {
  if (!binding) return null;
  switch (binding.mode) {
    case "ref":
      return getTrace(binding.traceId);
    case "inline":
      return binding.trace;
    case "derived":
      return null; // Phase 3: derived by running the instrumented reference solution
  }
}
