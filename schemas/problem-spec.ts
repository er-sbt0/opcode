/**
 * ProblemSpec — the canonical, data-driven description of a single exercise.
 *
 * This is one half of the architectural spine (see roadmap.md → "Architectural
 * spine"). The UI renders a problem *entirely* from this object, and the AI
 * generator produces one of these. Components never know which problem they show,
 * so adding or generating a problem is data, not code.
 *
 * Format note: these are TypeScript interfaces for readability + review. In the
 * codebase they become Zod schemas so the same shape validates AI-generated JSON
 * at runtime (see the `ProblemSpecZ` sketch at the bottom).
 */

// ────────────────────────────────────────────────────────────────────────────
// Primitives
// ────────────────────────────────────────────────────────────────────────────

/** Any JSON-serializable value. Used for test inputs/outputs. */
export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [k: string]: Json };

export type Difficulty = "easy" | "medium" | "hard";

/** Languages we can present. MVP executes only `python` (in-browser via Pyodide);
 *  the rest are authored ahead of the hosted judge landing (see roadmap). */
export type Language = "python" | "c" | "rust" | "go";

/**
 * A structural type for a function parameter or return value. Drives three things
 * from one declaration: (1) generated starter code, (2) how the run harness passes
 * test inputs, (3) how the tracer knows what it's visualizing.
 */
export type TypeRef =
  | { kind: "int" }
  | { kind: "float" }
  | { kind: "bool" }
  | { kind: "string" }
  | { kind: "array"; of: TypeRef }
  | { kind: "matrix"; of: TypeRef }
  | { kind: "tree"; valueType: TypeRef } // serialized as level-order array w/ nulls
  | { kind: "graph"; directed: boolean } // serialized as { nodes, edges }
  | { kind: "listnode"; valueType: TypeRef };

// ────────────────────────────────────────────────────────────────────────────
// Entry point / harness
// ────────────────────────────────────────────────────────────────────────────

export interface Param {
  name: string; // must match the keys used in TestCase.input
  type: TypeRef;
}

/**
 * How to call the user's solution. The run harness serializes each TestCase.input
 * according to these params, invokes `entry`, then compares against `expected`.
 */
export interface FunctionSignature {
  entry: string; // function/method name, e.g. "max_area"
  params: Param[];
  returns: TypeRef;
}

// ────────────────────────────────────────────────────────────────────────────
// Examples, tests, verification
// ────────────────────────────────────────────────────────────────────────────

/** A worked example shown in the problem statement (always visible). */
export interface Example {
  input: Record<string, Json>; // keyed by Param.name
  output: Json;
  explanation?: string; // markdown
}

export type CompareMode =
  | "exact" //   deep-equal
  | "float" //   numeric within epsilon
  | "unordered" //   arrays equal ignoring order
  | "set" //   arrays equal as sets (dedup + ignore order)
  | "any-solution"; // multiple valid answers → validated by a checker fn, not equality

/** A single graded test case. `hidden` cases are used for scoring but never shown. */
export interface TestCase {
  name?: string;
  input: Record<string, Json>; // keyed by Param.name
  expected: Json;
  hidden?: boolean; // default false
  compare?: { mode: CompareMode; epsilon?: number }; // default { mode: "exact" }
}

/**
 * Provenance + the verification gate. A problem is only publishable once its
 * reference solution has passed every test (roadmap principle: never publish an
 * unverified AI problem).
 */
export interface Origin {
  kind: "authored" | "ai-generated";
  topic?: string; // the concept the user asked for, e.g. "two pointers"
  model?: string; // e.g. "claude-opus-4-8" (when ai-generated)
  verified: boolean; // reference solution passed all tests?
  verifiedAt?: string; // ISO timestamp
}

// ────────────────────────────────────────────────────────────────────────────
// Visualization binding
// ────────────────────────────────────────────────────────────────────────────

/**
 * How this problem gets its interactive emulation. Prefer `derived`: the visual is
 * the *trace of the reference solution executing* (roadmap principle #3), so it is
 * correct for free and scales to any generated content.
 */
export type VisualizationBinding =
  | { mode: "ref"; traceId: string } //     points to a stored TraceSpec
  | { mode: "inline"; trace: import("./trace-spec").TraceSpec } // embedded
  | { mode: "derived"; recipe: TraceRecipe }; //  produced by instrumenting the solution

/**
 * Instructions for generating a TraceSpec by running the instrumented reference
 * solution against one representative input. Fleshed out in Phase 3; kept light here.
 */
export interface TraceRecipe {
  /** Which input to visualize (usually a small, illustrative case). */
  input: Record<string, Json>;
  /** Language whose instrumented reference solution emits the trace. */
  language: Language;
  /** Cap so a visualization never explodes; the tracer stops emitting past this. */
  maxSteps?: number; // default 60
}

