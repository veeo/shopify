"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AccountMenu, initials, StoreMenu } from "@/components/admin-rail";
import { IconButton, Orb, ShopifyMark } from "@/components/marks";
import { Tip } from "@/components/chat-column";
import { PIcon } from "@/components/polaris-icon";
import { visibleAgents, type AgentGroup, type PrototypeState } from "@/lib/prototype";

const groups: { id: AgentGroup; label: string | null }[] = [
  { id: "favorites", label: null },
  { id: "teams", label: "Teams" },
  { id: "channels", label: "Channels" },
  { id: "tools", label: "Tools" },
  { id: "hidden", label: "Hidden" },
];

const move = "420ms cubic-bezier(0.22, 1, 0.36, 1)";

export function AgentNav({
  state,
  navOpen,
  onToggleNav,
  onSelect,
  onAdd,
  onSearch,
  onQuery,
  onScenario,
  onMenuStyle,
  onSettings,
  onLogout,
}: {
  state: PrototypeState;
  navOpen: boolean;
  onToggleNav: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onSearch: () => void;
  onQuery: (query: string) => void;
  onScenario: (scenario: "setup" | "active") => void;
  onMenuStyle: (style: "push" | "drop") => void;
}) {
  const agents = visibleAgents(state);
  const [menu, setMenu] = useState<"account" | "store" | null>(null);
  const collapsed = !navOpen;
  const showHidden = state.scenario === "active" || state.agents.some((item) => item.installed && item.group === "hidden");
  const visibleGroups = groups
    .map((group) => ({ ...group, items: agents.filter((item) => item.group === group.id) }))
    .filter((group) => {
      if (group.id !== "hidden") return group.items.length > 0;
      if (collapsed && group.items.length === 0) return false;
      return showHidden;
    });
  const navRef = useRef<HTMLElement>(null);
  const placed = useRef(new Map<string, { left: number; top: number }>());
  const skipSlide = useRef(true);
  const [sliding, setSliding] = useState(false);

  // Icons share one layout in both widths. When the column rearranges, each icon
  // slides from where it was instead of popping. The list can paint outside its
  // scroller for that moment so the moving orbs aren't covered by the header.
  useLayoutEffect(() => {
    const root = navRef.current;
    if (!root) return;
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

  function search() {
    if (collapsed) {
      onToggleNav();
      if (!state.searchOpen) onSearch();
      return;
    }
    onSearch();
  }

  return (
    <aside
      ref={navRef}
      className={`flex h-full shrink-0 flex-col pb-3 pt-7 motion-reduce:transition-none ${
        collapsed ? "w-[64px]" : "w-[248px] gap-4 px-3"
      }`}
      style={{ transition: `width ${move}` }}
    >
      <div className={`relative z-0 flex bg-transparent ${collapsed ? "flex-col items-center gap-4" : "items-center gap-1.5 pb-4 pl-2"}`}>
        <button
          type="button"
          data-flip="logo"
          aria-label={navOpen ? "Collapse navigation" : "Expand navigation"}
          aria-expanded={navOpen}
          aria-keyshortcuts="Control+B Meta+B"
          onClick={onToggleNav}
          className={`group/logo press relative grid size-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/[0.08] ${collapsed ? "mb-2" : ""}`}
        >
          <span className="transition-opacity duration-150 group-hover/logo:opacity-0 group-focus-visible/logo:opacity-0">
            <ShopifyMark />
          </span>
          <span className="absolute inset-0 grid place-items-center text-white opacity-0 transition-opacity duration-150 group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100">
            <PIcon name="LayoutSidebarLeft" size={20} />
          </span>
        </button>
        <span data-flip="add" className={collapsed ? "" : "ml-auto"}>
          <IconButton label="Add a sidekick" onClick={onAdd} active={state.mode === "add"}>
            <PIcon name="Plus" size={20} />
          </IconButton>
        </span>
        <span data-flip="search">
          <IconButton label={state.searchOpen ? "Close search" : "Search sidekicks"} onClick={search} active={state.searchOpen}>
            <PIcon name={state.searchOpen ? "X" : "Search"} size={20} />
          </IconButton>
        </span>
      </div>

      {collapsed ? <div className="mx-auto mt-6 h-px w-8 bg-white/15" aria-hidden /> : null}

      {state.searchOpen && !collapsed ? (
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

      <div
        className={`scroll-thin relative z-10 flex min-h-0 flex-1 flex-col ${
          collapsed ? "pt-6 [scrollbar-gutter:stable_both-edges]" : "gap-4"
        } ${sliding ? "overflow-visible" : "overflow-x-hidden overflow-y-auto"}`}
      >
        {visibleGroups.map((group, index) => (
          <div key={group.id} className={collapsed ? "" : "flex min-w-0 flex-col gap-2"}>
            {collapsed && index > 0 ? <div className="mx-auto mb-6 mt-6 h-px w-8 bg-white/15" aria-hidden /> : null}
            {!collapsed && group.label ? (
              <div className="flex h-8 items-center gap-1.5 px-2.5">
                <span className="shrink-0 whitespace-nowrap text-[13px] leading-4 tracking-[-0.13px] text-[#7d7f7c]">{group.label}</span>
                <span className="h-px min-w-2 flex-1 bg-white/10" />
              </div>
            ) : null}
            <div className={collapsed ? "flex flex-col items-center gap-4" : "flex flex-col gap-2"}>
              {group.items.map((item) => {
                const selected = item.id === state.selectedAgentId && state.mode === "thread";
                const button = (
                  <button
                    type="button"
                    data-flip={`agent-${item.id}`}
                    aria-current={selected ? "page" : undefined}
                    aria-label={collapsed ? item.name : undefined}
                    onClick={() => onSelect(item.id)}
                    className={
                      collapsed
                        ? `press relative grid size-[31px] place-items-center rounded-full ${
                            selected
                              ? "shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#fff]"
                              : "hover:shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#9a9a9a] active:shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#bdbdbd]"
                          }`
                        : `press press-row relative flex h-12 w-full min-w-0 items-center gap-2 rounded-full py-2 pl-2 pr-2 text-left transition-[background-color,box-shadow] duration-300 ${
                            selected ? "btn-dark pr-4" : "hover:bg-white/[0.06] active:bg-white/10"
                          }`
                    }
                  >
                    <span className="relative grid size-[31px] shrink-0 place-items-center rounded-full">
                      <Orb id={item.orb} size={31} />
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
                        <span className="block truncate whitespace-nowrap text-[12px] leading-4 text-[#8e8f8b]">{item.preview}</span>
                      </span>
                    )}
                    {!collapsed && item.unread > 0 ? (
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
              })}
              {group.id === "hidden" && group.items.length === 0 && !collapsed ? (
                <p className="px-2.5 text-[12px] text-[#737572]">Nothing hidden</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {collapsed ? <div className="mx-auto mt-6 h-px w-8 bg-white/15" aria-hidden /> : null}
      <div className={`mb-3 flex items-center ${collapsed ? "mt-6 flex-col" : "pl-2"}`}>
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
                menuStyle={state.menuStyle}
                className={collapsed ? "bottom-0 left-[calc(100%+10px)] origin-bottom-left" : "bottom-[calc(100%+8px)] left-0 origin-bottom-left"}
                onClose={() => setMenu(null)}
                onSettings={onSettings}
                onLogout={onLogout}
                onScenario={onScenario}
                onMenuStyle={onMenuStyle}
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
      </div>
    </aside>
  );
}
