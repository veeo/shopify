"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AccountMenu, AdminNavSections, Alerts, initials, SidekickRecentChats, StoreMenu } from "@/components/admin-rail";
import { IconButton, Orb, ShopifyMark } from "@/components/marks";
import { ORB_SIZE } from "@/voiceorbs/lib/orb-model";
import { SidekickSwitcher, Tip } from "@/components/chat-column";
import { PIcon } from "@/components/polaris-icon";
import type { PreviewId } from "@/lib/admin-nav";
import type { AgentsRailMode } from "@/lib/shell-layout";
import {
  hiddenAgents,
  railGroup,
  recentAgentConversations,
  selectedAgent,
  visibleAgents,
  type Agent,
  type AgentGroup,
  type PrototypeState,
} from "@/lib/prototype";

const groups: { id: AgentGroup; label: string | null }[] = [
  { id: "favorites", label: null },
  { id: "teams", label: "Team" },
  { id: "channels", label: "Channels" },
  { id: "tools", label: "Tools" },
  { id: "hidden", label: "Hidden" },
];

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
const move = `420ms ${ease}`;
const MERGE_MS = 420;
const mergeEase = `${MERGE_MS}ms ${ease}`;
const LABEL_OUT_MS = 140;
const LABEL_IN_MS = 220;

type MergePhase = "agents" | "collapsing" | "admin";

