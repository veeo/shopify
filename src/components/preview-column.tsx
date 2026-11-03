"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PIcon } from "@/components/polaris-icon";
import type { BusinessType, PreviewId, Product, ProductTone, PrototypeState } from "@/lib/prototype";

type Nav = {
  onPreview: (page: PreviewId, wide?: boolean) => void;
  onRail: (id: string) => void;
  onChip: (label: string) => void;
};

export function PreviewColumn({
  state,
  onPreview,
  onChip,
  onBusiness,
  onIdentity,
  onPaymentsNext,
  onProduct,
  onUpdateProduct,
  onAddProduct,
  onRail,
}: {
  state: PrototypeState;
  onPreview: (page: PreviewId, wide?: boolean) => void;
  onChip: (label: string) => void;
  onBusiness: (value: PrototypeState["businessType"]) => void;
  onIdentity: (patch: Partial<PrototypeState["identity"]>) => void;
  onPaymentsNext: () => void;
  onProduct: (id: string) => void;
  onUpdateProduct: (id: string, patch: Partial<Product>) => void;
  onAddProduct: () => void;
  onRail: (id: string) => void;
}) {
  const wide = state.previewWide || state.preview === "payments-setup";
  const nav: Nav = { onPreview, onRail, onChip };
  return (
    <aside
      className={`p-partial-theme-admin-next-light h-full shrink-0 overflow-hidden rounded-3xl bg-white text-[#303030] ${
        state.motion ? "transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0,1)]" : ""
      }`}
      style={{ width: wide ? 584 : 393 }}
    >
      <div key={state.preview} className={`${state.motion ? "page-in" : ""} h-full overflow-y-auto [scrollbar-width:none]`}>
        <Screen
          state={state}
          nav={nav}
          onBusiness={onBusiness}
          onIdentity={onIdentity}
          onPaymentsNext={onPaymentsNext}
          onProduct={onProduct}
          onUpdateProduct={onUpdateProduct}
          onAddProduct={onAddProduct}
        />
      </div>
    </aside>
  );
}

