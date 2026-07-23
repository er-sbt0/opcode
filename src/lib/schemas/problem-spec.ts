/**
 * ProblemSpec — the canonical, data-driven description of a single exercise.
 *
 * One half of the architectural spine (roadmap.md → "Architectural spine"). The UI
 * renders a problem *entirely* from this object and the AI generator produces one,
 * so components never know which problem they show: adding or generating a problem
 * is data, not code.
 *
 * This is the runtime source of truth. Everything is a Zod schema so the exact same
 * shape that types the app also *validates AI-generated JSON at runtime* — the
 * verification gate ("never publish an unverified problem") runs against `parse`.
 * TypeScript types are inferred from the schemas (`z.infer`) so the two can't drift.
 */

import { z } from "zod";
import type { TraceSpec } from "./trace-spec";

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

export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string(),
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ]),
);

export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof difficultySchema>;

/** Languages we can present. MVP executes only `python` (in-browser via Pyodide);
 *  the rest are authored ahead of the hosted judge landing (see roadmap). */
export const languageSchema = z.enum(["python", "c", "rust", "go"]);
export type Language = z.infer<typeof languageSchema>;

/**
 * A structural type for a function parameter or return value. Drives three things
 * from one declaration: (1) generated starter code, (2) how the run harness passes
 * test inputs, (3) how the tracer knows what it's visualizing. Recursive, so it is
 * declared as a type + a lazy schema.
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

export const typeRefSchema: z.ZodType<TypeRef> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("int") }),
    z.object({ kind: z.literal("float") }),
    z.object({ kind: z.literal("bool") }),
    z.object({ kind: z.literal("string") }),
    z.object({ kind: z.literal("array"), of: typeRefSchema }),
    z.object({ kind: z.literal("matrix"), of: typeRefSchema }),
    z.object({ kind: z.literal("tree"), valueType: typeRefSchema }),
    z.object({ kind: z.literal("graph"), directed: z.boolean() }),
    z.object({ kind: z.literal("listnode"), valueType: typeRefSchema }),
  ]),
);

// ────────────────────────────────────────────────────────────────────────────
// Entry point / harness
// ────────────────────────────────────────────────────────────────────────────

export const paramSchema = z.object({
  name: z.string(), // must match the keys used in TestCase.input
  type: typeRefSchema,
});
export type Param = z.infer<typeof paramSchema>;

/**
 * How to call the user's solution. The run harness serializes each TestCase.input
 * according to these params, invokes `entry`, then compares against `expected`.
 */
export const functionSignatureSchema = z.object({
  entry: z.string(), // function/method name, e.g. "max_area"
  params: z.array(paramSchema),
  returns: typeRefSchema,
});
export type FunctionSignature = z.infer<typeof functionSignatureSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Examples, tests, verification
// ────────────────────────────────────────────────────────────────────────────

/** A worked example shown in the problem statement (always visible). */
export const exampleSchema = z.object({
  input: z.record(z.string(), jsonSchema), // keyed by Param.name
  output: jsonSchema,
  explanation: z.string().optional(), // markdown
});
export type Example = z.infer<typeof exampleSchema>;

export const compareModeSchema = z.enum([
  "exact", //   deep-equal
  "float", //   numeric within epsilon
  "unordered", //   arrays equal ignoring order
  "set", //   arrays equal as sets (dedup + ignore order)
  "any-solution", // multiple valid answers → validated by a checker fn, not equality
]);
export type CompareMode = z.infer<typeof compareModeSchema>;

/** A single graded test case. `hidden` cases are used for scoring but never shown. */
export const testCaseSchema = z.object({
  name: z.string().optional(),
  input: z.record(z.string(), jsonSchema), // keyed by Param.name
  expected: jsonSchema,
  hidden: z.boolean().optional(), // default false
  compare: z
    .object({ mode: compareModeSchema, epsilon: z.number().optional() })
    .optional(), // default { mode: "exact" }
});
export type TestCase = z.infer<typeof testCaseSchema>;

/**
 * Provenance + the verification gate. A problem is only publishable once its
 * reference solution has passed every test (roadmap principle: never publish an
 * unverified AI problem).
 */
export const originSchema = z.object({
  kind: z.enum(["authored", "ai-generated"]),
  topic: z.string().optional(), // the concept the user asked for
  model: z.string().optional(), // e.g. "claude-opus-4-8" (when ai-generated)
  verified: z.boolean(), // reference solution passed all tests?
  verifiedAt: z.string().optional(), // ISO timestamp
});
export type Origin = z.infer<typeof originSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Visualization binding
// ────────────────────────────────────────────────────────────────────────────

/**
 * Instructions for generating a TraceSpec by running the instrumented reference
 * solution against one representative input. Fleshed out in Phase 3; kept light here.
 */
export const traceRecipeSchema = z.object({
  /** Which input to visualize (usually a small, illustrative case). */
  input: z.record(z.string(), jsonSchema),
  /** Language whose instrumented reference solution emits the trace. */
  language: languageSchema,
  /** Cap so a visualization never explodes; the tracer stops emitting past this. */
  maxSteps: z.number().optional(), // default 60
});
export type TraceRecipe = z.infer<typeof traceRecipeSchema>;

/**
 * How this problem gets its interactive emulation. Prefer `derived`: the visual is
 * the *trace of the reference solution executing* (roadmap principle #3), so it is
 * correct for free and scales to any generated content. The `inline` trace is typed
 * against TraceSpec but validated structurally only until Phase 2 ships its schema.
 */
export const visualizationBindingSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("ref"), traceId: z.string() }),
  z.object({ mode: z.literal("inline"), trace: z.custom<TraceSpec>() }),
  z.object({ mode: z.literal("derived"), recipe: traceRecipeSchema }),
]);
export type VisualizationBinding = z.infer<typeof visualizationBindingSchema>;

// ────────────────────────────────────────────────────────────────────────────
// The spec
// ────────────────────────────────────────────────────────────────────────────

export const problemSpecSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(), // stable uuid
  slug: z.string().regex(/^[a-z0-9-]+$/), // url-safe
  title: z.string(),
  difficulty: difficultySchema,
  topics: z.array(z.string()), // e.g. ["two-pointers", "array", "greedy"]

  statement: z.string(), // markdown; the prose the solver reads
  examples: z.array(exampleSchema),
  constraints: z.array(z.string()), // rendered as a list
  hints: z.array(z.string()).optional(), // progressively revealed

  signature: functionSignatureSchema,
  starterCode: z.partialRecord(languageSchema, z.string()),
  referenceSolution: z.partialRecord(languageSchema, z.string()).optional(), // hidden from the client
  tests: z.array(testCaseSchema).min(3),

  visualization: visualizationBindingSchema.optional(),

  origin: originSchema,
  createdAt: z.string(), // ISO timestamp
});
export type ProblemSpec = z.infer<typeof problemSpecSchema>;

/**
 * Parse + validate an untrusted ProblemSpec (AI-generated JSON, stored records).
 * Throws a ZodError on malformed input — callers upstream of the verification loop
 * rely on this rejecting bad shapes before a reference solution is ever executed.
 */
export function parseProblemSpec(input: unknown): ProblemSpec {
  return problemSpecSchema.parse(input);
}
