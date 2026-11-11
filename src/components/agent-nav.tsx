"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AccountMenu, AdminNavSections, Alerts, initials, SidekickLead, StoreMenu } from "@/components/admin-rail";
import { IconButton, Orb, ShopifyMark } from "@/components/marks";
import { ORB_SIZE } from "@/voiceorbs/lib/orb-model";
import { Tip } from "@/components/chat-column";
import { PIcon } from "@/components/polaris-icon";
import type { PreviewId } from "@/lib/admin-nav";
import { hiddenAgents, railGroup, selectedAgent, visibleAgents, type Agent, type AgentGroup, type PrototypeState } from "@/lib/prototype";

const groups: { id: AgentGroup; label: string | null }[] = [
  { id: "favorites", label: null },
  { id: "teams", label: "Team" },
  { id: "channels", label: "Channels" },
  { id: "tools", label: "Tools" },
  { id: "hidden", label: "Hidden" },
];

const move = "420ms cubic-bezier(0.22, 1, 0.36, 1)";
const mergeEase = "480ms cubic-bezier(0.22, 1, 0.36, 1)";

type MergePhase = "agents" | "collapsing" | "admin";

export function AgentNav({
  state,
  navOpen,
  present = true,
  presentation = "rail",
  drawerOpen = false,
  merged = false,
  onCloseDrawer,
  onToggleNav,
  onSelect,
  onAdd,
  onSearch,
  onQuery,
  onScenario,
  onArrival,
  onMenuStyle,
  onSettings,
  onLogout,
  onDesignSystem,
  onViewSidekicks,
  onAdminOpen,
  onAdminGo,
  onAdminSearch,
}: {
  state: PrototypeState;
  navOpen: boolean;
  present?: boolean;
  /** In-flow rail, or a mobile/compact overlay drawer. */
  presentation?: "rail" | "drawer";
  drawerOpen?: boolean;
  /** Full layout: morph sidekick roster into Shopify admin nav. */
  merged?: boolean;
  onCloseDrawer?: () => void;
  onToggleNav: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onSearch: () => void;
  onQuery: (query: string) => void;
  onScenario: (scenario: "setup" | "active") => void;
  onArrival: (arrival: "tasks" | "sidekick") => void;
  onMenuStyle: (style: "push" | "drop") => void;
  onDesignSystem: () => void;
  onViewSidekicks?: () => void;
  onAdminOpen?: (id: string) => void;
  onAdminGo?: (page: PreviewId) => void;
  onAdminSearch?: (scope?: string) => void;
}) {
  const agents = visibleAgents(state);
  const lead = selectedAgent(state);
  const [menu, setMenu] = useState<"account" | "store" | null>(null);
  const [alerts, setAlerts] = useState(false);
  const [alertsRead, setAlertsRead] = useState(false);
  const alertsRef = useRef<HTMLSpanElement>(null);
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const [mergePhase, setMergePhase] = useState<MergePhase>(merged ? "admin" : "agents");
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
  // Drawers always show the expanded roster so agents are easy to pick on a phone.
  // Full merge always shows labels.
  const collapsed = drawer || merged ? false : !navOpen;
  const merging = mergePhase === "collapsing" || mergePhase === "admin";
  const showAdmin = mergePhase === "collapsing" || mergePhase === "admin";
  const showAgents = mergePhase !== "admin";

  useEffect(() => {
    if (merged) {
      if (mergePhase === "agents") setMergePhase("collapsing");
      return;
    }
    setMergePhase("agents");
    setAlerts(false);
  }, [merged]); // eslint-disable-line react-hooks/exhaustive-deps -- phase machine driven by merged edge

  useEffect(() => {
    if (mergePhase !== "collapsing") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setMergePhase("admin"), reduce ? 0 : 520);
    return () => window.clearTimeout(timer);
  }, [mergePhase]);

  function pick(id: string) {
    if (merged) return;
    onSelect(id);
    if (drawer) onCloseDrawer?.();
  }
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

  // Icons share one layout in both widths. When the column rearranges, each icon
  // slides from where it was instead of popping. The list can paint outside its
  // scroller for that moment so the moving orbs aren't covered by the header.
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
    for (const node of nodes) node.getAnimations().forEach((animation) => animation.cancel());
    for (const node of nodes) {
      const id = node.dataset.flip;
      if (!id) continue;
      const box = node.getBoundingClientRect();
      const prev = placed.current.get(id);
      if (prev && !reduce) {
        const dx = prev.left - box.left;
        const dy = prev.top - box.top;
        if (Math.hypot(dx, dy) > 1) {
          node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], {
            duration: 420,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          });
        }
      }
      placed.current.set(id, { left: box.left, top: box.top });
    }
    return () => window.clearTimeout(timer);
  }, [collapsed]);

  function agentRow(item: Agent, stackIndex: number) {
    const selectedRow = item.id === state.selectedAgentId && state.mode === "thread";
    const isLead = item.id === lead.id;
    const collapsingAway = merging && !isLead;
    const button = (
      <button
        type="button"
        data-flip={`agent-${item.id}`}
        aria-current={selectedRow ? "page" : undefined}
        aria-label={collapsed ? item.name : merging && isLead ? `View sidekicks — ${item.name}` : undefined}
        onClick={merging && isLead ? () => onViewSidekicks?.() : () => pick(item.id)}
        onMouseEnter={() => setHotId(item.id)}
        onMouseLeave={() => setHotId((current) => (current === item.id ? null : current))}
        className={
          collapsed
            ? `press relative grid size-[31px] place-items-center rounded-full ${
                selectedRow
                  ? "shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#fff]"
                  : "hover:shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#9a9a9a] active:shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#bdbdbd]"
              }`
            : `press press-row relative flex h-12 w-full min-w-0 items-center gap-2 rounded-full py-2 pl-2 pr-2 text-left transition-[background-color,box-shadow] duration-300 ${
                selectedRow || (merging && isLead) ? "btn-dark pr-4" : "hover:bg-white/[0.06] active:bg-white/10"
              }`
        }
        style={
          collapsingAway
            ? {
                // Sweep upward into the lead; farther rows travel farther.
                opacity: 0,
                transform: `translateY(${-28 - stackIndex * 36}px) scale(0.82)`,
                maxHeight: 0,
                marginTop: 0,
                marginBottom: 0,
                paddingTop: 0,
                paddingBottom: 0,
                overflow: "hidden",
                pointerEvents: "none",
                transition: `opacity ${mergeEase}, transform ${mergeEase}, max-height ${mergeEase}, margin ${mergeEase}, padding ${mergeEase}`,
              }
            : {
                opacity: 1,
                transform: "translateY(0) scale(1)",
                transition: `opacity ${mergeEase}, transform ${mergeEase}, max-height ${mergeEase}, margin ${mergeEase}, padding ${mergeEase}`,
              }
        }
      >
        <span className="relative grid size-[31px] shrink-0 place-items-center rounded-full">
          <Orb
            id={item.orb}
            agentId={item.id}
            size={ORB_SIZE.nav}
            colorFrom={item.orbFrom}
            colorTo={item.orbTo}
            presence={selectedRow || (merging && isLead) ? "selected" : "rest"}
            hot={hotId === item.id}
          />
          {collapsed && item.unread > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 z-10 grid size-4 place-items-center rounded-full bg-[#5631f4] text-[10px] font-medium text-white ring-2 ring-[#0c0d0c]">
              {item.unread}
            </span>
          ) : null}
        </span>
        {collapsed ? null : (
          <span className="min-w-0 flex-1 overflow-hidden">
            <span className="block truncate whitespace-nowrap text-[13px] font-semibold leading-[1.3] tracking-[-0.13px] text-white">
              {item.name}
            </span>
            <span className="block truncate whitespace-nowrap text-[12px] leading-4 text-[#8e8f8b]">
              {merging && isLead ? "View sidekicks" : item.preview}
            </span>
          </span>
        )}
        {!collapsed && item.unread > 0 && !(merging && isLead) ? (
          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[#5631f4] text-[11px] font-medium text-white">
            {item.unread}
          </span>
        ) : null}
      </button>
    );
    return collapsed ? (
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
    if (merged) return;
    if (collapsed) {
      onToggleNav();
      if (!state.searchOpen) onSearch();
      return;
    }
    onSearch();
  }

  const parked = !present;
  if (drawer && !drawerOpen) return null;

  let agentStack = 0;

  const body = (
    <aside
      ref={navRef}
      data-agents={drawer ? "drawer" : merged ? "merged" : "rail"}
      data-merge={mergePhase}
      className={
        drawer
          ? "shell-agents-drawer relative flex h-full w-[min(100vw-3rem,280px)] max-w-[280px] flex-col bg-[#0c0d0c] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))] text-white shadow-[8px_0_40px_rgba(0,0,0,0.45)]"
          : `relative flex h-full min-w-0 shrink-0 flex-col pb-3 pt-7 motion-reduce:transition-none ${collapsed ? "w-[64px]" : "w-[248px] px-3"} ${parked || curtain ? "overflow-hidden" : ""}`
      }
      style={drawer || curtain ? undefined : { transition: `width ${move}` }}
    >
      <button
        type="button"
        data-flip="logo"
        aria-label={
          drawer ? "Close sidekicks" : merged ? "Shopify" : navOpen ? "Collapse navigation" : "Expand navigation"
        }
        aria-expanded={drawer || merged ? true : navOpen}
        aria-keyshortcuts={drawer || merged ? undefined : "Control+B Meta+B"}
        onClick={drawer ? () => onCloseDrawer?.() : merged ? undefined : onToggleNav}
        className={`group/logo press absolute top-7 z-20 grid size-8 place-items-center rounded-full transition-colors hover:bg-white/[0.08] ${collapsed ? "left-4" : "left-5"}`}
      >
        <span className={`transition-opacity duration-150 ${merged ? "" : "group-hover/logo:opacity-0 group-focus-visible/logo:opacity-0"}`}>
          <ShopifyMark />
        </span>
        {merged ? null : (
          <span className="absolute inset-0 grid place-items-center text-white opacity-0 transition-opacity duration-150 group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100">
            <PIcon name={drawer ? "X" : "LayoutSidebarLeft"} size={20} />
          </span>
        )}
      </button>
      <div
        inert={parked ? true : undefined}
        aria-hidden={parked || undefined}
        className={`flex min-h-0 flex-1 flex-col ${collapsed ? "" : "gap-4"} ${parked ? "pointer-events-none -translate-x-full opacity-0" : ""} ${!parked && curtain ? "nav-reveal" : ""}`}
      >
        <div className={`relative z-0 flex bg-transparent ${collapsed ? "flex-col items-center gap-4" : "items-center gap-1.5 pb-4 pl-2"}`}>
          <span className={`size-8 shrink-0 ${collapsed ? "mb-2" : ""}`} aria-hidden />
          <span
            data-flip="add"
            className={`${collapsed ? "" : "ml-auto"} transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              merging ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <IconButton label="Add a sidekick" onClick={onAdd} active={state.mode === "add"}>
              <PIcon name="Plus" size={20} />
            </IconButton>
          </span>
          <span
            data-flip="search"
            className={`transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              merging ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <IconButton label={state.searchOpen ? "Close search" : "Search sidekicks"} onClick={search} active={state.searchOpen}>
              <PIcon name={state.searchOpen ? "X" : "Search"} size={20} />
            </IconButton>
          </span>
        </div>

        {collapsed ? <div className="mx-auto mt-6 h-px w-8 bg-white/15" aria-hidden /> : null}

        {state.searchOpen && !collapsed && !merging ? (
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
          {showAgents ? (
            <div
              className={`scroll-thin relative z-10 flex min-h-0 flex-1 flex-col ${
                collapsed ? "pt-6 [scrollbar-gutter:stable_both-edges]" : "gap-4"
              } ${sliding ? "overflow-visible" : "overflow-x-hidden overflow-y-auto"}`}
              style={{ transition: `opacity ${mergeEase}` }}
            >
              {visibleGroups.map((group, index) => {
                const hidden = group.id === "hidden";
                const open = !hidden || hiddenOpen;
                return (
                  <div
                    key={group.id}
                    className={collapsed ? "" : "flex min-w-0 flex-col gap-2"}
                    style={
                      merging && !group.items.some((item) => item.id === lead.id)
                        ? { opacity: 0, maxHeight: 0, overflow: "hidden", transition: `opacity ${mergeEase}, max-height ${mergeEase}` }
                        : undefined
                    }
                  >
                    {collapsed && index > 0 && !hidden ? <div className="mx-auto mb-6 mt-6 h-px w-8 bg-white/15" aria-hidden /> : null}
                    {hidden ? (
                      <button
                        type="button"
                        aria-expanded={hiddenOpen}
                        aria-controls="hidden-sidekicks"
                        aria-label={collapsed ? (hiddenOpen ? "Hide sidekicks" : "Show hidden sidekicks") : undefined}
                        onClick={() => setHiddenOpen((value) => !value)}
                        className={
                          collapsed
                            ? "press mx-auto mb-6 mt-6 grid h-6 w-8 place-items-center"
                            : "press flex h-8 w-full items-center gap-1.5 rounded-lg px-2.5 text-left hover:bg-white/[0.06]"
                        }
                        style={merging ? { opacity: 0, pointerEvents: "none" } : undefined}
                      >
                        {collapsed ? (
                          <span className={`h-px w-8 ${hiddenOpen ? "bg-white/40" : "bg-white/15"}`} />
                        ) : (
                          <>
                            <span className="shrink-0 whitespace-nowrap text-[13px] leading-4 tracking-[-0.13px] text-[#7d7f7c]">{group.label}</span>
                            <span className={`h-px min-w-2 flex-1 ${hiddenOpen ? "bg-white/30" : "bg-white/10"}`} />
                            <PIcon name={hiddenOpen ? "ChevronUp" : "ChevronDown"} size={16} />
                          </>
                        )}
                      </button>
                    ) : !collapsed && group.label ? (
                      <div
                        className="flex h-8 items-center gap-1.5 px-2.5"
                        style={merging ? { opacity: 0, transition: `opacity ${mergeEase}` } : undefined}
                      >
                        <span className="shrink-0 whitespace-nowrap text-[13px] leading-4 tracking-[-0.13px] text-[#7d7f7c]">{group.label}</span>
                        <span className="h-px min-w-2 flex-1 bg-white/10" />
                      </div>
                    ) : null}
                    {open ? (
                      <div
                        id={hidden ? "hidden-sidekicks" : undefined}
                        ref={hidden ? hiddenList : undefined}
                        className={collapsed ? "flex flex-col items-center gap-4" : "flex flex-col gap-2"}
                      >
                        {group.items.map((item) => agentRow(item, agentStack++))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {showAdmin ? (
            <div
              className={`admin-rail-rise z-20 flex min-h-0 flex-col px-0.5 ${
                mergePhase === "admin" ? "relative flex-1" : "pointer-events-none absolute inset-0"
              }`}
            >
              {mergePhase === "admin" ? (
                <SidekickLead agent={lead} expanded onView={() => onViewSidekicks?.()} />
              ) : (
                // Spacer matching the lead so rising nav lands under it.
                <div className="mb-3 h-12 shrink-0" aria-hidden />
              )}
              <AdminNavSections
                expanded
                preview={state.preview}
                onOpen={(id) => onAdminOpen?.(id)}
                onGo={(page) => onAdminGo?.(page)}
                onSearchApps={() => onAdminSearch?.("Apps")}
              />
            </div>
          ) : null}
        </div>

        <div className={`mb-3 flex items-center ${collapsed ? "mt-6 flex-col" : "gap-1.5 pl-2"}`}>
          <span className={`group/ids relative flex ${collapsed ? "flex-col items-center" : "items-center"}`} data-open={menu ? "" : undefined}>
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
                  arrival={state.arrival}
                  menuStyle={state.menuStyle}
                  className={collapsed ? "bottom-0 left-[calc(100%+10px)] origin-bottom-left" : "bottom-[calc(100%+8px)] left-0 origin-bottom-left"}
                  onClose={() => setMenu(null)}
                  onSettings={onSettings}
                  onLogout={onLogout}
                  onScenario={onScenario}
                  onArrival={(arrival) => {
                    setMenu(null);
                    onArrival(arrival);
                  }}
                  onMenuStyle={onMenuStyle}
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
                collapsed
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
                  className={collapsed ? "bottom-0 left-[calc(100%+10px)] origin-bottom-left" : "bottom-[calc(100%+8px)] left-0 origin-bottom-left"}
                  onClose={() => setMenu(null)}
                  onSettings={onSettings}
                />
              ) : null}
            </span>
          </span>
          <span
            className={`relative flex items-center gap-1.5 ${
              collapsed ? "mt-2 flex-col" : "ml-auto pr-1"
            }`}
          >
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
