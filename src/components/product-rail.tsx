"use client";

import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { railForPreview, type PreviewId } from "@/lib/prototype";

type RailItem = { id: string; label: string; icon: PolarisIconName; filled: PolarisIconName } | { id: string; divider: true };

const items: RailItem[] = [
  { id: "home", label: "Home", icon: "Home", filled: "HomeFilled" },
  { id: "inbox", label: "Inbox", icon: "Chat", filled: "Chat" },
  { id: "notifications", label: "Notifications", icon: "Notification", filled: "NotificationFilled" },
  { id: "products", label: "Products", icon: "Product", filled: "ProductFilled" },
  { id: "customers", label: "Customers", icon: "Person", filled: "PersonFilled" },
  { id: "marketing", label: "Marketing", icon: "Target", filled: "TargetFilled" },
  { id: "analytics", label: "Analytics", icon: "ChartVertical", filled: "ChartVerticalFilled" },
  { id: "finance", label: "Finance", icon: "Finance", filled: "FinanceFilled" },
  { id: "content", label: "Content", icon: "Content", filled: "ContentFilled" },
  { id: "divider-1", divider: true },
  { id: "online-store", label: "Online Store", icon: "Store", filled: "StoreFilled" },
  { id: "divider-2", divider: true },
  { id: "email", label: "Email", icon: "Email", filled: "Email" },
];

export function ProductRail({ preview, onOpen }: { preview: PreviewId; onOpen: (id: string) => void }) {
  const active = railForPreview(preview);
  return (
    <nav className="flex h-full w-[52px] shrink-0 flex-col items-center py-4" aria-label="Shopify">
      <div className="flex flex-1 flex-col items-center gap-1">
        {items.map((item) =>
          "divider" in item ? (
            <span key={item.id} className="my-1.5 h-px w-5 bg-white/15" />
          ) : (
            <RailButton
              key={item.id}
              label={item.label}
              icon={item.id === active ? item.filled : item.icon}
              on={item.id === active}
              onClick={() => onOpen(item.id)}
            />
          ),
        )}
      </div>
      <RailButton
        label="Settings"
        icon={active === "settings" ? "SettingsFilled" : "Settings"}
        on={active === "settings"}
        onClick={() => onOpen("settings")}
      />
    </nav>
  );
}

function RailButton({
  label,
  icon,
  on,
  onClick,
}: {
  label: string;
  icon: PolarisIconName;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={on ? "page" : undefined}
      onClick={onClick}
      className={`press group relative grid size-8 place-items-center rounded-[10px] ${
        on ? "btn-dark text-white" : "text-[#aaa] hover:bg-white/[0.08] hover:text-white active:bg-white/[0.12]"
      }`}
    >
      <PIcon name={icon} size={20} />
      <span className="pointer-events-none absolute right-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#303030] px-2 py-1 text-[12px] font-medium text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-opacity duration-150 group-hover:opacity-100 group-hover:delay-300">
        {label}
      </span>
    </button>
  );
}