export function AgentNav({
  state,
  navOpen,
  present = true,
  presentation = "rail",
  drawerOpen = false,
  railMode = "sidekick",
  onCloseDrawer,
  onToggleNav,
  onSelect,
  onAdd,
  onSearch,
  onQuery,
  onScenario,
  onSettings,
  onLogout,
  onDesignSystem,
  onAdminOpen,
  onAdminGo,
  onAdminSearch,
  onOpenConversation,
}: {
  state: PrototypeState;
  navOpen: boolean;
  present?: boolean;
  /** In-flow rail, or a mobile/compact overlay drawer. */
  presentation?: "rail" | "drawer";
  drawerOpen?: boolean;
  /**
   * Left-rail adaptation:
   * - sidekick — agents roster (conversation mode)
   * - hybrid — admin nav + condensed sidekick (full takeover)
   * - minimized — icon-only hybrid (collapsed from full)
   */
  railMode?: AgentsRailMode;
  onCloseDrawer?: () => void;
  onToggleNav: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onSearch: () => void;
  onQuery: (query: string) => void;
  onScenario: (scenario: "setup" | "active") => void;
  onDesignSystem: () => void;
  onAdminOpen?: (id: string) => void;
  onAdminGo?: (page: PreviewId) => void;
  onAdminSearch?: (scope?: string) => void;
  onOpenConversation?: (id: string) => void;
}) {
  const agents = visibleAgents(state);
  const lead = selectedAgent(state);
  const [menu, setMenu] = useState<"account" | "store" | null>(null);
  const [alerts, setAlerts] = useState(false);
  const [alertsRead, setAlertsRead] = useState(false);
  const alertsRef = useRef<HTMLSpanElement>(null);
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const adminRail = railMode === "hybrid" || railMode === "minimized";
  const [mergePhase, setMergePhase] = useState<MergePhase>(adminRail ? "admin" : "agents");
  const query = state.search.trim().toLowerCase();
  const hiddenItems = state.scenario === "setup" ? [] : hiddenAgents(state);
  const selected = state.agents.find((item) => item.id === state.selectedAgentId);
  const hiddenSelection = selected?.hidden && state.mode === "thread" ? state.selectedAgentId : "";
  const [openedFor, setOpenedFor] = useState("");
  if (hiddenSelection !== openedFor) {
    setOpenedFor(hiddenSelection);
    if (hiddenSelection) setHiddenOpen(true);
  }
  const [openedQuery, setOpenedQuery] = useState("");
  if (query !== openedQuery) {
    setOpenedQuery(query);
    if (query && hiddenItems.length > 0) setHiddenOpen(true);
  }
  const drawer = presentation === "drawer";
  // Drawers always show the expanded roster. Hybrid/minimized use navOpen for width.
  const collapsed = drawer ? false : !navOpen;
  const merging = mergePhase === "collapsing" || mergePhase === "admin";
  const showAgents = mergePhase !== "admin";
  // Defer the CSS shrink one frame so a newly-mounted lead slot paints at nav size first,
  // then eases to the palette size — avoids a popped-small / remount flash.
  const [leadScaled, setLeadScaled] = useState(adminRail);

  // Collapse: fade labels first, then shrink width. Expand: grow width, then fade labels in.
  const [widthCollapsed, setWidthCollapsed] = useState(collapsed);
  const [showLabels, setShowLabels] = useState(!collapsed);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (collapsed) {
      setShowLabels(false);
      const timer = window.setTimeout(() => setWidthCollapsed(true), reduce ? 0 : LABEL_OUT_MS);
      return () => window.clearTimeout(timer);
    }
    setWidthCollapsed(false);
    const timer = window.setTimeout(() => setShowLabels(true), reduce ? 0 : LABEL_IN_MS);
    return () => window.clearTimeout(timer);
  }, [collapsed]);

  useEffect(() => {
    if (adminRail) {
      if (mergePhase === "agents") setMergePhase("collapsing");
      return;
    }
    setMergePhase("agents");
    setLeadScaled(false);
    setAlerts(false);
  }, [adminRail]); // eslint-disable-line react-hooks/exhaustive-deps -- phase machine driven by rail mode edge

  useLayoutEffect(() => {
    if (mergePhase !== "collapsing") {
      if (mergePhase === "admin") setLeadScaled(true);
      if (mergePhase === "agents") setLeadScaled(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setLeadScaled(true);
      return;
    }
    setLeadScaled(false);
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setLeadScaled(true));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [mergePhase]);

  useEffect(() => {
    if (mergePhase !== "collapsing") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setMergePhase("admin"), reduce ? 0 : MERGE_MS);
    return () => window.clearTimeout(timer);
  }, [mergePhase]);

  const recentChats = recentAgentConversations(state, lead.id, 3);

  function pick(id: string) {
    if (adminRail) return;
    onSelect(id);
    if (drawer) onCloseDrawer?.();
  }

  /** Hybrid lead switcher — stays in full/hybrid when applyWorkspace keeps takeover. */
  function switchLead(id: string) {
    setSwitchOpen(false);
    if (id === lead.id) return;
    onSelect(id);
    if (drawer) onCloseDrawer?.();
  }

  useEffect(() => {
    if (!adminRail || widthCollapsed) setSwitchOpen(false);
  }, [adminRail, widthCollapsed]);
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.id === "hidden" ? hiddenItems : agents.filter((item) => railGroup(item) === group.id),
    }))
    .filter((group) => group.items.length > 0);
  const navRef = useRef<HTMLElement>(null);
  const hiddenList = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!hiddenOpen) return;
    hiddenList.current?.scrollIntoView({ block: "nearest" });
  }, [hiddenOpen]);
  const placed = useRef(new Map<string, { left: number; top: number }>());
  const skipSlide = useRef(true);
  const [sliding, setSliding] = useState(false);
  const [hotId, setHotId] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [seenPresent, setSeenPresent] = useState(present);
  if (seenPresent !== present) {
    setSeenPresent(present);
    setRevealing(present);
  }
  useEffect(() => {
    if (!revealing) return;
    const timer = window.setTimeout(() => setRevealing(false), 760);
    return () => window.clearTimeout(timer);
  }, [revealing]);
  const curtain = !present || revealing;

  // FLIP only across sidekick↔hybrid merge. Width collapse already CSS-transitions;
  // FLIP'ing that same move left residual translates on the lead (group thrash).
  // collapsing→admin shares one epoch so the lead isn't re-FLIP'd after settle.
  const flipEpoch = mergePhase === "agents" ? "agents" : "merged";
  useLayoutEffect(() => {
    const root = navRef.current;
    if (!root) return;
    if (root.getBoundingClientRect().width < 8) {
      skipSlide.current = true;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;
    if (!skipSlide.current && !reduce) {
      setSliding(true);
      timer = window.setTimeout(() => setSliding(false), 460);
    }
    skipSlide.current = false;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-flip]")];
    for (const node of nodes) {
      node.getAnimations().forEach((animation) => animation.cancel());
      // Drop any stuck inline translate from a prior interrupted FLIP.
      if (node.style.transform) node.style.removeProperty("transform");
    }
    for (const node of nodes) {
      const id = node.dataset.flip;
      if (!id) continue;
      const box = node.getBoundingClientRect();
      const prev = placed.current.get(id);
      if (prev && !reduce) {
        const dx = prev.left - box.left;
        const dy = prev.top - box.top;
        if (Math.hypot(dx, dy) > 1) {
          const prevTransition = node.style.transition;
          // .press transitions transform — disable so WAAPI can't leave a residual.
          node.style.transition = "none";
          const anim = node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], {
            duration: 420,
            easing: ease,
            fill: "none",
          });
          const clear = () => {
            node.style.removeProperty("transform");
            node.style.transition = prevTransition;
          };
          anim.finished.then(clear).catch(clear);
        }
      }
      placed.current.set(id, { left: box.left, top: box.top });
    }
    return () => window.clearTimeout(timer);
  }, [flipEpoch]);

  // Keep placed map in sync when width/labels change without FLIP'ing (avoids a stale
  // delta the next time merge runs).
  useLayoutEffect(() => {
    const root = navRef.current;
    if (!root || root.getBoundingClientRect().width < 8) return;
    for (const node of root.querySelectorAll<HTMLElement>("[data-flip]")) {
      const id = node.dataset.flip;
      if (!id) continue;
      const box = node.getBoundingClientRect();
      placed.current.set(id, { left: box.left, top: box.top });
    }
  }, [widthCollapsed, showLabels]);

  function agentRow(item: Agent, opts?: { leadSlot?: boolean }) {
    const selectedRow = item.id === state.selectedAgentId && state.mode === "thread";
    const isLead = item.id === lead.id;
    const collapsingAway = merging && !isLead;
    const leadMorph = Boolean(opts?.leadSlot) || (merging && isLead);
    const narrow = widthCollapsed;
    // Lead keeps a fixed size-5 icon box (same as Home/Orders). Orb stays at nav
    // WebGL size and CSS-scales inside — never resize the box, so it can't sit low.
    const orbScale = leadMorph && leadScaled ? ORB_SIZE.palette / ORB_SIZE.nav : 1;
    const button = (
      <button
        type="button"
        data-flip={`agent-${item.id}`}
        aria-current={selectedRow ? "page" : undefined}
        aria-label={
          narrow
            ? item.name
            : leadMorph
              ? `Switch sidekick, current: ${item.name}`
              : undefined
        }
        aria-haspopup={leadMorph && !narrow ? "menu" : undefined}
        aria-expanded={leadMorph && !narrow ? switchOpen : undefined}
        aria-controls={leadMorph && !narrow ? "sidekick-switcher" : undefined}
        onClick={
          leadMorph
            ? () => {
                if (narrow) return;
                setSwitchOpen((open) => !open);
              }
            : () => pick(item.id)
        }
        onMouseEnter={() => setHotId(item.id)}
        onMouseLeave={() => setHotId((current) => (current === item.id ? null : current))}
        className={
          narrow
            ? leadMorph
              ? `press relative mx-auto grid size-8 place-items-center rounded-full text-white hover:shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#9a9a9a]`
              : `press relative grid size-[31px] place-items-center rounded-full ${
                  selectedRow
                    ? "shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#fff]"
                    : "hover:shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#9a9a9a] active:shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#bdbdbd]"
                }`
            : leadMorph
              ? `press press-row relative flex h-8 w-full min-w-0 items-center gap-2 rounded-full py-0 pl-1.5 ${
                  opts?.leadSlot ? "pr-8" : "pr-1.5"
                } text-left transition-[background-color,box-shadow] duration-300 hover:bg-white/[0.08] ${
                  switchOpen ? "bg-white/[0.08]" : ""
                }`
              : `press press-row relative flex h-12 w-full min-w-0 items-center gap-2 rounded-full py-2 pl-2 pr-2 text-left transition-[background-color,box-shadow] duration-300 ${
                  selectedRow ? "btn-dark pr-4" : "hover:bg-white/[0.06] active:bg-white/10"
                }`
        }
        style={
          collapsingAway
            ? {
                opacity: 0,
                transform: "scale(0.96)",
                maxHeight: 0,
                marginTop: 0,
                marginBottom: 0,
                paddingTop: 0,
                paddingBottom: 0,
                overflow: "hidden",
                pointerEvents: "none",
                transition: `opacity 240ms ease, transform ${mergeEase}, max-height ${mergeEase}, margin ${mergeEase}, padding ${mergeEase}`,
              }
            : leadMorph
              ? {
                  // No inline transform — avoids fighting FLIP / .press and leaving a residual offset.
                  opacity: 1,
                  maxHeight: 32,
                  transition: `opacity 240ms ease, max-height ${mergeEase}`,
                }
              : {
                  opacity: 1,
                  transform: "scale(1)",
                  maxHeight: 56,
                  transition: `opacity 240ms ease, transform ${mergeEase}, max-height ${mergeEase}, margin ${mergeEase}, padding ${mergeEase}`,
                }
        }
      >
        <span
          className={
            leadMorph
              ? "relative grid size-5 shrink-0 place-items-center overflow-visible rounded-full"
              : "relative grid shrink-0 place-items-center overflow-visible rounded-full"
          }
          data-flip={leadMorph ? undefined : `agent-orb-${item.id}`}
          style={
            leadMorph
              ? undefined
              : {
                  width: ORB_SIZE.nav,
                  height: ORB_SIZE.nav,
                }
          }
        >
          {leadMorph ? (
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 grid place-items-center"
              style={{
                width: ORB_SIZE.nav,
                height: ORB_SIZE.nav,
                transform: `translate(-50%, -50%) scale(${orbScale})`,
                transformOrigin: "center center",
                transition: `transform ${mergeEase}`,
              }}
            >
              <Orb
                id={item.orb}
                agentId={item.id}
                size={ORB_SIZE.nav}
                colorFrom={item.orbFrom}
                colorTo={item.orbTo}
                presence="selected"
                hot={hotId === item.id}
              />
            </span>
          ) : (
            <Orb
              id={item.orb}
              agentId={item.id}
              size={ORB_SIZE.nav}
              colorFrom={item.orbFrom}
              colorTo={item.orbTo}
              presence={selectedRow ? "selected" : "rest"}
              hot={hotId === item.id}
            />
          )}
          {narrow && !leadMorph && item.unread > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 z-10 grid size-4 place-items-center rounded-full bg-[#5631f4] text-[10px] font-medium text-white ring-2 ring-[#0c0d0c]">
              {item.unread}
            </span>
          ) : null}
        </span>
        {narrow ? null : (
          <span className="min-w-0 flex-1 overflow-hidden">
            <span className="rail-label block truncate text-[13px] font-semibold leading-[1.3] tracking-[-0.13px] text-white" data-show={showLabels ? "true" : "false"}>
              {item.name}
            </span>
            {leadMorph ? null : (
              <span className="rail-label block truncate text-[12px] leading-4 text-[#8e8f8b]" data-show={showLabels ? "true" : "false"}>
                {item.preview}
              </span>
            )}
          </span>
        )}
        {!narrow && item.unread > 0 && !leadMorph ? (
          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[#5631f4] text-[11px] font-medium text-white">
            {item.unread}
          </span>
        ) : null}
      </button>
    );
    if (opts?.leadSlot) {
      return (
        <div
          key={`lead-${item.id}`}
          className={narrow ? "flex w-full justify-center" : "relative w-full"}
        >
          {button}
          {!narrow ? (
            <>
              <span
                aria-hidden
                className={`pointer-events-none absolute right-1.5 top-1/2 z-10 grid size-4 -translate-y-1/2 place-items-center text-[#8e8f8b] transition-transform duration-200 ${
                  switchOpen ? "rotate-180 text-white" : ""
                }`}
              >
                <PIcon name="ChevronDown" size={16} />
              </span>
              {switchOpen ? (
                <SidekickSwitcher
                  state={state}
                  current={lead.id}
                  onDismiss={() => setSwitchOpen(false)}
                  onPick={switchLead}
                  onAdd={() => {
                    setSwitchOpen(false);
                    onAdd();
                  }}
                  className="left-0 right-0 top-[calc(100%+6px)] z-40 w-full origin-top-left p-1.5"
                />
              ) : null}
            </>
          ) : null}
        </div>
      );
    }
    return narrow ? (
      <Tip key={item.id} label={item.name} side="right" fixed>
        {button}
      </Tip>
    ) : (
      <span key={item.id} className="contents">
        {button}
      </span>
    );
  }

  function search() {
    // In full/hybrid the top search opens the admin palette; sidekick mode searches agents.
    if (adminRail) {
      if (collapsed) onToggleNav();
      onAdminSearch?.();
      return;
    }
    if (collapsed) {
      onToggleNav();
      if (!state.searchOpen) onSearch();
      return;
    }
    onSearch();
  }

  const parked = !present;
  if (drawer && !drawerOpen) return null;

  const logoLabel = drawer ? "Close sidekicks" : navOpen ? "Collapse navigation" : "Expand navigation";
  const narrow = widthCollapsed;

  const body = (
    <aside
      ref={navRef}
      data-agents={drawer ? "drawer" : railMode === "sidekick" ? "rail" : railMode}
      data-rail={railMode}
      data-merge={mergePhase}
      className={
        drawer
          ? "shell-agents-drawer relative flex h-full w-[min(100vw-3rem,280px)] max-w-[280px] flex-col bg-[#0c0d0c] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))] text-white shadow-[8px_0_40px_rgba(0,0,0,0.45)]"
          : `relative flex h-full min-w-0 shrink-0 flex-col pb-3 pt-7 motion-reduce:transition-none ${
              narrow ? "w-[64px]" : "w-[248px] px-3"
            } ${parked || curtain ? "overflow-hidden" : ""}`
      }
      style={drawer || curtain ? undefined : { transition: `width ${move}` }}
    >
      <button
        type="button"
        data-flip="logo"
        aria-label={logoLabel}
        aria-expanded={drawer ? true : navOpen}
        aria-keyshortcuts={drawer ? undefined : "Control+B Meta+B"}
        onClick={drawer ? () => onCloseDrawer?.() : onToggleNav}
        className={`group/logo press absolute top-7 z-20 grid size-8 place-items-center rounded-full transition-[left,colors] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/[0.08] ${
          narrow ? "left-4" : "left-5"
        }`}
      >
        <span className="transition-opacity duration-150 group-hover/logo:opacity-0 group-focus-visible/logo:opacity-0">
          <ShopifyMark />
        </span>
        <span className="absolute inset-0 grid place-items-center text-white opacity-0 transition-opacity duration-150 group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100">
          <PIcon name={drawer ? "X" : "LayoutSidebarLeft"} size={20} />
        </span>
      </button>
      <div
        inert={parked ? true : undefined}
        aria-hidden={parked || undefined}
        className={`flex min-h-0 flex-1 flex-col ${narrow ? "" : "gap-4"} ${parked ? "pointer-events-none -translate-x-full opacity-0" : ""} ${!parked && curtain ? "nav-reveal" : ""}`}
      >
        <div className={`relative z-0 flex bg-transparent ${narrow ? "flex-col items-center gap-4" : "items-center gap-1.5 pb-4 pl-2"}`}>
          <span className={`size-8 shrink-0 ${narrow ? "mb-2" : ""}`} aria-hidden />
          <span data-flip="add" className={narrow ? "" : "ml-auto"}>
            <IconButton
              label="Add a sidekick"
              onClick={() => {
                if (adminRail && collapsed) onToggleNav();
                onAdd();
              }}
              active={state.mode === "add"}
            >
              <PIcon name="Plus" size={20} />
            </IconButton>
          </span>
          <span data-flip="search">
            <IconButton
              label={adminRail ? "Search" : state.searchOpen ? "Close search" : "Search sidekicks"}
              onClick={search}
              active={!adminRail && state.searchOpen}
            >
              <PIcon name={!adminRail && state.searchOpen ? "X" : "Search"} size={20} />
            </IconButton>
          </span>
        </div>

        {narrow ? <div className="mx-auto mt-6 h-px w-8 bg-white/15" aria-hidden /> : null}

        {state.searchOpen && !narrow && !adminRail ? (
          <div className="rise -mt-4 px-1">
            <s-search-field
              label="Search sidekicks"
              labelAccessibilityVisibility="exclusive"
              placeholder="Search sidekicks"
              value={state.search}
              onInput={(event) => onQuery(event.currentTarget.value)}
            />
          </div>
        ) : null}

        <div className="relative flex min-h-0 flex-1 flex-col">
          {merging ? (
            // Lead mounts once for collapsing→admin (no SidekickLead swap). Recent + admin
            // share the same reveal timing. Orb stays at nav WebGL size and CSS-scales down.
            <div
              className={`relative z-20 flex min-h-0 flex-1 flex-col ${narrow ? "items-center" : "px-0.5"}`}
            >
              <div className={`mb-6 flex w-full shrink-0 flex-col ${narrow ? "items-center gap-0.5" : "gap-0.5"}`}>
                {agentRow(lead, { leadSlot: true })}
                {/* Keep the chats block mounted; collapse height instead of unmount so the group doesn't jump. */}
                <div
                  className={`w-full overflow-hidden ${mergePhase === "collapsing" && !narrow ? "admin-rail-rise" : ""}`}
                  style={{
                    maxHeight: narrow ? 0 : 120,
                    opacity: narrow ? 0 : undefined,
                    transform: mergePhase === "admin" ? "none" : undefined,
                    pointerEvents: narrow ? "none" : undefined,
                    transition: `max-height ${mergeEase}, opacity 200ms ease`,
                  }}
                >
                  <SidekickRecentChats
                    expanded
                    labels={showLabels}
                    items={recentChats}
                    onOpen={(id) => onOpenConversation?.(id)}
                  />
                </div>
              </div>
              <div
                className={`flex min-h-0 w-full flex-1 flex-col ${narrow ? "items-center" : ""} ${
                  mergePhase === "collapsing" ? "admin-rail-rise" : ""
                }`}
                style={mergePhase === "admin" ? { opacity: 1, transform: "none" } : undefined}
              >
                <AdminNavSections
                  expanded={!narrow}
                  labels={showLabels}
                  preview={state.preview}
                  onOpen={(id) => onAdminOpen?.(id)}
                  onGo={(page) => onAdminGo?.(page)}
                  onSearchApps={() => onAdminSearch?.("Apps")}
                />
              </div>
            </div>
          ) : null}

          {showAgents ? (
            <div
              className={`scroll-thin relative z-10 flex min-h-0 flex-1 flex-col ${
                narrow ? "items-center pt-6 [scrollbar-gutter:stable_both-edges]" : "gap-4"
              } ${sliding ? "overflow-visible" : "overflow-x-hidden overflow-y-auto"} ${
                merging ? "pointer-events-none absolute inset-0" : ""
              }`}
              style={
                merging
                  ? {
                      opacity: 0,
                      transition: `opacity 220ms ease`,
                    }
                  : undefined
              }
            >
              {visibleGroups.map((group, index) => {
                const hidden = group.id === "hidden";
                const open = !hidden || hiddenOpen;
                // Lead is rendered in the hybrid slot while merging — omit it here.
                const items = merging ? group.items.filter((item) => item.id !== lead.id) : group.items;
                if (merging && items.length === 0 && !hidden) return null;
                return (
                  <div
                    key={group.id}
                    className={narrow ? "" : "flex min-w-0 flex-col gap-2"}
                    style={
                      merging
                        ? {
                            opacity: 0,
                            transform: "translateY(-6px)",
                            transition: `opacity 220ms ease, transform ${mergeEase}`,
                          }
                        : undefined
                    }
                  >
                    {narrow && index > 0 && !hidden ? <div className="mx-auto mb-6 mt-6 h-px w-8 bg-white/15" aria-hidden /> : null}
                    {hidden ? (
                      <button
                        type="button"
                        aria-expanded={hiddenOpen}
                        aria-controls="hidden-sidekicks"
                        aria-label={narrow ? (hiddenOpen ? "Hide sidekicks" : "Show hidden sidekicks") : undefined}
                        onClick={() => setHiddenOpen((value) => !value)}
                        className={
                          narrow
                            ? "press mx-auto mb-6 mt-6 grid h-6 w-8 place-items-center"
                            : "press flex h-8 w-full items-center gap-1.5 rounded-full px-2.5 text-left hover:bg-white/[0.06]"
                        }
                      >
                        {narrow ? (
                          <span className={`h-px w-8 ${hiddenOpen ? "bg-white/40" : "bg-white/15"}`} />
                        ) : (
                          <>
                            <span className="rail-label shrink-0 text-[13px] leading-4 tracking-[-0.13px] text-[#7d7f7c]" data-show={showLabels ? "true" : "false"}>
                              {group.label}
                            </span>
                            <span className={`h-px min-w-2 flex-1 ${hiddenOpen ? "bg-white/30" : "bg-white/10"}`} />
                            <PIcon name={hiddenOpen ? "ChevronUp" : "ChevronDown"} size={16} />
                          </>
                        )}
                      </button>
                    ) : !narrow && group.label ? (
                      <div className="flex h-8 items-center gap-1.5 px-2.5">
                        <span className="rail-label shrink-0 text-[13px] leading-4 tracking-[-0.13px] text-[#7d7f7c]" data-show={showLabels ? "true" : "false"}>
                          {group.label}
                        </span>
                        <span className="h-px min-w-2 flex-1 bg-white/10" />
                      </div>
                    ) : null}
                    {open && items.length ? (
                      <div
                        id={hidden ? "hidden-sidekicks" : undefined}
                        ref={hidden ? hiddenList : undefined}
                        className={narrow ? "flex flex-col items-center gap-4" : "flex flex-col gap-2"}
                      >
                        {items.map((item) => agentRow(item))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className={`mb-3 flex items-center ${narrow ? "mt-6 flex-col" : "gap-1.5 pl-2"}`}>
          <span className={`group/ids relative flex ${narrow ? "flex-col items-center" : "items-center"}`} data-open={menu ? "" : undefined}>
            <span className="relative z-10" data-flip="account">
              <button
                type="button"
                aria-label="Your account"
                aria-expanded={menu === "account"}
                aria-controls="account-menu"
                onClick={() => setMenu(menu === "account" ? null : "account")}
                className={`press block rounded-full ring-2 ring-[#0c0d0c] transition-shadow duration-150 hover:shadow-[0_0_0_4px_rgba(255,255,255,0.14)] ${
                  menu === "account" ? "shadow-[0_0_0_4px_rgba(255,255,255,0.22)]" : ""
                }`}
              >
                <img src="/assets/user.png" alt="" className="size-[31px] rounded-full object-cover" />
              </button>
              {menu === "account" ? (
                <AccountMenu
                  storeName={state.storeName}
                  scenario={state.scenario}
                  className={narrow ? "bottom-0 left-[calc(100%+10px)] origin-bottom-left" : "bottom-[calc(100%+8px)] left-0 origin-bottom-left"}
                  onClose={() => setMenu(null)}
                  onSettings={onSettings}
                  onLogout={onLogout}
                  onScenario={onScenario}
                  onDesignSystem={() => {
                    setMenu(null);
                    onDesignSystem();
                  }}
                />
              ) : null}
            </span>
            <span
              data-flip="store"
              className={`relative ${
                narrow
                  ? "-mt-3 group-hover/ids:mt-1.5 group-focus-within/ids:mt-1.5 group-data-[open]/ids:mt-1.5"
                  : "-ml-3 group-hover/ids:ml-1.5 group-focus-within/ids:ml-1.5 group-data-[open]/ids:ml-1.5"
              }`}
              style={{ transition: `margin ${move}` }}
            >
              <button
                type="button"
                aria-label={`${state.storeName}: switch stores`}
                aria-expanded={menu === "store"}
                aria-controls="store-menu"
                onClick={() => setMenu(menu === "store" ? null : "store")}
                className={`press grid size-[31px] place-items-center rounded-full bg-[#36fba1] text-[11px] font-bold text-[#0b3b26] transition-shadow duration-150 hover:shadow-[0_0_0_4px_rgba(255,255,255,0.14)] ${
                  menu === "store" ? "shadow-[0_0_0_4px_rgba(255,255,255,0.22)]" : ""
                }`}
              >
                {initials(state.storeName)}
              </button>
              {menu === "store" ? (
                <StoreMenu
                  storeName={state.storeName}
                  className={narrow ? "bottom-0 left-[calc(100%+10px)] origin-bottom-left" : "bottom-[calc(100%+8px)] left-0 origin-bottom-left"}
                  onClose={() => setMenu(null)}
                  onSettings={onSettings}
                />
              ) : null}
            </span>
          </span>
          <span className={`relative flex items-center gap-1.5 ${narrow ? "mt-2 flex-col" : "ml-auto pr-1"}`}>
            <span ref={alertsRef} className="relative">
              <IconButton
                label="Alerts"
                active={alerts}
                controls="alerts-menu"
                onClick={() => setAlerts((open) => !open)}
              >
                <PIcon name="Notification" size={20} />
              </IconButton>
              {alertsRead ? null : (
                <span className="pointer-events-none absolute -right-0.5 -top-0.5 grid size-3.5 place-items-center rounded-full bg-[#e51c00] text-[9px] font-bold text-white">
                  1
                </span>
              )}
              {alerts ? (
                <Alerts
                  anchorRef={alertsRef}
                  read={alertsRead}
                  onRead={() => setAlertsRead(true)}
                  onClose={() => setAlerts(false)}
                  onOpen={() => onAdminOpen?.("pos")}
                />
              ) : null}
            </span>
            <IconButton
              label="Settings"
              onClick={() => {
                if (onAdminOpen) onAdminOpen("settings");
                else onSettings();
              }}
            >
              <PIcon name="Settings" size={20} />
            </IconButton>
          </span>
        </div>
      </div>
    </aside>
  );

  if (!drawer) return body;

  return (
    <div className="shell-agents-layer fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Sidekicks">
      <button type="button" className="shell-scrim absolute inset-0 bg-black/50" aria-label="Close sidekicks" onClick={() => onCloseDrawer?.()} />
      <div className="absolute inset-y-0 left-0 flex">{body}</div>
    </div>
  );
}

