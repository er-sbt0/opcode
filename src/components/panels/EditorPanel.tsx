"use client";

import { useState } from "react";
import { Code2, Play, RotateCcw } from "lucide-react";
import type { ProblemSpec } from "@/lib/schemas/problem-spec";
import { compareResult } from "@/lib/pyodide/compare";
import { runTests } from "@/lib/pyodide/runner";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { Panel } from "./Panel";
import {
  VerdictStrip,
  type CaseResult,
  type VerdictState,
} from "./VerdictStrip";

/**
 * Center column: the code editor seeded from the problem's Python starter, plus
 * the run verdict strip. Like every panel it takes the whole problem as data and
 * has no per-problem knowledge — it drives Pyodide entirely from `signature` and
 * `tests`, so any problem runs through the same path.
 */
export function EditorPanel({ problem }: { problem: ProblemSpec }) {
  const starter = problem.starterCode.python ?? "";
  const [code, setCode] = useState(starter);
  const [verdict, setVerdict] = useState<VerdictState>({ kind: "idle" });
  const dirty = code !== starter;
  const busy = verdict.kind === "loading" || verdict.kind === "running";

  function editCode(next: string) {
    setCode(next);
    // A stale verdict describes code that no longer exists — clear it on edit.
    setVerdict((v) => (v.kind === "done" || v.kind === "error" ? { kind: "idle" } : v));
  }

  async function run() {
    setVerdict({ kind: "loading" });
    try {
      const outcomes = await runTests(code, problem.signature, problem.tests, (phase) => {
        if (phase === "running") setVerdict({ kind: "running" });
      });
      const results: CaseResult[] = problem.tests.map((test, i) => {
        const outcome = outcomes[i];
        const passed = outcome?.ok
          ? compareResult(test.expected, outcome.value, test.compare?.mode, test.compare?.epsilon)
          : false;
        return { test, outcome, passed };
      });
      setVerdict({ kind: "done", results });
    } catch (err) {
      setVerdict({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <Panel
      title="Code"
      icon={<Code2 className="size-4 text-muted-foreground" />}
      actions={
        <>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5"
            disabled={!dirty || busy}
            onClick={() => {
              setCode(starter);
              setVerdict({ kind: "idle" });
            }}
            title="Reset to starter code"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
          <Button size="sm" className="h-7 gap-1.5" disabled={busy} onClick={run}>
            <Play className="size-3.5" />
            Run
          </Button>
        </>
      }
    >
      <CodeEditor
        value={code}
        onChange={editCode}
        className="min-h-0 flex-1 overflow-auto"
      />
      <VerdictStrip state={verdict} />
    </Panel>
  );
}
