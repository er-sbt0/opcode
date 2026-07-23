import { Code2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelPlaceholder } from "./Panel";

/** Center column: the code editor (Monaco/CodeMirror) plus the run verdict strip. */
export function EditorPanel() {
  return (
    <Panel
      title="Code"
      icon={<Code2 className="size-4 text-muted-foreground" />}
      actions={
        <Button size="sm" disabled className="h-7 gap-1.5">
          <Play className="size-3.5" />
          Run
        </Button>
      }
    >
      <PanelPlaceholder
        label="EditorPanel"
        hint="Monaco / CodeMirror editor with the Python starter mounts here"
      />
      <div className="shrink-0 border-t border-border px-4 py-2 text-xs text-muted-foreground">
        Verdict strip — pass/fail per sample case
      </div>
    </Panel>
  );
}
