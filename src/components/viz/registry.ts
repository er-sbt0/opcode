/**
 * The view registry — maps a view `kind` to its renderer. Adding an emulation
 * primitive is "write a renderer, register it here"; nothing else in the engine
 * changes. Kinds without a real renderer yet fall back to a diagnostic view.
 */

import type { ViewState } from "@/lib/schemas/trace-spec";
import type { ViewRegistry, ViewRenderer } from "./types";
import { BarsView } from "./views/BarsView";
import { ValueView } from "./views/ValueView";
import { FallbackView } from "./views/FallbackView";

// FallbackView accepts the full ViewState union, so it stands in for any kind.
const fallback: ViewRenderer<ViewState> = FallbackView;

export const defaultRegistry: ViewRegistry = {
  bars: BarsView,
  value: ValueView,
  // Later Phase 2 slices: ArrayView + PointerOverlay, GridView, GraphView, TreeView.
  array: fallback,
  grid: fallback,
  graph: fallback,
  tree: fallback,
};

/** Merge custom/override renderers over the defaults (custom primitives, restyles). */
export function extendRegistry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra: Partial<ViewRegistry> & Record<string, ViewRenderer<any>>,
  base: ViewRegistry = defaultRegistry,
): ViewRegistry {
  return { ...base, ...extra };
}

/** Look up a renderer by kind, falling back to the diagnostic view. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rendererFor(registry: ViewRegistry, kind: string): ViewRenderer<any> {
  return registry[kind] ?? fallback;
}
