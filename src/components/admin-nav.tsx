"use client";

import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { ShopifyMark } from "@/components/marks";
import { railForPreview, type PreviewId } from "@/lib/prototype";

const primary: { id: string; label: string; icon: PolarisIconName }[] = [
  { id: "home", label: "Home", icon: "HomeFilled" },
  { id: "products", label: "Products", icon: "ProductFilled" },
  { id: "customers", label: "Customers", icon: "PersonFilled" },
  { id: "marketing", label: "Marketing", icon: "TargetFilled" },
  { id: "content", label: "Content", icon: "ContentFilled" },
  { id: "analytics", label: "Analytics", icon: "ChartVerticalFilled" },
  { id: "finance", label: "Finances", icon: "CashDollarFilled" },
];

const channels: { id: string; label: string; icon: PolarisIconName }[] = [
  { id: "online-store", label: "Online Store", icon: "StoreFilled" },
  { id: "inbox", label: "Inbox", icon: "Chat" },
  { id: "email", label: "Email", icon: "Email" },
];

export function AdminNav({
  storeName,
  preview,
  onOpen,
  onSearch,
}: {
  storeName: string;
  preview: PreviewId;
  onOpen: (id: string) => void;
  onSearch: () => void;
}) {
  const active = railForPreview(preview);
  return (
    <nav className="flex h-full w-[232px] shrink-0 flex-col bg-[#0a0a0a] px-3 pb-3 pt-4 text-white" aria-label="Shopify">
      <div className="mb-3 flex items-center gap-2 px-2">
        <ShopifyMark className="h-5 w-[18px]" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-[-0.13px]">{storeName}</span>
      </div>

      <button
        type="button"
        onClick={onSearch}
        className="mb-3 flex h-8 items-center gap-2 rounded-[10px] bg-white/10 px-2 text-[13px] text-white/70 transition duration-200 ease-out hover:bg-white/15 hover:text-white"
      >
        <PIcon name="Search" size={16} />
        Search
      </button>

      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {primary.map((item) => (
          <NavItem key={item.id} item={item} on={item.id === active} onOpen={onOpen} />
        ))}
        <p className="px-2 pb-1 pt-4 text-[12px] text-white/50">Sales channels</p>
        {channels.map((item) => (
          <NavItem key={item.id} item={item} on={item.id === active} onOpen={onOpen} />
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-0.5 border-t border-white/10 pt-2">
        <NavItem
          item={{ id: "notifications", label: "Notifications", icon: "NotificationFilled" }}
          on={active === "notifications"}
          onOpen={onOpen}
        />
        <NavItem
          item={{ id: "settings", label: "Settings", icon: "SettingsFilled" }}
          on={active === "settings"}
          onOpen={onOpen}
        />
      </div>
    </nav>
  );
}

function NavItem({
  item,
  on,
  onOpen,
}: {
  item: { id: string; label: string; icon: PolarisIconName };
  on: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      aria-current={on ? "page" : undefined}
      onClick={() => onOpen(item.id)}
      className={`flex h-8 items-center gap-2 rounded-[10px] px-2 text-left text-[13px] tracking-[-0.13px] transition duration-200 ease-out ${
        on ? "bg-white/15 font-medium text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <PIcon name={item.icon} size={20} />
      <span className="truncate">{item.label}</span>
    </button>
  );
}
