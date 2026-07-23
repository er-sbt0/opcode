/**
 * Visualization renderer — public API (design draft, Phase 2).
 *
 * One generic React component tree animates any `TraceSpec`. There is no
 * per-problem visualization code: new emulation primitives are added by
 * registering a view renderer, not by branching on the problem. This is the
 * "content is data, never hardcoded" principle at the rendering layer.
 *
 * Layering (outer → inner):
 *
 *   <Visualization spec>                     orchestrator: owns playback
 *     ├─ <Stage>                             lays out the declared views
 *     │    └─ registry[view.kind] → <View>   one renderer per view snapshot
 *     ├─ <Caption>                           per-step narration (markdown)
 *     └─ <Transport>                         play / step / scrub controls
 *
 * These are type signatures + contracts, not implementations. JSX appears only in
 * comments so this file stays a clean, compilable contract.
 */

import type { FC, ReactElement } from "react";
import type {
  TraceSpec,
  Step,
  ViewDecl,
  ViewState,
  Role,
  ArrayState,
  BarsState,
  GridState,
  GraphState,
  TreeState,
  ValueState,
} from "../schemas/trace-spec";

// ────────────────────────────────────────────────────────────────────────────
// Roles → design tokens (content stays presentation-free)
// ────────────────────────────────────────────────────────────────────────────

/**
 * A trace names semantic `Role`s; the renderer resolves each to a themeable CSS
 * variable. These vars live in the design-token layer and are defined for both
 * light and dark themes — so Phase 4 restyling touches tokens, never traces.
 */
export const ROLE_TOKENS: Record<Role, string> = {
  default: "var(--viz-neutral)",
  active: "var(--viz-active)", // reuses the brand teal
  compared: "var(--viz-compared)",
  window: "var(--viz-window)",
  visited: "var(--viz-visited)",
  result: "var(--viz-result)",
  excluded: "var(--viz-excluded)",
  path: "var(--viz-path)",
};

/** Default resolver. Override via `Visualization`'s `roleToken` prop for theming. */
export type RoleResolver = (role: Role | undefined) => string;
export const defaultRoleToken: RoleResolver = (r) => ROLE_TOKENS[r ?? "default"];

// ────────────────────────────────────────────────────────────────────────────
// View renderer contract — the extensibility point
// ────────────────────────────────────────────────────────────────────────────

/**
 * Every view renderer receives its current snapshot plus the previous one. Because
 * markers/nodes/edges carry stable ids (see TraceSpec), renderers can tween element
 * movement between steps (e.g. Framer Motion `layoutId`); `prev` is there for delta
 * emphasis ("this value just changed", "this cell just became visited") and can be
 * ignored by renderers that rely purely on keyed layout animation.
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
 * Maps a view `kind` to its renderer. Open by design: the built-ins below are the
 * typed contract, but the registry accepts any string kind + component, so adding a
 * new emulation primitive is "write a renderer, register it" — plus (optionally)
 * augmenting the `ViewState` union for full type-safety. Unknown kinds fall back to
 * a diagnostic placeholder rather than crashing.
 */
export interface ViewRegistry extends Record<string, ViewRenderer<any>> {
  array: ViewRenderer<ArrayState>;
  bars: ViewRenderer<BarsState>;
  grid: ViewRenderer<GridState>;
  graph: ViewRenderer<GraphState>;
  tree: ViewRenderer<TreeState>;
  value: ViewRenderer<ValueState>;
}

/** The shipped renderers (Phase 2 build order roughly top-to-bottom). */
export declare const defaultRegistry: ViewRegistry;

/** Merge custom/override renderers over the defaults. */
export declare function extendRegistry(
  extra: Partial<ViewRegistry> & Record<string, ViewRenderer<any>>,
  base?: ViewRegistry,
): ViewRegistry;

// ────────────────────────────────────────────────────────────────────────────
// Playback — headless state, decoupled from the transport UI
// ────────────────────────────────────────────────────────────────────────────

export type VizMode = "animate" | "explain";

