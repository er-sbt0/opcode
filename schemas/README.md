# Schemas — the architectural spine

Two data shapes that everything in the product speaks. See `roadmap.md` →
"Architectural spine" for the why. The rule: **problems and visualizations are
data, never hardcoded** — so the UI, the AI generator, and the run harness all
work against these two contracts, and adding content never means writing code.

| File | Shape | Role |
|---|---|---|
| [`problem-spec.ts`](./problem-spec.ts) | `ProblemSpec` | Everything about an exercise: statement, examples, constraints, function signature, starter/reference code, tests, provenance. The UI renders it; the harness runs against it; the AI produces it. |
| [`trace-spec.ts`](./trace-spec.ts) | `TraceSpec` | The "algorithm trace as data" DSL: ordered steps × view snapshots (array / bars / grid / graph / tree / scalar). Generic renderers animate it. |

## How they connect

```
ProblemSpec.visualization ──▶ TraceSpec
        (mode: "ref" | "inline" | "derived")
```

Prefer `mode: "derived"`: the `TraceSpec` is **produced by running the instrumented
reference solution** (see the tracer sketch at the bottom of `trace-spec.ts`), so
the visualization is correct by construction for any generated problem.

## Conventions

- **Content, not presentation.** Traces name semantic `Role`s (`active`, `window`,
  `result`); the renderer maps roles → design tokens. No colors in the data.
- **Stable identity.** Markers/nodes/edges carry ids so the renderer can tween them
  between steps (the gliding pointers in the mockup).
- **Runtime validation.** These interfaces become Zod schemas in app code, so the
  same shapes validate AI-generated JSON before the verification gate runs.

## Status

Draft v1 (`schemaVersion: 1`). Both files include a worked **Container With Most
Water** example — the exact problem and emulation from the design mockup, expressed
purely as data.
