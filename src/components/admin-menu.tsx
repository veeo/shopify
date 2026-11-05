"use client";

import { useState } from "react";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { channelNav, mainNav, navFor, type PreviewId } from "@/lib/admin-nav";

/** The admin navigation, drawn on white inside the preview panel. */
export function AdminMenu({
  preview,
  onOpen,
  onSearch,
}: {
  preview: PreviewId;
  onOpen: (id: string) => void;
  onSearch: (scope?: string) => void;
}) {
  const active = navFor(preview).id;
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [alerts, setAlerts] = useState(false);
  return (
    <div className="flex flex-col gap-0.5 text-[13px] text-[#303030]">
      <button
        type="button"
        onClick={() => onSearch()}
        className="press mb-1 flex h-9 items-center gap-2 rounded-lg bg-[#f3f3f3] px-2.5 text-[#616161] hover:bg-[#ebebeb] hover:text-[#303030]"
      >
        <PIcon name="Search" size={18} />
        <span className="flex-1 text-left">Search</span>
        <span className="text-[11px] text-[#8a8a8a]">Ctrl K</span>
      </button>
      {mainNav.map((item) => (
        <Row key={item.id} icon={item.icon} label={item.label} on={active === item.id} onClick={() => onOpen(item.id)} />
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
          <PIcon name="ChevronRight" size={14} />
        </span>
      </button>
      {channelsOpen
        ? channelNav.map((item) => (
            <Row key={item.id} icon={item.icon} label={item.label} on={active === item.id} channel onClick={() => onOpen(item.id)} />
          ))
        : null}
      <span className="my-1.5 h-px bg-[#ebebeb]" />
      <Row icon="Apps" label="Apps" on={false} onClick={() => onSearch("Apps")} />
      <Row icon="Settings" label="Settings" on={active === "settings"} onClick={() => onOpen("settings")} />
      <button
        type="button"
        aria-expanded={alerts}
        onClick={() => setAlerts((open) => !open)}
        className="press flex h-9 items-center gap-2 rounded-lg px-2.5 text-left hover:bg-[#f3f3f3]"
      >
        <span className="relative">
          <PIcon name="Notification" size={18} />
          <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#e51c00]" />
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

function Row({
  icon,
  label,
  on,
  channel,
  onClick,
}: {
  icon: PolarisIconName;
  label: string;
  on: boolean;
  channel?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={on ? "page" : undefined}
      onClick={onClick}
      className={`press flex h-9 items-center gap-2 rounded-lg px-2.5 text-left ${on ? "bg-[#f1f1f1] font-medium text-[#171817]" : "hover:bg-[#f6f6f6]"}`}
    >
      {channel ? (
        <span className={`grid size-[18px] shrink-0 place-items-center rounded-[5px] ${on ? "bg-[#303030] text-white" : "bg-[#f1f1f1] text-[#303030]"}`}>
          <PIcon name={icon} size={14} />
        </span>
      ) : (
        <PIcon name={icon} size={18} />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}
