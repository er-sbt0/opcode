/**
 * The visualization engine — one generic component tree that animates any
 * TraceSpec. Add an emulation primitive by registering a view renderer; nothing
 * that consumes a trace ever branches on the specific problem.
 */

export { Visualization, type VisualizationProps } from "./Visualization";
export { Stage, type StageProps } from "./Stage";
export { Transport } from "./Transport";
export { Caption } from "./Caption";
export { usePlayback, resolveStepState } from "./playback";
export {
  defaultRegistry,
  extendRegistry,
  rendererFor,
} from "./registry";
export { ROLE_TOKENS, defaultRoleToken } from "./roles";
export type {
  VizMode,
  RoleResolver,
  ViewRenderProps,
  ViewRenderer,
  ViewRegistry,
  PlaybackOptions,
  Playback,
} from "./types";
