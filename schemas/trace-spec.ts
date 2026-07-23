/**
 * TraceSpec — the "algorithm trace as data" DSL. The other half of the spine.
 *
 * A TraceSpec is an ordered list of `steps`, each a snapshot of one or more named
 * `views` (array, bars, grid, graph, tree, scalar). Generic renderers animate it;
 * no per-problem visualization code is written. Crucially, a TraceSpec is meant to
 * be *produced by running the instrumented reference solution* (roadmap principle
 * #3), so it is correct by construction for any generated problem — see the tracer
 * sketch at the bottom.
 *
 * Design rules:
 *  - Content, not presentation. Steps name semantic `Role`s ("active", "window");
 *    the renderer maps roles → design tokens. No colors live in a trace.
 *  - Stable identity. Markers, nodes, and edges carry ids/labels so the renderer
 *    can *tween* them between steps (the pointers gliding in the mockup).
 */

// ────────────────────────────────────────────────────────────────────────────
// Shared vocabulary
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// Per-view state — discriminated on the view's declared `kind`.
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// Views + steps + the spec
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// Worked example — the exact emulation from the mockup, as data.
//   Stage: one `bars` view (heights + L/R markers + water span) and two `value`
//   readouts (current area, best). A few steps shown; the rest are analogous.
// ────────────────────────────────────────────────────────────────────────────

export const containerTwoPointerTrace: TraceSpec = {
  schemaVersion: 1,
  id: "container-two-pointer",
  title: "Container With Most Water — two pointers",
  algorithm: "two-pointer scan",
  meta: { generatedFrom: "height=[1,8,6,2,5,4,8,3,7]", derivedFromSolution: true },

  views: [
    { id: "bars", kind: "bars", label: "height", weight: 3 },
    { id: "area", kind: "value", label: "Current area", weight: 1 },
    { id: "best", kind: "value", label: "Best so far", weight: 1 },
  ],

  steps: [
    {
      caption:
        "**L=0** (height 1) · **R=8** (height 7). Water can't rise above the " +
        "shorter wall (1), so this holds **1 × 8 = 8**. The left wall is shorter — " +
        "move **L →** inward.",
      state: {
        bars: {
          kind: "bars",
          values: [1, 8, 6, 2, 5, 4, 8, 3, 7],
          markers: [
            { id: "L", label: "L", index: 0, role: "active" },
            { id: "R", label: "R", index: 8, role: "active" },
          ],
          spans: [{ from: 0, to: 8, role: "window", level: 1, label: "1 × 8 = 8" }],
        },
        area: { kind: "value", value: 8 },
        best: { kind: "value", value: 8, role: "result" },
      },
    },
    {
      caption:
        "**L=1** (height 8) · **R=8** (height 7). Limited by 7 → **7 × 7 = 49**, a " +
        "new best. The right wall is now the shorter one — move **← R**.",
      state: {
        bars: {
          kind: "bars",
          values: [1, 8, 6, 2, 5, 4, 8, 3, 7],
          markers: [
            { id: "L", label: "L", index: 1, role: "active" },
            { id: "R", label: "R", index: 8, role: "active" },
          ],
          spans: [{ from: 1, to: 8, role: "window", level: 7, label: "7 × 7 = 49" }],
        },
        area: { kind: "value", value: 49 },
        best: { kind: "value", value: 49, role: "result", delta: 41 },
      },
    },
    // … steps for R=7,6,5,4,3,2 (areas 18, 40, 16, 15, 16, 6) omitted for brevity …
    {
      caption:
        "**Pointers met — done in 8 steps.** The widest useful container wins: " +
        "lines **1** and **8** hold **49**. By always advancing the shorter wall we " +
        "skip every container that couldn't beat it — O(n), not O(n²).",
      state: {
        bars: {
          kind: "bars",
          values: [1, 8, 6, 2, 5, 4, 8, 3, 7],
          markers: [
            { id: "L", label: "L", index: 1, role: "result" },
            { id: "R", label: "R", index: 8, role: "result" },
          ],
          spans: [{ from: 1, to: 8, role: "result", level: 7, label: "MAX = 49" }],
        },
        area: { kind: "value", value: 49 },
        best: { kind: "value", value: 49, role: "result" },
      },
    },
  ],
};

/**
 * Producing a trace by instrumentation (Phase 3). The reference solution is run
 * with a tiny `Tracer` in scope; each meaningful iteration emits one Step. The
 * model writes ordinary solution code plus a few `trace.*` calls — it never
 * hand-authors frames, so the visual always matches the real algorithm.
 *
 *   def max_area(height, trace):
 *       left, right, best = 0, len(height) - 1, 0
 *       while left < right:
 *           span = min(height[left], height[right])
 *           best = max(best, span * (right - left))
 *           trace.step(
 *               bars={"values": height,
 *                     "markers": [("L", left), ("R", right)],
 *                     "spans": [(left, right, span)]},
 *               area=span * (right - left), best=best,
 *               caption=f"L={left}, R={right} → {span} × {right-left}",
 *           )
 *           if height[left] < height[right]: left += 1
 *           else: right -= 1
 *       return best
 *
 * The `Tracer` serializes these calls into the TraceSpec above (roles/layout
 * filled from the view declarations). Capped at TraceRecipe.maxSteps.
 */
