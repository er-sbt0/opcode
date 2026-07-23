# Prism — Roadmap

> **Working name:** Prism · **Owner:** solo, full-time · **Status:** pre-MVP
>
> An algorithm-practice platform whose differentiator is *seeing* concepts run —
> AI-generated exercises paired with beautiful, interactive visualizations and emulations.

---

## Vision

Anyone can ask for a problem on a topic and get a well-formed exercise **plus** a
gorgeous, interactive explanation of the concept behind it. The web experience —
UI, visualizations, illustrations, interactive emulations — *is* the product.

The MVP target: a self-contained web app where you can **open an AI-generated
problem, watch a beautiful interactive emulation of the concept, and write & run
code in the browser** — with everything driven by a generic content engine, so no
two problems require bespoke code. No real users yet; ship, then keep improving design.

---

## Guiding principles

1. **Move vertically.** Every phase is a thin end-to-end slice you can demo and
   improve — never a horizontal layer that only pays off later.
2. **Content is data, never hardcoded.** Problems and visualizations are
   schema-driven. Adding (or AI-generating) a problem means adding *data*, not
   writing a new React component. This is what keeps us un-bound to any specific
   generated examples and free to iterate fast.
3. **Derive visuals by executing solutions.** A visualization is the *trace* of a
   reference solution running — captured as data — not hand-authored per problem.
   Correctness comes for free and scales to any generated content.
4. **Design & interactivity are the moat.** Invest craft there. For everything
   that isn't the differentiator (execution infra, auth later), use hosted /
   off-the-shelf tools.
5. **Iterate fast, deploy always.** Short phases, continuous deploy. No real-user
   constraints to slow us down — optimize for learning speed.
6. **Defer heavy infra until the differentiator is proven.** Hardened multi-language
   judging, accounts, and community come *after* the AI + visualization loop works.

---

## Architectural spine

Two schemas are the backbone. Everything consumes them; the AI produces them.

```
                ┌─────────────────────────────────────────────┐
   AI generator │  ProblemSpec (content)   TraceSpec (visuals) │  hand-authored
   ───────────► │  { statement, examples,  { steps: [ state,   │ ◄───────────────
                │    constraints, tags,      state, ... ] }     │  (early on)
                │    starterCode, tests }                       │
                └───────────────┬─────────────────┬─────────────┘
                                │                 │
                     ┌──────────▼──────┐  ┌───────▼────────────┐
                     │ Problem renderer │  │ Visualization      │
                     │ + in-browser run │  │ engine (generic    │
                     │ (Pyodide)        │  │ emulation players) │
                     └──────────────────┘  └────────────────────┘
```

- **`ProblemSpec`** — one JSON shape describes any problem. The UI renders it; the
  editor runs against its tests.
- **`TraceSpec`** — the "algorithm trace as data" DSL: an ordered list of states
  (arrays, pointers, graphs, trees, grids, bars). Generic renderers animate it.
- Because both are **data**, the same engine serves a hand-written problem and an
  AI-generated one identically. We are never bound to specific content.

---

## Phases

Rough solo/full-time pacing. Dates are targets to move fast against, not promises.
MVP is reached at the end of **Phase 3**.

### Phase 0 — Foundation & design system  ·  ~1 week
Turn the mockup into a real, componentized shell.

- [ ] Scaffold: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- [ ] Design tokens from the mockup: color (light + dark), type scale, spacing, motion, radii
- [ ] Extract mockup into real components: `TopBar`, `ProblemPanel`, `EditorPanel`, `VizPanel`, 3-column layout
- [ ] Storybook for building/documenting components in isolation
- [ ] Deploy the empty shell to Vercel — the pipeline is live from day one

**Ships:** a polished, themeable app shell on a public URL.

### Phase 1 — First vertical slice (hand-authored content)  ·  ~1 week
One real problem, end-to-end, flowing through the *generic* engine.

- [x] Define **`ProblemSpec` v0** (statement, examples, constraints, tags, difficulty, starterCode, tests)
- [x] Render one problem (**Container With Most Water**) entirely from its JSON — no hardcoded copy in components
- [x] Wire the code editor (Monaco or CodeMirror 6) with the Python starter
- [x] **Pyodide in-browser run**: execute user code against sample cases → pass/fail verdict strip
- [ ] Deploy

**Ships:** a working, data-driven problem you can actually solve in the browser.
Content is hand-written JSON, but it proves the spine — the component tree never
knows *which* problem it's showing.

### Phase 2 — Visualization & emulation engine  ·  ~2 weeks
The differentiator's engine. This is where the craft budget goes.

