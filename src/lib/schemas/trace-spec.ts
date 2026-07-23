/**
 * TraceSpec — the "algorithm trace as data" DSL. The other half of the spine.
 *
 * A TraceSpec is an ordered list of `steps`, each a snapshot of one or more named
 * `views` (array, bars, grid, graph, tree, scalar). Generic renderers animate it;
 * no per-problem visualization code is written. Crucially, a TraceSpec is meant to
 * be *produced by running the instrumented reference solution* (roadmap principle
 * #3), so it is correct by construction for any generated problem.
 *
 * Like ProblemSpec, this is schema-first: every shape is a Zod schema and the TS
 * type is `z.infer`'d from it, so the shape that *types* the renderer also
 * *validates* any trace (hand-authored now, instrumentation-derived in Phase 3)
 * before it ever reaches the screen. `parseTraceSpec` is the gate.
 *
 * Design rules:
 *  - Content, not presentation. Steps name semantic `Role`s ("active", "window");
 *    the renderer maps roles → design tokens. No colors live in a trace.
 *  - Stable identity. Markers, nodes, and edges carry ids/labels so the renderer
 *    can *tween* them between steps (the pointers gliding in the mockup).
 */

import { z } from "zod";

// ────────────────────────────────────────────────────────────────────────────
// Shared vocabulary
// ────────────────────────────────────────────────────────────────────────────

/** Semantic emphasis. Renderer resolves each to a token color + weight. */
export const roleSchema = z.enum([
  "default",
  "active", //   currently being examined
  "compared", //   being compared against active
  "window", //   inside the current window / candidate region
  "visited", //   already processed
  "result", //   part of the answer
  "excluded", //   ruled out
  "path", //   on the current path (graphs/trees)
]);
export type Role = z.infer<typeof roleSchema>;

/** A scalar cell/readout value. */
const scalarSchema = z.union([z.number(), z.string()]);

/** A named pointer/cursor into an array or bars view (e.g. "L", "R", "i"). */
export const markerSchema = z.object({
  id: z.string(), // stable across steps → animated when it moves
  label: z.string(), // shown to the user, e.g. "L"
  index: z.number().int(), // position it points at
  role: roleSchema.optional(), // default "active"
});
export type Marker = z.infer<typeof markerSchema>;

/** A highlighted contiguous span, e.g. a sliding window or the water fill. */
export const spanSchema = z.object({
  from: z.number().int(), // inclusive index
  to: z.number().int(), // inclusive index
  role: roleSchema.optional(), // default "window"
  label: z.string().optional(), // optional annotation, e.g. "area = 49"
  /** For `bars` only: fill height in value-units (e.g. the water level = min wall). */
  level: z.number().optional(),
});
export type Span = z.infer<typeof spanSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Per-view state — discriminated on the view's declared `kind`.
// ────────────────────────────────────────────────────────────────────────────

/** Per-index role override, for cells not covered by a span. Keys are indices. */
const cellRolesSchema = z.record(z.string(), roleSchema);

export const arrayStateSchema = z.object({
  kind: z.literal("array"),
  values: z.array(scalarSchema),
  markers: z.array(markerSchema).optional(),
  spans: z.array(spanSchema).optional(),
  cellRoles: cellRolesSchema.optional(),
});
export type ArrayState = z.infer<typeof arrayStateSchema>;

export const barsStateSchema = z.object({
  kind: z.literal("bars"),
  values: z.array(z.number()), // bar heights
  markers: z.array(markerSchema).optional(),
  spans: z.array(spanSchema).optional(), // use `level` to draw a fill (water) under the span
  cellRoles: cellRolesSchema.optional(),
});
export type BarsState = z.infer<typeof barsStateSchema>;

export const gridStateSchema = z.object({
  kind: z.literal("grid"),
  cells: z.array(z.array(scalarSchema)), // row-major values / terrain
  cellRoles: z
    .array(
      z.object({
        row: z.number().int(),
        col: z.number().int(),
        role: roleSchema,
        label: z.string().optional(),
      }),
    )
    .optional(),
  markers: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        row: z.number().int(),
        col: z.number().int(),
        role: roleSchema.optional(),
      }),
    )
    .optional(),
});
export type GridState = z.infer<typeof gridStateSchema>;

export const graphStateSchema = z.object({
  kind: z.literal("graph"),
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string().optional(),
      role: roleSchema.optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    }),
  ),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      weight: z.number().optional(),
      role: roleSchema.optional(),
    }),
  ),
});
export type GraphState = z.infer<typeof graphStateSchema>;

export const treeStateSchema = z.object({
  kind: z.literal("tree"),
  /** Nodes with parent links; renderer computes layout. Root has no parent. */
  nodes: z.array(
    z.object({
      id: z.string(),
      value: scalarSchema,
      parent: z.string().optional(),
      role: roleSchema.optional(),
    }),
  ),
});
export type TreeState = z.infer<typeof treeStateSchema>;

/** A scalar readout — "best so far", counters, running sums. */
export const valueStateSchema = z.object({
  kind: z.literal("value"),
  value: scalarSchema,
  role: roleSchema.optional(),
  /** Optional change vs previous step, for a subtle +/- animation. */
  delta: z.number().optional(),
});
export type ValueState = z.infer<typeof valueStateSchema>;

export const viewStateSchema = z.discriminatedUnion("kind", [
  arrayStateSchema,
  barsStateSchema,
  gridStateSchema,
  graphStateSchema,
  treeStateSchema,
  valueStateSchema,
]);
export type ViewState = z.infer<typeof viewStateSchema>;

/** The set of view kinds; a `ViewDecl.kind` must be one of these. */
export const viewKindSchema = z.enum([
  "array",
  "bars",
  "grid",
  "graph",
  "tree",
  "value",
]);
export type ViewKind = z.infer<typeof viewKindSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Views + steps + the spec
// ────────────────────────────────────────────────────────────────────────────

/** Declares a visual surface present throughout the trace, with layout hints. */
export const viewDeclSchema = z.object({
  id: z.string(), // referenced by each Step.state key
  kind: viewKindSchema,
  label: z.string().optional(), // shown as the view's title, e.g. "Best so far"
  /** Layout weight when several views share the stage (flex-grow-like). */
  weight: z.number().optional(),
});
export type ViewDecl = z.infer<typeof viewDeclSchema>;

/** One frame. Provides a snapshot for each view (or a subset — omitted views hold). */
export const stepSchema = z.object({
  /** Markdown narration for the step, used verbatim in "Explain" mode. */
  caption: z.string().optional(),
  state: z.record(z.string(), viewStateSchema), // keyed by ViewDecl.id
});
export type Step = z.infer<typeof stepSchema>;

export const traceSpecSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(), // referenced by ProblemSpec.visualization.traceId
  title: z.string().optional(),
  algorithm: z.string().optional(), // e.g. "two-pointer scan"
  views: z.array(viewDeclSchema).min(1),
  steps: z.array(stepSchema).min(1),
  meta: z
    .object({
      generatedFrom: z.string().optional(), // input that produced this trace
      derivedFromSolution: z.boolean().optional(), // true when emitted by the instrumented reference
    })
    .optional(),
});
export type TraceSpec = z.infer<typeof traceSpecSchema>;

/**
 * Parse + validate an untrusted TraceSpec (hand-authored data now, emitted by the
 * instrumented reference solution in Phase 3). Throws a ZodError on malformed
 * input — the same "never render garbage" gate ProblemSpec has.
 */
export function parseTraceSpec(input: unknown): TraceSpec {
  return traceSpecSchema.parse(input);
}
