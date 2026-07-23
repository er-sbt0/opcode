/**
 * Roles → design tokens. A trace names semantic Roles; the renderer resolves each
 * to a themeable CSS variable (defined in globals.css for light + dark). Content
 * stays presentation-free, so a Phase 4 restyle touches tokens, never traces.
 */

import type { Role } from "@/lib/schemas/trace-spec";
import type { RoleResolver } from "./types";

export const ROLE_TOKENS: Record<Role, string> = {
  default: "var(--viz-neutral)",
  active: "var(--viz-active)",
  compared: "var(--viz-compared)",
  window: "var(--viz-window)",
  visited: "var(--viz-visited)",
  result: "var(--viz-result)",
  excluded: "var(--viz-excluded)",
  path: "var(--viz-path)",
};

/** Default resolver. Override via `Visualization`'s `roleToken` prop for theming. */
export const defaultRoleToken: RoleResolver = (r) => ROLE_TOKENS[r ?? "default"];
