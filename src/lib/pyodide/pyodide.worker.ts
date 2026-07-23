/**
 * Pyodide execution worker. Loads a Python runtime on first use (from the CDN, so
 * there's zero execution infra — roadmap "Code execution (MVP): Pyodide"), then
 * runs the user's solution against each test case and hands back the raw return
 * values. It performs no grading: the main thread compares against `expected`.
 *
 * The user's code is re-`exec`'d in a fresh namespace per case, so mutable
 * module-level state can't leak between test cases.
 */

import {
  PYODIDE_ESM_URL,
  PYODIDE_INDEX_URL,
  type CaseOutcome,
  type WorkerRequest,
  type WorkerResponse,
} from "./protocol";

// Worker global, typed minimally to avoid pulling the webworker lib (which would
// clash with the DOM `self: Window` declaration during the app's typecheck).
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
};

type PyodideAPI = {
  globals: { set(name: string, value: unknown): void };
  runPythonAsync(code: string): Promise<string>;
};

let runtime: Promise<PyodideAPI> | null = null;

function post(message: WorkerResponse) {
  ctx.postMessage(message);
}

async function getRuntime(): Promise<PyodideAPI> {
  if (!runtime) {
    post({ type: "status", phase: "loading" });
    runtime = (async () => {
      // Bundler must leave this alone: Pyodide's ESM entry is fetched at runtime
      // from the CDN, not resolved at build time.
      const mod = await import(/* turbopackIgnore: true */ PYODIDE_ESM_URL);
      return (await mod.loadPyodide({ indexURL: PYODIDE_INDEX_URL })) as PyodideAPI;
    })();
    runtime.then(() => post({ type: "status", phase: "ready" })).catch(() => {
      // Surface load failure on the next run attempt; reset so it can be retried.
      runtime = null;
    });
  }
  return runtime;
}

/**
 * Python side: define the user's `Solution` (or a top-level function) fresh per
 * case, invoke `entry`, and collect a JSON-safe outcome. `default=list` degrades
 * sets/tuples to arrays so an otherwise-correct return still serializes.
 */
const DRIVER = `
import json, traceback

def _prism_run():
    calls = json.loads(PRISM_CALLS)
    entry = PRISM_ENTRY
    out = []
    for args in calls:
        ns = {}
        try:
            exec(PRISM_CODE, ns)
            sol = ns.get("Solution")
            fn = None
            if sol is not None and hasattr(sol, entry):
                fn = getattr(sol(), entry)
            elif callable(ns.get(entry)):
                fn = ns.get(entry)
            if fn is None:
                raise NameError(
                    "No callable '%s' found — define a Solution class with a "
                    "%s method, or a top-level %s function." % (entry, entry, entry)
                )
            out.append({"ok": True, "value": fn(*args)})
        except Exception:
            out.append({"ok": False, "error": traceback.format_exc()})
    return json.dumps(out, default=list)

_prism_run()
`;

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  if (req.type !== "run") return;
  try {
    const py = await getRuntime();
    post({ type: "status", phase: "running", id: req.id });
    py.globals.set("PRISM_CODE", req.code);
    py.globals.set("PRISM_ENTRY", req.entry);
    py.globals.set("PRISM_CALLS", JSON.stringify(req.calls));
    const json = await py.runPythonAsync(DRIVER);
    post({ type: "done", id: req.id, results: JSON.parse(json) as CaseOutcome[] });
  } catch (err) {
    post({
      type: "fatal",
      id: req.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
