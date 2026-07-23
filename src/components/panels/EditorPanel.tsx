"use client";

import { useState } from "react";
import { Code2, Play, RotateCcw } from "lucide-react";
import type { ProblemSpec } from "@/lib/schemas/problem-spec";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { Panel } from "./Panel";

/**
 * Center column: the code editor seeded from the problem's Python starter, plus
 * the run verdict strip. Like every panel it takes the whole problem as data and
 * has no per-problem knowledge — swapping `problem` swaps the starter code.
 * (Running against tests via Pyodide is the next slice; Run is inert for now.)
 */
export function EditorPanel({ problem }: { problem: ProblemSpec }) {
  const starter = problem.starterCode.python ?? "";
  const [code, setCode] = useState(starter);
  const dirty = code !== starter;

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
            disabled={!dirty}
            onClick={() => setCode(starter)}
            title="Reset to starter code"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
          <Button size="sm" disabled className="h-7 gap-1.5">
            <Play className="size-3.5" />
            Run
          </Button>
        </>
      }
    >
      <CodeEditor
        value={code}
        onChange={setCode}
        className="min-h-0 flex-1 overflow-auto"
      />
      <div className="shrink-0 border-t border-border px-4 py-2 text-xs text-muted-foreground">
        Run to check your solution against the sample cases
      </div>
    </Panel>
  );
}