function Screen(props: {
  state: PrototypeState;
  nav: Nav;
  onBusiness: (value: PrototypeState["businessType"]) => void;
  onIdentity: (patch: Partial<PrototypeState["identity"]>) => void;
  onPaymentsNext: () => void;
  onProduct: (id: string) => void;
  onUpdateProduct: (id: string, patch: Partial<Product>) => void;
  onAddProduct: () => void;
}) {
  const { state, nav } = props;
  const home = () => nav.onRail("home");
  switch (state.preview) {
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
          onHome={home}
        />
      );
    case "products":
      return <Products state={state} onProduct={props.onProduct} onAdd={props.onAddProduct} />;
    case "product":
      return (
        <ProductEdit
          state={state}
          onBack={() => nav.onPreview("products")}
          onHome={home}
          onUpdate={props.onUpdateProduct}
          onAdd={props.onAddProduct}
        />
      );
    case "theme":
      return (
        <SetupDetail
          title="Themes"
          onHome={home}
          art={<img src="/assets/theme-pitch.png" alt="" className="mx-auto h-56 rounded-lg object-cover object-top shadow-xl" />}
          body="PITCH is installed as a draft. Publish it when the photography is ready."
          action="Publish theme"
          secondary="Customize"
        />
      );
    case "domain":
      return (
        <SetupDetail
          title="Domains"
          onHome={home}
          body="Primary domain is still mystore.myshopify.com. Connect a domain you already own, or buy a new one."
          action="Connect existing domain"
          secondary="Buy new domain"
        >
          <s-text-field label="Domain" placeholder="example.com" name="domain" />
        </SetupDetail>
      );
    case "shipping":
      return (
        <SetupDetail
          title="Shipping"
          onHome={home}
          body="Rates set from your location. Calculated rates stay on at checkout."
          action="Edit rates"
        >
          <s-stack gap="small-200">
            <Row label="Domestic · under $50" value="$6.00" />
            <s-divider />
            <Row label="Domestic · $50 and up" value="Free" />
            <s-divider />
            <Row label="International" value="Calculated" />
          </s-stack>
        </SetupDetail>
      );
    case "address":
      return (
        <SetupDetail
          title="Locations"
          onHome={home}
          body="Add a retail address to offer pickup. Online orders still ship from the default location."
          action="Save location"
        >
          <s-stack gap="base">
            <s-text-field label="Location name" placeholder="Main street shop" name="location" />
            <s-text-field label="Address" placeholder="Street and number" name="address" autocomplete="address-line1" />
            <s-checkbox label="Offer local pickup" checked />
          </s-stack>
        </SetupDetail>
      );
    case "pos":
      return (
        <SetupDetail
          title="Point of Sale"
          onHome={home}
          art={<img src="/assets/pos.png" alt="" className="mx-auto h-36 object-contain" />}
          body="Retail kit: reader, dock, and receipt printer. One counter. Ships in 3–5 days."
          action="Order hardware"
        />
      );
    case "inbox":
      return (
        <ListPage
          title="Inbox"
          rows={[
            { label: "Where is order #1078?", meta: "Danielle Hudson · 4m" },
            { label: "Do you ship the lamp this week?", meta: "Maya Chen · 1h" },
            { label: "Can I exchange the case?", meta: "Jordan Ellis · Yesterday" },
          ]}
        />
      );
    case "notifications":
      return (
        <ListPage
          title="Notifications"
          rows={[
            { label: "Trial ends in 1 day", meta: "Pick a plan to keep selling", tone: "warning" },
            { label: "Payout of $2,184.60 is on the way", meta: "Today at 8:00 AM", go: () => nav.onRail("finance") },
            { label: "2 orders need tracking", meta: "Fulfillment", go: () => nav.onRail("customers") },
          ]}
        />
      );
    case "customers":
      return (
        <ListPage
          title="Customers"
          rows={[
            { label: "Danielle Hudson", meta: "3 orders · $612.40" },
            { label: "Maya Chen", meta: "1 order · $89.00" },
            { label: "Jordan Ellis", meta: "5 orders · $1,204.95" },
          ]}
        />
      );
    case "marketing":
      return (
        <ListPage
          title="Marketing"
          rows={[
            { label: "Welcome back", meta: "Email · Draft", tone: "info" },
            { label: "Headphones bundle", meta: "Discount · Paused" },
            { label: "Gift sets", meta: "Campaign · This week", tone: "success" },
          ]}
        />
      );
    case "analytics":
      return <Analytics />;
    case "finance":
      return (
        <ListPage
          title="Finance"
          rows={[
            { label: "Payout $2,184.60", meta: "Arrives today" },
            { label: "Balance $18,420.12", meta: "Shopify Balance" },
            { label: "Shopify Payments", meta: "Finish setup", tone: "warning", go: () => nav.onPreview("payments") },
          ]}
        />
      );
    case "content":
      return (
        <ListPage
          title="Content"
          rows={[
            { label: "Homepage hero", meta: "Metaobject" },
            { label: "Lamp delivery note", meta: "Page" },
            { label: "About the studio", meta: "Page" },
          ]}
        />
      );
    case "online-store":
      return (
        <ListPage
          title="Online Store"
          rows={[
            { label: "Themes", meta: "PITCH · Draft", go: () => nav.onPreview("theme") },
            { label: "Pages", meta: "4 pages" },
            { label: "Navigation", meta: "Main menu" },
            { label: "Domains", meta: "mystore.myshopify.com", go: () => nav.onPreview("domain") },
          ]}
        />
      );
    case "email":
      return (
        <ListPage
          title="Email"
          rows={[
            { label: "Welcome", meta: "Tightened by Slackbot", tone: "success" },
            { label: "Abandoned checkout", meta: "Automation · On" },
            { label: "Back in stock", meta: "Automation · Off" },
          ]}
        />
      );
    case "settings":
      return (
        <ListPage
          title="Settings"
          rows={[
            { label: "Store details", meta: "My Store" },
            { label: "Plan", meta: "Trial · 1 day left", tone: "warning" },
            { label: "Payments", meta: "Shopify Payments", go: () => nav.onPreview("payments") },
            { label: "Shipping and delivery", meta: "2 rates", go: () => nav.onPreview("shipping") },
            { label: "Locations", meta: "1 location", go: () => nav.onPreview("address") },
          ]}
        />
      );
    default:
      return <HomeSetup storeName={state.storeName} onChip={nav.onChip} />;
  }
}

function TopBar({ onBack, onHome, children }: { onBack?: () => void; onHome?: () => void; children?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 mb-1 flex h-14 items-center gap-2 bg-white/85 px-4 backdrop-blur-md">
      {onBack ? <s-button icon="arrow-left" accessibilityLabel="Back" onClick={onBack} /> : null}
      {onHome ? <s-button icon="home" accessibilityLabel="Home" onClick={onHome} /> : null}
      <span className="ml-auto flex items-center gap-2">{children}</span>
    </div>
  );
}