// ────────────────────────────────────────────────────────────────────────────
// The spec
// ────────────────────────────────────────────────────────────────────────────

export interface ProblemSpec {
  schemaVersion: 1;
  id: string; // stable uuid
  slug: string; // url-safe, e.g. "container-with-most-water"
  title: string;
  difficulty: Difficulty;
  topics: string[]; // e.g. ["two-pointers", "array", "greedy"]

  statement: string; // markdown; the prose the solver reads
  examples: Example[];
  constraints: string[]; // rendered as a list, e.g. "2 <= n <= 1e5"
  hints?: string[]; // progressively revealed

  signature: FunctionSignature;
  starterCode: Partial<Record<Language, string>>;
  referenceSolution?: Partial<Record<Language, string>>; // hidden from the client
  tests: TestCase[];

  visualization?: VisualizationBinding;

  origin: Origin;
  createdAt: string; // ISO timestamp
}

// ────────────────────────────────────────────────────────────────────────────
// Worked example — the problem from the mockup, fully data-driven.
// ────────────────────────────────────────────────────────────────────────────

export const containerWithMostWater: ProblemSpec = {
  schemaVersion: 1,
  id: "b0d2…", // uuid in practice
  slug: "container-with-most-water",
  title: "Container With Most Water",
  difficulty: "medium",
  topics: ["two-pointers", "array", "greedy"],

  statement: [
    "You are given an integer array `height` of length `n`. Each value draws a",
    "vertical line from `(i, 0)` to `(i, height[i])`.",
    "",
    "Pick two lines that, with the x-axis, form a container holding the **most",
    "water**. Return that maximum area. You may not slant the container.",
  ].join("\n"),

  examples: [
    {
      input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
      output: 49,
      explanation:
        "Lines at index 1 and 8 (heights 8 and 7) bound the widest useful " +
        "container: `min(8, 7) × (8 − 1) = 49`.",
    },
  ],

  constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
  hints: [
    "Start with the widest container and walk inward.",
    "Only the shorter of the two walls limits the area — move that one.",
  ],

  signature: {
    entry: "max_area",
    params: [{ name: "height", type: { kind: "array", of: { kind: "int" } } }],
    returns: { kind: "int" },
  },

  starterCode: {
    python:
      "class Solution:\n" +
      "    def max_area(self, height: list[int]) -> int:\n" +
      "        # your code here\n" +
      "        pass\n",
  },

  referenceSolution: {
    python:
      "class Solution:\n" +
      "    def max_area(self, height: list[int]) -> int:\n" +
      "        left, right, best = 0, len(height) - 1, 0\n" +
      "        while left < right:\n" +
      "            span = min(height[left], height[right])\n" +
      "            best = max(best, span * (right - left))\n" +
      "            if height[left] < height[right]:\n" +
      "                left += 1\n" +
      "            else:\n" +
      "                right -= 1\n" +
      "        return best\n",
  },

  tests: [
    { name: "example", input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, expected: 49 },
    { name: "two-bars", input: { height: [1, 1] }, expected: 1 },
    { name: "descending", input: { height: [4, 3, 2, 1, 4] }, expected: 16, hidden: true },
    { name: "peak-middle", input: { height: [1, 2, 4, 3] }, expected: 4, hidden: true },
  ],

  visualization: { mode: "ref", traceId: "container-two-pointer" }, // see trace-spec.ts

  origin: {
    kind: "ai-generated",
    topic: "two pointers",
    model: "claude-opus-4-8",
    verified: true,
    verifiedAt: "2026-07-23T00:00:00Z",
  },
  createdAt: "2026-07-23T00:00:00Z",
};

/**
 * Runtime validation sketch (Zod). The generator forces the model to emit JSON,
 * then `ProblemSpecZ.parse(json)` rejects malformed output before the verification
 * step ever runs. Full version lives beside the app code.
 *
 *   import { z } from "zod";
 *   const TypeRefZ: z.ZodType<TypeRef> = z.lazy(() => z.discriminatedUnion("kind", [
 *     z.object({ kind: z.literal("int") }),
 *     z.object({ kind: z.literal("array"), of: TypeRefZ }),
 *     // …
 *   ]));
 *   export const ProblemSpecZ = z.object({
 *     schemaVersion: z.literal(1),
 *     slug: z.string().regex(/^[a-z0-9-]+$/),
 *     difficulty: z.enum(["easy", "medium", "hard"]),
 *     tests: z.array(TestCaseZ).min(3),
 *     // …
 *   });
 */
