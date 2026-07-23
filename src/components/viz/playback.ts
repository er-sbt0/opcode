"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Step, TraceSpec, ViewState } from "@/lib/schemas/trace-spec";
import type { Playback, PlaybackOptions } from "./types";

const DEFAULT_SPEED = 1100; // ms per step

/**
 * Effective per-view state at `index`, forward-filling any view a step omits (a
 * Step may provide a subset; omitted views hold their last value). Pure — safe to
 * memoize.
 */
export function resolveStepState(
  spec: TraceSpec,
  index: number,
): Record<string, ViewState> {
  const upto = Math.min(Math.max(index, 0), spec.steps.length - 1);
  const resolved: Record<string, ViewState> = {};
  for (let i = 0; i <= upto; i++) {
    const state = spec.steps[i]?.state;
    if (!state) continue;
    for (const key of Object.keys(state)) {
      resolved[key] = state[key];
    }
  }
  return resolved;
}

/**
 * Owns the timer and step index. Advances on a self-scheduling timeout while
 * playing, honors `loop`, and clears its timer on unmount. Both Transport and
 * Stage read from the same Playback, so the UI and the animation never drift.
 */
export function usePlayback(
  spec: TraceSpec,
  opts: PlaybackOptions = {},
): Playback {
  const total = spec.steps.length;
  const clamp = useCallback(
    (i: number) => Math.min(Math.max(i, 0), total - 1),
    [total],
  );

  const [index, setIndex] = useState(() => clamp(opts.initialStep ?? 0));
  const [isPlaying, setIsPlaying] = useState(opts.autoPlay ?? false);
  const [speed, setSpeedState] = useState(opts.speed ?? DEFAULT_SPEED);
  const loop = opts.loop ?? false;

  const isFirst = index <= 0;
  const isLast = index >= total - 1;

  // Self-scheduling advance: re-arms whenever index/speed/playing changes. At the
  // last frame it either loops back or stops — the stop runs in a timeout callback,
  // never synchronously in the effect body.
  useEffect(() => {
    if (!isPlaying) return;
    if (index >= total - 1) {
      if (loop) {
        const t = setTimeout(() => setIndex(0), speed);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setIsPlaying(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIndex((i) => i + 1), speed);
    return () => clearTimeout(t);
  }, [isPlaying, index, speed, total, loop]);

  const play = useCallback(() => {
    // Restart from the top if we're parked on the last frame.
    setIndex((i) => (i >= total - 1 ? 0 : i));
    setIsPlaying(true);
  }, [total]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => {
    setIsPlaying((p) => {
      if (!p) setIndex((i) => (i >= total - 1 ? 0 : i));
      return !p;
    });
  }, [total]);
  const next = useCallback(() => {
    setIsPlaying(false);
    setIndex((i) => clamp(i + 1));
  }, [clamp]);
  const prev = useCallback(() => {
    setIsPlaying(false);
    setIndex((i) => clamp(i - 1));
  }, [clamp]);
  const seek = useCallback(
    (i: number) => {
      setIsPlaying(false);
      setIndex(clamp(i));
    },
    [clamp],
  );
  const restart = useCallback(() => {
    setIsPlaying(false);
    setIndex(0);
  }, []);
  const setSpeed = useCallback((ms: number) => setSpeedState(ms), []);

  // Keep index valid if the spec (and thus `total`) changes underneath us.
  const specId = spec.id;
  const lastSpecId = useRef(specId);
  useEffect(() => {
    if (lastSpecId.current !== specId) {
      lastSpecId.current = specId;
      setIndex(0);
      setIsPlaying(opts.autoPlay ?? false);
    }
  }, [specId, opts.autoPlay]);

  const step: Step = useMemo(
    () => ({
      caption: spec.steps[index]?.caption,
      state: resolveStepState(spec, index),
    }),
    [spec, index],
  );

  return {
    index,
    step,
    total,
    isPlaying,
    isFirst,
    isLast,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    restart,
    speed,
    setSpeed,
  };
}
