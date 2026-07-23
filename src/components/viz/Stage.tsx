"use client";

import type { ViewDecl, ViewState } from "@/lib/schemas/trace-spec";
import type { RoleResolver, ViewRegistry, VizMode } from "./types";
import { rendererFor } from "./registry";

/** Scalar readouts sit in a compact row; everything else fills the main area. */
const SCALAR_KINDS = new Set(["value"]);

export interface StageProps {
  views: ViewDecl[];
  state: Record<string, ViewState>; // resolved (forward-filled) current snapshot
  prev: Record<string, ViewState> | null;
  registry: ViewRegistry;
  roleToken: RoleResolver;
  reducedMotion: boolean;
  mode: VizMode;
}

/**
 * Lays out the declared views: primary views (bars/array/grid/graph/tree) share the
 * main area weighted by `weight`, scalar readouts line up beneath. Each view is
 * drawn by its registered renderer — the Stage never knows the medium.
 */
export function Stage({
  views,
  state,
  prev,
  registry,
  roleToken,
  reducedMotion,
  mode,
}: StageProps) {
  const primary = views.filter((v) => !SCALAR_KINDS.has(v.kind));
  const scalars = views.filter((v) => SCALAR_KINDS.has(v.kind));

  const render = (decl: ViewDecl) => {
    const View = rendererFor(registry, decl.kind);
    const snapshot = state[decl.id];
    if (!snapshot) return null;
    return (
      <View
        state={snapshot as never}
        prev={(prev?.[decl.id] ?? null) as never}
        decl={decl}
        roleToken={roleToken}
        reducedMotion={reducedMotion}
        mode={mode}
      />
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {primary.length > 0 ? (
        <div className="flex min-h-0 flex-1 gap-4">
          {primary.map((decl) => (
            <div
              key={decl.id}
              className="flex min-w-0 flex-col"
              style={{ flex: decl.weight ?? 1 }}
            >
              {decl.label ? (
                <span className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {decl.label}
                </span>
              ) : null}
              <div className="min-h-0 flex-1">{render(decl)}</div>
            </div>
          ))}
        </div>
      ) : null}

      {scalars.length > 0 ? (
        <div className="grid shrink-0 gap-3" style={gridCols(scalars.length)}>
          {scalars.map((decl) => (
            <div key={decl.id}>{render(decl)}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function gridCols(n: number): React.CSSProperties {
  return { gridTemplateColumns: `repeat(${Math.min(n, 4)}, minmax(0, 1fr))` };
}
