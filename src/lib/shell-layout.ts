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
  /** Thin conversation handle while admin is in takeover. */
  chatTakeoverStrip: 56,
  /**
   * Conversation pane must keep at least this much width with an expanded admin
   * docked beside it — otherwise the panels touch/crowd and we floor to sidebar.
   */
  chatMinBesideExpanded: 360,
  /** Outer padding + inter-pane gutters around the three columns. */
  chromeX: 16,
} as const;

/** Desktop docked admin width modes. Mobile/compact sheets ignore these. */
export type AdminLayoutMode = "sidebar" | "expanded" | "takeover";

export const ADMIN_LAYOUT_MODES: readonly AdminLayoutMode[] = ["sidebar", "expanded", "takeover"] as const;

/**
 * Left-rail adaptation — independent of admin panel width, but coupled in practice:
 *
 * | Rail mode   | When                         | Left rail chrome                                      |
 * |-------------|------------------------------|-------------------------------------------------------|
 * | sidekick    | Conversation (A)             | Agents roster, logo, plus, search, footer             |
 * | hybrid      | Full admin takeover (B)      | Admin nav + condensed sidekick lead; logo+plus+search |
 * | minimized   | Collapsed from full (C)      | Icon-only / narrow hybrid; admin stays large          |
 *
 * Transitions:
 * - Entering takeover → hybrid (expanded labels).
 * - Logo collapse while hybrid → minimized (admin stays takeover).
 * - Logo expand while minimized → hybrid.
 * - “View sidekicks” / leaving takeover → sidekick.
 */
export type AgentsRailMode = "sidekick" | "hybrid" | "minimized";

export const AGENTS_RAIL_MODES: readonly AgentsRailMode[] = ["sidekick", "hybrid", "minimized"] as const;

/** Content density inside the admin panel — driven by layout mode, not window width. */
export type AdminDensity = "compact" | "desktop";

export const ADMIN_DESKTOP_MAX = 1120;

export function adminLayoutFromWide(wide: boolean | undefined, fallbackWide = false): AdminLayoutMode {
  return (wide ?? fallbackWide) ? "expanded" : "sidebar";
}

export function isAdminWideLayout(mode: AdminLayoutMode): boolean {
  return mode === "expanded" || mode === "takeover";
}

/** Full takeover uses desktop density; sidebar/expanded/sheets stay compact. */
export function adminDensityForLayout(mode: AdminLayoutMode, sheet = false): AdminDensity {
  return !sheet && mode === "takeover" ? "desktop" : "compact";
}

/** Resolve the left-rail adaptation from admin layout + collapse preference. */
export function agentsRailModeFor(adminLayout: AdminLayoutMode, railExpanded: boolean): AgentsRailMode {
  if (adminLayout !== "takeover") return "sidekick";
  return railExpanded ? "hybrid" : "minimized";
}

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
  /** Allow the wide (584) admin panel and the layout-mode control. */
  allowAdminWide: boolean;
  /** Allow the full-takeover admin layout (docked desktops only). */
  allowAdminTakeover: boolean;
  /**
   * Auto floor for docked admin when the merchant has not pinned a tighter size:
   * roomy viewports prefer expanded; tight ones stay sidebar so chat is not crowded.
   */
  preferredAdminLayout: "sidebar" | "expanded";
  /** Admin panel width when docked in sidebar mode. */
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

/**
 * Whether an expanded (584) admin can sit beside the agents rail without crowding
 * the conversation. Uses the expanded rail width — the comfortable docked case.
 */
export function fitsExpandedAdmin(width: number, navWidth: number = SHELL.navExpanded): boolean {
  return width >= navWidth + SHELL.adminWide + SHELL.chatMinBesideExpanded + SHELL.chromeX;
}

/** Auto floor for docked admin: roomy → expanded, tight → sidebar. */
export function preferredDockedAdminLayout(width: number, navWidth: number = SHELL.navExpanded): "sidebar" | "expanded" {
  return fitsExpandedAdmin(width, navWidth) ? "expanded" : "sidebar";
}

/**
 * Resolve a docked admin mode against the viewport floor.
 *
 * - Tight viewports always floor expanded down to sidebar (chat must not be crowded).
 * - Takeover survives only while the shell allows it.
 * - Roomy viewports promote to expanded unless the merchant explicitly pinned sidebar.
 * - Programmatic expands (Orders, Settings, etc.) are left alone on roomy screens
 *   even if the merchant previously pinned sidebar for the empty desk.
 */
export function resolveAdminLayoutForViewport(
  current: AdminLayoutMode,
  preferred: "sidebar" | "expanded",
  allowTakeover: boolean,
  choice: "auto" | AdminLayoutMode = "auto",
): AdminLayoutMode {
  if (current === "takeover") {
    return allowTakeover ? "takeover" : preferred;
  }
  if (preferred === "sidebar") return "sidebar";
  if (current === "expanded") return "expanded";
  if (choice === "sidebar") return "sidebar";
  return "expanded";
}

/** Resolve the shell layout from viewport signals. Pure — safe for tests and SSR defaults. */
export function resolveShellLayout({ width, spanning = false, coarsePointer = false }: ShellSignals): ShellLayout {
  if (spanning && width >= SHELL.compactMax) {
    const preferNavCollapsed = true;
    const navWidth = SHELL.navCollapsed;
    const preferredAdminLayout = preferredDockedAdminLayout(width, navWidth);
    const allowAdminWide = preferredAdminLayout === "expanded";
    return {
      mode: "fold-open",
      width,
      spanning: true,
      // Collapsed rail keeps every sidekick one tap away beside the chat pane.
      agents: "rail",
      admin: "docked",
      preferNavCollapsed,
      allowAdminWide,
      allowAdminTakeover: true,
      preferredAdminLayout,
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
      allowAdminTakeover: false,
      preferredAdminLayout: "sidebar",
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
      allowAdminTakeover: false,
      preferredAdminLayout: "sidebar",
      adminWidth: SHELL.adminNarrow,
      // Touch tablets prefer a bottom sheet; mouse-driven windows slide from the end.
      chatChrome: "compact",
      adminSheetEdge: coarsePointer || width < 900 ? "bottom" : "end",
    };
  }

  const preferredAdminLayout = preferredDockedAdminLayout(width, SHELL.navExpanded);
  const allowAdminWide = preferredAdminLayout === "expanded";

  if (width <= SHELL.desktopMax) {
    return {
      mode: "desktop",
      width,
      spanning: false,
      agents: "rail",
      admin: "docked",
      preferNavCollapsed: false,
      allowAdminWide,
      allowAdminTakeover: true,
      preferredAdminLayout,
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
    allowAdminWide,
    allowAdminTakeover: true,
    preferredAdminLayout,
    adminWidth: allowAdminWide ? SHELL.adminWide : SHELL.adminNarrow,
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