function Title({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-[24px] font-semibold leading-8 tracking-[-0.6px] text-[#303030]">{children}</h2>;
}

function HomeSetup({ storeName, onChip }: { storeName: string; onChip: (label: string) => void }) {
  return (
    <div className="px-4 pb-8 pt-4">
      <div className="mb-4 flex items-center justify-between text-[12px] leading-4">
        <span className="flex items-center gap-1.5 text-[#303030]">
          <span className="size-1.5 rounded-full bg-[#e51c00]" />
          Trial ends in 1 day
        </span>
        <span className="text-[#616161]">
          Questions?{" "}
          <a href="tel:8449821186" className="font-medium text-[#303030] underline decoration-[#b5b5b5] underline-offset-2 hover:decoration-[#303030]">
            (844) 982-1186
          </a>
        </span>
      </div>
      <h2 className="mb-4 text-[24px] font-semibold leading-8 tracking-[-0.6px] text-[#303030]">
        <span className="underline decoration-[#b5b5b5] decoration-dotted underline-offset-4">{storeName}</span> is coming along.
        <br />
        <span className="text-[#616161]">Now let’s design your store.</span>
      </h2>
      <div className="flex flex-col gap-3">
        <SetupCard
          art={<img src="/assets/theme-pitch.png" alt="" className="absolute left-10 top-5 h-72 w-56 rounded-md object-cover object-top shadow-xl" />}
          title="Choose your store design"
          body="Pick a theme that fits your brand, then customize from there."
          cta="Choose theme"
          onClick={() => onChip("Choose theme →")}
        />
        <SetupCard
          art={<PayArt />}
          title="You're ready to accept payments"
          body="Review settings to accept more payment methods and add a payout account."
          cta="Review payments"
          onClick={() => onChip("Review payments →")}
        />
        <SetupCard
          art={<DomainArt />}
          title="Get a custom domain"
          body="Give your store a branded URL that's easy to find, trust, and remember."
          cta="Set up domain"
          onClick={() => onChip("Set up domain →")}
        />
        <SetupCard
          art={<img src="/assets/shipping-label.png" alt="" className="absolute left-1/2 top-8 w-40 -translate-x-1/2" />}
          title="Review shipping rates"
          body="Look over the defaults set up for you based on your location."
          cta="Review rates"
          onClick={() => onChip("Review rates →")}
        />
        <SetupCard
          art={<img src="/assets/address-pin.png" alt="" className="absolute left-1/2 top-4 h-24 w-24 -translate-x-1/2 object-contain" />}
          title="Add your retail address"
          body="Add location details and set fulfillment options."
          cta="Add address"
          onClick={() => onChip("Add address →")}
        />
        <SetupCard
          art={<img src="/assets/pos.png" alt="" className="absolute left-1/2 top-2 h-32 -translate-x-1/2 object-contain" />}
          title="Order POS hardware"
          body="Power your store with fast checkouts you can count on."
          cta="Order hardware"
          onClick={() => onChip("Order hardware →")}
        />
      </div>
    </div>
  );
}

function SetupCard({
  art,
  title,
  body,
  cta,
  onClick,
}: {
  art: ReactNode;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <s-section padding="none" accessibilityLabel={title}>
      <div className="p-2">
        <div className="relative h-[132px] overflow-hidden rounded-xl bg-gradient-to-b from-[#f7f7f7] to-[#ebebeb]">{art}</div>
        <div className="flex flex-col items-start gap-3 px-2 pb-2 pt-3">
          <s-stack gap="small-500">
            <s-heading>{title}</s-heading>
            <s-paragraph color="subdued">{body}</s-paragraph>
          </s-stack>
          <s-button onClick={onClick}>{cta}</s-button>
        </div>
      </div>
    </s-section>
  );
}

function PayArt() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-[78px] top-[19px] grid h-[50px] w-[86px] place-items-center rounded-[13px] bg-[#5a31f4] text-[18px] font-semibold text-white shadow-md">
        shop
      </div>
      <div className="absolute left-[121px] top-[41px] grid h-[50px] w-[87px] place-items-center rounded-[13px] bg-[#1934cf] text-[22px] font-extrabold italic tracking-tight text-white shadow-md">
        VISA
      </div>
      <div className="absolute left-[168px] top-[62px] grid h-[50px] w-[70px] place-items-center rounded-[13px] bg-white shadow-md">
        <span className="flex">
          <span className="size-5 rounded-full bg-[#eb001b]" />
          <span className="-ml-2 size-5 rounded-full bg-[#f79e1b] mix-blend-multiply" />
        </span>
      </div>
    </div>
  );
}

function DomainArt() {
  return (
    <div className="absolute left-12 top-7 h-[154px] w-[206px] rounded-3xl border border-[#e7e7e7] bg-[#f8f8f8] shadow-lg">
      <div className="m-2 flex h-10 items-center gap-2 rounded-full border border-[#e7e7e7] bg-white px-3 shadow-sm">
        <span className="h-2.5 flex-1 rounded-full bg-[#e4e4e4]" />
        <span className="text-[12px] text-[#616161]">.com</span>
        <img src="/assets/domain-cursor.png" alt="" className="absolute -right-2 bottom-6 w-10" />
      </div>
    </div>
  );
}

const ranges = {
  today: { label: "Today", sales: 1842.3, sessions: 612, orders: 14, conversion: 2.3, scale: 0.55 },
  week: { label: "Last 7 days", sales: 11284.9, sessions: 3410, orders: 92, conversion: 2.6, scale: 0.8 },
  month: { label: "Last 30 days", sales: 48392.5, sessions: 14280, orders: 386, conversion: 2.7, scale: 1 },
} as const;

type RangeId = keyof typeof ranges;

function HomeActive({ nav }: { nav: Nav }) {
  const [range, setRange] = useState<RangeId>("month");
  const data = ranges[range];
  const next: Record<RangeId, RangeId> = { today: "week", week: "month", month: "today" };
  return (
    <div className="px-4 pb-8 pt-5">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.6px] text-[#303030]">Home</h2>
        <button
          type="button"
          onClick={() => nav.onRail("analytics")}
          className="press flex items-center gap-1 rounded-full py-1 pl-1 pr-1.5 text-[12px] text-[#616161] hover:bg-[#f1f1f1]"
        >
          <span className="flex -space-x-1.5">
            <img src="/assets/visitor-a.png" alt="" className="size-5 rounded-full object-cover ring-2 ring-white" />
            <img src="/assets/visitor-b.png" alt="" className="size-5 rounded-full object-cover ring-2 ring-white" />
          </span>
          <span className="relative ml-0.5 flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#29845a] opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[#29845a]" />
          </span>
          82 visitors right now
          <PIcon name="ChevronRight" size={16} />
        </button>
      </div>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
        <s-clickable-chip color="strong" onClick={() => setRange(next[range])}>
          {data.label}
        </s-clickable-chip>
        <s-clickable-chip>All channels</s-clickable-chip>
        <s-clickable-chip onClick={() => nav.onRail("analytics")}>View analytics</s-clickable-chip>
      </div>
      <s-section padding="none" accessibilityLabel="Sales">
        <div className="px-3 pb-1 pt-3">
          <s-clickable onClick={() => nav.onRail("analytics")} borderRadius="base">
            <div className="flex items-baseline justify-between px-1">
              <span className="text-[12px] text-[#616161]">Total sales</span>
              <span className="text-[12px] text-[#616161]">{data.label}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 px-1">
              <CountUp key={`sales-${range}`} value={data.sales} prefix="$" decimals={2} className="text-[20px] font-semibold tracking-[-0.4px] text-[#303030]" />
              <s-badge tone="success" icon="arrow-up">
                24%
              </s-badge>
            </div>
            <SalesChart key={range} scale={data.scale} />
          </s-clickable>
        </div>
        <s-divider />
        <div className="px-1 py-1">
          <Metric name="Sessions" value={data.sessions} delta="18%" up onClick={() => nav.onRail("analytics")} rangeKey={range} />
          <Metric name="Total orders" value={data.orders} delta="2%" up={false} onClick={() => nav.onRail("analytics")} rangeKey={range} />
          <Metric name="Conversion rate" value={data.conversion} suffix="%" decimals={1} delta="0.2%" up onClick={() => nav.onRail("analytics")} rangeKey={range} />
        </div>
      </s-section>

      <div className="mb-2 mt-6 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold tracking-[-0.2px] text-[#303030]">Recent activity</h3>
        <s-button variant="tertiary" onClick={() => nav.onRail("notifications")}>
          View all
        </s-button>
      </div>
      <s-section padding="none" accessibilityLabel="Recent activity">
        <Activity icon="OrderFilled" title="Danielle Hudson placed order #1078" meta="$369.99 · 3 items · 7 min ago" onClick={() => nav.onRail("customers")} />
        <s-divider />
        <Activity icon="CashDollarFilled" title="Your payout is on its way" meta="$2,184.60 · Today at 8:00 AM" onClick={() => nav.onRail("finance")} />
        <s-divider />
        <Activity icon="DeliveryFilled" title="Order #1071 was delivered" meta="Maya Chen · Today at 7:42 AM" onClick={() => nav.onRail("customers")} />
      </s-section>

      <h3 className="mb-2 mt-6 text-[16px] font-semibold tracking-[-0.2px] text-[#303030]">Business forward</h3>
      <div className="flex flex-col gap-3">
        <s-section accessibilityLabel="Best seller">
          <s-stack gap="small-200">
            <s-heading>Your best seller is picking up speed</s-heading>
            <s-paragraph color="subdued">Flora Sneakers sales are up 32%. You have 126 units left across 8 variants.</s-paragraph>
            <s-stack direction="inline">
              <s-button onClick={() => nav.onRail("products")}>Review inventory</s-button>
            </s-stack>
          </s-stack>
        </s-section>
        <s-section accessibilityLabel="Repeat customers">
          <s-stack gap="small-200">
            <s-heading>Bring customers back for a second look</s-heading>
            <s-paragraph color="subdued">Turn this month’s new shoppers into repeat customers with a welcome-back email.</s-paragraph>
            <s-stack direction="inline">
              <s-button icon="magic" onClick={() => nav.onRail("marketing")}>
                Plan with Sidekick
              </s-button>
            </s-stack>
          </s-stack>
        </s-section>
      </div>
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

function Metric({
  name,
  value,
  delta,
  up,
  suffix,
  decimals,
  onClick,
  rangeKey,
}: {
  name: string;
  value: number;
  delta: string;
  up: boolean;
  suffix?: string;
  decimals?: number;
  onClick: () => void;
  rangeKey: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press press-row flex w-full items-center gap-2 rounded-[10px] px-2 py-2.5 text-left hover:bg-[#f7f7f7] active:bg-[#f1f1f1]"
    >
      <span className="text-[13px] text-[#303030]">{name}</span>
      <s-badge tone={up ? "success" : "neutral"} icon={up ? "arrow-up" : "arrow-down"}>
        {delta}
      </s-badge>
      <CountUp
        key={`${name}-${rangeKey}`}
        value={value}
        suffix={suffix}
        decimals={decimals}
        className="ml-auto text-[13px] font-semibold text-[#303030]"
      />
      <span className="text-[#8a8a8a]">
        <PIcon name="ChevronRight" size={16} />
      </span>
    </button>
  );
}

function Activity({
  icon,
  title,
  meta,
  onClick,
}: {
  icon: "OrderFilled" | "CashDollarFilled" | "DeliveryFilled";
  title: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press press-row flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f7f7f7] active:bg-[#f1f1f1]"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#f1f1f1] text-[#4a4a4a]">
        <PIcon name={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[#303030]">{title}</span>
        <span className="block truncate text-[12px] text-[#616161]">{meta}</span>
      </span>
      <span className="text-[#8a8a8a]">
        <PIcon name="ChevronRight" size={16} />
      </span>
    </button>
  );
}

const salesPath =
  "M0 92 C 22 90, 34 74, 56 72 C 84 69, 98 46, 126 52 C 152 58, 172 34, 202 40 C 230 46, 246 22, 274 30 C 298 37, 316 20, 340 24";
const comparePath = "M0 96 C 40 94, 70 80, 110 84 C 150 88, 180 70, 220 76 C 260 82, 290 66, 340 70";

function SalesChart({ scale }: { scale: number }) {
  const lift = (1 - scale) * 40;
  return (
    <svg viewBox="0 0 340 128" className="mt-2 h-[132px] w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1b9ad4" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#1b9ad4" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[24, 58, 92].map((y) => (
        <line key={y} x1="0" x2="340" y1={y} y2={y} stroke="#ebebeb" strokeWidth="1" />
      ))}
      <g transform={`translate(0 ${lift}) scale(1 ${0.6 + scale * 0.4})`}>
        <path className="chart-fill" d={`${salesPath} L 340 128 L 0 128 Z`} fill="url(#sales-fill)" />
        <path
          className="chart-line-compare"
          pathLength={1}
          d={comparePath}
          fill="none"
          stroke="#b5d9ef"
          strokeWidth="2"
          strokeDasharray="1"
          strokeLinecap="round"
        />
        <path className="chart-line" pathLength={1} d={salesPath} fill="none" stroke="#1b9ad4" strokeWidth="2.5" strokeLinecap="round" />
        <circle className="chart-dot" cx="340" cy="24" r="4" fill="#1b9ad4" stroke="white" strokeWidth="2" />
      </g>
      <g fill="#8a8a8a" fontSize="10">
        <text x="0" y="124">Oct 4</text>
        <text x="160" y="124">Oct 18</text>
        <text x="306" y="124">Nov 3</text>
      </g>
    </svg>
  );
}

function Analytics() {
  return (
    <div className="px-4 pb-8 pt-5">
      <Title>Analytics</Title>
      <s-stack gap="base">
        <s-section accessibilityLabel="Sessions">
          <s-stack gap="small-300">
            <s-text color="subdued">Sessions</s-text>
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <CountUp value={14280} className="text-[20px] font-semibold text-[#303030]" />
              <s-badge tone="success" icon="arrow-up">
                18%
              </s-badge>
            </s-stack>
            <SalesChart scale={0.9} />
          </s-stack>
        </s-section>
        <s-section accessibilityLabel="Breakdown">
          <s-stack gap="small-200">
            <Row label="Conversion rate" value="2.7%" />
            <s-divider />
            <Row label="Average order value" value="$125.37" />
            <s-divider />
            <Row label="Top product" value="Cloud Headphones" />
          </s-stack>
        </s-section>
      </s-stack>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <s-stack direction="inline" justifyContent="space-between" alignItems="center">
      <s-text>{label}</s-text>
      <s-text type="strong">{value}</s-text>
    </s-stack>
  );
}

function Payments({ nav }: { nav: Nav }) {
  return (
    <div className="px-4 pb-10">
      <TopBar onBack={() => nav.onRail("settings")} onHome={() => nav.onRail("home")} />
      <Title>Payments</Title>
      <s-stack gap="base">
        <s-section heading="Shopify Payments">
          <s-stack gap="base">
            <s-box padding="base" background="subdued" borderRadius="base">
              <s-stack gap="small-200">
                <s-heading>Get up to 7.5% better performance than any other provider on Shopify</s-heading>
                <s-unordered-list>
                  <s-list-item>Tap into the 400+ million buyers who expect Shop Pay</s-list-item>
                  <s-list-item>Sell in over 130 currencies and get paid in yours</s-list-item>
                  <s-list-item>Access funding, credit, and a free business account</s-list-item>
                </s-unordered-list>
                <s-text color="subdued">No transaction fees · Card rates from 2.5% + $0.30</s-text>
              </s-stack>
            </s-box>
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <CardMark kind="mc" />
              <CardMark kind="visa" />
              <CardMark kind="shop" />
            </s-stack>
            <s-grid gridTemplateColumns="1fr 1fr" gap="small-200">
              <s-button variant="primary" inlineSize="fill" onClick={() => nav.onChip("Complete setup")}>
                Complete setup
              </s-button>
              <s-button inlineSize="fill" onClick={() => nav.onChip("Learn more")}>
                Learn more
              </s-button>
            </s-grid>
          </s-stack>
        </s-section>
        <s-section heading="More ways to pay">
          <s-stack gap="small-200">
            <s-paragraph color="subdued">Offer methods processed offsite or through custom checkout integrations</s-paragraph>
            <s-button icon="plus" inlineSize="fill">
              Method
            </s-button>
          </s-stack>
        </s-section>
        <s-section heading="Manual payment methods">
          <s-stack gap="small-200">
            <s-paragraph color="subdued">Accept payments outside your online store, like bank deposits or cash on delivery</s-paragraph>
            <s-button icon="plus" inlineSize="fill">
              Method
            </s-button>
          </s-stack>
        </s-section>
        <s-section heading="Shopify configuration" padding="none">
          {["Payment capture method", "Payment method customizations", "Gift card expiration", "Apple Wallet passes"].map((row, index) => (
            <div key={row}>
              {index > 0 ? <s-divider /> : null}
              <button
                type="button"
                className="press press-row flex w-full items-center justify-between px-4 py-3 text-left text-[13px] text-[#303030] hover:bg-[#f7f7f7] active:bg-[#f1f1f1]"
              >
                {row}
                <span className="text-[#8a8a8a]">
                  <PIcon name="ChevronRight" size={16} />
                </span>
              </button>
            </div>
          ))}
        </s-section>
      </s-stack>
    </div>
  );
}

function CardMark({ kind }: { kind: "mc" | "visa" | "shop" }) {
  if (kind === "mc") {
    return (
      <span className="grid h-6 w-10 place-items-center rounded-[5px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)]">
        <span className="flex">
          <span className="size-3 rounded-full bg-[#eb001b]" />
          <span className="-ml-1 size-3 rounded-full bg-[#f79e1b] mix-blend-multiply" />
        </span>
      </span>
    );
  }
  if (kind === "visa") {
    return <span className="grid h-6 w-10 place-items-center rounded-[5px] bg-[#1934cf] text-[9px] font-extrabold italic text-white">VISA</span>;
  }
  return <span className="grid h-6 w-10 place-items-center rounded-[5px] bg-[#5a31f4] text-[10px] font-semibold text-white">shop</span>;
}

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

function isBusiness(value: string): value is BusinessType {
  return value === "individual" || value === "business" || value === "nonprofit";
}

function PaymentsSetup({
  state,
  onBusiness,
  onIdentity,
  onNext,
  onBack,
  onHome,
}: {
  state: PrototypeState;
  onBusiness: (value: PrototypeState["businessType"]) => void;
  onIdentity: (patch: Partial<PrototypeState["identity"]>) => void;
  onNext: () => void;
  onBack: () => void;
  onHome: () => void;
}) {
  const identity = state.paymentsStep === "identity" || state.paymentsStep === "done";
  return (
    <div className="px-5 pb-8">
      <TopBar onBack={onBack} onHome={onHome}>
        <s-text color="subdued">Step {identity ? 2 : 1} of 4</s-text>
      </TopBar>
      <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.6px] text-[#303030]">Set up Shopify Payments</h2>
      <p className="mb-5 mt-1 text-[13px] text-[#616161]">Tell us about your store to start accepting payments</p>
      <div key={identity ? "identity" : "type"} className="rise">
        {identity ? (
          <s-section heading="Your name">
            <s-stack gap="base">
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
            </s-stack>
          </s-section>
        ) : (
          <s-section heading="I am running my store as">
            <s-choice-list
              label="Business type"
              labelAccessibilityVisibility="exclusive"
              name="business-type"
              values={[state.businessType]}
              onChange={(event) => {
                const next = event.currentTarget.values[0] ?? "";
                if (isBusiness(next)) onBusiness(next);
              }}
            >
              {(Object.keys(businessCopy) as BusinessType[]).map((key) => (
                <s-choice key={key} value={key}>
                  {businessCopy[key].title}
                  <s-text slot="details">{businessCopy[key].body}</s-text>
                </s-choice>
              ))}
            </s-choice-list>
          </s-section>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        {identity ? <s-button onClick={onBack}>Back</s-button> : null}
        <s-button variant="primary" onClick={onNext}>
          {identity ? "Continue" : "Next"}
        </s-button>
      </div>
    </div>
  );
}

const toneClass: Record<ProductTone, string> = {
  coral: "bg-[#ffd7cc]",
  blue: "bg-[#d7e6ff]",
  lamp: "bg-[#ffe1c4]",
  lilac: "bg-[#efe0ff]",
  headphones: "bg-[#ddd6ff]",
  mint: "bg-[#d9f5e5]",
  sand: "bg-[#f3e6d4]",
  teal: "bg-[#d5f3f0]",
  violet: "bg-[#e4dcff]",
  navy: "bg-[#d9e2f2]",
  amber: "bg-[#ffe7c2]",
  aqua: "bg-[#d4f4ff]",
};

function Products({ state, onProduct, onAdd }: { state: PrototypeState; onProduct: (id: string) => void; onAdd: () => void }) {
  const [query, setQuery] = useState("");
  const shown = state.products.filter((product) => product.title.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="px-4 pb-8 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.6px] text-[#303030]">Products</h2>
        <span className="ml-auto flex items-center gap-2">
          <s-button variant="primary" onClick={onAdd}>
            Add product
          </s-button>
          <s-button icon="menu-horizontal" accessibilityLabel="More actions" />
        </span>
      </div>
      <s-stack gap="base">
        <s-section padding="none" accessibilityLabel="Product performance">
          <div className="px-3 py-1">
            {[
              ["Avg. sell-through rate", "18.4%"],
              ["Days of inventory remaining", "42"],
              ["ABC product analysis", "A · 6"],
            ].map(([label, value], index) => (
              <div key={label}>
                {index > 0 ? <s-divider /> : null}
                <div className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-[#303030]">{label}</span>
                  <span className="font-semibold text-[#303030]">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </s-section>
        <s-search-field
          label="Search products"
          labelAccessibilityVisibility="exclusive"
          placeholder="Search and filter"
          value={query}
          onInput={(event) => setQuery(event.currentTarget.value)}
        />
        <s-section padding="none" accessibilityLabel="Products">
          {shown.map((product, index) => (
            <div key={product.id}>
              {index > 0 ? <s-divider /> : null}
              <button
                type="button"
                onClick={() => onProduct(product.id)}
                className="press press-row flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#f7f7f7] active:bg-[#f1f1f1]"
              >
                <Thumb product={product} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[#303030]">{product.title}</span>
                  <span className="block truncate text-[12px] text-[#616161]">{product.inventory}</span>
                </span>
                <s-badge tone={product.status === "Active" ? "success" : "info"}>{product.status}</s-badge>
                <span className="w-14 text-right text-[13px] tabular-nums text-[#303030]">${product.price}</span>
              </button>
            </div>
          ))}
          {shown.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px] text-[#616161]">No products match “{query}”</div>
          ) : null}
        </s-section>
      </s-stack>
    </div>
  );
}

function Thumb({ product, size = 40 }: { product: Product; size?: number }) {
  const src = product.tone === "lamp" ? "/assets/lamp.png" : product.tone === "headphones" ? "/assets/headphones.png" : null;
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] ${toneClass[product.tone]}`}
      style={{ width: size, height: size }}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : <span className="text-[#00000040]"><PIcon name="Image" size={Math.round(size * 0.45)} /></span>}
    </span>
  );
}

function ProductEdit({
  state,
  onBack,
  onHome,
  onUpdate,
  onAdd,
}: {
  state: PrototypeState;
  onBack: () => void;
  onHome: () => void;
  onUpdate: (id: string, patch: Partial<Product>) => void;
  onAdd: () => void;
}) {
  const product = state.products.find((item) => item.id === state.selectedProductId) ?? state.products[0];
  if (!product) return null;
  return (
    <div className="px-4 pb-10">
      <TopBar onBack={onBack} onHome={onHome}>
        <s-button variant="primary" onClick={onAdd}>
          Add product
        </s-button>
        <s-button icon="menu-horizontal" accessibilityLabel="More actions" />
      </TopBar>
      <div className="mb-3">
        <Thumb product={product} size={64} />
      </div>
      <Title>{product.title || "Untitled product"}</Title>
      <s-stack gap="base">
        <s-section accessibilityLabel="Product details">
          <s-stack gap="base">
            <s-text-field
              label="Title"
              name="title"
              value={product.title}
              onInput={(event) => onUpdate(product.id, { title: event.currentTarget.value })}
            />
            <s-text-area
              label="Description"
              name="description"
              rows={4}
              value={product.description}
              onInput={(event) => onUpdate(product.id, { description: event.currentTarget.value })}
            />
            <s-drop-zone label="Media" accessibilityLabel="Upload media" accept="image/*,video/*" multiple />
            <s-text-field label="Category" name="category" value={product.title} readOnly />
          </s-stack>
        </s-section>
        <s-section heading="Price">
          <s-stack gap="base">
            <s-money-field
              label="Price"
              name="price"
              value={product.price}
              onInput={(event) => onUpdate(product.id, { price: event.currentTarget.value })}
            />
            <s-checkbox label="Charge tax on this product" checked />
          </s-stack>
        </s-section>
        <s-section heading="Inventory">
          <s-stack gap="base">
            <s-paragraph>{product.inventory}</s-paragraph>
            <s-checkbox label="Track quantity" checked />
          </s-stack>
        </s-section>
      </s-stack>
    </div>
  );
}

function SetupDetail({
  title,
  body,
  action,
  secondary,
  art,
  onHome,
  children,
}: {
  title: string;
  body: string;
  action: string;
  secondary?: string;
  art?: ReactNode;
  onHome: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="px-4 pb-8">
      <TopBar onBack={onHome} onHome={onHome} />
      <Title>{title}</Title>
      <s-stack gap="base">
        {art ? <div className="rounded-xl bg-gradient-to-b from-[#f7f7f7] to-[#ebebeb] p-4">{art}</div> : null}
        <s-section accessibilityLabel={title}>
          <s-stack gap="base">
            <s-paragraph>{body}</s-paragraph>
            {children}
            <s-stack direction="inline" gap="small-200">
              <s-button variant="primary">{action}</s-button>
              {secondary ? <s-button>{secondary}</s-button> : null}
            </s-stack>
          </s-stack>
        </s-section>
      </s-stack>
    </div>
  );
}

type ListRow = { label: string; meta: string; tone?: "warning" | "info" | "success"; go?: () => void };

function ListPage({ title, rows }: { title: string; rows: ListRow[] }) {
  return (
    <div className="px-4 pb-8 pt-5">
      <Title>{title}</Title>
      <s-section padding="none" accessibilityLabel={title}>
        {rows.map((row, index) => (
          <div key={row.label}>
            {index > 0 ? <s-divider /> : null}
            <button
              type="button"
              onClick={row.go}
              className="press press-row flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f7f7f7] active:bg-[#f1f1f1]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-[#303030]">{row.label}</span>
                <span className="block truncate text-[12px] text-[#616161]">{row.meta}</span>
              </span>
              {row.tone ? <s-badge tone={row.tone}>{row.tone === "warning" ? "Action" : row.tone === "info" ? "Draft" : "Live"}</s-badge> : null}
              <span className="text-[#8a8a8a]">
                <PIcon name="ChevronRight" size={16} />
              </span>
            </button>
          </div>
        ))}
      </s-section>
    </div>
  );
}