- [ ] Define **`TraceSpec`** DSL (steps × state; primitives: array, pointers, bars, grid, graph, tree)
- [ ] Build generic renderers that consume it:
  - [ ] `ArrayView` + `PointerOverlay` (two-pointer, sliding-window)
  - [ ] `BarField` / water-fill (the mockup's viz, now generic)
  - [ ] `GraphView` (React Flow) and `TreeView`
  - [ ] `GridView` (BFS/DFS on a grid)
- [ ] Reusable **playback component**: play / step / scrub / per-step caption (already prototyped in the mockup)
- [ ] Author 3–4 problems spanning different primitives to prove genericity
- [ ] Motion pass with Framer Motion; respect `prefers-reduced-motion`

**Ships:** any problem with a `TraceSpec` gets a beautiful interactive emulation
for free. This is the product's soul, working.

### Phase 3 — AI generation pipeline  ·  ~2 weeks  → **MVP**
Un-bind content from hand-authoring.

- [ ] Anthropic API (Claude, structured output) → generate `{ statement, referenceSolution, tests }` matching `ProblemSpec`
- [ ] **Validation loop:** execute the reference solution against generated tests (Pyodide) → accept only if it passes; auto-repair / regenerate on failure. *Never publish an unverified problem.*
- [ ] **Derive the `TraceSpec` by running the instrumented reference solution** — not by asking the model to hand-write the trace. Correct visuals for any generated problem.
- [ ] "Generate a problem on topic ___" UI flow (topic → loading → rendered problem + emulation)
- [ ] Deploy

**Ships — MVP:** request a topic → get a verified problem + a correct interactive
emulation + in-browser run, all through one generic engine. 🎯

### Phase 4 — Iterate on design, illustration & interactivity  ·  ongoing
The "then improve design" phase. Continuous, no fixed end.

- [ ] Illustration system (Lottie / bespoke SVG) — a consistent visual language
- [ ] "Explain mode": a guided, teaching walkthrough distinct from raw animate mode
- [ ] More emulation primitives (recursion trees, DP tables, heaps, linked lists)
- [ ] Onboarding, empty / loading / error states, micro-interactions
- [ ] Topic browser / library view; "generate similar" and "regenerate at difficulty"
- [ ] Theme and typography refinement; self-hosted display font for more character

---

## Explicitly deferred (not now)

Cut from MVP on purpose — revisit only after the differentiator lands.

- **Accounts, auth, progress, streaks, profiles** — no real users yet.
- **Hardened multi-language judging (C / Rust / Go)** — MVP runs Python in-browser
  via Pyodide. When compiled languages are needed, add a **hosted judge**
  (Judge0 CE / Piston) before ever operating our own sandbox.
- **Leaderboards, social, comments, community content.**
- **Difficulty calibration, spaced repetition, learning paths.**
- **Mobile app, SEO/public problem pages, monetization.**

---

## Stack (decided)

| Concern | Choice | Notes |
|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind | SSR-ready, rich ecosystem |
| UI kit | shadcn/ui + Radix | own the components, push past the default look |
| Editor | Monaco or CodeMirror 6 | CodeMirror if mobile/lightweight matters |
| Visualization | D3 · React Flow · SVG/Canvas | consumed via the `TraceSpec` engine |
| Motion | Framer Motion | step transitions, micro-interactions |
| Code execution (MVP) | **Pyodide** (Python, in-browser) | zero execution infra |
| Code execution (later) | Judge0 CE / Piston (hosted) | for C/Rust/Go, when needed |
| AI generation | Anthropic API (Claude) | structured output → validated JSON |
| Data (when needed) | Postgres (Supabase/Neon) + pgvector | dedup & topic search; not required for MVP |
| Hosting | Vercel | frontend; workers elsewhere if/when judging is added |

---

## Definition of "MVP done"

A stranger (in principle) could:

1. Type a topic and get a **verified** AI-generated problem.
2. See a **correct, beautiful, interactive emulation** of the concept.
3. Write and **run Python in the browser** against the problem's tests.
4. …with *every* problem flowing through one generic engine — zero per-problem code.

No accounts, no server judge, no real traffic required.

---

## Risks & how the architecture retires them

| Risk | Mitigation |
|---|---|
| AI generates plausible-but-wrong problems | Validation loop executes the reference solution against tests before publishing |
| Visualizations don't scale past a few hand-made ones | `TraceSpec` DSL + generic renderers; visuals derived from executing solutions |
| Getting bound to specific content / rewrites per problem | Everything is schema-driven data; components never know the specific problem |
| Solo scope creep | Deferred list is explicit; heavy infra (judging, auth) postponed until differentiator is proven |
| Compiled-language execution complexity | Python-in-browser for MVP; hosted judge (not self-run) only when C/Rust/Go are actually needed |
