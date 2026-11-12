"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useDismiss } from "@/components/admin-ui";
import { Orb } from "@/components/marks";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { channelNav, mainNav, navFor, type NavItem, type PreviewId } from "@/lib/admin-nav";
import type { Agent } from "@/lib/prototype";
import { ORB_SIZE } from "@/voiceorbs/lib/orb-model";

const channelIds = new Set(channelNav.map((item) => item.id));

/** Main admin destinations (Home → Apps) without search or footer chrome. */
export function AdminNavSections({
  expanded,
  preview,
  onOpen,
  onGo,
  onSearchApps,
}: {
  expanded: boolean;
  preview: PreviewId;
  onOpen: (id: string) => void;
  onGo: (page: PreviewId) => void;
  onSearchApps?: () => void;
}) {
  const { id: active, child } = navFor(preview);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const shared = { expanded, active, child, onOpen, onGo };
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
      <div className="flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <RailItem key={item.id} item={item} {...shared} />
        ))}
      </div>
      <span className={`my-2 h-px shrink-0 bg-white/15 ${expanded ? "mx-2" : "mx-1.5"}`} />
      {expanded ? (
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            aria-expanded={channelsOpen}
            onClick={() => setChannelsOpen((open) => !open)}
            className="flex h-7 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[12px] font-medium text-[#a6a6a6] hover:text-white"
          >
            Sales channels
            <span className={`transition-transform duration-150 ${channelsOpen ? "rotate-90" : ""}`}>
              <PIcon name="ChevronRight" size={14} />
            </span>
          </button>
          {channelsOpen ? channelNav.map((item) => <RailItem key={item.id} item={item} {...shared} />) : null}
        </div>
      ) : (
        <ChannelsItem active={active} onOpen={onOpen} />
      )}
      <span className={`my-2 h-px shrink-0 bg-white/15 ${expanded ? "mx-2" : "mx-1.5"}`} />
      {expanded ? (
        <button
          type="button"
          onClick={() => onSearchApps?.()}
          className="flex h-7 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[12px] font-medium text-[#a6a6a6] hover:text-white"
        >
          Apps
          <PIcon name="ChevronRight" size={14} />
        </button>
      ) : (
        <RailButton label="Apps" icon="Apps" onClick={() => onSearchApps?.()} />
      )}
    </div>
  );
}

/** The admin sidebar, docked on the right of the prototype. Collapsed it's an icon rail with hover flyouts; expanded it shows labels and the active item's children inline. */
export function AdminRail({
  expanded,
  preview,
  onOpen,
  onGo,
  onSearch,
  onToggle,
  embedded = false,
  revealed = false,
  lead = null,
  hideSearch = false,
  hideFooter = false,
}: {
  expanded: boolean;
  preview: PreviewId;
  onOpen: (id: string) => void;
  onGo: (page: PreviewId) => void;
  onSearch: (scope?: string) => void;
  onToggle?: () => void;
  /** Drawn inside the admin panel instead of the far-right rail. */
  embedded?: boolean;
  /** The sheet is open, so the groups can ease in. */
  revealed?: boolean;
  /** Optional block above Search — used for the merged sidekick affordance in full layout. */
  lead?: ReactNode;
  hideSearch?: boolean;
  hideFooter?: boolean;
}) {
  const { id: active, child } = navFor(preview);
  const [alerts, setAlerts] = useState(false);
  const [read, setRead] = useState(false);
  const shared = { expanded, active, child, onOpen, onGo };
  return (
    <nav
      className={`relative flex h-full shrink-0 flex-col pb-3 transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
        embedded ? "w-full px-2 pt-[72px]" : expanded ? "w-[220px] px-2 pt-6" : "w-[52px] px-[10px] pt-6"
      } ${embedded && revealed ? "menu-stagger" : ""}`}
      aria-label="Shopify admin"
    >
      {lead}
      {hideSearch ? null : expanded ? (
        <button
          type="button"
          onClick={() => onSearch()}
          className="fade-in mb-1 flex h-8 w-full items-center gap-2 rounded-[10px] bg-white/[0.08] px-2 text-[13px] text-[#b5b5b5] transition-colors hover:bg-white/[0.12] hover:text-white"
        >
          <PIcon name="Search" size={18} />
          <span className="flex-1 text-left">Search</span>
          <span className="text-[11px] text-[#8a8a8a]">Ctrl K</span>
        </button>
      ) : (
        <RailButton label="Search" shortcut="Ctrl K" icon="Search" onClick={() => onSearch()} />
      )}
      <AdminNavSections
        expanded={expanded}
        preview={preview}
        onOpen={onOpen}
        onGo={onGo}
        onSearchApps={() => onSearch("Apps")}
      />
      {hideFooter ? null : (
        <div className="mt-auto flex flex-col gap-1">
          {onToggle ? (
            <RailButton
              label={expanded ? "Collapse admin menu" : "Expand admin menu"}
              icon="LayoutSidebarRight"
              onClick={onToggle}
              text={expanded ? "Collapse" : undefined}
            />
          ) : null}
          <RailItem item={{ id: "settings", label: "Settings", icon: "Settings", page: "settings" }} {...shared} />
          <span className="relative flex flex-col">
            <RailButton
              label="Alerts"
              icon="Notification"
              on={alerts}
              onClick={() => setAlerts(!alerts)}
              controls="alerts-menu"
              text={expanded ? "Alerts" : undefined}
            />
            {read ? null : (
              <span className="pointer-events-none absolute left-[22px] -top-0.5 grid size-3.5 place-items-center rounded-full bg-[#e51c00] text-[9px] font-bold text-white">1</span>
            )}
            {alerts ? (
              <Alerts embedded={embedded} read={read} onRead={() => setRead(true)} onClose={() => setAlerts(false)} onOpen={() => onOpen("pos")} />
            ) : null}
          </span>
        </div>
      )}
    </nav>
  );
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "M") + (words[1]?.[0] ?? words[0]?.[1] ?? "S")).toUpperCase();
}

