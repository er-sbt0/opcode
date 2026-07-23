import { FileText } from "lucide-react";
import { Panel, PanelPlaceholder } from "./Panel";

/** Left column: renders a problem's statement, examples & constraints from ProblemSpec. */
export function ProblemPanel() {
  return (
    <Panel
      title="Problem"
      icon={<FileText className="size-4 text-muted-foreground" />}
    >
      <PanelPlaceholder
        label="ProblemPanel"
        hint="Statement, examples & constraints render here from ProblemSpec"
      />
    </Panel>
  );
}
