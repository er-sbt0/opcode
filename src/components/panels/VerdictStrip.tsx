import { Check, Loader2, TriangleAlert, X } from "lucide-react";
import type { TestCase } from "@/lib/schemas/problem-spec";
import type { CaseOutcome } from "@/lib/pyodide/protocol";
import { cn } from "@/lib/utils";

export type CaseResult = {
  test: TestCase;
  outcome: CaseOutcome | undefined;
  passed: boolean;
};

export type VerdictState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "running" }
  | { kind: "error"; message: string }
  | { kind: "done"; results: CaseResult[] };

/**
 * The run verdict: pass/fail per case, shown under the editor. Hidden cases never
 * reveal their input or expected value — only whether they passed.
 */
export function VerdictStrip({ state }: { state: VerdictState }) {
  return (
    <div className="shrink-0 border-t border-border px-4 py-2.5 text-xs">
      {state.kind === "idle" ? (
        <p className="text-muted-foreground">
          Run to check your solution against the test cases
        </p>
      ) : state.kind === "loading" ? (
        <Busy label="Loading Python runtime…" />
      ) : state.kind === "running" ? (
        <Busy label="Running…" />
      ) : state.kind === "error" ? (
        <p className="flex items-center gap-2 text-destructive">
          <TriangleAlert className="size-3.5 shrink-0" />
          {state.message}
        </p>
      ) : (
        <Results results={state.results} />
      )}
    </div>
  );
}

function Busy({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="size-3.5 shrink-0 animate-spin" />
      {label}
    </p>
  );
}

function Results({ results }: { results: CaseResult[] }) {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;
  const firstFail = results.find((r) => !r.passed);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ring-1 ring-inset",
            allPassed
              ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
          )}
        >
          {allPassed ? <Check className="size-3" /> : <X className="size-3" />}
          {allPassed ? `All ${total} tests passed` : `${passed} / ${total} passed`}
        </span>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {results.map((result, i) => (
          <li key={i}>
            <CaseChip result={result} index={i} />
          </li>
        ))}
      </ul>

      {firstFail ? <FailDetail result={firstFail} /> : null}
    </div>
  );
}

function CaseChip({ result, index }: { result: CaseResult; index: number }) {
  const { test, passed } = result;
  const hidden = test.hidden ?? false;
  const label = hidden ? "Hidden" : test.name ?? `Case ${index + 1}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
        passed
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      )}
    >
      {passed ? <Check className="size-3" /> : <X className="size-3" />}
      {label}
    </span>
  );
}

/** One line of actionable feedback for the first failing case. Hidden cases stay
 *  opaque; visible cases show expected-vs-got or the runtime error. */
function FailDetail({ result }: { result: CaseResult }) {
  const { test, outcome } = result;
  if (test.hidden) {
    return <p className="text-muted-foreground">A hidden test failed.</p>;
  }
  if (outcome && !outcome.ok) {
    return (
      <p className="truncate font-mono text-[0.6875rem] text-destructive">
        {lastLine(outcome.error)}
      </p>
    );
  }
  return (
    <p className="font-mono text-[0.6875rem] text-muted-foreground">
      Expected{" "}
      <span className="text-foreground/80">{format(test.expected)}</span> · Got{" "}
      <span className="text-foreground/80">
        {outcome && outcome.ok ? format(outcome.value) : "—"}
      </span>
    </p>
  );
}

function format(value: unknown): string {
  const s = JSON.stringify(value);
  return s.length > 80 ? `${s.slice(0, 79)}…` : s;
}

function lastLine(trace: string): string {
  const lines = trace.trimEnd().split("\n");
  return lines[lines.length - 1] ?? "Runtime error";
}
