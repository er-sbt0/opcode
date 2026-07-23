import { Eye } from "lucide-react";
import type { ProblemSpec } from "@/lib/schemas/problem-spec";
import { resolveTrace } from "@/lib/traces/registry";
import { Visualization } from "@/components/viz";
import { Panel, PanelPlaceholder } from "./Panel";

/**
 * Right column: the interactive emulation. Resolves the problem's `visualization`
 * binding to a TraceSpec and hands it to the generic renderer — the panel has no
 * per-problem knowledge, exactly like the other two. Problems without a (resolvable)
 * trace show the placeholder until Phase 3's derived traces land.
 */
export function VizPanel({ problem }: { problem: ProblemSpec }) {
  const trace = resolveTrace(problem.visualization);

  return (
    <Panel title="Visualization" icon={<Eye className="size-4 text-muted-foreground" />}>
      {trace ? (
        <Visualization spec={trace} />
      ) : (
        <PanelPlaceholder
          label="No visualization yet"
          hint="A TraceSpec renders here once this problem has one"
        />
      )}
    </Panel>
  );
}
