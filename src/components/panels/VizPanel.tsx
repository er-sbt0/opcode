import { Eye, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelPlaceholder } from "./Panel";

/** Right column: the interactive emulation, driven by a TraceSpec, with playback controls. */
export function VizPanel() {
  return (
    <Panel
      title="Visualization"
      icon={<Eye className="size-4 text-muted-foreground" />}
    >
      <PanelPlaceholder
        label="VizPanel"
        hint="Generic TraceSpec renderers animate the concept here"
      />
      <div className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-2">
        <div className="flex items-center gap-0.5">
          <Button size="icon" variant="ghost" className="size-7" disabled>
            <SkipBack className="size-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7" disabled>
            <Play className="size-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7" disabled>
            <Pause className="size-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7" disabled>
            <SkipForward className="size-3.5" />
          </Button>
        </div>
        <div className="h-1.5 flex-1 rounded-full bg-muted" aria-hidden />
        <span className="text-xs tabular-nums text-muted-foreground">0 / 0</span>
      </div>
    </Panel>
  );
}
