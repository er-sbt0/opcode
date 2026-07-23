import { TopBar } from "@/components/layout/TopBar";
import { EditorPanel } from "@/components/panels/EditorPanel";
import { ProblemPanel } from "@/components/panels/ProblemPanel";
import { VizPanel } from "@/components/panels/VizPanel";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      <TopBar />
      <main className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border overflow-y-auto md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] md:divide-x md:divide-y-0 md:overflow-hidden">
        <ProblemPanel />
        <EditorPanel />
        <VizPanel />
      </main>
    </div>
  );
}
