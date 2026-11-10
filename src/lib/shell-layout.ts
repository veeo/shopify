/**
 * Responsive shell model for Sidekick.
 *
 * Priority: agents + conversation first; admin is secondary and may collapse
 * all the way to an icon. Breakpoints follow common device bands and foldable
 * spanning when the browser exposes multi-segment viewports.
 *
 * | Mode          | Typical surface              | Agents        | Chat     | Admin              |
 * |---------------|------------------------------|---------------|----------|--------------------|
 * | desktop-wide  | large monitor                | rail          | primary  | docked, may widen  |
 * | desktop       | laptop / large iPad landscape| rail          | primary  | docked, sidebar    |
 * | compact       | iPad portrait / small laptop | rail (narrow) | primary  | sheet via icon     |
 * | mobile        | iPhone / Duo closed          | drawer        | full     | sheet via icon     |
 * | fold-open     | Duo / Fold spanning          | strip/drawer  | primary  | docked beside chat |
 */

export const SHELL = {
  /** Below this, phone-first: chat fills; agents & admin are overlays. */
  mobileMax: 719,
  /** Compact: chat + slim agent rail; admin becomes a sheet. */
  compactMax: 1023,
  /** Desktop with sidebar-sized admin (current 393px). */
  desktopMax: 1279,
  /** Above this, admin may expand to the wide panel (584px). */
  wideMin: 1280,
  navCollapsed: 64,
  navExpanded: 248,
  adminNarrow: 393,
  adminWide: 584,
} as const;

export type ShellMode = "desktop-wide" | "desktop" | "compact" | "mobile" | "fold-open";

export type AgentsPresentation = "rail" | "drawer";
export type AdminPresentation = "docked" | "sheet";

export type ShellLayout = {
  mode: ShellMode;
  width: number;
  spanning: boolean;
  agents: AgentsPresentation;
  admin: AdminPresentation;
  /** Prefer the collapsed agent rail when the rail is in-flow. */
  preferNavCollapsed: boolean;
  /** Allow the wide (584) admin panel. */
  allowAdminWide: boolean;
  /** Admin panel width when docked. */
  adminWidth: number;
  /** Chat should show a compact chrome (logo + admin affordance). */
  chatChrome: "desktop" | "compact" | "mobile";
  /** Safe-area aware bottom sheet vs side sheet for admin. */
  adminSheetEdge: "bottom" | "end";
};

export type ShellSignals = {
  width: number;
  /** True when the viewport reports two horizontal segments (open foldable). */
  spanning?: boolean;
  /** Coarse pointer — soft signal for touch-first chrome. */
  coarsePointer?: boolean;
};

/** Resolve the shell layout from viewport signals. Pure — safe for tests and SSR defaults. */
export function resolveShellLayout({ width, spanning = false, coarsePointer = false }: ShellSignals): ShellLayout {
  if (spanning && width >= SHELL.compactMax) {
    return {
      mode: "fold-open",
      width,
      spanning: true,
      // Collapsed rail keeps every sidekick one tap away beside the chat pane.
      agents: "rail",
      admin: "docked",
      preferNavCollapsed: true,
      allowAdminWide: false,
      adminWidth: Math.min(SHELL.adminNarrow, Math.round(width * 0.42)),
      chatChrome: "compact",
      adminSheetEdge: "end",
    };
  }

  if (width <= SHELL.mobileMax) {
    return {
      mode: "mobile",
      width,
      spanning: false,
      agents: "drawer",
      admin: "sheet",
      preferNavCollapsed: true,
      allowAdminWide: false,
      adminWidth: SHELL.adminNarrow,
      chatChrome: "mobile",
      adminSheetEdge: "bottom",
    };
  }

  if (width <= SHELL.compactMax) {
    return {
      mode: "compact",
      width,
      spanning: false,
      agents: "rail",
      admin: "sheet",
      preferNavCollapsed: true,
      allowAdminWide: false,
      adminWidth: SHELL.adminNarrow,
      chatChrome: "compact",
      adminSheetEdge: width < 900 ? "bottom" : "end",
    };
  }

  if (width <= SHELL.desktopMax) {
    return {
      mode: "desktop",
      width,
      spanning: false,
      agents: "rail",
      admin: "docked",
      preferNavCollapsed: false,
      allowAdminWide: false,
      adminWidth: SHELL.adminNarrow,
      chatChrome: "desktop",
      adminSheetEdge: "end",
    };
  }

  return {
    mode: "desktop-wide",
    width,
    spanning: false,
    agents: "rail",
    admin: "docked",
    preferNavCollapsed: false,
    allowAdminWide: true,
    adminWidth: SHELL.adminWide,
    chatChrome: "desktop",
    adminSheetEdge: "end",
  };
}

/** Detect dual-segment / spanning foldable viewports when the platform exposes them. */
export function readSpanning(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(horizontal-viewport-segments: 2)").matches) return true;
    if (window.matchMedia("(vertical-viewport-segments: 2)").matches) return true;
  } catch {
    /* older engines */
  }
  const segments = (window as Window & { viewport?: { segments?: unknown[] } }).viewport?.segments;
  return Array.isArray(segments) && segments.length > 1;
}

export function readCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}
