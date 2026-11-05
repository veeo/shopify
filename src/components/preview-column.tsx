"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AdminMenu } from "@/components/admin-menu";
import { AdminPage, type PageNav } from "@/components/admin-pages";
import { Badge, Body, Btn, Card as AdminCard, circleButton, HeaderExtras, HeaderSlotProvider, Muted, Row, Section, Table, TableSearch, Toggle, TopBar } from "@/components/admin-ui";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { sectionChoices } from "@/lib/admin-nav";
import type { BusinessType, PreviewId, Product, ProductTone, PrototypeState } from "@/lib/prototype";

type Nav = PageNav & {
  onPreview: (page: PreviewId, wide?: boolean) => void;
  onRail: (id: string) => void;
  onChip: (label: string) => void;
};

export function PreviewColumn({
  state,
  onPreview,
  onChip,
  onAsk,
  onCard,
  onDismissCard,
  onBusiness,
  onIdentity,
  onPaymentsNext,
  onProduct,
  onUpdateProduct,
  onAddProduct,
  onRail,
  onSearch,
}: {
  state: PrototypeState;
  onPreview: (page: PreviewId, wide?: boolean) => void;
  onChip: (label: string) => void;
  onAsk: (text: string) => void;
  onCard: (id: string) => void;
  onDismissCard: (id: string) => void;
  onBusiness: (value: PrototypeState["businessType"]) => void;
  onIdentity: (patch: Partial<PrototypeState["identity"]>) => void;
  onPaymentsNext: () => void;
  onProduct: (id: string) => void;
  onUpdateProduct: (id: string, patch: Partial<Product>) => void;
  onAddProduct: () => void;
  onRail: (id: string) => void;
  onSearch: (scope?: string) => void;
}) {
  const wide = state.previewWide || state.preview === "payments-setup";
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  // A click on the pushed page dismisses the menu. The pointerdown closes it
  // before the click, so the click is swallowed here or it would activate whatever it landed on.
  const swallow = useRef(false);
  function setMenuOpen(next: boolean, restore: boolean) {
    const el = scrollRef.current;
    if (el && state.menuStyle === "push") {
      if (next && !menuRef.current) {
        savedScroll.current = el.scrollTop;
        el.scrollTop = 0;
      } else if (!next && menuRef.current && restore) {
        el.scrollTop = savedScroll.current;
      }
    }
    menuRef.current = next;
    setMenu(next);
  }
  const closeMenu = useRef(setMenuOpen);
  useEffect(() => {
    closeMenu.current = setMenuOpen;
  });
  const nav: Nav = {
    onPreview,
    onRail,
    onChip,
    go: (page) => {
      menuRef.current = false;
      setMenu(false);
      onPreview(page);
    },
    rail: (id) => {
      menuRef.current = false;
      setMenu(false);
      onRail(id);
    },
    chip: onChip,
    ask: onAsk,
  };
  const grey = state.preview === "product";
  const detailBack =
    state.preview === "product" ? "Back to products" : state.preview === "payments-setup" ? "Back to payments" : null;
  if (detailBack && menu) setMenu(false);
  const headerRef = useRef<HTMLElement>(null);
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const [menuTop, setMenuTop] = useState(84);
  useLayoutEffect(() => {
    if (!headerRef.current) return;
    setMenuTop(headerRef.current.offsetHeight + 24);
  }, [state.preview, menu]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
    savedScroll.current = 0;
    if (state.preview === "product" || state.preview === "payments-setup") menuRef.current = false;
  }, [state.preview, state.selectedProductId]);
  useEffect(() => {
    if (!menu) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu.current(false, true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);
  const menuProps = {
    preview: state.preview,
    onOpen: (id: string) => nav.rail(id),
    onGo: (page: PreviewId) => nav.go(page),
    onSearch: (scope?: string) => {
      setMenuOpen(false, true);
      onSearch(scope);
    },
  };
  return (
    <aside
      className={`p-partial-theme-admin-next-light relative flex h-full shrink-0 flex-col overflow-hidden rounded-[20px] text-[#303030] ${grey ? "bg-[#f7f7f7]" : "bg-white"} ${
        state.motion ? "transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0,1)]" : ""
      }`}
      style={{ width: wide ? 584 : 393 }}
    >
      <HeaderSlotProvider slot={slot}>
        <header ref={headerRef} className="relative z-30 flex shrink-0 items-center justify-between gap-3 px-6 pb-1 pt-7">
          {detailBack ? (
            <button
              type="button"
              aria-label={detailBack}
              onClick={() => {
                menuRef.current = false;
                setMenu(false);
                onPreview(state.preview === "product" ? "products" : "payments");
              }}
              className={circleButton}
            >
              <PIcon name="ArrowLeft" size={20} />
            </button>
          ) : (
            <button
              type="button"
              aria-label={menu ? "Close admin menu" : "Open admin menu"}
              aria-expanded={menu}
              aria-controls="admin-menu"
              onClick={() => setMenuOpen(!menu, true)}
              className={circleButton}
            >
              <span className="relative grid size-5 place-items-center">
                <span className={`absolute transition-all duration-200 ${menu ? "scale-75 rotate-90 opacity-0" : "opacity-100"}`}>
                  <PIcon name="Menu" size={20} />
                </span>
                <span className={`absolute transition-all duration-200 ${menu ? "opacity-100" : "-rotate-90 scale-75 opacity-0"}`}>
                  <PIcon name="X" size={20} />
                </span>
              </span>
            </button>
          )}
          <div ref={setSlot} className="flex min-w-0 items-center justify-end gap-1.5" />
        </header>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">
          {state.menuStyle === "push" ? (
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                menu ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden" inert={menu ? undefined : true}>
                <div id={menu ? "admin-menu" : undefined} className="border-b border-[#ebebeb] px-6 pb-3 pt-5">
                  <AdminMenu {...menuProps} />
                </div>
              </div>
            </div>
          ) : null}
          <div
            key={state.preview}
            className={`${state.motion ? "page-in" : ""} ${menu && state.menuStyle === "push" ? "opacity-40 transition-opacity duration-300" : "opacity-100 transition-opacity duration-300"}`}
            onPointerDownCapture={(event) => {
              if (!menu || state.menuStyle !== "push") return;
              swallow.current = true;
              event.preventDefault();
              event.stopPropagation();
              setMenuOpen(false, true);
            }}
            onClickCapture={(event) => {
              if (!swallow.current) return;
              swallow.current = false;
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <Screen
              state={state}
              nav={nav}
              onCard={onCard}
              onDismissCard={onDismissCard}
              onBusiness={onBusiness}
              onIdentity={onIdentity}
              onPaymentsNext={onPaymentsNext}
              onProduct={(id) => {
                menuRef.current = false;
                setMenu(false);
                onProduct(id);
              }}
              onUpdateProduct={onUpdateProduct}
              onAddProduct={onAddProduct}
            />
          </div>
        </div>
        {state.menuStyle === "drop" && menu ? (
          <>
            <button type="button" aria-label="Close admin menu" onClick={() => setMenu(false)} className="absolute inset-0 z-20" />
            <div
              id="admin-menu"
              role="menu"
              aria-label="Admin menu"
              className="pop-in absolute inset-x-6 z-30 max-h-[calc(100%-108px)] overflow-y-auto rounded-2xl bg-white p-2 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.16)]"
              style={{ top: menuTop }}
            >
              <AdminMenu {...menuProps} />
            </div>
          </>
        ) : null}
      </HeaderSlotProvider>
    </aside>
  );
}

function Screen(props: {
  state: PrototypeState;
  nav: Nav;
  onCard: (id: string) => void;
  onDismissCard: (id: string) => void;
  onBusiness: (value: PrototypeState["businessType"]) => void;
  onIdentity: (patch: Partial<PrototypeState["identity"]>) => void;
  onPaymentsNext: () => void;
  onProduct: (id: string) => void;
  onUpdateProduct: (id: string, patch: Partial<Product>) => void;
  onAddProduct: () => void;
}) {
  const { state, nav } = props;
  switch (state.preview) {
    case "home-setup":
      return <HomeSetup state={state} nav={nav} onCard={props.onCard} onDismiss={props.onDismissCard} />;
    case "home-active":
      return <HomeActive nav={nav} />;
    case "payments":
      return <Payments nav={nav} />;
    case "payments-setup":
      return (
        <PaymentsSetup
          state={state}
          onBusiness={props.onBusiness}
          onIdentity={props.onIdentity}
          onNext={props.onPaymentsNext}
          onBack={() => nav.onPreview("payments")}
        />
      );
    case "products":
      return <Products state={state} onProduct={props.onProduct} onAdd={props.onAddProduct} nav={nav} />;
    case "product":
      return <ProductEdit state={state} onBack={() => nav.onPreview("products")} onProduct={props.onProduct} onUpdate={props.onUpdateProduct} />;
    default:
      return <AdminPage page={state.preview} state={state} nav={nav} />;
  }
}

/* Shared pieces for the Figma-designed screens (active home, payments setup) */

function H1({ children }: { children: ReactNode }) {
  return <h2 className="text-[25px] font-medium leading-8 tracking-[-0.75px] text-[#171817]">{children}</h2>;
}

type PillTone = "outline" | "fill" | "dark" | "soft" | "ink";

const pillTone: Record<PillTone, string> = {
  outline: "border border-[#e3e3e3] bg-white text-[#171817] shadow-[0_3px_15px_rgba(0,0,0,0.03)] hover:bg-[#fafafa] active:bg-[#f4f4f4]",
  fill: "bg-[#ebebeb] text-[#171817] hover:bg-[#e3e3e3] active:bg-[#dcdcdc]",
  soft: "bg-[#f4f5f3] text-[#171817] hover:bg-[#ebece9] active:bg-[#e3e4e1]",
  dark: "bg-gradient-to-t from-black to-[#3d3d3d] text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_3px_16px_rgba(0,0,0,0.1)] hover:to-[#4a4a4a]",
  ink: "bg-[#171817] text-white hover:bg-[#2a2b2a]",
};

function Pill({
  tone = "outline",
  onClick,
  className = "",
  children,
  label,
}: {
  tone?: PillTone;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`press inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium leading-none tracking-[-0.13px] transition-colors ${pillTone[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "gap-2 p-2" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-col rounded-[24px] border border-[#e3e3e3] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04),0_3px_12px_rgba(0,0,0,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-[#eaece8]" />;
}

/* Home · setup guides, from the current admin home */

const setupCards: { id: string; art: ReactNode; title: string; body: string; cta: string; badge?: string }[] = [
  {
    id: "theme",
    art: <img src="/assets/theme-pitch.png" alt="" className="absolute left-1/2 top-[19px] w-[228px] -translate-x-1/2 rounded-t-[3px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]" />,
    title: "Choose your store design",
    body: "Pick a theme that fits your brand, then customize from there.",
    cta: "Choose theme",
  },
  {
    id: "payments",
    art: <PayArt />,
    title: "You're ready to accept payments",
    body: "Review settings to accept more payment methods and add a payout account.",
    cta: "Review payments",
  },
  {
    id: "domain",
    art: <DomainArt />,
    badge: "Get $20 back",
    title: "Get a custom domain",
    body: "Give your store a branded URL that's easy to find, trust, and remember.",
    cta: "Set up domain",
  },
  {
    id: "shipping",
    art: <img src="/assets/shipping-label.png" alt="" className="absolute left-1/2 top-8 w-40 -translate-x-1/2" />,
    title: "Review shipping rates",
    body: "Look over the defaults set up for you based on your location.",
    cta: "Review rates",
  },
  {
    id: "address",
    art: <img src="/assets/address-pin.png" alt="" className="absolute left-1/2 top-4 size-24 -translate-x-1/2 object-contain" />,
    title: "Add your retail address",
    body: "Add location details and set fulfillment options.",
    cta: "Add address",
  },
  {
    id: "pos",
    art: <img src="/assets/pos.png" alt="" className="absolute left-1/2 top-2 h-32 -translate-x-1/2 object-contain" />,
    title: "Order POS hardware",
    body: "Power your store with fast checkouts you can count on.",
    cta: "Order hardware",
  },
];

/** Cards that have already played their collapse, so returning to Home doesn't replay it. */
const collapsedCards = new Set<string>();

function HomeSetup({
  state,
  nav,
  onCard,
  onDismiss,
}: {
  state: PrototypeState;
  nav: Nav;
  onCard: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const hidden = new Set([...state.cardsDone, ...state.cardsDismissed]);
  return (
    <div className="flex flex-col gap-6 px-6 pb-10 pt-5">
      <HeaderExtras>
        <span className="flex items-center gap-1.5 text-[12px] text-[#616161]">
          Trial end in 1 day
          <span className="size-2 rounded-full bg-[#e51c00]" />
        </span>
      </HeaderExtras>
      <h2 className="text-left text-[22px] font-medium leading-[1.3] tracking-[-0.44px] text-[#171817]">
        <button
          type="button"
          onClick={() => nav.go("settings-general")}
          className="underline decoration-dotted decoration-1 underline-offset-[5px] hover:decoration-solid"
        >
          {state.storeName}
        </button>{" "}
        {state.cardsDone.length > 0 ? "is on a roll" : "is looking good"}
        <br />
        Now let’s design your store
      </h2>
      <ul aria-label="Home feed" className="flex flex-col">
        {setupCards.map((card) => (
          <CardSlot key={card.id} id={card.id} hidden={hidden.has(card.id)}>
            <SetupCard {...card} onOpen={() => onCard(card.id)} onDismiss={() => onDismiss(card.id)} />
          </CardSlot>
        ))}
      </ul>
      {setupCards.every((card) => hidden.has(card.id)) ? (
        <p className="rise text-center text-[12px] text-[#616161]">You’re all caught up. Sidekick will suggest what to do next.</p>
      ) : null}
    </div>
  );
}

function CardSlot({ id, hidden, children }: { id: string; hidden: boolean; children: ReactNode }) {
  const [hiddenAtMount] = useState(hidden);
  const [phase, setPhase] = useState<"shown" | "fading" | "gone">(() => (hidden && collapsedCards.has(id) ? "gone" : "shown"));
  useEffect(() => {
    if (!hidden) {
      collapsedCards.delete(id);
      return;
    }
    if (collapsedCards.has(id)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A card completed elsewhere stays on screen for a beat when Home opens, so the reflow reads as cause and effect.
    const delay = reduce ? 0 : hiddenAtMount ? 450 : 0;
    const fade = window.setTimeout(() => setPhase("fading"), delay);
    const gone = window.setTimeout(() => {
      collapsedCards.add(id);
      setPhase("gone");
    }, delay + (reduce ? 0 : 220));
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(gone);
    };
  }, [hidden, id, hiddenAtMount]);
  const state = !hidden ? "shown" : phase;
  return (
    <li
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={`grid transition-[grid-template-rows,opacity,scale] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
        state === "gone" ? "grid-rows-[0fr] opacity-0 duration-300" : state === "fading" ? "grid-rows-[1fr] scale-[0.97] opacity-0 duration-200" : "grid-rows-[1fr] opacity-100 duration-200"
      }`}
    >
      <div className={`min-h-0 ${hidden ? "overflow-hidden" : ""}`}>
        <div className="pb-3">{children}</div>
      </div>
    </li>
  );
}

function SetupCard({
  art,
  title,
  body,
  cta,
  badge,
  onOpen,
  onDismiss,
}: {
  art: ReactNode;
  title: string;
  body: string;
  cta: string;
  badge?: string;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group/card relative flex cursor-pointer flex-col rounded-2xl bg-white p-1.5 shadow-[0_0_0_1px_#ebebeb,0_1px_0_rgba(0,0,0,0.03)] outline-none transition-[transform,box-shadow] duration-200 ease-out will-change-transform hover:scale-[1.025] hover:shadow-[0_0_0_1px_#dcdcdc,0_10px_28px_rgba(0,0,0,0.1)] focus-visible:shadow-[0_0_0_2px_#005bd3] active:scale-[1.01] active:shadow-[0_0_0_1px_#d4d4d4,0_6px_18px_rgba(0,0,0,0.1)] motion-reduce:transform-none"
    >
      <div className="relative h-[132px] overflow-hidden rounded-xl bg-gradient-to-b from-[#f6f6f6] to-[#ececed]">
        <div className="absolute inset-0 origin-center opacity-90 saturate-[0.85] transition-[transform,filter,opacity] duration-300 ease-out group-hover/card:scale-[1.06] group-hover/card:opacity-100 group-hover/card:saturate-100 group-active/card:scale-[1.04] group-active/card:opacity-100 group-active/card:saturate-100 motion-reduce:transform-none">
          {art}
        </div>
        {badge ? <span className="absolute left-2 top-2 rounded-full bg-[#616161] px-2 py-0.5 text-[11px] font-medium text-white">{badge}</span> : null}
        <button
          type="button"
          aria-label="Dismiss card"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-white/95 text-[#4a4a4a] opacity-0 shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-opacity duration-200 hover:bg-white hover:text-[#303030] focus-visible:opacity-100 group-hover/card:opacity-100 group-active/card:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <PIcon name="X" size={14} />
        </button>
      </div>
      <div className="flex flex-col items-start gap-3 px-2.5 pb-2.5 pt-3 transition-transform duration-200 ease-out group-hover/card:-translate-y-px">
        <div className="flex flex-col gap-1">
          <h3 className="text-[13px] font-semibold text-[#303030]">{title}</h3>
          <p className="text-[12px] leading-[1.45] text-[#616161]">{body}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="press inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[12px] font-semibold text-[#303030] shadow-[0_0_0_1px_#e3e3e3,0_1px_0_#e3e3e3] hover:bg-[#fafafa]"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}

export function ReadyToSell({ onLaunch, dark = false }: { onLaunch: () => void; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={`flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-[12px] font-medium ${dark ? "text-white" : "text-[#303030] hover:bg-[#f1f1f1]"}`}
      >
        <span className="grid size-3.5 place-items-center rounded-full bg-[#cdfed4]">
          <span className="size-2 rounded-full bg-[#29b14b]" />
        </span>
        Ready to sell
      </button>
      {open ? <ReadyCard onLaunch={onLaunch} className="left-0 top-8" /> : null}
    </span>
  );
}

export function ReadyCard({ onLaunch, className }: { onLaunch: () => void; className: string }) {
  return (
    <span
      className={`pop-in absolute z-50 flex w-[240px] flex-col items-start gap-1.5 rounded-2xl bg-white p-3 text-left text-[#303030] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.16)] ${className}`}
    >
      <span className="flex items-center gap-1.5 rounded-full bg-[#f1f1f1] py-0.5 pl-1 pr-2 text-[11px] font-medium">
        <span className="size-2 rounded-full bg-[#29b14b]" /> Ready to sell
      </span>
      <span className="text-[13px] font-semibold">You can sell, but your store isn’t public</span>
      <span className="text-[12px] leading-[1.4] text-[#616161]">When you’re ready to reach customers, launch your online store.</span>
      <span className="pt-1">
        <Btn tone="primary" onClick={onLaunch}>
          Launch store
        </Btn>
      </span>
    </span>
  );
}

function PayArt() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-[166px] top-[63px] grid h-[50px] w-[86px] place-items-center rounded-[13px] bg-white shadow-md">
        <span className="flex">
          <span className="size-6 rounded-full bg-[#eb001b]" />
          <span className="-ml-2.5 size-6 rounded-full bg-[#f79e1b] mix-blend-multiply" />
        </span>
      </div>
      <div className="absolute left-[121px] top-[41px] grid h-[50px] w-[87px] place-items-end rounded-[13px] bg-[#1934cf] px-3 pb-1.5 text-[22px] font-extrabold italic leading-none tracking-tight text-white shadow-md">
        VISA
      </div>
      <div className="absolute left-[78px] top-[19px] grid h-[50px] w-[86px] place-items-center rounded-[13px] bg-[#5a31f4] text-[24px] font-bold tracking-[-0.8px] text-white shadow-md">
        shop
      </div>
    </div>
  );
}

function DomainArt() {
  return (
    <div className="absolute left-14 top-6 h-[154px] w-[206px] rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <div className="relative m-2 flex h-10 items-center gap-2 rounded-full border border-[#e7e7e7] bg-white pl-4 pr-3 shadow-sm">
        <span className="h-2.5 flex-1 rounded-full bg-[#e4e4e4]" />
        <span className="text-[13px] text-[#303030]">.com</span>
        <img src="/assets/domain-cursor.png" alt="" className="absolute -bottom-12 -right-6 w-11" />
      </div>
    </div>
  );
}

/* Home · active store */

const ranges = {
  today: { label: "Today", sales: 1842.5, sessions: 612, orders: 14, conversion: 2.3, scale: 0.55 },
  week: { label: "Last 7 days", sales: 11284.9, sessions: 3410, orders: 92, conversion: 2.6, scale: 0.8 },
  month: { label: "Last 30 days", sales: 48392.5, sessions: 14280, orders: 386, conversion: 2.7, scale: 1 },
} as const;

type RangeId = keyof typeof ranges;

function HomeActive({ nav }: { nav: Nav }) {
  const [range, setRange] = useState<RangeId>("month");
  const data = ranges[range];
  const next: Record<RangeId, RangeId> = { today: "week", week: "month", month: "today" };
  const analytics = () => nav.onRail("analytics");
  return (
    <div className="flex flex-col gap-6 px-6 pb-[86px] pt-5">
      <div className="flex flex-col gap-6">
        <div className="flex h-8 items-center justify-between">
          <H1>Home</H1>
          <button type="button" onClick={analytics} className="press group flex items-center gap-1.5 text-[12px] leading-[1.45] tracking-[-0.12px] text-[#737572] hover:text-[#171817]">
            82 visitors right now
            <span className="flex -space-x-2">
              {["/assets/visitor-a.png", "/assets/visitor-b.png", "/assets/user.png"].map((src) => (
                <img key={src} src={src} alt="" className="size-5 rounded-full border-[1.5px] border-white object-cover" />
              ))}
            </span>
            <span className="text-[#171817] transition-transform group-hover:translate-x-0.5">
              <PIcon name="ChevronRight" size={20} />
            </span>
          </button>
        </div>
        <div className="-mr-6 flex gap-2 overflow-x-auto pr-6 [scrollbar-width:none]">
          <Pill tone="ink" onClick={() => setRange(next[range])} className="pl-3 pr-[13px]">
            <PIcon name="Calendar" size={20} />
            {data.label}
          </Pill>
          <Pill tone="soft" className="px-[13px]">
            All sales channels
          </Pill>
          <Pill tone="soft" onClick={analytics} className="px-[13px]">
            View analytics
          </Pill>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button type="button" onClick={analytics} aria-label="Open analytics" className="block">
          <SalesChart key={range} scale={data.scale} />
        </button>
        <div className="flex flex-col gap-1">
          <Metric name="Total sales" value={data.sales} prefix="$" decimals={2} delta="24%" up onClick={analytics} rangeKey={range} />
          <Metric name="Sessions" value={data.sessions} delta="18%" up onClick={analytics} rangeKey={range} />
          <Metric name="Total orders" value={data.orders} delta="2%" up={false} onClick={analytics} rangeKey={range} />
          <Metric name="Conversion rate" value={data.conversion} suffix="%" decimals={1} delta="0.2%" up onClick={analytics} rangeKey={range} />
        </div>
      </div>

      <Divider />

      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[20px] font-medium leading-8 tracking-[-0.4px]">Recent activity</h3>
          <button type="button" onClick={() => nav.onRail("orders")} className="press text-[12px] text-[#737572] hover:text-[#171817]">
            View all
          </button>
        </div>
        <div className="flex flex-col">
          <Activity icon="Order" title="Danielle Hudson placed order #1078." meta="$369.99 · 3 items · 7 minutes ago" onClick={() => nav.onRail("orders")} />
          <Activity icon="Money" title="Your payout is on its way." meta="$2,184.60 · Today at 8:00 AM" onClick={() => nav.onRail("finance")} />
          <Activity icon="Delivery" title="Order #1071 was delivered." meta="Maya Chen · Today at 7:42 AM" onClick={() => nav.onRail("orders")} />
        </div>
      </section>

      <Divider />

      <section className="flex flex-col gap-3.5">
        <h3 className="text-[20px] font-medium leading-8 tracking-[-0.4px]">Business forward</h3>
        <div className="grid grid-cols-2 gap-6">
          <Forward
            title="Your best seller is picking up speed"
            body="Flora Sneakers sales are up 32%. You have 126 units left across 8 variants."
            cta="Review inventory"
            onClick={() => nav.onRail("products")}
          />
          <Forward
            title="Bring customers back for a second look"
            body="Turn this month’s new shoppers into repeat customers with a welcome-back email."
            cta="Plan a campaign with Sidekick"
            onClick={() => nav.onRail("growth")}
          />
        </div>
      </section>
    </div>
  );
}

function Forward({ title, body, cta, onClick }: { title: string; body: string; cta: string; onClick: () => void }) {
  return (
    <div className="flex flex-col items-start gap-[7px]">
      <p className="text-[13px] font-medium leading-[1.3] tracking-[-0.13px]">{title}</p>
      <p className="text-[12px] leading-[1.4] text-[#737572]">{body}</p>
      <button type="button" onClick={onClick} className="press text-left text-[12px] font-medium leading-[1.4] hover:underline">
        {cta}
        <span className="-my-1 ml-0.5 inline-block align-middle">
          <PIcon name="ArrowRight" size={20} />
        </span>
      </button>
    </div>
  );
}

function useCountUp(value: number, duration = 900) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const span = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = span === 0 ? 1 : Math.min(1, (now - start) / span);
      const eased = 1 - Math.pow(1 - t, 4);
      setCurrent(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return current;
}

function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const current = useCountUp(value);
  const text = current.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span className={`tabular-nums ${className ?? ""}`}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

function Delta({ up, children }: { up: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex w-12 shrink-0 items-center justify-center whitespace-nowrap rounded-[20px] px-1.5 py-1 text-[11px] font-semibold leading-3 tracking-[-0.55px] ${
        up ? "bg-[rgb(215,255,215)] text-black" : "bg-[#f4f5f3] text-[#787878]"
      }`}
    >
      <span className="-my-1 -ml-1">
        <PIcon name={up ? "ArrowUp" : "ArrowDown"} size={20} />
      </span>
      {children}
    </span>
  );
}

function Metric({
  name,
  value,
  delta,
  up,
  prefix,
  suffix,
  decimals,
  onClick,
  rangeKey,
}: {
  name: string;
  value: number;
  delta: string;
  up: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  onClick: () => void;
  rangeKey: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press press-row -mx-2 flex items-center justify-between rounded-xl px-2 py-2 text-left hover:bg-[#f7f7f6]"
    >
      <span className="flex items-center gap-2">
        <Delta up={up}>{delta}</Delta>
        <span className="text-[13px] font-medium tracking-[-0.13px]">{name}</span>
      </span>
      <CountUp
        key={`${name}-${rangeKey}`}
        value={value}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        className="text-[20px] font-medium leading-8 tracking-[-0.8px]"
      />
    </button>
  );
}

function Activity({ icon, title, meta, onClick }: { icon: PolarisIconName; title: string; meta: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press press-row -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[#f7f7f6]">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f4f5f3] text-[#171817]">
        <PIcon name={icon} size={20} />
      </span>
      <span className="flex min-w-0 flex-col gap-[3px]">
        <span className="truncate text-[13px] font-medium leading-4 tracking-[-0.13px]">{title}</span>
        <span className="truncate text-[12px] leading-4 text-[#737572]">{meta}</span>
      </span>
    </button>
  );
}

const salesPath = "M0 155 C 14 140, 24 128, 40 128 C 58 128, 64 140, 80 138 C 104 134, 106 96, 126 94 C 148 92, 152 118, 172 116 C 190 114, 194 92, 212 86 C 230 80, 240 100, 258 98 C 278 96, 280 86, 300 92 C 314 96, 318 98, 329 94";
const comparePath = "M0 140 C 16 138, 24 148, 44 146 C 62 144, 68 122, 90 118 C 112 114, 114 104, 134 104 C 152 104, 160 118, 182 112 C 200 106, 206 96, 222 98 C 240 100, 244 66, 262 66 C 282 66, 290 92, 308 92 C 318 92, 322 88, 329 86";
const areaPath =
  "M0 80 C 14 72, 24 58, 44 56 C 62 54, 72 64, 92 66 C 108 68, 112 50, 126 50 C 142 50, 140 64, 156 64 C 172 64, 182 60, 196 58 C 212 56, 216 60, 230 52 C 244 44, 238 16, 260 12 C 280 8, 282 36, 300 34 C 314 32, 320 26, 329 26 L 329 156 L 0 156 Z";

function SalesChart({ scale }: { scale: number }) {
  const sy = 0.55 + scale * 0.45;
  return (
    <svg viewBox="0 0 329 180" className="h-[180px] w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5631f4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5631f4" stopOpacity="0.06" />
        </linearGradient>
        <mask id="compare-reveal" maskUnits="userSpaceOnUse" x="-4" y="-4" width="337" height="188">
          <path className="chart-line-compare" pathLength={1} d={comparePath} fill="none" stroke="white" strokeWidth="6" />
        </mask>
      </defs>
      {[8, 60, 112, 164].map((y) => (
        <line key={y} x1="0" x2="329" y1={y} y2={y} stroke="#eaece8" strokeWidth="1" />
      ))}
      <g transform={`translate(0 ${164 * (1 - sy)}) scale(1 ${sy})`}>
        <path className="chart-fill" d={areaPath} fill="url(#sales-fill)" />
        <path d={comparePath} fill="none" stroke="#c4c6c2" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" mask="url(#compare-reveal)" />
        <path className="chart-line" pathLength={1} d={salesPath} fill="none" stroke="#5631f4" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* Payments setup (panel widens to 584) */

const businessCopy = {
  individual: {
    title: "An individual",
    body: "I haven't registered with any legal entities and I'm just running the store in my name.",
  },
  business: {
    title: "A registered business",
    body: "I have a business that will own this store and is registered with the government of the United States.",
  },
  nonprofit: {
    title: "A non-profit",
    body: "I have a non-profit entity that will own this store and is registered with the government of the United States.",
  },
} as const;

function PaymentsSetup({
  state,
  onBusiness,
  onIdentity,
  onNext,
  onBack,
}: {
  state: PrototypeState;
  onBusiness: (value: PrototypeState["businessType"]) => void;
  onIdentity: (patch: Partial<PrototypeState["identity"]>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const identity = state.paymentsStep === "identity" || state.paymentsStep === "done";
  return (
    <>
      <TopBar title="Set up Shopify Payments" />
      <div className="flex flex-col gap-6 px-6 pb-[86px]">
      <p className="text-[13px] leading-[1.4] tracking-[-0.13px] text-[#4a4a4a]">Tell us about your store to start accepting payments</p>
      <div key={identity ? "identity" : "type"} className="rise">
        <Card className="p-2">
          <p className="p-4 text-[15px] font-medium leading-[1.4] tracking-[-0.15px]">{identity ? "What’s your legal name?" : "I am running my store as:"}</p>
          {identity ? (
            <div className="flex flex-col gap-3 px-4 pb-4">
              <s-text-field
                label="First name"
                name="first-name"
                autocomplete="given-name"
                value={state.identity.first}
                onInput={(event) => onIdentity({ first: event.currentTarget.value })}
              />
              <s-text-field
                label="Last name"
                name="last-name"
                autocomplete="family-name"
                value={state.identity.last}
                onInput={(event) => onIdentity({ last: event.currentTarget.value })}
              />
            </div>
          ) : (
            <div role="radiogroup" aria-label="Business type" className="flex flex-col gap-1">
              {(Object.keys(businessCopy) as BusinessType[]).map((key) => {
                const selected = state.businessType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onBusiness(key)}
                    className={`press press-row flex gap-3 rounded-2xl p-3 text-left transition-colors ${selected ? "bg-[#f7f7f7]" : "hover:bg-[#fafafa]"}`}
                  >
                    <span
                      className={`mt-1 grid size-4 shrink-0 place-items-center rounded-full transition-colors ${
                        selected ? "bg-[#171717]" : "border border-[#ccc] bg-white"
                      }`}
                    >
                      <span className={`rounded-full bg-white transition-transform ${selected ? "size-2 scale-100" : "size-2 scale-0"}`} />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[15px] font-medium leading-6 tracking-[-0.15px]">{businessCopy[key].title}</span>
                      <span className="text-[13px] leading-[1.4] tracking-[-0.13px] text-[#4a4a4a]">{businessCopy[key].body}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>
      <div className="flex justify-end gap-2">
        {identity ? (
          <Pill tone="fill" onClick={onBack}>
            Back
          </Pill>
        ) : null}
        <Pill tone="dark" onClick={onNext}>
          {identity ? "Continue" : "Next"}
        </Pill>
      </div>
      </div>
    </>
  );
}

/* Settings › Payments */

const payPoints = [
  "Tap into the 400+ million buyers who expect Shop Pay",
  "Sell in over 130 currencies and get paid in yours",
  "Access funding, credit, and a free business account for payouts and spending",
];

const configRows: { icon: PolarisIconName; label: string }[] = [
  { icon: "Payment", label: "Payment capture method" },
  { icon: "Settings", label: "Payment method customizations" },
  { icon: "GiftCard", label: "Gift card expiration" },
  { icon: "Wallet", label: "Apple Wallet passes" },
];

function Payments({ nav }: { nav: Nav }) {
  return (
    <>
      <TopBar title="Payments" sections={sectionChoices("payments") ?? undefined} current="payments" onSection={(page) => nav.go(page)} />
      <Body>
        <Section
          title="Shopify Payments"
          aside={
            <span className="flex gap-1.5">
              <Btn tone="gray" onClick={() => nav.onChip("Learn more")}>
                Learn more
              </Btn>
              <Btn tone="primary" onClick={() => nav.onChip("Complete setup")}>
                Complete setup
              </Btn>
            </span>
          }
        >
          <AdminCard className="flex flex-col gap-2.5">
            <Muted>No transaction fees · Card rates starting at 2.9% + $0.30</Muted>
            <div className="flex flex-col gap-1.5 rounded-lg bg-[#f7f7f7] p-3">
              <p className="text-[12px] font-semibold">Get up to 7.5% better performance than any other provider on Shopify</p>
              {payPoints.map((point) => (
                <p key={point} className="flex gap-1.5 text-[12px] leading-[1.4]">
                  <span className="mt-px shrink-0">
                    <PIcon name="Check" size={14} />
                  </span>
                  {point}
                </p>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg p-2.5 text-[12px] shadow-[0_0_0_1px_#ebebeb]">
              <PIcon name="Payment" size={18} />
              <span className="flex-1">Available payment methods</span>
              <img src="/assets/admin/pay-methods.png" alt="Shop Pay, Visa, Mastercard, American Express, Discover, Diners Club" className="h-4 w-auto" />
              <span className="text-[11px] text-[#616161]">+10</span>
            </div>
          </AdminCard>
          <button type="button" className="self-start px-1 text-[12px] text-[#303030] underline">
            See all other providers
          </button>
        </Section>
        <MethodSection title="More ways to pay" body="Offer methods processed offsite or through custom checkout integrations" />
        <MethodSection title="Manual payment methods" body="Accept payments outside your online store, like bank deposits or cash on delivery" />
        <Section title="Payment configuration">
          <AdminCard flush>
            {configRows.map((row, index) => (
              <Row key={row.label} first={index === 0} icon={row.icon} title={row.label} />
            ))}
          </AdminCard>
        </Section>
      </Body>
    </>
  );
}

function MethodSection({ title, body }: { title: string; body: string }) {
  return (
    <Section title={title}>
      <Muted className="-mt-2 px-1">{body}</Muted>
      <AdminCard className="flex justify-center">
        <Btn tone="gray" icon="Plus">
          Method
        </Btn>
      </AdminCard>
    </Section>
  );
}

/* Products */

const toneClass: Record<ProductTone, string> = {
  coral: "bg-[#ffd9cc]",
  blue: "bg-[#d4e8ff]",
  lamp: "bg-[#e8dcff]",
  lilac: "bg-[#f6dcf5]",
  headphones: "bg-[#ffe3c9]",
  mint: "bg-[#d3f1ee]",
  sand: "bg-[#f8dcd8]",
  teal: "bg-[#d5f0ec]",
  violet: "bg-[#e1d9ff]",
  navy: "bg-[#d6e7ff]",
  amber: "bg-[#ffe2c6]",
  aqua: "bg-[#ccf3f6]",
};

function Products({ state, onProduct, onAdd, nav }: { state: PrototypeState; onProduct: (id: string) => void; onAdd: () => void; nav: Nav }) {
  const [query, setQuery] = useState("");
  const shown = state.products.filter((product) => product.title.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <>
      <TopBar
        title="Products"
        sections={sectionChoices("products") ?? undefined}
        current="products"
        onSection={(page) => nav.go(page)}
        actions={[{ label: "Add product", tone: "primary", onClick: onAdd }]}
        more={[{ label: "View as" }, { label: "Import" }, { label: "Export" }]}
      />
      <Body>
        <AdminCard flush>
          <div className="flex items-stretch gap-3 overflow-x-auto px-3 py-2.5 [scrollbar-width:none]">
            <span className="flex shrink-0 items-center gap-1 self-center text-[12px] font-medium">
              <PIcon name="Calendar" size={16} />
              30 days
            </span>
            {[
              ["Average sell-through rate", state.scenario === "active" ? "18.4%" : "—"],
              ["Products by days of inventory remaining", state.scenario === "active" ? "42 days" : "No data"],
              ["ABC product analysis", state.scenario === "active" ? "A: 4 · B: 6 · C: 18" : "No data"],
            ].map(([label, value]) => (
              <span key={label} className="flex w-40 shrink-0 flex-col gap-0.5 border-l border-[#ebebeb] pl-3 text-[12px]">
                <span className="truncate font-semibold underline decoration-[#b5b5b5] decoration-dotted underline-offset-[3px]">{label}</span>
                <span className="text-[#616161]">{value}</span>
              </span>
            ))}
          </div>
        </AdminCard>
        <Table
          select
          toolbar={<TableSearch placeholder="Search and filter" value={query} onChange={setQuery} />}
          onRow={(index) => onProduct(shown[index].id)}
          columns={[
            { label: "", width: 28 },
            { label: "Product", width: 170 },
            { label: "Status", width: 64 },
            { label: "Inventory", width: 128 },
            { label: "Category", width: 96 },
            { label: "Channels", width: 64, align: "end" },
            { label: "Product type", width: 92 },
            { label: "Vendor", width: 80 },
          ]}
          rows={shown.map((product) => [
            <Thumb key="t" product={product} size={28} />,
            <span key="p" className="font-semibold">
              {product.title || "Untitled product"}
            </span>,
            <Badge key="s" tone={product.status === "Active" ? "success" : "info"}>
              {product.status}
            </Badge>,
            product.inventory === "0 in stock" ? "Inventory not tracked" : product.inventory,
            "Uncategorized",
            "3",
            "",
            state.storeName,
          ])}
        />
        {shown.length === 0 ? <p className="py-6 text-center text-[12px] text-[#616161]">No products match “{query}”</p> : null}
      </Body>
    </>
  );
}

function Thumb({ product, size = 40 }: { product: Product; size?: number }) {
  if (product.image) {
    return (
      <img
        src={product.image}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-md border border-[#ebebeb] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className={`grid shrink-0 place-items-center rounded-md border border-[#ebebeb] ${toneClass[product.tone]}`} style={{ width: size, height: size }}>
      <span className="text-black/30">
        <PIcon name="Image" size={16} />
      </span>
    </span>
  );
}

/* Add product / edit product, stacked for the narrow panel */

const inputClass =
  "w-full rounded-lg border border-[#8a8a8a]/40 bg-white px-2.5 text-[12px] leading-[1.5] text-[#303030] outline-none transition-colors hover:border-[#8a8a8a] focus:border-[#303030] focus:shadow-[0_0_0_1px_#303030] placeholder:text-[#8a8a8a]";

const toolbarIcons: PolarisIconName[] = ["TextBold", "TextItalic", "TextUnderline", "TextColor", "TextAlignLeft", "Link", "Image", "PlayCircle", "TextIndent", "Code"];

function Label({ children }: { children: ReactNode }) {
  return <span className="text-[12px] font-medium text-[#303030]">{children}</span>;
}

function ProductEdit({
  state,
  onBack,
  onProduct,
  onUpdate,
}: {
  state: PrototypeState;
  onBack: () => void;
  onProduct: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Product>) => void;
}) {
  const [taxed, setTaxed] = useState(true);
  const [tracked, setTracked] = useState(true);
  const product = state.products.find((item) => item.id === state.selectedProductId) ?? state.products[0];
  if (!product) return null;
  const fresh = !product.title && !product.description;
  const index = state.products.findIndex((item) => item.id === product.id);
  const title = product.title.trim() || (fresh ? "Add product" : "Untitled product");
  return (
    <>
      <TopBar
        title={title}
        choices={state.products.map((item) => ({ id: item.id, label: item.title.trim() || "Untitled product" }))}
        choice={product.id}
        onChoice={onProduct}
        pager={{
          onPrev: () => onProduct(state.products[index - 1].id),
          onNext: () => onProduct(state.products[index + 1].id),
          prevDisabled: index <= 0,
          nextDisabled: index < 0 || index >= state.products.length - 1,
        }}
        actions={[{ label: "Save", tone: "primary", onClick: onBack }]}
      />
      <Body>
        <AdminCard className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <Label>Title</Label>
            <input value={product.title} placeholder="Short sleeve t-shirt" onChange={(event) => onUpdate(product.id, { title: event.target.value })} className={`${inputClass} h-8`} />
          </label>
          <div className="flex flex-col gap-1">
            <Label>Description</Label>
            <div className="overflow-hidden rounded-lg border border-[#8a8a8a]/40 focus-within:border-[#303030]">
              <div className="flex items-center gap-0.5 overflow-x-auto border-b border-[#ebebeb] bg-[#f7f7f7] px-1.5 py-1 text-[#4a4a4a] [scrollbar-width:none]">
                <span className="flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px]">
                  Paragraph <PIcon name="ChevronDown" size={14} />
                </span>
                {toolbarIcons.map((icon) => (
                  <span key={icon} className="grid size-6 shrink-0 place-items-center rounded hover:bg-[#ebebeb]">
                    <PIcon name={icon} size={16} />
                  </span>
                ))}
              </div>
              <textarea
                rows={4}
                value={product.description}
                aria-label="Description"
                onChange={(event) => onUpdate(product.id, { description: event.target.value })}
                className="w-full resize-none px-2.5 py-2 text-[12px] leading-[1.5] outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Media</Label>
            <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-[#8a8a8a] px-4 py-5">
              {product.image ? <img src={product.image} alt="" className="mb-1 size-14 rounded-md object-cover" /> : null}
              <span className="flex items-center gap-2">
                <Btn tone="gray">Upload new</Btn>
                <Btn tone="plain">Select existing</Btn>
              </span>
              <span className="text-[11px] text-[#616161]">Accepts images, videos, or 3D models</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <s-select label="Category" placeholder="Choose a product category" details="Determines tax rates and adds metafields to improve search, filters, and cross-channel sales">
              <s-option value="none">Uncategorized</s-option>
            </s-select>
          </div>
        </AdminCard>
        <Section title="Price">
          <AdminCard flush>
            <div className="p-3">
              <label className="flex h-8 w-40 items-center gap-1 rounded-lg border border-[#8a8a8a]/40 px-2.5 text-[12px] focus-within:border-[#303030]">
                <span className="text-[#616161]">$</span>
                <input
                  value={product.price}
                  inputMode="decimal"
                  aria-label="Price"
                  onChange={(event) => onUpdate(product.id, { price: event.target.value })}
                  className="min-w-0 flex-1 bg-transparent outline-none"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 border-t border-[#ebebeb] px-3 py-2">
              {["Compare-at", "Unit price"].map((label) => (
                <span key={label} className="rounded-md bg-[#f1f1f1] px-1.5 py-1 text-[11px] text-[#616161]">
                  {label}
                </span>
              ))}
              <button type="button" onClick={() => setTaxed((value) => !value)} className="flex items-center gap-1 rounded-md bg-[#f1f1f1] px-1.5 py-1 text-[11px] text-[#616161]">
                Charge tax <span className="rounded bg-[#e3e3e3] px-1 font-medium text-[#303030]">{taxed ? "Yes" : "No"}</span>
              </button>
              <span className="rounded-md bg-[#f1f1f1] px-1.5 py-1 text-[11px] text-[#616161]">Cost per item</span>
            </div>
          </AdminCard>
        </Section>
        <AdminCard flush>
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[13px] font-semibold">Inventory</span>
            <span className="flex items-center gap-2 text-[12px] text-[#616161]">
              Inventory tracked
              <Toggle on={tracked} onChange={setTracked} label="Inventory tracked" />
            </span>
          </div>
          {tracked ? (
            <div className="mx-3 mb-3 overflow-hidden rounded-lg text-[12px] shadow-[0_0_0_1px_#e3e3e3]">
              <div className="flex justify-between bg-[#f7f7f7] px-2.5 py-1.5 font-medium text-[#616161]">
                <span>Location</span>
                <span>Quantity</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-2">
                <span>Shop location</span>
                <input aria-label="Quantity" defaultValue={Number.parseInt(product.inventory, 10) || 0} className={`${inputClass} h-7 w-20 text-right`} />
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5 border-t border-[#ebebeb] px-3 py-2">
            {["SKU", "Barcodes"].map((label) => (
              <span key={label} className="rounded-md bg-[#f1f1f1] px-1.5 py-1 text-[11px] text-[#616161]">
                {label}
              </span>
            ))}
            <span className="flex items-center gap-1 rounded-md bg-[#f1f1f1] px-1.5 py-1 text-[11px] text-[#616161]">
              Sell when out of stock <span className="rounded bg-[#e3e3e3] px-1 font-medium text-[#303030]">Off</span>
            </span>
          </div>
        </AdminCard>
        <AdminCard className="flex flex-col gap-3">
          <s-select label="Status" value={product.status} onChange={(event) => onUpdate(product.id, { status: event.currentTarget.value as Product["status"] })}>
            <s-option value="Active">Active</s-option>
            <s-option value="Draft">Draft</s-option>
          </s-select>
          <span className="flex items-center justify-between text-[12px]">
            <span className="font-medium">Publishing</span>
            <PIcon name="Adjust" size={16} />
          </span>
          <span className="flex items-center gap-1.5 text-[12px]">
            <PIcon name="Channels" size={16} /> All channels
          </span>
        </AdminCard>
        <AdminCard className="flex flex-col gap-3">
          <span className="flex items-center gap-1 text-[12px] font-semibold">
            Product organization <PIcon name="Info" size={14} />
          </span>
          <s-select label="Type">
            <s-option value="">None</s-option>
          </s-select>
          <s-select label="Vendor">
            <s-option value="">None</s-option>
          </s-select>
          <s-text-field label="Collections" placeholder="Add collections" />
          <s-text-field label="Tags" placeholder="Add tags" />
          <s-select label="Theme template">
            <s-option value="default">Default product</s-option>
          </s-select>
        </AdminCard>
      </Body>
    </>
  );
}
