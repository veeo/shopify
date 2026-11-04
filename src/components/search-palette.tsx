"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Orb } from "@/components/marks";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { channelNav, mainNav, settingsNav, type PreviewId } from "@/lib/admin-nav";
import type { PrototypeState } from "@/lib/prototype";

type Result = {
  id: string;
  group: string;
  label: string;
  meta?: string;
  icon?: PolarisIconName;
  image?: string;
  orb?: boolean;
  external?: boolean;
  run: () => void;
};

const scopes = ["Apps", "Customers", "Orders", "Products", "Sales channels"] as const;

const recommendedApps = [
  {
    name: "Printful: Print on Demand",
    image: "/assets/admin/app-printful.png",
    meta: "4.8 ★ Free plan available · Sell custom print and embroidery items with no upfront costs",
    url: "https://apps.shopify.com/printful",
  },
  {
    name: "Shopify Forms",
    image: "/assets/admin/app-forms.png",
    meta: "4.5 ★ Free · Capture customer information to grow your marketing list",
    url: "https://apps.shopify.com/shopify-forms",
  },
  {
    name: "Google & YouTube",
    image: "/assets/admin/app-google.png",
    meta: "4.5 ★ Free plan available · Drive sales by showcasing your products on Google and YouTube",
    url: "https://apps.shopify.com/google",
  },
];

