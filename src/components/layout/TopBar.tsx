import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Global top bar: wordmark plus (placeholder) primary actions. */
export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight">Prism</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            see concepts run
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled className="gap-1.5">
          <Sparkles className="size-3.5" />
          Generate problem
        </Button>
      </div>
    </header>
  );
}
