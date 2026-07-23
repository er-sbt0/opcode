/**
 * Container With Most Water — the first hand-authored problem, and the Phase 1
 * proof that the component tree renders any problem from data alone (roadmap.md →
 * Phase 1). It is `parseProblemSpec`-validated at module load: if this object ever
 * drifts from the schema, the build fails here rather than the UI rendering garbage.
 */

import { parseProblemSpec } from "@/lib/schemas/problem-spec";

export const containerWithMostWater = parseProblemSpec({
  schemaVersion: 1,
  id: "b0d2c1a4-6f3e-4d1b-9c2a-2f7e8a5c1d90",
  slug: "container-with-most-water",
  title: "Container With Most Water",
  difficulty: "medium",
  topics: ["two-pointers", "array", "greedy"],

  statement: [
    "You are given an integer array `height` of length `n`. Each value draws a",
    "vertical line from `(i, 0)` to `(i, height[i])`.",
    "",
    "Pick two lines that, with the x-axis, form a container holding the **most",
    "water**. Return that maximum area. You may not slant the container.",
  ].join("\n"),

  examples: [
    {
      input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
      output: 49,
      explanation:
        "Lines at index 1 and 8 (heights 8 and 7) bound the widest useful " +
        "container: `min(8, 7) × (8 − 1) = 49`.",
    },
  ],

  constraints: [
    "n == height.length",
    "2 <= n <= 10^5",
    "0 <= height[i] <= 10^4",
  ],
  hints: [
    "Start with the widest container and walk inward.",
    "Only the shorter of the two walls limits the area — move that one.",
  ],

  signature: {
    entry: "max_area",
    params: [{ name: "height", type: { kind: "array", of: { kind: "int" } } }],
    returns: { kind: "int" },
  },

  starterCode: {
    python:
      "class Solution:\n" +
      "    def max_area(self, height: list[int]) -> int:\n" +
      "        # your code here\n" +
      "        pass\n",
  },

  referenceSolution: {
    python:
      "class Solution:\n" +
      "    def max_area(self, height: list[int]) -> int:\n" +
      "        left, right, best = 0, len(height) - 1, 0\n" +
      "        while left < right:\n" +
      "            span = min(height[left], height[right])\n" +
      "            best = max(best, span * (right - left))\n" +
      "            if height[left] < height[right]:\n" +
      "                left += 1\n" +
      "            else:\n" +
      "                right -= 1\n" +
      "        return best\n",
  },

  tests: [
    { name: "example", input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, expected: 49 },
    { name: "two-bars", input: { height: [1, 1] }, expected: 1 },
    { name: "descending", input: { height: [4, 3, 2, 1, 4] }, expected: 16, hidden: true },
    { name: "peak-middle", input: { height: [1, 2, 4, 3] }, expected: 4, hidden: true },
  ],

  visualization: { mode: "ref", traceId: "container-two-pointer" },

  origin: {
    kind: "ai-generated",
    topic: "two pointers",
    model: "claude-opus-4-8",
    verified: true,
    verifiedAt: "2026-07-23T00:00:00Z",
  },
  createdAt: "2026-07-23T00:00:00Z",
});
