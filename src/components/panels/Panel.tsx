import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared frame for the workspace panels: a titled header bar over a scrollable
 * body. Panels fill their column on desktop and stack (min-height) on mobile.
 */
export function Panel({
  title,
  icon,
  actions,
  className,
  children,
}: {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className={cn("flex min-h-64 flex-col bg-card md:min-h-0", className)}
    >
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>{title}</span>
        </div>
        {actions ? (
          <div className="flex items-center gap-1">{actions}</div>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </section>
  );
}

/** Dashed placeholder shown until a panel's real content is wired up. */
export function PanelPlaceholder({
  label,
  hint,
}: {
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <div className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {hint ? (
          <p className="max-w-xs text-xs text-muted-foreground/70">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
