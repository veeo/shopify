"use client";

import { useRef, useState } from "react";
import { useDismiss } from "@/components/admin-ui";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { channelNav, mainNav, navFor, type NavItem, type PreviewId } from "@/lib/admin-nav";

const channelIds = new Set(channelNav.map((item) => item.id));

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
}) {
  const { id: active, child } = navFor(preview);
  const [alerts, setAlerts] = useState(false);
  const [read, setRead] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const shared = { expanded, active, child, onOpen, onGo };
  return (
    <nav
      className={`relative flex h-full shrink-0 flex-col pb-3 transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
        embedded ? "w-full px-2 pt-[72px]" : expanded ? "w-[220px] px-2 pt-8" : "w-[52px] px-[10px] pt-8"
      } ${embedded && revealed ? "menu-stagger" : ""}`}
      aria-label="Shopify admin"
    >
      {expanded ? (
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
      <div className="mt-1.5 flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <RailItem key={item.id} item={item} {...shared} />
        ))}
      </div>
      <span className={`my-2 h-px bg-white/15 ${expanded ? "mx-2" : "mx-1.5"}`} />
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
      <span className={`my-2 h-px bg-white/15 ${expanded ? "mx-2" : "mx-1.5"}`} />
      {expanded ? (
        <button
          type="button"
          onClick={() => onSearch("Apps")}
          className="flex h-7 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[12px] font-medium text-[#a6a6a6] hover:text-white"
        >
          Apps
          <PIcon name="ChevronRight" size={14} />
        </button>
      ) : (
        <RailButton label="Apps" icon="Apps" onClick={() => onSearch("Apps")} />
      )}
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
    </nav>
  );
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "M") + (words[1]?.[0] ?? words[0]?.[1] ?? "S")).toUpperCase();
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

function Alerts({
  read,
  onRead,
  onClose,
  onOpen,
  embedded = false,
}: {
  read: boolean;
  onRead: () => void;
  onClose: () => void;
  onOpen: () => void;
  embedded?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(true, ref, onClose);
  return (
    <div
      ref={ref}
      id="alerts-menu"
      className={`pop-in absolute z-50 origin-bottom-right rounded-2xl bg-white text-[#303030] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.3)] ${
        embedded ? "bottom-full left-0 right-0 mb-1" : "bottom-0 right-[calc(100%+8px)] w-[300px]"
      }`}
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

/** The merchant's account: the store, help, the design system, prototype controls, and log out. */
export function AccountMenu({
  storeName,
  scenario,
  arrival,
  menuStyle,
  className,
  onClose,
  onSettings,
  onLogout,
  onScenario,
  onArrival,
  onMenuStyle,
  onDesignSystem,
}: {
  storeName: string;
  scenario: "setup" | "active";
  arrival: "tasks" | "sidekick";
  menuStyle: "push" | "drop";
  className: string;
  onClose: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onScenario: (scenario: "setup" | "active") => void;
  onArrival: (arrival: "tasks" | "sidekick") => void;
  onMenuStyle: (style: "push" | "drop") => void;
  onDesignSystem: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(true, ref, onClose);
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
      <span className={menuDivider} />
      <p className="px-2 pb-1 pt-1.5 text-[12px] font-medium text-[#616161]">Prototype</p>
      <MenuChoice
        label="Store"
        value={scenario}
        options={[
          ["setup", "New store"],
          ["active", "Active store"],
        ]}
        onChange={onScenario}
      />
      {scenario === "setup" ? (
        <MenuChoice
          label="Opening"
          value={arrival}
          options={[
            ["tasks", "Tasks"],
            ["sidekick", "Sidekick"],
          ]}
          onChange={onArrival}
        />
      ) : null}
      <MenuChoice
        label="Navigation"
        value={menuStyle}
        options={[
          ["push", "Push down"],
          ["drop", "Dropdown"],
        ]}
        onChange={onMenuStyle}
      />
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

function MenuChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="px-1.5 py-1">
      <p className="px-1.5 pb-1 text-[12px] text-[#616161]">{label}</p>
      <div role="group" aria-label={label} className="grid grid-cols-2 gap-0.5 rounded-[10px] bg-[#f1f1f1] p-0.5">
        {options.map(([option, text]) => {
          const on = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(option)}
              className={`h-8 rounded-lg px-2 text-[13px] ${on ? "bg-white font-medium text-[#171817] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.08)]" : "text-[#303030] hover:bg-white/70"}`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
