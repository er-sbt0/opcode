/**
 * TraceSpec — the "algorithm trace as data" DSL. The other half of the spine.
 *
 * These are the canonical *types*. The runtime Zod schema for TraceSpec lands in
 * Phase 2 alongside the visualization engine that consumes it — until then nothing
 * generates or validates traces, so shipping the schema now would be dead code.
 * `ProblemSpec.visualization` only needs the *shape* to reference (see the `inline`
 * binding), which is what this file provides.
 *
 * Design rules (see roadmap.md → "Architectural spine"):
 *  - Content, not presentation. Steps name semantic `Role`s; the renderer maps
 *    roles → design tokens. No colors live in a trace.
 *  - Stable identity. Markers, nodes, and edges carry ids so the renderer can
 *    *tween* them between steps.
 */

/** Semantic emphasis. Renderer resolves each to a token color + weight. */
export type Role =
  | "default"
  | "active" //   currently being examined
  | "compared" //   being compared against active
  | "window" //   inside the current window / candidate region
  | "visited" //   already processed
  | "result" //   part of the answer
  | "excluded" //   ruled out
  | "path"; //   on the current path (graphs/trees)

/** A named pointer/cursor into an array or bars view (e.g. "L", "R", "i"). */
export interface Marker {
  id: string; // stable across steps → animated when it moves
  label: string; // shown to the user, e.g. "L"
  index: number; // position it points at
  role?: Role; // default "active"
}

/** A highlighted contiguous span, e.g. a sliding window or the water fill. */
export interface Span {
  from: number; // inclusive index
  to: number; // inclusive index
  role?: Role; // default "window"
  label?: string; // optional annotation, e.g. "area = 49"
  /** For `bars` only: fill height in value-units (e.g. the water level = min wall). */
  level?: number;
}

export interface ArrayState {
  kind: "array";
  values: (number | string)[];
  markers?: Marker[];
  spans?: Span[];
  /** Per-index role override, for cells not covered by a span. */
  cellRoles?: Record<number, Role>;
}

export interface BarsState {
  kind: "bars";
  values: number[]; // bar heights
  markers?: Marker[];
  spans?: Span[]; // use `level` to draw a fill (water) under the span
  cellRoles?: Record<number, Role>;
}

export interface GridState {
  kind: "grid";
  cells: (number | string)[][]; // row-major values / terrain
  cellRoles?: { row: number; col: number; role: Role; label?: string }[];
  markers?: { id: string; label: string; row: number; col: number; role?: Role }[];
}

export interface GraphState {
  kind: "graph";
  nodes: { id: string; label?: string; role?: Role; x?: number; y?: number }[];
  edges: { from: string; to: string; weight?: number; role?: Role }[];
}

export interface TreeState {
  kind: "tree";
  /** Nodes with parent links; renderer computes layout. Root has no parent. */
  nodes: { id: string; value: number | string; parent?: string; role?: Role }[];
}

/** A scalar readout — "best so far", counters, running sums. */
export interface ValueState {
  kind: "value";
  value: number | string;
  role?: Role;
  /** Optional change vs previous step, for a subtle +/- animation. */
  delta?: number;
}

export type ViewState =
  | ArrayState
  | BarsState
  | GridState
  | GraphState
  | TreeState
  | ValueState;

/** Declares a visual surface present throughout the trace, with layout hints. */
export interface ViewDecl {
  id: string; // referenced by each Step.state key
  kind: ViewState["kind"];
  label?: string; // shown as the view's title, e.g. "Best so far"
  /** Layout weight when several views share the stage (flex-grow-like). */
  weight?: number;
}

/** One frame. Provides a snapshot for each view (or a subset — omitted views hold). */
export interface Step {
  /** Markdown narration for the step, used verbatim in "Explain" mode. */
  caption?: string;
  state: Record<string, ViewState>; // keyed by ViewDecl.id
}

export interface TraceSpec {
  schemaVersion: 1;
  id: string; // referenced by ProblemSpec.visualization.traceId
  title?: string;
  algorithm?: string; // e.g. "two-pointer scan"
  views: ViewDecl[];
  steps: Step[];
  meta?: {
    generatedFrom?: string; // input that produced this trace
    derivedFromSolution?: boolean; // true when emitted by the instrumented reference
  };
}
