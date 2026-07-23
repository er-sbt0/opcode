"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { python } from "@codemirror/lang-python";
import { basicSetup } from "codemirror";

/**
 * Editor chrome, driven entirely by the app's design tokens (CSS custom
 * properties) rather than a bundled CodeMirror theme — so it tracks light/dark
 * automatically the moment a `.dark` ancestor appears, with no JS theme switch.
 */
const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "0.8125rem",
    color: "var(--foreground)",
    backgroundColor: "transparent",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    lineHeight: "1.6",
    padding: "0.5rem 0",
  },
  ".cm-content": { padding: "0" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "color-mix(in oklch, var(--muted-foreground) 55%, transparent)",
    border: "none",
  },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 0.75rem 0 1rem" },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklch, var(--muted) 45%, transparent)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    {
      backgroundColor: "color-mix(in oklch, var(--primary) 22%, transparent)",
    },
  ".cm-matchingBracket, &.cm-focused .cm-matchingBracket": {
    backgroundColor: "color-mix(in oklch, var(--primary) 18%, transparent)",
    outline: "none",
  },
});

/**
 * Monochrome syntax highlighting: the design system is intentionally grayscale,
 * so tokens are distinguished by weight, opacity and italics rather than hue —
 * on-brand and legible in both themes.
 */
const highlightStyle = HighlightStyle.define([
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--muted-foreground)", fontStyle: "italic" },
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword], color: "var(--foreground)", fontWeight: "600" },
  { tag: [t.definitionKeyword, t.operatorKeyword], color: "var(--foreground)", fontWeight: "600" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--foreground)" },
  { tag: [t.string, t.special(t.string)], color: "color-mix(in oklch, var(--foreground) 78%, transparent)" },
  { tag: [t.number, t.bool, t.null], color: "color-mix(in oklch, var(--foreground) 88%, transparent)" },
  { tag: [t.className, t.typeName, t.namespace], color: "var(--foreground)", fontWeight: "600" },
  { tag: [t.operator, t.punctuation, t.bracket], color: "var(--muted-foreground)" },
  { tag: t.variableName, color: "var(--foreground)" },
  { tag: t.propertyName, color: "color-mix(in oklch, var(--foreground) 85%, transparent)" },
]);

/**
 * A thin, controlled-ish CodeMirror 6 editor. It seeds its document from
 * `value` and reports edits through `onChange`; if `value` is changed
 * externally (e.g. "reset to starter code") the document is reconciled without
 * clobbering the user's cursor mid-typing.
 */
export function CodeEditor({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange?: (next: string) => void;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  // Keep the latest onChange without re-creating the editor on every render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) return;

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab, ...defaultKeymap]),
          python(),
          editorTheme,
          syntaxHighlighting(highlightStyle),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current?.(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Create once; external `value` changes are reconciled in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconcile external value changes (resets) without disturbing local edits.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value === current) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return <div ref={hostRef} className={className} />;
}
