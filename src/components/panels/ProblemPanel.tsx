import { FileText } from "lucide-react";
import type {
  Difficulty,
  Example,
  Json,
  ProblemSpec,
} from "@/lib/schemas/problem-spec";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import { Panel } from "./Panel";

/**
 * Left column: renders a problem's statement, examples, constraints & hints
 * entirely from its ProblemSpec. It has no knowledge of *which* problem it shows —
 * swapping the `problem` prop swaps the content, no code changes (roadmap principle
 * #2, "content is data").
 */
export function ProblemPanel({ problem }: { problem: ProblemSpec }) {
  return (
    <Panel
      title="Problem"
      icon={<FileText className="size-4 text-muted-foreground" />}
    >
      <article className="flex flex-col gap-6 p-5">
        <header>
          <DifficultyBadge difficulty={problem.difficulty} />
          <h1 className="mt-2.5 text-xl font-semibold tracking-tight text-foreground">
            {problem.title}
          </h1>
          {problem.topics.length > 0 ? (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {problem.topics.map((topic) => (
                <li
                  key={topic}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {topic}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <Markdown className="text-foreground/80">{problem.statement}</Markdown>

        {problem.examples.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SectionLabel>
              {problem.examples.length > 1 ? "Examples" : "Example"}
            </SectionLabel>
            <ol className="flex flex-col gap-3">
              {problem.examples.map((example, i) => (
                <li key={i}>
                  <ExampleCard example={example} index={i} />
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {problem.constraints.length > 0 ? (
          <section className="flex flex-col gap-2.5">
            <SectionLabel>Constraints</SectionLabel>
            <ul className="flex flex-col gap-1.5">
              {problem.constraints.map((constraint) => (
                <li
                  key={constraint}
                  className="flex gap-2 text-sm text-muted-foreground"
                >
                  <span aria-hidden className="select-none text-muted-foreground/50">
                    &bull;
                  </span>
                  <code className="font-mono text-[0.8125rem]">{constraint}</code>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {problem.hints && problem.hints.length > 0 ? (
          <section className="flex flex-col gap-2">
            <SectionLabel>Hints</SectionLabel>
            <div className="flex flex-col gap-2">
              {problem.hints.map((hint, i) => (
                <details
                  key={i}
                  className="group rounded-lg border border-border bg-card"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/80 select-none">
                    <span className="text-muted-foreground/60 transition-transform group-open:rotate-90">
                      &rsaquo;
                    </span>
                    Hint {i + 1}
                  </summary>
                  <div className="px-3 pb-3 pl-8">
                    <Markdown className="text-muted-foreground">{hint}</Markdown>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </Panel>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
      {children}
    </h2>
  );
}

const difficultyStyles: Record<Difficulty, string> = {
  easy: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
  medium: "text-amber-600 dark:text-amber-400 bg-amber-500/10 ring-amber-500/20",
  hard: "text-rose-600 dark:text-rose-400 bg-rose-500/10 ring-rose-500/20",
};

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        difficultyStyles[difficulty],
      )}
    >
      {difficulty}
    </span>
  );
}

function ExampleCard({ example, index }: { example: Example; index: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground/70">
        Example {index + 1}
      </p>
      <dl className="flex flex-col gap-1 font-mono text-[0.8125rem]">
        <div className="flex gap-2">
          <dt className="shrink-0 text-muted-foreground">Input:</dt>
          <dd className="text-foreground/90">{formatInput(example.input)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-muted-foreground">Output:</dt>
          <dd className="text-foreground/90">{formatJson(example.output)}</dd>
        </div>
      </dl>
      {example.explanation ? (
        <Markdown className="mt-2.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
          {example.explanation}
        </Markdown>
      ) : null}
    </div>
  );
}

/** `{ height: [1, 2] }` → `height = [1, 2]`, matching how the solver calls it. */
function formatInput(input: Record<string, Json>): string {
  return Object.entries(input)
    .map(([key, value]) => `${key} = ${formatJson(value)}`)
    .join(", ");
}

function formatJson(value: Json): string {
  return JSON.stringify(value);
}