export function SearchPalette({
  state,
  initialScope,
  onClose,
  onGo,
  onRail,
  onProduct,
  onAsk,
}: {
  state: PrototypeState;
  initialScope?: string;
  onClose: () => void;
  onGo: (page: PreviewId) => void;
  onRail: (id: string) => void;
  onProduct: (id: string) => void;
  onAsk: (text: string) => void;
}) {
  const [scope, setScope] = useState<string | null>(initialScope ?? null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => input.current?.focus(), [scope]);

  const results = useMemo(() => {
    const done = (fn: () => void) => () => {
      fn();
      onClose();
    };
    const q = query.trim().toLowerCase();
    const match = (...text: (string | undefined)[]) => !q || text.some((value) => value?.toLowerCase().includes(q));

    const pages: Result[] = [
      ...mainNav.flatMap((item) => [
        { id: `nav-${item.id}`, group: "Pages", label: item.label, icon: item.icon, run: done(() => onRail(item.id)) },
        ...(item.children ?? [])
          .filter((child) => child.page !== item.page)
          .map((child) => ({ id: `page-${child.page}`, group: "Pages", label: child.label, meta: item.label, icon: item.icon, run: done(() => onGo(child.page)) })),
      ]),
      { id: "nav-settings", group: "Pages", label: "Settings", icon: "Settings", run: done(() => onRail("settings")) },
      ...settingsNav.map((row) => ({ id: `settings-${row.page}`, group: "Settings", label: row.label, meta: "Settings", icon: row.icon, run: done(() => onGo(row.page)) })),
    ];
    const channels: Result[] = channelNav.flatMap((item) => [
      { id: `channel-${item.id}`, group: "Sales channels", label: item.label, icon: item.icon, run: done(() => onRail(item.id)) },
      ...(item.children ?? []).map((child) => ({
        id: `channel-${child.page}`,
        group: "Sales channels",
        label: child.label,
        meta: item.label,
        icon: item.icon,
        run: done(() => onGo(child.page)),
      })),
    ]);
    const products: Result[] = state.products.map((product) => ({
      id: `product-${product.id}`,
      group: "Products",
      label: product.title || "Untitled product",
      meta: `${product.status} · $${product.price}`,
      image: product.image,
      icon: "Product",
      run: done(() => onProduct(product.id)),
    }));
    const apps: Result[] = [
      { id: "app-messaging", group: "Installed apps (1)", label: "Messaging", image: "/assets/admin/app-messaging.png", run: done(() => onGo("settings-apps")) },
      ...recommendedApps.map((app) => ({
        id: `app-${app.name}`,
        group: "Recommended for businesses like yours",
        label: app.name,
        meta: app.meta,
        image: app.image,
        external: true,
        run: done(() => window.open(app.url, "_blank", "noopener")),
      })),
      { id: "app-all", group: "Recommended for businesses like yours", label: "All recommended apps", icon: "Apps", run: done(() => onGo("settings-apps")) },
    ];
    const ask: Result[] = q
      ? [{ id: "ask", group: "Sidekick", label: `Ask Sidekick “${query.trim()}”`, orb: true, run: done(() => onAsk(query.trim())) }]
      : [];

    if (scope === "Apps") return apps.filter((item) => match(item.label, item.meta));
    if (scope === "Products") return [...products.filter((item) => match(item.label)), ...ask];
    if (scope === "Sales channels") return channels.filter((item) => match(item.label, item.meta));
    if (scope === "Orders") {
      const orders = pages.filter((item) => item.id === "nav-orders" || item.meta === "Orders");
      return [...orders.filter((item) => match(item.label)), ...ask];
    }
    if (scope === "Customers") {
      const customers = pages.filter((item) => item.id === "nav-customers" || item.meta === "Customers");
      return [...customers.filter((item) => match(item.label)), ...ask];
    }
    if (!q) return [];
    return [...pages, ...channels, ...products, ...apps.filter((item) => !item.external)].filter((item) => match(item.label, item.meta)).slice(0, 12).concat(ask);
  }, [scope, query, state.products, onClose, onGo, onRail, onProduct, onAsk]);

  const active = Math.min(cursor, Math.max(0, results.length - 1));

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((active + 1) % Math.max(1, results.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((active - 1 + results.length) % Math.max(1, results.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      results[active]?.run();
    } else if (event.key === "Backspace" && !query && scope) {
      setScope(null);
    }
  }

  let lastGroup = "";
  return (
    <div
      className="fade-in fixed inset-0 z-[150] flex items-start justify-center bg-black/50 pt-[12vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={onKeyDown}
        className="p-partial-theme-admin-next-light pop-in flex max-h-[70vh] w-[640px] flex-col overflow-hidden rounded-2xl bg-white text-[#303030] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.35)] [transform-origin:top_center]"
      >
        <div className="flex items-center gap-2 border-b border-[#ebebeb] px-4 py-3">
          <span className="text-[#616161]">
            <PIcon name="Search" size={20} />
          </span>
          {scope ? (
            <span className="flex items-center gap-0.5 rounded-md bg-[#ebebeb] py-0.5 pl-1.5 pr-0.5 text-[12px] font-medium">
              {scope}
              <button type="button" aria-label={`Remove ${scope} filter`} onClick={() => setScope(null)} className="grid size-4 place-items-center rounded hover:bg-black/10">
                <PIcon name="X" size={12} />
              </button>
            </span>
          ) : null}
          <input
            ref={input}
            value={query}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#8a8a8a]"
          />
          <button type="button" aria-label="Filter" className="grid size-7 place-items-center rounded-lg text-[#616161] hover:bg-[#f1f1f1]">
            <PIcon name="Filter" size={18} />
          </button>
        </div>

        <div ref={list} id="palette-results" role="listbox" className="scroll-thin-light min-h-0 flex-1 overflow-y-auto p-2">
          {!scope && !query.trim() ? (
            <div className="px-2 py-6 text-center">
              <p className="text-[13px] font-medium">Find anything in {state.storeName}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {scopes.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setScope(name);
                      setCursor(0);
                    }}
                    className="press rounded-lg bg-[#f1f1f1] px-2.5 py-1 text-[12px] font-medium hover:bg-[#e3e3e3]"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-[13px] text-[#616161]">No results for “{query}”</p>
          ) : (
            results.map((item, index) => {
              const heading = item.group !== lastGroup ? item.group : null;
              lastGroup = item.group;
              return (
                <div key={item.id}>
                  {heading ? <p className="px-2 pb-1 pt-2 text-[12px] font-semibold text-[#303030]">{heading}</p> : null}
                  <button
                    type="button"
                    role="option"
                    id={`palette-${item.id}`}
                    data-index={index}
                    aria-selected={index === active}
                    onMouseMove={() => setCursor(index)}
                    onClick={item.run}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left ${index === active ? "bg-[#f1f1f1]" : ""}`}
                  >
                    {item.orb ? (
                      <Orb id="sidekick" size={20} />
                    ) : item.image ? (
                      <img src={item.image} alt="" className="size-5 shrink-0 rounded object-cover" />
                    ) : item.icon ? (
                      <span className="text-[#4a4a4a]">
                        <PIcon name={item.icon} size={20} />
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 text-[13px] font-medium">
                        <span className="truncate">{item.label}</span>
                        {item.external ? (
                          <span className="text-[#616161]">
                            <PIcon name="ExternalSmall" size={16} />
                          </span>
                        ) : null}
                      </span>
                      {item.meta ? <span className="block truncate text-[12px] text-[#616161]">{item.meta}</span> : null}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-[#ebebeb] px-3 py-2 text-[12px] text-[#616161]">
          {scope === "Apps" ? (
            <>
              <button type="button" onClick={() => results.find((item) => item.id === "app-all")?.run()} className="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-[#f1f1f1] hover:text-[#303030]">
                <PIcon name="Apps" size={16} />
                All recommended apps
              </button>
              <button
                type="button"
                onClick={() => {
                  onGo("settings-apps");
                  onClose();
                }}
                className="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-[#f1f1f1] hover:text-[#303030]"
              >
                <PIcon name="Settings" size={16} />
                App settings
              </button>
            </>
          ) : null}
          <span className="ml-auto flex items-center gap-1.5">
            Open
            <kbd className="grid h-5 min-w-5 place-items-center rounded bg-[#ebebeb] px-1 font-sans text-[11px] text-[#616161]">⏎</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