/** Collapsed sidekick roster entry at the top of the merged full-layout rail. */
export function SidekickLead({
  agent,
  expanded,
  onView,
}: {
  agent: Agent;
  expanded: boolean;
  onView: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`View sidekicks — ${agent.name}`}
      onClick={onView}
      className={`press press-row mb-3 flex w-full min-w-0 items-center text-left transition-[background-color,box-shadow] duration-300 hover:bg-white/[0.06] active:bg-white/10 ${
        expanded ? "h-12 gap-2 rounded-full py-2 pl-2 pr-2" : "h-8 justify-center rounded-full px-0"
      }`}
    >
      <span className="relative grid size-[31px] shrink-0 place-items-center rounded-full">
        <Orb
          id={agent.orb}
          agentId={agent.id}
          size={ORB_SIZE.nav}
          colorFrom={agent.orbFrom}
          colorTo={agent.orbTo}
          presence="rest"
        />
      </span>
      {expanded ? (
        <span className="min-w-0 flex-1 overflow-hidden">
          <span className="block truncate text-[13px] font-semibold leading-[1.3] tracking-[-0.13px] text-white">{agent.name}</span>
          <span className="block truncate text-[12px] leading-4 text-[#8e8f8b]">View sidekicks</span>
        </span>
      ) : null}
    </button>
  );
}

function ItemIcon({ item, on }: { item: NavItem; on: boolean }) {
  return item.channel ? (
    <span className={`grid size-[18px] shrink-0 place-items-center rounded-[5px] ${on ? "bg-white text-[#303030]" : "bg-white/15 text-white"}`}>
      <PIcon name={item.icon} size={16} />
    </span>
  ) : (
    <span className="shrink-0">
      <PIcon name={item.icon} size={20} />
    </span>
  );
}

const flyout = "flex min-w-[176px] flex-col rounded-xl border border-black/60 bg-[#1a1a1a] p-1 text-[13px] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_12px_32px_rgba(0,0,0,0.5)]";
const flyoutRow = "flex items-center gap-2 whitespace-nowrap rounded-lg px-2 py-1.5 text-left hover:bg-[#303030]";

