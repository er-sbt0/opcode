"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Step, TraceSpec } from "@/lib/schemas/trace-spec";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type {
  PlaybackOptions,
  RoleResolver,
  ViewRegistry,
  ViewRenderer,
  VizMode,
} from "./types";
import { defaultRoleToken } from "./roles";
import { defaultRegistry, extendRegistry } from "./registry";
import { resolveStepState, usePlayback } from "./playback";
import { Stage } from "./Stage";
import { Caption } from "./Caption";
import { Transport } from "./Transport";

export interface VisualizationProps {
  spec: TraceSpec;
  mode?: VizMode; // default "animate"
  /** Overrides/extends the default renderers (custom primitives, restyled views). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registry?: Partial<ViewRegistry> & Record<string, ViewRenderer<any>>;
  roleToken?: RoleResolver; // default `defaultRoleToken`
  playback?: PlaybackOptions;
  onStepChange?: (index: number, step: Step) => void;
  /** Hide the built-in transport to drive playback from an external control bar. */
  hideTransport?: boolean;
  className?: string;
}

/**
 * The whole emulation: stage + caption + transport, wired to one `usePlayback`.
 * Generic over any TraceSpec — there is no per-problem code here.
 */
export function Visualization({
  spec,
  mode = "animate",
  registry,
  roleToken = defaultRoleToken,
  playback: playbackOpts,
  onStepChange,
  hideTransport = false,
  className,
}: VisualizationProps) {
  const reducedMotion = useReducedMotion();
  const resolvedRegistry = useMemo(
    () => (registry ? extendRegistry(registry) : defaultRegistry),
    [registry],
  );
  const pb = usePlayback(spec, playbackOpts);

  const state = useMemo(
    () => resolveStepState(spec, pb.index),
    [spec, pb.index],
  );
  const prev = useMemo(
    () => (pb.index > 0 ? resolveStepState(spec, pb.index - 1) : null),
    [spec, pb.index],
  );

  useEffect(() => {
    onStepChange?.(pb.index, pb.step);
  }, [pb.index, pb.step, onStepChange]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="min-h-0 flex-1 overflow-hidden p-4">
        <Stage
          views={spec.views}
          state={state}
          prev={prev}
          registry={resolvedRegistry}
          roleToken={roleToken}
          reducedMotion={reducedMotion}
          mode={mode}
        />
      </div>
      <Caption text={pb.step.caption} mode={mode} />
      {!hideTransport ? <Transport playback={pb} /> : null}
    </div>
  );
}
