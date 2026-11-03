"use client";

import {
  Bell,
  ChartNoAxesCombined,
  House,
  Inbox,
  Landmark,
  Mail,
  PanelsTopLeft,
  Settings,
  Store,
  Tag,
  Target,
  Users,
} from "lucide-react";
import { railForPreview, type PreviewId } from "@/lib/prototype";

const items = [
  { id: "home", label: "Home", icon: House },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "products", label: "Products", icon: Tag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "marketing", label: "Marketing", icon: Target },
  { id: "analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { id: "finance", label: "Finance", icon: Landmark },
  { id: "content", label: "Content", icon: PanelsTopLeft },
  { id: "divider-1", label: "", icon: null },
  { id: "online-store", label: "Online Store", icon: Store },
  { id: "divider-2", label: "", icon: null },
  { id: "email", label: "Email", icon: Mail },
] as const;

export function ProductRail({ preview, onOpen }: { preview: PreviewId; onOpen: (id: string) => void }) {
  const active = railForPreview(preview);
  return (
    <nav className="flex h-full w-[55px] shrink-0 flex-col items-center py-4" aria-label="Shopify">
      <div className="flex flex-1 flex-col items-center gap-1">
        {items.map((item) => {
          if (!item.icon) return <span key={item.id} className="my-1 h-px w-5 bg-white/15" />;
          const Icon = item.icon;
          const on = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-current={on ? "page" : undefined}
              title={item.label}
              onClick={() => onOpen(item.id)}
              className={`grid size-8 place-items-center rounded-xl text-white/80 transition duration-150 ease-out hover:bg-white/10 hover:text-white ${
                on ? "bg-white/10 text-white" : ""
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        onClick={() => onOpen("settings")}
        className={`grid size-8 place-items-center rounded-xl text-white/80 transition duration-150 ease-out hover:bg-white/10 hover:text-white ${
          active === "settings" ? "bg-white/10 text-white" : ""
        }`}
      >
        <Settings size={16} strokeWidth={1.75} />
      </button>
    </nav>
  );
}
