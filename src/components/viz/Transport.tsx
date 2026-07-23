"use client";

import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Playback } from "./types";

/**
 * Reusable play / pause · step · scrub · "n / total" bar — the generic version of
 * the mockup's transport. Reads and drives a single `usePlayback`, so the controls
 * and the animation can never disagree.
 */
export function Transport({
  playback,
  showScrubber = true,
}: {
  playback: Playback;
  showScrubber?: boolean;
}) {
  const { index, total, isPlaying, isFirst, isLast } = playback;

  return (
    <div className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-2">
      <div className="flex items-center gap-0.5">
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={playback.restart}
          disabled={isFirst}
          title="Restart"
        >
          <RotateCcw className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={playback.prev}
          disabled={isFirst}
          title="Previous step"
        >
          <SkipBack className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={playback.toggle}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={playback.next}
          disabled={isLast}
          title="Next step"
        >
          <SkipForward className="size-3.5" />
        </Button>
      </div>

      {showScrubber ? (
        <input
          type="range"
          min={0}
          max={Math.max(total - 1, 0)}
          value={index}
          onChange={(e) => playback.seek(Number(e.target.value))}
          aria-label="Scrub steps"
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-[var(--viz-active)]"
        />
      ) : (
        <div className="flex-1" />
      )}

      <span className="text-xs tabular-nums text-muted-foreground">
        {index + 1} / {total}
      </span>
    </div>
  );
}
