"use client";

import { useState } from "react";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { channelNav, findNav, mainNav, navFor, navIconSize, settingsNav, type NavChild, type PreviewId } from "@/lib/admin-nav";

/** The admin navigation, drawn on white inside the preview panel. */
const settingsChildren: NavChild[] = [{ label: "General", page: "settings-general" }, ...settingsNav.map((row) => ({ label: row.label, page: row.page }))];

export function AdminMenu({
  preview,
  onOpen,
  onGo,
  onSearch,
}: {
  preview: PreviewId;
  onOpen: (id: string) => void;
  onGo: (page: PreviewId) => void;
  onSearch: (scope?: string) => void;
}) {
  const { id: active, child } = navFor(preview);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [alerts, setAlerts] = useState(false);
  return (
    <div className="flex flex-col gap-0.5 text-[13px] text-[#303030]">
      <button
        type="button"
        onClick={() => onSearch()}
        className="press mb-1 flex h-9 items-center gap-2 rounded-lg bg-[#f3f3f3] px-2.5 text-[#616161] hover:bg-[#ebebeb] hover:text-[#303030]"
      >
        <PIcon name="Search" size={20} />
        <span className="flex-1 text-left">Search</span>
        <span className="text-[11px] text-[#8a8a8a]">Ctrl K</span>
      </button>
      {mainNav.map((item) => (
        <Item key={item.id} id={item.id} icon={item.icon} label={item.label} active={active} child={child} preview={preview} onOpen={onOpen} onGo={onGo} />
      ))}
      <span className="my-1.5 h-px bg-[#ebebeb]" />
      <button
        type="button"
        aria-expanded={channelsOpen}
        onClick={() => setChannelsOpen((open) => !open)}
        className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-[#616161] hover:text-[#303030]"
      >
        Sales channels
        <span className={`transition-transform duration-150 ${channelsOpen ? "rotate-90" : ""}`}>
          <PIcon name="ChevronRight" size={16} />
        </span>
      </button>
      {channelsOpen
        ? channelNav.map((item) => (
            <Item key={item.id} id={item.id} icon={item.icon} label={item.label} active={active} child={child} preview={preview} channel onOpen={onOpen} onGo={onGo} />
          ))
        : null}
      <span className="my-1.5 h-px bg-[#ebebeb]" />
      <Row icon="Apps" label="Apps" on={false} onClick={() => onSearch("Apps")} />
      <Item id="settings" icon="Settings" label="Settings" active={active} child={child} preview={preview} onOpen={onOpen} onGo={onGo} />
      <button
        type="button"
        aria-expanded={alerts}
        onClick={() => setAlerts((open) => !open)}
        className="press flex h-9 items-center gap-2 rounded-lg px-2.5 text-left hover:bg-[#f3f3f3]"
      >
        <span className="relative">
          <PIcon name="Notification" size={20} />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#e51c00]" />
        </span>
        Alerts
      </button>
      {alerts ? (
        <button
          type="button"
          onClick={() => onOpen("pos")}
          className="mb-1 rounded-lg bg-[#f7f7f7] px-3 py-2 text-left text-[12px] leading-[1.4] hover:bg-[#f1f1f1]"
        >
          <span className="block text-[11px] text-[#616161]">Point of Sale · Monday at 7:01 AM</span>
          <span className="font-medium">Your free trial of POS Pro ends in 3 days</span>
        </button>
      ) : null}
    </div>
  );
}

function Item({
  id,
  icon,
  label,
  active,
  child,
  preview,
  channel,
  onOpen,
  onGo,
}: {
  id: string;
  icon: PolarisIconName;
  label: string;
  active: string;
  child: PreviewId | null;
  preview: PreviewId;
  channel?: boolean;
  onOpen: (id: string) => void;
  onGo: (page: PreviewId) => void;
}) {
  const section = active === id;
  const parentCurrent = section && child == null;
  const kids = id === "settings" ? settingsChildren : (findNav(id)?.children ?? []);
  return (
    <div className="flex flex-col">
      <Row icon={icon} label={label} on={parentCurrent} section={section && !parentCurrent} channel={channel} onClick={() => onOpen(id)} />
      {section && kids.length > 0 ? (
        <div className="flex flex-col pb-1">
          {kids.map((entry) => {
            const current = entry.page === preview || entry.page === child;
            return (
              <button
                key={entry.page}
                type="button"
                aria-current={current ? "page" : undefined}
                onClick={() => onGo(entry.page)}
                className={`press h-8 truncate rounded-lg pl-9 pr-2.5 text-left text-[13px] ${
                  current ? "bg-[#f1f1f1] font-medium text-[#171817]" : "text-[#4a4a4a] hover:bg-[#f6f6f6]"
                }`}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Row({
  icon,
  label,
  on,
  section,
  onClick,
}: {
  icon: PolarisIconName;
  label: string;
  on: boolean;
  section?: boolean;
  channel?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={on ? "page" : undefined}
      onClick={onClick}
      className={`press flex h-9 items-center gap-2 rounded-lg px-2.5 text-left ${
        on ? "bg-[#f1f1f1] font-medium text-[#171817]" : section ? "font-medium text-[#171817] hover:bg-[#f6f6f6]" : "hover:bg-[#f6f6f6]"
      }`}
    >
      {/* Same 20px slot for main nav and sales channels — no gray chip. Full-bleed marks scale down to the Home/Orders ink size. */}
      <span className="grid size-5 shrink-0 place-items-center">
        <PIcon name={icon} size={navIconSize(icon)} />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
