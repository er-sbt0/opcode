"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false; // assume motion on the server; the client corrects on hydration
}

/**
 * Tracks the user's `prefers-reduced-motion` setting via `useSyncExternalStore`, so
 * SSR and hydration agree and there's no setState-in-effect. Renderers use it to
 * skip tweens and jump straight to each step's final state (roadmap: "respect
 * prefers-reduced-motion").
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