export interface PlaybackOptions {
  initialStep?: number; // default 0
  autoPlay?: boolean; // default false
  speed?: number; // ms per step, default 1100
  loop?: boolean; // default false
}

export interface Playback {
  index: number;
  step: Step; // current step (with omitted views forward-filled)
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

/**
 * Owns the timer and step index. Honors `prefers-reduced-motion` (advances without
 * long tweens) and clears its timer on unmount. Both `Transport` and `Stage` read
 * from the same `Playback`, so the UI and the animation never drift.
 */
export declare function usePlayback(spec: TraceSpec, opts?: PlaybackOptions): Playback;

/**
 * Resolves the effective per-view state at `index`, forward-filling any view a step
 * omits (a Step may provide a subset; omitted views hold their last value). Pure —
 * safe to memoize.
 */
export declare function resolveStepState(
  spec: TraceSpec,
  index: number,
): Record<string, ViewState>;

// ────────────────────────────────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────────────────────────────────

export interface VisualizationProps {
  spec: TraceSpec;
  mode?: VizMode; // default "animate"
  /** Overrides/extends the default renderers (custom primitives, restyled views). */
  registry?: Partial<ViewRegistry> & Record<string, ViewRenderer<any>>;
  roleToken?: RoleResolver; // default `defaultRoleToken`
  playback?: PlaybackOptions;
  onStepChange?: (index: number, step: Step) => void;
  /** Hide the built-in transport to drive playback from an external control bar. */
  hideTransport?: boolean;
  className?: string;
}

/** The whole panel: stage + caption + transport, wired to one `usePlayback`. */
export declare const Visualization: FC<VisualizationProps>;

export interface StageProps {
  views: ViewDecl[];
  state: Record<string, ViewState>; // resolved (forward-filled) current snapshot
  prev: Record<string, ViewState> | null;
  registry: ViewRegistry;
  roleToken: RoleResolver;
  reducedMotion: boolean;
  mode: VizMode;
}

/** Lays out declared views by `weight` (CSS grid/flex) and renders each via the
 *  registry. Medium is the renderer's choice — BarsView draws SVG, GraphView uses
 *  React Flow, GridView uses a DOM grid — the Stage doesn't care. */
export declare const Stage: FC<StageProps>;

export interface TransportProps {
  playback: Playback;
  compact?: boolean; // default false
  showScrubber?: boolean; // default true
}

/** Reusable play/pause · step · scrub · "n / total" bar (generalized from the mockup). */
export declare const Transport: FC<TransportProps>;

export interface CaptionProps {
  text?: string; // markdown from Step.caption
  mode: VizMode; // "explain" gives it more prominence
}

export declare const Caption: FC<CaptionProps>;

// ────────────────────────────────────────────────────────────────────────────
// Composition example — how the problem page mounts it
// ────────────────────────────────────────────────────────────────────────────

/**
 *   import { Visualization } from "@/renderer/api";
 *
 *   function VizPanel({ trace }: { trace: TraceSpec }) {
 *     const [mode, setMode] = useState<VizMode>("animate");
 *     return (
 *       <section className="viz-panel">
 *         <Segmented value={mode} onChange={setMode} options={["animate", "explain"]} />
 *         <Visualization spec={trace} mode={mode} />
 *       </section>
 *     );
 *   }
 *
 * A view renderer sketch (BarsView — the mockup's emulation, now generic):
 *
 *   const BarsView: ViewRenderer<BarsState> = ({ state, roleToken, reducedMotion }) => {
 *     // scale bars to the stage; draw <rect> per value;
 *     // for each span: a gradient fill from `from`→`to` at height `level`;
 *     // for each marker: a <motion.g layoutId={marker.id}> so L/R glide when index
 *     //   changes; fill via roleToken(marker.role); tweens off when reducedMotion.
 *     return /* <svg>…</svg> */ null as unknown as ReactElement;
 *   };
 *
 * Adding a new primitive (e.g. a DP table) is: define its ViewState in the union,
 * write a `ViewRenderer<DpTableState>`, and `extendRegistry({ dptable: DpTableView })`.
 * No existing code changes — the same reason the AI can target this engine blindly.
 */
