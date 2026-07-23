# Renderer — the visualization engine

One generic component tree animates any [`TraceSpec`](../schemas/trace-spec.ts).
No per-problem code: new emulation primitives are *registered*, not branched on.
See [`api.ts`](./api.ts) for the full contract.

```
<Visualization spec>            orchestrator — owns playback (usePlayback)
  ├─ <Stage>                    lays out declared views by weight
  │    └─ registry[kind] → View one renderer per view snapshot
  ├─ <Caption>                  per-step markdown narration
  └─ <Transport>                play / step / scrub (from the mockup)
```

## Key contracts

| Piece | Contract |
|---|---|
| `usePlayback(spec)` | Headless step/timer state. Honors `prefers-reduced-motion`; `Stage` and `Transport` share one instance so UI and animation never drift. |
| `ViewRenderer<S>` | `(state, prev, decl, roleToken, reducedMotion, mode) → element`. `prev` enables tweening + delta emphasis. Each renderer picks its own medium (SVG, React Flow, DOM grid). |
| `ViewRegistry` | Open map `kind → renderer`. Built-ins are typed; unknown kinds fall back to a placeholder. Extend via `extendRegistry`. |
| `roleToken` | Resolves semantic `Role` → CSS var. Content stays presentation-free; theming is token-only. |

## Why it's built this way

- **Add a primitive without touching existing code** — define its `ViewState`,
  write a `ViewRenderer`, `extendRegistry({ dptable: DpTableView })`. This is the
  same property that lets the AI generator target the engine blindly.
- **Restyle without touching content** — every color comes from `roleToken` → CSS
  vars, so Phase 4 design iteration lives entirely in the token layer.
- **Playback is headless** — drive it from the built-in `Transport` or an external
  control bar (`hideTransport`), same state either way.

## Status

Draft API only — signatures and contracts, no implementations yet. Build order in
Phase 2 (see `roadmap.md`): `bars` → `array` → `grid` → `graph`/`tree`, with the
shared `Transport`/`Caption`/`usePlayback` first.
