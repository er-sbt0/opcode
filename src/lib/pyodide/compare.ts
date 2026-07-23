/**
 * Verdict comparison for a single test case, honouring the spec's `compare.mode`.
 *
 * Runs on the main thread against the JSON-decoded value the worker returned, so
 * grading is pure, typed, and independent of the Python runtime.
 */

import type { CompareMode, Json } from "@/lib/schemas/problem-spec";

const DEFAULT_EPSILON = 1e-6;

export function compareResult(
  expected: Json,
  actual: Json,
  mode: CompareMode = "exact",
  epsilon = DEFAULT_EPSILON,
): boolean {
  switch (mode) {
    case "exact":
      return deepEqual(expected, actual);
    case "float":
      return floatEqual(expected, actual, epsilon);
    case "unordered":
      return multisetEqual(expected, actual);
    case "set":
      return multisetEqual(dedupe(expected), dedupe(actual));
    // No checker function exists in the spec yet (Phase 3); fall back to equality
    // so a single canonical answer still grades correctly.
    case "any-solution":
      return deepEqual(expected, actual);
  }
}

function deepEqual(a: Json, b: Json): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(
      (k) =>
        Object.prototype.hasOwnProperty.call(b, k) &&
        deepEqual((a as Record<string, Json>)[k], (b as Record<string, Json>)[k]),
    );
  }
  return false;
}

function floatEqual(a: Json, b: Json, eps: number): boolean {
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) <= eps;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => floatEqual(x, b[i], eps));
  }
  return deepEqual(a, b);
}

/** Arrays equal ignoring order (as multisets). Non-arrays fall back to equality. */
function multisetEqual(a: Json, b: Json): boolean {
  if (!Array.isArray(a) || !Array.isArray(b)) return deepEqual(a, b);
  if (a.length !== b.length) return false;
  const norm = (arr: Json[]) => arr.map((x) => JSON.stringify(x)).sort();
  const na = norm(a);
  const nb = norm(b);
  return na.every((x, i) => x === nb[i]);
}

function dedupe(v: Json): Json {
  if (!Array.isArray(v)) return v;
  const seen = new Map<string, Json>();
  for (const x of v) seen.set(JSON.stringify(x), x);
  return [...seen.values()];
}
