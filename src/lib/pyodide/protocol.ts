/**
 * Message protocol shared between the main thread and the Pyodide Web Worker.
 *
 * The worker owns a lazily-loaded Python runtime; the main thread ({@link ../runner})
 * owns the worker's lifecycle (creation, the infinite-loop timeout, teardown) and
 * all pass/fail comparison. Keeping comparison out of the worker means the grading
 * logic stays in typed TS, and the worker stays a thin "run this and hand back the
 * raw return value" boundary.
 */

import type { Json } from "@/lib/schemas/problem-spec";

/** Pinned so the CDN URL, the wasm index, and cache keys never drift apart. */
export const PYODIDE_VERSION = "0.28.3";
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const PYODIDE_ESM_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`;

/** Main → worker: run `code`, calling `entry` once per argument list in `calls`. */
export type WorkerRequest = {
  type: "run";
  id: number;
  code: string;
  entry: string;
  /** One positional-args array per test case, already ordered by signature. */
  calls: Json[][];
};

/** The raw result of invoking the user's function for a single case. */
export type CaseOutcome =
  | { ok: true; value: Json } // JSON-decoded return value (compared on main thread)
  | { ok: false; error: string }; // Python traceback text

/** Worker → main. `running` fires the moment user code starts, so the main thread
 *  can arm the execution timeout *after* the (slow, one-time) runtime load. */
export type WorkerResponse =
  | { type: "status"; phase: "loading" | "ready" | "running"; id?: number }
  | { type: "done"; id: number; results: CaseOutcome[] }
  | { type: "fatal"; id: number; message: string };