function RailItem({
  item,
  expanded,
  active,
  child,
  onOpen,
  onGo,
}: {
  item: NavItem;
  expanded: boolean;
  active: string;
  child: PreviewId | null;
  onOpen: (id: string) => void;
  onGo: (page: PreviewId) => void;
}) {
  const on = active === item.id;
  const kids = item.children?.filter((entry) => entry.page !== item.page) ?? [];
  return (
    <div className="group relative flex flex-col">
      <button
        type="button"
        aria-label={expanded ? undefined : item.label}
        aria-current={on && !child ? "page" : undefined}
        onClick={() => onOpen(item.id)}
        className={`press relative flex h-8 w-full items-center gap-2 overflow-hidden rounded-[10px] px-1.5 text-[13px] ${
          on && (!child || !expanded) ? "bg-[#303030] text-white" : "text-[#b5b5b5] hover:bg-white/[0.08] hover:text-white"
        } ${on && expanded ? "font-semibold text-white" : ""}`}
      >
        <ItemIcon item={item} on={on} />
        <span className={`truncate whitespace-nowrap transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>{item.label}</span>
        {item.dot ? (
          <span className={`absolute size-1.5 rounded-full bg-[#b5b5b5] ${expanded ? "right-3 top-1/2 -translate-y-1/2" : "right-1 top-1"}`} title="Pin to your navigation" />
        ) : null}
        {expanded && on && item.channel ? (
          <span className="ml-auto text-[#b5b5b5]">
            <PIcon name="Edit" size={16} />
          </span>
        ) : null}
      </button>
      {expanded && on && kids.length ? (
        <div className="rise flex flex-col gap-0.5 py-0.5">
          {kids.map((entry) => (
            <button
              key={entry.page}
              type="button"
              aria-current={child === entry.page ? "page" : undefined}
              onClick={() => onGo(entry.page)}
              className={`h-7 truncate whitespace-nowrap rounded-lg pl-8 pr-2 text-left text-[13px] ${
                child === entry.page ? "bg-[#303030] font-medium text-white" : "text-[#a6a6a6] hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      ) : null}
      {expanded ? null : kids.length ? (
        <span className="pointer-events-none invisible absolute right-full top-0 z-50 pr-1.5 opacity-0 transition-opacity duration-75 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
          <span className={flyout}>
            <button type="button" onClick={() => onOpen(item.id)} className={`${flyoutRow} ${on && !child ? "bg-[#303030]" : ""}`}>
              {item.label}
            </button>
            {kids.map((entry) => (
              <button key={entry.page} type="button" onClick={() => onGo(entry.page)} className={`${flyoutRow} ${child === entry.page ? "bg-[#303030]" : ""}`}>
                {entry.label}
              </button>
            ))}
          </span>
        </span>
      ) : (
        <RailTip label={item.label} />
      )}
    </div>
  );
}

function RailTip({ label, shortcut }: { label: string; shortcut?: string }) {
  return (
    <span className="pointer-events-none absolute right-[calc(100%+6px)] top-1/2 z-50 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-black/60 bg-[#1a1a1a] px-2 py-1 text-[13px] text-white opacity-0 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.4)] transition-opacity duration-75 group-hover:opacity-100 group-focus-visible:opacity-100">
      {label}
      {shortcut ? <span className="text-[11px] text-[#9a9a9a]">{shortcut}</span> : null}
    </span>
  );
}

function ChannelsItem({ active, onOpen }: { active: string; onOpen: (id: string) => void }) {
  const [more, setMore] = useState(false);
  const on = channelIds.has(active);
  const shown = more ? channelNav : channelNav.filter((item) => item.id !== "shop");
  return (
    <div className="group relative flex flex-col" onMouseLeave={() => setMore(false)}>
      <button
        type="button"
        aria-label="Sales channels"
        aria-current={on ? "page" : undefined}
        onClick={() => onOpen(on ? active : "online-store")}
        className={`press flex h-8 w-full items-center rounded-[10px] px-1.5 ${on ? "bg-[#303030] text-white" : "text-[#b5b5b5] hover:bg-white/[0.08] hover:text-white"}`}
      >
        <PIcon name="Channels" size={20} />
      </button>
      <span className="pointer-events-none invisible absolute right-full top-0 z-50 pr-1.5 opacity-0 transition-opacity duration-75 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
        <span className={flyout}>
          {shown.map((item) => (
            <button key={item.id} type="button" onClick={() => onOpen(item.id)} className={`${flyoutRow} ${active === item.id ? "bg-[#303030]" : ""}`}>
              <ItemIcon item={item} on={active === item.id} />
              {item.label}
            </button>
          ))}
          {more ? null : (
            <button type="button" onClick={() => setMore(true)} className={`${flyoutRow} text-[#c7c7c7]`}>
              See more
            </button>
          )}
        </span>
      </span>
    </div>
  );
}

function RailButton({
  label,
  icon,
  on = false,
  onClick,
  shortcut,
  controls,
  text,
}: {
  text?: string;
  label: string;
  icon: PolarisIconName;
  on?: boolean;
  onClick: () => void;
  shortcut?: string;
  controls?: string;
}) {
  return (
    <span className="group relative flex">
      <button
        type="button"
        aria-label={label}
        aria-controls={controls}
        aria-current={on && !controls ? "page" : undefined}
        aria-expanded={controls ? on : undefined}
        onClick={onClick}
        className={`press flex h-8 items-center gap-2 rounded-[10px] px-1.5 text-[13px] ${text ? "w-full" : "w-8"} ${
          on ? "bg-[#303030] text-white" : "text-[#b5b5b5] hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <PIcon name={icon} size={20} />
        {text ? <span className="fade-in truncate whitespace-nowrap">{text}</span> : null}
      </button>
      {(controls && on) || text ? null : <RailTip label={label} shortcut={shortcut} />}
    </span>
  );
}

const alertsShell =
  "pop-in z-50 rounded-2xl bg-white text-[#303030] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.3)]";

/** Alerts list. Pass `anchorRef` to portal + collision-place above the trigger (flips if needed). */
export function Alerts({
  read,
  onRead,
  onClose,
  onOpen,
  embedded = false,
  className = "",
  anchorRef,
}: {
  read: boolean;
  onRead: () => void;
  onClose: () => void;
  onOpen: () => void;
  embedded?: boolean;
  className?: string;
  /** When set, menu portals to `document.body` and stays inside the viewport. */
  anchorRef?: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ top: number; left: number; width: number; origin: string } | null>(null);
  useDismiss(true, ref, onClose);

  useLayoutEffect(() => {
    if (!anchorRef) return;
    const gap = 8;
    const pad = 12;
    const width = 300;

    function update() {
      const anchor = anchorRef!.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const menuH = ref.current?.offsetHeight ?? 220;
      const spaceAbove = rect.top - pad;
      const spaceBelow = window.innerHeight - rect.bottom - pad;
      const openUp = spaceAbove >= Math.min(menuH, 160) || spaceAbove >= spaceBelow;
      let top = openUp ? rect.top - gap - menuH : rect.bottom + gap;
      top = Math.max(pad, Math.min(top, window.innerHeight - pad - menuH));
      // Prefer growing away from the nearer viewport edge (left rail → open rightward).
      const preferLeft = rect.left + width / 2 < window.innerWidth / 2;
      let left = preferLeft ? rect.left : rect.right - width;
      left = Math.max(pad, Math.min(left, window.innerWidth - pad - width));
      const originX = preferLeft ? "left" : "right";
      setPlace({
        top,
        left,
        width,
        origin: `${openUp ? "bottom" : "top"} ${originX}`,
      });
    }

    update();
    const frame = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  const body = (
    <div
      ref={ref}
      id="alerts-menu"
      role="dialog"
      aria-label="Alerts"
      className={`${alertsShell} ${
        anchorRef
          ? "fixed w-[300px]"
          : `absolute origin-bottom-right ${embedded ? "bottom-full left-0 right-0 mb-1" : "bottom-0 right-[calc(100%+8px)] w-[300px]"}`
      } ${className}`}
      style={
        anchorRef && place
          ? { top: place.top, left: place.left, width: place.width, transformOrigin: place.origin }
          : anchorRef
            ? { visibility: "hidden", top: 0, left: 0 }
            : undefined
      }
    >
      <div className="flex items-center gap-1 px-3 pb-1.5 pt-3">
        <span className="flex-1 text-[13px] font-semibold">Alerts</span>
        <button type="button" aria-label="Filter alerts" className="grid size-7 place-items-center rounded-lg hover:bg-[#f1f1f1]">
          <PIcon name="Filter" size={16} />
        </button>
        <button type="button" onClick={onRead} className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[12px] font-medium hover:bg-[#f1f1f1]">
          <PIcon name="Check" size={16} />
          Mark all as read
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          onRead();
          onClose();
          onOpen();
        }}
        className="flex w-full gap-2 px-3 py-2.5 text-left hover:bg-[#f7f7f7]"
      >
        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${read ? "bg-transparent" : "bg-[#005bd3]"}`} />
        <span className="flex flex-col gap-0.5 text-[12px] leading-[1.4]">
          <span className="text-[11px] text-[#616161]">Point of Sale · Monday at 7:01 AM</span>
          <span className="font-semibold">Your free trial of POS Pro ends in 3 days</span>
          <span className="text-[#616161]">Your account will automatically switch to POS Lite.</span>
        </span>
      </button>
      <p className="border-t border-[#ebebeb] py-3 text-center text-[12px] text-[#616161]">No more alerts</p>
    </div>
  );

  if (anchorRef && typeof document !== "undefined") {
    return createPortal(body, document.body);
  }
  return body;
}

const menuShell =
  "pop-in absolute z-50 flex max-h-[min(520px,calc(100vh-24px))] w-[272px] flex-col overflow-y-auto rounded-2xl bg-white p-1.5 text-[#303030] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.3)]";
const menuItem = "flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] leading-5 text-[#303030] hover:bg-[#f1f1f1]";
const menuDivider = "mx-1.5 my-1 h-px shrink-0 bg-[#ebebeb]";

/** The store itself: switch stores or create one. */
export function StoreMenu({
  storeName,
  className,
  onClose,
  onSettings,
}: {
  storeName: string;
  className: string;
  onClose: () => void;
  onSettings: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(true, ref, onClose);
  return (
    <div ref={ref} id="store-menu" className={`${menuShell} ${className}`}>
      <button
        type="button"
        onClick={() => {
          onClose();
          onSettings();
        }}
        className={`${menuItem} bg-[#f1f1f1] font-semibold`}
      >
        <span className="grid size-6 place-items-center rounded-full bg-[#36fba1] text-[10px] font-bold text-[#0b3b26]">{initials(storeName)}</span>
        <span className="flex-1">{storeName}</span>
        <PIcon name="Check" size={16} />
      </button>
      <button type="button" className={menuItem}>
        <PIcon name="Plus" size={16} />
        Create store
      </button>
    </div>
  );
}

/** The merchant's account: the store, help, the design system, and log out. */
export function AccountMenu({
  storeName,
  scenario,
  className,
  onClose,
  onSettings,
  onLogout,
  onScenario,
  onDesignSystem,
}: {
  storeName: string;
  scenario: "setup" | "active";
  className: string;
  onClose: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onScenario: (scenario: "setup" | "active") => void;
  onDesignSystem: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(true, ref, onClose);
  const activeStore = scenario === "active";
  return (
    <div ref={ref} id="account-menu" className={`${menuShell} ${className}`}>
      <button
        type="button"
        onClick={() => {
          onClose();
          onSettings();
        }}
        className={menuItem}
      >
        <img src="/assets/user.png" alt="" className="size-5 rounded-full object-cover" />
        <span className="min-w-0 flex-1 truncate">{storeName} Admin</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onSettings();
        }}
        className={menuItem}
      >
        <span className="grid size-5 place-items-center rounded-full bg-[#36fba1] text-[9px] font-bold text-[#0b3b26]">{initials(storeName)}</span>
        <span className="min-w-0 flex-1 truncate">{storeName}</span>
      </button>
      <a href="https://help.shopify.com" target="_blank" rel="noreferrer" onClick={onClose} className={menuItem}>
        <span className="grid size-5 place-items-center">
          <PIcon name="QuestionCircle" size={16} />
        </span>
        Help Center
      </a>
      <button
        type="button"
        onClick={() => {
          onClose();
          onDesignSystem();
        }}
        className={menuItem}
      >
        <span className="grid size-5 place-items-center">
          <PIcon name="Apps" size={16} />
        </span>
        <span className="min-w-0 flex-1">Design system</span>
        <PIcon name="ChevronRight" size={16} />
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={activeStore}
        onClick={() => onScenario(activeStore ? "setup" : "active")}
        className={menuItem}
      >
        <span className="grid size-5 place-items-center">
          <PIcon name="Store" size={16} />
        </span>
        <span className="min-w-0 flex-1">Active store</span>
        <span className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${activeStore ? "bg-[#303030]" : "bg-[#d4d4d4]"}`}>
          <span
            className={`absolute top-0.5 size-3 rounded-full bg-white shadow transition-[left] duration-150 ${
              activeStore ? "left-[14px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
      <span className={menuDivider} />
      <button
        type="button"
        onClick={() => {
          onClose();
          onLogout();
        }}
        className={menuItem}
      >
        <span className="grid size-5 place-items-center">
          <PIcon name="Exit" size={16} />
        </span>
        Log out
      </button>
    </div>
  );
}
