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
  onExperiments,
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
  onExperiments: () => void;
}) {
  const agents = visibleAgents(state);
  const [menu, setMenu] = useState<"account" | "store" | null>(null);
  const collapsed = !navOpen;
  const showHidden = state.scenario === "active" || state.agents.some((item) => item.installed && item.group === "hidden");
  const navRef = useRef<HTMLElement>(null);
  const placed = useRef(new Map<string, { left: number; top: number }>());

  // Icons share one layout in both widths. When the column rearranges, each icon
  // slides from where it was instead of popping.
  useLayoutEffect(() => {
    const root = navRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      className={`flex h-full shrink-0 flex-col gap-4 px-3 pb-3 pt-7 motion-reduce:transition-none ${
        collapsed ? "w-[76px]" : "w-[248px]"
      }`}
      style={{ transition: `width ${move}` }}
    >
      <div className={`flex gap-1.5 pb-4 pl-2 ${collapsed ? "flex-col items-start" : "items-center"}`}>
        <Tip label={navOpen ? "Collapse navigation" : "Expand navigation"} keys={["Ctrl", "B"]} side="right">
          <button
            type="button"
            data-flip="logo"
            aria-label={navOpen ? "Collapse navigation" : "Expand navigation"}
            aria-expanded={navOpen}
            aria-keyshortcuts="Control+B Meta+B"
            onClick={onToggleNav}
            className="group/logo press relative grid size-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-white/[0.08]"
          >
            <span className="transition-opacity duration-150 group-hover/logo:opacity-0 group-focus-visible/logo:opacity-0">
              <ShopifyMark />
            </span>
            <span className="absolute inset-0 grid place-items-center text-white opacity-0 transition-opacity duration-150 group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100">
              <PIcon name="LayoutSidebarLeft" size={20} />
            </span>
          </button>
        </Tip>
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

      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto">
        {groups.map((group) => {
          if (group.id === "hidden" && !showHidden) return null;
          const items = agents.filter((item) => item.group === group.id);
          if (group.id !== "hidden" && items.length === 0) return null;
          return (
            <div key={group.id} className="flex min-w-0 flex-col gap-2">
              {group.label ? (
                <div className="flex h-8 items-center gap-1.5 px-2.5">
                  <span
                    className={`whitespace-nowrap text-[13px] leading-4 tracking-[-0.13px] text-[#7d7f7c] transition-opacity duration-300 ${
                      collapsed ? "w-0 overflow-hidden opacity-0" : "shrink-0"
                    }`}
                  >
                    {group.label}
                  </span>
                  <span className="h-px min-w-2 flex-1 bg-white/10" />
                </div>
              ) : null}
              <div className="flex flex-col gap-2">
                {items.map((item) => {
                  const selected = item.id === state.selectedAgentId && state.mode === "thread";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-flip={`agent-${item.id}`}
                      aria-current={selected ? "page" : undefined}
                      aria-label={collapsed ? item.name : undefined}
                      onClick={() => onSelect(item.id)}
                      className={`press press-row relative flex h-12 w-full min-w-0 items-center gap-2 rounded-full py-2 pl-2 pr-2 text-left transition-[background-color,box-shadow] duration-300 ${
                        selected && !collapsed ? "btn-dark pr-4" : "hover:bg-white/[0.06] active:bg-white/10"
                      }`}
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full transition-shadow duration-300 ${
                          collapsed && selected ? "shadow-[0_0_0_2px_#0c0d0c,0_0_0_3px_#fff]" : ""
                        }`}
                      >
                        <Orb id={item.orb} size={collapsed ? 32 : 28} />
                        {collapsed && item.unread > 0 ? (
                          <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#5631f4] text-[10px] font-medium text-white ring-2 ring-[#0c0d0c]">
                            {item.unread}
                          </span>
                        ) : null}
                      </span>
                      <span className={`min-w-0 flex-1 overflow-hidden transition-opacity duration-300 ${collapsed ? "opacity-0" : "opacity-100"}`}>
                        <span className="block truncate whitespace-nowrap text-[13px] font-semibold leading-[1.3] tracking-[-0.13px] text-white">
                          {item.name}
                        </span>
                        <span className="block truncate whitespace-nowrap text-[12px] leading-4 text-[#8e8f8b]">{item.preview}</span>
                      </span>
                      {!collapsed && item.unread > 0 ? (
                        <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[#5631f4] text-[11px] font-medium text-white">
                          {item.unread}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                {group.id === "hidden" && items.length === 0 && !collapsed ? (
                  <p className="px-2.5 text-[12px] text-[#737572]">Nothing hidden</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`flex pl-2 ${collapsed ? "flex-col items-start gap-2" : "h-12 items-center"}`}>
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
              <img src="/assets/user.png" alt="" className="size-8 rounded-full object-cover" />
            </button>
            {menu === "account" ? (
              <AccountMenu
                storeName={state.storeName}
                className={collapsed ? "bottom-0 left-[calc(100%+10px)] origin-bottom-left" : "bottom-[calc(100%+8px)] left-0 origin-bottom-left"}
                onClose={() => setMenu(null)}
                onSettings={onSettings}
                onLogout={onLogout}
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
              className={`press grid size-8 place-items-center rounded-full bg-[#36fba1] text-[11px] font-bold text-[#0b3b26] transition-shadow duration-150 hover:shadow-[0_0_0_4px_rgba(255,255,255,0.14)] ${
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
        <span data-flip="apps" className={collapsed ? "" : "ml-auto"}>
          <IconButton label="Apps" onClick={onExperiments}>
            <PIcon name="Apps" size={20} />
          </IconButton>
        </span>
        <span data-flip="settings">
          <IconButton label="Experiments" onClick={onExperiments} active={state.experimentsOpen} controls="experiments-menu">
            <PIcon name="Settings" size={20} />
          </IconButton>
        </span>
      </div>
    </aside>
  );
}
