"use client";

import { cn } from "@/lib/utils";
import type { BarsState, Role } from "@/lib/schemas/trace-spec";
import type { ViewRenderProps } from "../types";

/** Reserve space at the top for marker pills so tall bars never hide them. */
const MARKER_LANE = 30; // px

/**
 * BarsView — the mockup's water-fill emulation, now generic. Bars are laid out on
 * a shared percentage grid so markers (L/R) and spans (the water) align exactly and
 * glide via CSS transitions when motion is allowed. Content is presentation-free:
 * every color comes from `roleToken`.
 */
export function BarsView({
  state,
  roleToken,
  reducedMotion,
}: ViewRenderProps<BarsState>) {
  const { values, markers = [], spans = [], cellRoles } = state;
  const n = values.length;
  const colW = n > 0 ? 100 / n : 100;

  const spanLevels = spans.map((s) => s.level ?? 0);
  const max = Math.max(...values, ...spanLevels, 1);
  const ceil = max * 1.12; // headroom so bars don't touch the marker lane
  const heightPct = (v: number) => `${(v / ceil) * 100}%`;

  const move = reducedMotion ? "" : "transition-all duration-500 ease-out";
  const cellRole = (i: number): Role => cellRoles?.[i] ?? "default";

  return (
    <div className="relative h-full min-h-40 w-full select-none">
      <div
        className="absolute inset-x-1 bottom-0"
        style={{ top: MARKER_LANE }}
      >
        {/* Bars — the wrapper carries the height so the fill has a box to fill. */}
        {values.map((v, i) => (
          <div
            key={i}
            className={cn("absolute bottom-0", move)}
            style={{
              left: `${i * colW}%`,
              width: `${colW}%`,
              height: heightPct(v),
              minHeight: 2,
            }}
          >
            <div
              className="h-full rounded-t-[3px] bg-[var(--bar)]"
              style={
                {
                  marginLeft: 2,
                  marginRight: 2,
                  "--bar": roleToken(cellRole(i)),
                } as React.CSSProperties
              }
            />
            <span className="absolute inset-x-0 -bottom-5 text-center text-[10px] tabular-nums text-muted-foreground">
              {v}
            </span>
          </div>
        ))}

        {/* Spans (the translucent water fill) */}
        {spans.map((s, i) => {
          const left = Math.min(s.from, s.to);
          const cols = Math.abs(s.to - s.from) + 1;
          const color = roleToken(s.role ?? "window");
          return (
            <div
              key={`span-${i}`}
              className={cn("absolute bottom-0 rounded-t-[3px] border-t-2", move)}
              style={{
                left: `${left * colW}%`,
                width: `${cols * colW}%`,
                height: heightPct(s.level ?? max),
                backgroundColor: color,
                borderTopColor: color,
                opacity: 0.22,
              }}
            />
          );
        })}

        {/* Span labels — drawn separately at the waterline so they stay crisp. */}
        {spans.map((s, i) =>
          s.label ? (
            <div
              key={`label-${i}`}
              className={cn(
                "pointer-events-none absolute z-10 flex justify-center",
                move,
              )}
              style={{
                left: `${Math.min(s.from, s.to) * colW}%`,
                width: `${(Math.abs(s.to - s.from) + 1) * colW}%`,
                bottom: heightPct(s.level ?? max),
              }}
            >
              <span className="-translate-y-1/2 whitespace-nowrap rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium tabular-nums text-foreground shadow-sm">
                {s.label}
              </span>
            </div>
          ) : null,
        )}

        {/* Markers (L / R pointers) */}
        {markers.map((m) => {
          const color = roleToken(m.role ?? "active");
          return (
            <div
              key={m.id}
              className={cn("absolute top-0 bottom-0 z-10", move)}
              style={{ left: `${(m.index + 0.5) * colW}%` }}
            >
              <div className="absolute inset-y-0 -left-px w-0 border-l border-dashed" style={{ borderColor: color }} />
              <span
                className="absolute left-0 -translate-x-1/2 rounded px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow"
                style={{ top: -(MARKER_LANE - 6), backgroundColor: color }}
              >
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
