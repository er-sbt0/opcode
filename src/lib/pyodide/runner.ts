"use client";

/**
 * Main-thread driver for the Pyodide worker: one lazily-created worker, reused
 * across runs. Owns the execution timeout — the only way to stop a user's
 * infinite loop is to terminate the worker — and rebuilds it on the next run.
 */

import type { FunctionSignature, Json, TestCase } from "@/lib/schemas/problem-spec";
import type { CaseOutcome, WorkerRequest, WorkerResponse } from "./protocol";

export type RunPhase = "loading" | "ready" | "running";

/** Guards user code only; armed when the worker reports `running`, so a slow
 *  one-time runtime download doesn't count against it. */
const EXEC_TIMEOUT_MS = 10_000;

type Pending = {
  resolve: (results: CaseOutcome[]) => void;
  reject: (error: Error) => void;
  onPhase?: (phase: RunPhase) => void;
  timer: ReturnType<typeof setTimeout> | null;
};

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, Pending>();

function ensureWorker(): Worker {
  if (worker) return worker;
  const w = new Worker(new URL("./pyodide.worker.ts", import.meta.url), {
    type: "module",
  });
  w.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const msg = event.data;
    if (msg.type === "status") {
      for (const p of pending.values()) p.onPhase?.(msg.phase);
      if (msg.phase === "running" && msg.id != null) {
        const p = pending.get(msg.id);
        if (p) p.timer = setTimeout(() => onTimeout(msg.id!), EXEC_TIMEOUT_MS);
      }
      return;
    }
    const p = pending.get(msg.id);
    if (!p) return;
    if (p.timer) clearTimeout(p.timer);
    pending.delete(msg.id);
    if (msg.type === "done") p.resolve(msg.results);
    else p.reject(new Error(msg.message));
  };
  w.onerror = (event) =>
    failAll(new Error(event.message || "The Python worker crashed."));
  worker = w;
  return w;
}

function onTimeout(id: number) {
  const p = pending.get(id);
  if (!p) return;
  pending.delete(id);
  resetWorker(); // kill the looping runtime; next run rebuilds it
  p.reject(
    new Error(
      `Execution timed out after ${EXEC_TIMEOUT_MS / 1000}s — check for an infinite loop.`,
    ),
  );
}

function failAll(error: Error) {
  for (const p of pending.values()) {
    if (p.timer) clearTimeout(p.timer);
    p.reject(error);
  }
  pending.clear();
  resetWorker();
}

function resetWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

/**
 * Run `code` against every test, returning one outcome per test (order-aligned
 * with `tests`). Call args are built positionally from `signature.params` so the
 * Python side never has to know parameter names.
 */
export function runTests(
  code: string,
  signature: FunctionSignature,
  tests: TestCase[],
  onPhase?: (phase: RunPhase) => void,
): Promise<CaseOutcome[]> {
  const w = ensureWorker();
  const id = ++seq;
  const calls: Json[][] = tests.map((test) =>
    signature.params.map((param) => test.input[param.name] ?? null),
  );
  return new Promise<CaseOutcome[]>((resolve, reject) => {
    pending.set(id, { resolve, reject, onPhase, timer: null });
    const request: WorkerRequest = {
      type: "run",
      id,
      code,
      entry: signature.entry,
      calls,
    };
    w.postMessage(request);
  });
}
