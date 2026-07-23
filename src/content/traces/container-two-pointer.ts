/**
 * Container With Most Water — the two-pointer scan, as a TraceSpec.
 *
 * This is the mockup's water-fill emulation expressed as *data*: one `bars` view
 * (heights + L/R markers + a water span) and two `value` readouts (current area,
 * best so far). The generic renderer animates it with zero problem-specific code.
 *
 * It is `parseTraceSpec`-validated at module load, and the frame data below is
 * exactly what `max_area` computes on the example input — the same numbers the
 * instrumented reference solution will emit for free in Phase 3 (roadmap #3). It
 * is authored by hand only until that tracer lands.
 */

import { parseTraceSpec, type Step } from "@/lib/schemas/trace-spec";

const HEIGHT = [1, 8, 6, 2, 5, 4, 8, 3, 7];

/** One iteration of the scan: pointers, the area they bound, and the running best. */
interface Frame {
  l: number;
  r: number;
  area: number;
  best: number;
  deltaBest?: number; // set only on the step where `best` improves
  caption: string;
}

// Walking [1,8,6,2,5,4,8,3,7] inward, always advancing the shorter wall.
const frames: Frame[] = [
  {
    l: 0, r: 8, area: 8, best: 8, deltaBest: 8,
    caption:
      "**L=0** (height 1) · **R=8** (height 7). Water can't rise above the shorter " +
      "wall (1), so this holds **1 × 8 = 8**. The left wall is shorter — move **L →** inward.",
  },
  {
    l: 1, r: 8, area: 49, best: 49, deltaBest: 41,
    caption:
      "**L=1** (height 8) · **R=8** (height 7). Limited by 7 → **7 × 7 = 49**, a new " +
      "best. The right wall is now the shorter one — move **← R**.",
  },
  {
    l: 1, r: 7, area: 18, best: 49,
    caption:
      "**L=1** (8) · **R=7** (3). Only **3 × 6 = 18** — the short right wall caps it. " +
      "Move **← R** again.",
  },
  {
    l: 1, r: 6, area: 40, best: 49,
    caption:
      "**L=1** (8) · **R=6** (8). Two tall walls, but narrower: **8 × 5 = 40**. Still " +
      "short of 49. Walls tie, so move **← R**.",
  },
  {
    l: 1, r: 5, area: 16, best: 49,
    caption: "**L=1** (8) · **R=5** (4). **4 × 4 = 16**. Move **← R**.",
  },
  {
    l: 1, r: 4, area: 15, best: 49,
    caption: "**L=1** (8) · **R=4** (5). **5 × 3 = 15**. Move **← R**.",
  },
  {
    l: 1, r: 3, area: 4, best: 49,
    caption: "**L=1** (8) · **R=3** (2). **2 × 2 = 4**. Move **← R**.",
  },
  {
    l: 1, r: 2, area: 6, best: 49,
    caption:
      "**L=1** (8) · **R=2** (6). **6 × 1 = 6**. Next move brings the pointers " +
      "together — the scan ends.",
  },
];

/** Turn a frame into a Step: bars with L/R markers + the water span, plus readouts. */
function toStep(f: Frame): Step {
  const level = Math.min(HEIGHT[f.l], HEIGHT[f.r]);
  return {
    caption: f.caption,
    state: {
      bars: {
        kind: "bars",
        values: HEIGHT,
        markers: [
          { id: "L", label: "L", index: f.l, role: "active" },
          { id: "R", label: "R", index: f.r, role: "active" },
        ],
        spans: [
          {
            from: f.l,
            to: f.r,
            role: "window",
            level,
            label: `${level} × ${f.r - f.l} = ${f.area}`,
          },
        ],
      },
      area: { kind: "value", value: f.area },
      best: {
        kind: "value",
        value: f.best,
        role: "result",
        ...(f.deltaBest ? { delta: f.deltaBest } : {}),
      },
    },
  };
}

// Iteration steps, then a summary frame that lights up the winning container.
const steps: Step[] = [
  ...frames.map(toStep),
  {
    caption:
      "**Done — 8 steps, O(n).** The widest *useful* container wins: lines **1** and " +
      "**8** hold **49**. Always advancing the shorter wall skips every container that " +
      "couldn't beat it, so we never test the O(n²) rest.",
    state: {
      bars: {
        kind: "bars",
        values: HEIGHT,
        markers: [
          { id: "L", label: "L", index: 1, role: "result" },
          { id: "R", label: "R", index: 8, role: "result" },
        ],
        spans: [{ from: 1, to: 8, role: "result", level: 7, label: "MAX = 49" }],
      },
      area: { kind: "value", value: 49 },
      best: { kind: "value", value: 49, role: "result" },
    },
  },
];

export const containerTwoPointerTrace = parseTraceSpec({
  schemaVersion: 1,
  id: "container-two-pointer",
  title: "Container With Most Water — two pointers",
  algorithm: "two-pointer scan",
  meta: { generatedFrom: "height=[1,8,6,2,5,4,8,3,7]", derivedFromSolution: false },
  views: [
    { id: "bars", kind: "bars", label: "height", weight: 3 },
    { id: "area", kind: "value", label: "Current area", weight: 1 },
    { id: "best", kind: "value", label: "Best so far", weight: 1 },
  ],
  steps,
});
