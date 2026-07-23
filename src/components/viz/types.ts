/**
 * Public contracts for the visualization engine (implements renderer/api.ts).
 *
 * One generic component tree animates any TraceSpec; new emulation primitives are
 * added by *registering a view renderer*, never by branching on the problem.
 */

import type { FC } from "react";
import type {
  ArrayState,
  BarsState,
  GraphState,
  GridState,
  Role,
  Step,
  TreeState,
  ValueState,
  ViewDecl,
  ViewState,
} from "@/lib/schemas/trace-spec";

/** Presentation mode. "explain" gives narration/detail more prominence. */
export type VizMode = "animate" | "explain";

/** Resolves a semantic Role to a themeable CSS variable (see roles.ts). */
export type RoleResolver = (role: Role | undefined) => string;

/**
 * Every view renderer receives its current snapshot plus the previous one. Stable
 * ids on markers/nodes let renderers tween movement between steps; `prev` is for
 * delta emphasis ("this value just changed") and may be ignored.
 */
export interface ViewRenderProps<S extends ViewState = ViewState> {
  state: S; // this view's snapshot at the active step
  prev: S | null; // previous step's snapshot, or null at step 0
  decl: ViewDecl; // label, weight, kind
  roleToken: RoleResolver; // Role → CSS var
  reducedMotion: boolean; // true → skip tweens, render final state
  mode: VizMode; // renderers may show more detail in "explain"
}

export type ViewRenderer<S extends ViewState = ViewState> = FC<ViewRenderProps<S>>;

/**
 * Maps a view `kind` to its renderer. Open by design: the built-ins are the typed
 * contract, but any string kind + component is accepted, so a new primitive is
 * "write a renderer, register it". Unknown kinds fall back to a diagnostic view.
 *
 * The index signature is `ViewRenderer<any>` on purpose: a registry mixing
 * renderers of different, narrower state types can't be made variance-safe under a
 * single key type, and each built-in below still keeps its precise signature.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ViewRegistry extends Record<string, ViewRenderer<any>> {
  array: ViewRenderer<ArrayState>;
  bars: ViewRenderer<BarsState>;
  grid: ViewRenderer<GridState>;
  graph: ViewRenderer<GraphState>;
  tree: ViewRenderer<TreeState>;
  value: ViewRenderer<ValueState>;
}

export interface PlaybackOptions {
  initialStep?: number; // default 0
  autoPlay?: boolean; // default false
  speed?: number; // ms per step, default 1100
  loop?: boolean; // default false
}

export interface Playback {
  index: number;
  step: Step; // current step, with omitted views forward-filled
  total: number;
  isPlaying: boolean;
  isFirst: boolean;
  isLast: boolean;
  play(): void;
  pause(): void;
  toggle(): void;
  next(): void;
  prev(): void;
  seek(index: number): void;
  restart(): void;
  speed: number;
  setSpeed(ms: number): void;
}
