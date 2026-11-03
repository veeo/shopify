"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
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
  const grey = state.preview === "product";
  return (
    <aside
      className={`p-partial-theme-admin-next-light h-full shrink-0 overflow-hidden rounded-3xl text-[#171817] ${grey ? "bg-[#f7f7f7]" : "bg-white"} ${
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
          onUpdate={props.onUpdateProduct}
          onAdd={props.onAddProduct}
        />
      );
    case "theme":
      return (
        <SetupDetail
          title="Themes"
          onHome={home}
          art={<img src="/assets/theme-pitch.png" alt="" className="absolute left-1/2 top-5 w-[228px] -translate-x-1/2 rounded-t-md shadow-xl" />}
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
          art={<DomainArt />}
          body="Primary domain is still mystore.myshopify.com. Connect a domain you already own, or buy a new one."
          action="Connect existing"
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
          art={<img src="/assets/shipping-label.png" alt="" className="absolute left-1/2 top-8 w-40 -translate-x-1/2" />}
          body="Rates set from your location. Calculated rates stay on at checkout."
          action="Edit rates"
        >
          <div className="flex flex-col">
            <KeyValue label="Domestic · under $50" value="$6.00" />
            <KeyValue label="Domestic · $50 and up" value="Free" />
            <KeyValue label="International" value="Calculated" last />
          </div>
        </SetupDetail>
      );
    case "address":
      return (
        <SetupDetail
          title="Locations"
          onHome={home}
          art={<img src="/assets/address-pin.png" alt="" className="absolute left-1/2 top-4 size-24 -translate-x-1/2 object-contain" />}
          body="Add a retail address to offer pickup. Online orders still ship from the default location."
          action="Save location"
        >
          <div className="flex flex-col gap-3">
            <s-text-field label="Location name" placeholder="Main street shop" name="location" />
            <s-text-field label="Address" placeholder="Street and number" name="address" autocomplete="address-line1" />
            <s-checkbox label="Offer local pickup" checked />
          </div>
        </SetupDetail>
      );
    case "pos":
      return (
        <SetupDetail
          title="Point of Sale"
          onHome={home}
          art={<img src="/assets/pos.png" alt="" className="absolute left-1/2 top-2 h-32 -translate-x-1/2 object-contain" />}
          body="Retail kit: reader, dock, and receipt printer. One counter. Ships in 3–5 days."
          action="Order hardware"
        />
      );
    case "inbox":
      return (
        <ListPage
          title="Inbox"
          onHome={home}
          rows={[
            { icon: "Chat", label: "Where is order #1078?", meta: "Danielle Hudson · 4m" },
            { icon: "Chat", label: "Do you ship the lamp this week?", meta: "Maya Chen · 1h" },
            { icon: "Chat", label: "Can I exchange the case?", meta: "Jordan Ellis · Yesterday" },
          ]}
        />
      );
    case "notifications":
      return (
        <ListPage
          title="Notifications"
          onHome={home}
          rows={[
            { icon: "Clock", label: "Trial ends in 1 day", meta: "Pick a plan to keep selling", badge: "Action" },
            { icon: "Money", label: "Payout of $2,184.60 is on the way", meta: "Today at 8:00 AM", go: () => nav.onRail("finance") },
            { icon: "Package", label: "2 orders need tracking", meta: "Fulfillment", go: () => nav.onRail("customers") },
          ]}
        />
      );
    case "customers":
      return (
        <ListPage
          title="Customers"
          onHome={home}
          rows={[
            { icon: "Person", label: "Danielle Hudson", meta: "3 orders · $612.40" },
            { icon: "Person", label: "Maya Chen", meta: "1 order · $89.00" },
            { icon: "Person", label: "Jordan Ellis", meta: "5 orders · $1,204.95" },
          ]}
        />
      );
    case "marketing":
      return (
        <ListPage
          title="Marketing"
          onHome={home}
          rows={[
            { icon: "Email", label: "Welcome back", meta: "Email · Draft", badge: "Draft" },
            { icon: "DiscountFilled", label: "Headphones bundle", meta: "Discount · Paused" },
            { icon: "Target", label: "Gift sets", meta: "Campaign · This week", badge: "Live" },
          ]}
        />
      );
    case "analytics":
      return <Analytics onHome={home} />;
    case "finance":
      return (
        <ListPage
          title="Finance"
          onHome={home}
          rows={[
            { icon: "Money", label: "Payout $2,184.60", meta: "Arrives today" },
            { icon: "Wallet", label: "Balance $18,420.12", meta: "Shopify Balance" },
            { icon: "Payment", label: "Shopify Payments", meta: "Finish setup", badge: "Action", go: () => nav.onPreview("payments") },
          ]}
        />
      );
    case "content":
      return (
        <ListPage
          title="Content"
          onHome={home}
          rows={[
            { icon: "Content", label: "Homepage hero", meta: "Metaobject" },
            { icon: "Content", label: "Lamp delivery note", meta: "Page" },
            { icon: "Content", label: "About the studio", meta: "Page" },
          ]}
        />
      );
    case "online-store":
      return (
        <ListPage
          title="Online Store"
          onHome={home}
          rows={[
            { icon: "Theme", label: "Themes", meta: "PITCH · Draft", go: () => nav.onPreview("theme") },
            { icon: "Content", label: "Pages", meta: "4 pages" },
            { icon: "MenuHorizontal", label: "Navigation", meta: "Main menu" },
            { icon: "Globe", label: "Domains", meta: "mystore.myshopify.com", go: () => nav.onPreview("domain") },
          ]}
        />
      );
    case "email":
      return (
        <ListPage
          title="Email"
          onHome={home}
          rows={[
            { icon: "Email", label: "Welcome", meta: "Tightened by Slackbot", badge: "Live" },
            { icon: "Email", label: "Abandoned checkout", meta: "Automation · On" },
            { icon: "Email", label: "Back in stock", meta: "Automation · Off" },
          ]}
        />
      );
    case "settings":
      return (
        <ListPage
          title="Settings"
          onHome={home}
          rows={[
            { icon: "Store", label: "Store details", meta: "My Store" },
            { icon: "Clock", label: "Plan", meta: "Trial · 1 day left", badge: "Action" },
            { icon: "Payment", label: "Payments", meta: "Shopify Payments", go: () => nav.onPreview("payments") },
            { icon: "DeliveryFilled", label: "Shipping and delivery", meta: "2 rates", go: () => nav.onPreview("shipping") },
            { icon: "LocationFilled", label: "Locations", meta: "1 location", go: () => nav.onPreview("address") },
          ]}
        />
      );
    default:
      return <HomeSetup storeName={state.storeName} onChip={nav.onChip} />;
  }
}

/* Shared pieces, sized from the Figma mobile frames */

function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`flex flex-col gap-6 pb-[86px] pt-7 ${wide ? "px-8" : "px-6"}`}>{children}</div>;
}

function H1({ children }: { children: ReactNode }) {
  return <h2 className="text-[25px] font-medium leading-8 tracking-[-0.75px] text-[#171817]">{children}</h2>;
}

function H2({ children }: { children: ReactNode }) {
  return <h3 className="text-[15px] font-medium leading-[1.4] tracking-[-0.15px] text-[#171817]">{children}</h3>;
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

function BackPill({ onBack, onHome, icon = "Home" }: { onBack: () => void; onHome?: () => void; icon?: PolarisIconName }) {
  return (
    <div className="flex">
      <span className="inline-flex h-8 items-center overflow-hidden rounded-full border border-[#e3e3e3] bg-white shadow-[0_3px_15px_rgba(0,0,0,0.03)]">
        <button type="button" aria-label="Back" onClick={onBack} className="press grid h-full place-items-center pl-2 pr-0.5 hover:bg-[#f7f7f7]">
          <PIcon name="ChevronLeft" size={14} />
        </button>
        <button type="button" aria-label="Home" onClick={onHome ?? onBack} className="press grid h-full place-items-center pl-1 pr-3 hover:bg-[#f7f7f7]">
          <PIcon name={icon} size={16} />
        </button>
      </span>
    </div>
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

/* Home · setup guides */

function HomeSetup({ storeName, onChip }: { storeName: string; onChip: (label: string) => void }) {
  return (
    <Page>
      <div className="flex h-8 items-center justify-between text-[12px] leading-4">
        <span className="flex items-center gap-1.5 font-medium text-black">
          <span className="grid size-[18px] place-items-center">
            <span className="grid size-4 place-items-center rounded-full bg-[#ffdbd7]">
              <span className="size-2 rounded-full bg-[#eb1700]" />
            </span>
          </span>
          Trial end in 1 day
        </span>
        <span className="text-[#737572]">
          Questions?{" "}
          <a href="tel:8449821186" className="ml-1 font-medium text-black underline underline-offset-2 hover:decoration-2">
            (844) 982-1186
          </a>
        </span>
      </div>
      <h2 className="text-[25px] font-medium leading-8 tracking-[-0.75px] text-black">
        <span className="underline decoration-dotted decoration-1 underline-offset-[5px]">{storeName}</span> is coming along
        <br />
        Now let’s design your store
      </h2>
      <div className="flex flex-col gap-4">
        <SetupCard
          art={<img src="/assets/theme-pitch.png" alt="" className="absolute left-1/2 top-[19px] w-[228px] -translate-x-1/2 rounded-t-[3px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]" />}
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
          art={<img src="/assets/address-pin.png" alt="" className="absolute left-1/2 top-4 size-24 -translate-x-1/2 object-contain" />}
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
    </Page>
  );
}

function SetupCard({ art, title, body, cta, onClick }: { art: ReactNode; title: string; body: string; cta: string; onClick: () => void }) {
  return (
    <Card className="p-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={cta}
        className="relative h-[132px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#f6f6f6] to-[#ececed] transition-[filter] hover:brightness-[0.98]"
      >
        {art}
      </button>
      <div className="flex flex-col items-start gap-3 p-3">
        <div className="flex flex-col gap-1.5 text-[15px] leading-[1.4] tracking-[-0.15px]">
          <p className="font-medium text-black">{title}</p>
          <p className="text-[#737572]">{body}</p>
        </div>
        <Pill onClick={onClick}>{cta} →</Pill>
      </div>
    </Card>
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
    <div className="flex flex-col gap-6 px-8 pb-[86px] pt-7">
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
              <PIcon name="ChevronRight" size={14} />
            </span>
          </button>
        </div>
        <div className="-mr-8 flex gap-2 overflow-x-auto pr-8 [scrollbar-width:none]">
          <Pill tone="ink" onClick={() => setRange(next[range])} className="pl-3 pr-[13px]">
            <PIcon name="Calendar" size={14} />
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
          <button type="button" onClick={() => nav.onRail("notifications")} className="press text-[12px] text-[#737572] hover:text-[#171817]">
            View all
          </button>
        </div>
        <div className="flex flex-col">
          <Activity icon="Order" title="Danielle Hudson placed order #1078." meta="$369.99 · 3 items · 7 minutes ago" onClick={() => nav.onRail("customers")} />
          <Activity icon="Money" title="Your payout is on its way." meta="$2,184.60 · Today at 8:00 AM" onClick={() => nav.onRail("finance")} />
          <Activity icon="Package" title="Order #1071 was delivered." meta="Maya Chen · Today at 7:42 AM" onClick={() => nav.onRail("customers")} />
        </div>
      </section>

      <Divider />

      <section className="flex flex-col gap-3.5">
        <h3 className="text-[20px] font-medium leading-8 tracking-[-0.4px]">Business forward</h3>
        <div className="grid grid-cols-2 gap-6">
          <Forward
            title="Your best seller is picking up speed"
            body="Flora Sneakers sales are up 32%. You have 126 units left across 8 variants."
            cta="Review inventory →"
            onClick={() => nav.onRail("products")}
          />
          <Forward
            title="Bring customers back for a second look"
            body="Turn this month’s new shoppers into repeat customers with a welcome-back email."
            cta="Plan a campaign with Sidekick →"
            onClick={() => nav.onRail("marketing")}
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
      {up ? "↑" : "↓"} {children}
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
        <PIcon name={icon} size={16} />
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

function Analytics({ onHome }: { onHome: () => void }) {
  return (
    <Page>
      <BackPill onBack={onHome} />
      <H1>Analytics</H1>
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] text-[#737572]">Sessions · Last 30 days</span>
        <span className="flex items-center gap-2">
          <CountUp value={14280} className="text-[25px] font-medium leading-8 tracking-[-0.75px]" />
          <Delta up>18%</Delta>
        </span>
      </div>
      <SalesChart scale={0.9} />
      <div className="flex flex-col">
        <KeyValue label="Conversion rate" value="2.7%" />
        <KeyValue label="Average order value" value="$125.37" />
        <KeyValue label="Top product" value="Cloud Headphones" last />
      </div>
    </Page>
  );
}

function KeyValue({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 text-[13px] tracking-[-0.13px] ${last ? "" : "border-b border-[#eaece8]"}`}>
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/* Payments */

const payPoints = [
  "Tap into the 400+ million buyers who expect Shop Pay",
  "Sell in over 130 currencies and get paid in yours",
  "Access funding, credit, and a free business account for payouts and spending",
];

const configRows: { icon: PolarisIconName; label: string }[] = [
  { icon: "Payment", label: "Payment capture method" },
  { icon: "Settings", label: "Payment method customizations" },
  { icon: "Clock", label: "Gift card expiration" },
  { icon: "Wallet", label: "Apple Wallet passes" },
];

function Payments({ nav }: { nav: Nav }) {
  return (
    <Page>
      <BackPill onBack={() => nav.onRail("settings")} onHome={() => nav.onRail("home")} />
      <H1>Payments</H1>
      <section className="flex flex-col gap-4">
        <H2>Shopify Payments</H2>
        <Card>
          <div className="flex flex-col gap-3 rounded-2xl bg-[#f7f7f7] p-4">
            <p className="text-[15px] font-medium leading-[1.4] tracking-[-0.15px]">Get up to 7.5% better performance than any other provider on Shopify</p>
            <ul className="flex flex-col gap-0.5">
              {payPoints.map((point) => (
                <li key={point} className="flex gap-2 text-[13px] leading-[1.4] tracking-[-0.13px] text-black">
                  <span className="mt-0.5 shrink-0">
                    <PIcon name="Check" size={14} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <p className="text-[13px] leading-[1.4] tracking-[-0.13px] text-[#4a4a4a]">No transaction fees • Card rates starting at 2.5% + $0.30</p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border-[0.5px] border-[#e6e6e6] bg-white p-4">
            <p className="text-[15px] font-medium leading-[1.4] tracking-[-0.15px]">Available payment methods</p>
            <div className="flex gap-2">
              <CardMark kind="mc" />
              <CardMark kind="visa" />
              <CardMark kind="shop" />
            </div>
          </div>
        </Card>
        <div className="flex gap-2">
          <Pill tone="dark" className="flex-1" onClick={() => nav.onChip("Complete setup")}>
            Complete setup
          </Pill>
          <Pill tone="fill" className="flex-1" onClick={() => nav.onChip("Learn more")}>
            Learn more
          </Pill>
        </div>
      </section>
      <MethodSection title="More ways to pay" body="Offer methods processed offsite or through custom checkout integrations" />
      <MethodSection title="Manual payment methods" body="Accept payments outside your online store, like bank deposits or cash on delivery" />
      <section className="flex flex-col gap-4">
        <H2>Shopify configuration</H2>
        <Card>
          <div className="flex flex-col gap-2.5 px-3 pt-3">
            {configRows.map((row, index) => (
              <button key={row.label} type="button" className="press press-row group flex items-start gap-3 text-left">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#f4f5f3]">
                  <PIcon name={row.icon} size={16} />
                </span>
                <span
                  className={`flex flex-1 items-center justify-between pb-3 pt-0.5 text-[13px] tracking-[-0.13px] ${
                    index < configRows.length - 1 ? "border-b-[0.5px] border-[#e6e6e6]" : ""
                  }`}
                >
                  {row.label}
                  <span className="text-[#8a8a8a] transition-transform group-hover:translate-x-0.5">
                    <PIcon name="ChevronRight" size={14} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </section>
    </Page>
  );
}

function MethodSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex flex-col gap-4 py-3">
      <div className="flex flex-col gap-1.5 leading-[1.4]">
        <H2>{title}</H2>
        <p className="text-[13px] tracking-[-0.13px] text-[#4a4a4a]">{body}</p>
      </div>
      <Pill tone="fill" className="w-full gap-2">
        <PIcon name="Plus" size={16} />
        Method
      </Pill>
    </section>
  );
}

function CardMark({ kind }: { kind: "mc" | "visa" | "shop" }) {
  if (kind === "mc") {
    return (
      <span className="grid h-6 w-10 place-items-center rounded-[4px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
        <span className="flex">
          <span className="size-3 rounded-full bg-[#eb001b]" />
          <span className="-ml-1 size-3 rounded-full bg-[#f79e1b] mix-blend-multiply" />
        </span>
      </span>
    );
  }
  if (kind === "visa") {
    return <span className="grid h-6 w-10 place-items-center rounded-[4px] bg-[#1934cf] text-[10px] font-extrabold italic text-white">VISA</span>;
  }
  return <span className="grid h-6 w-10 place-items-center rounded-[4px] bg-[#5a31f4] text-[11px] font-bold tracking-[-0.3px] text-white">shop</span>;
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
    <Page wide>
      <BackPill onBack={onBack} onHome={onHome} />
      <div className="flex flex-col gap-1">
        <H1>Set up Shopify Payments</H1>
        <p className="text-[13px] leading-[1.4] tracking-[-0.13px] text-[#4a4a4a]">Tell us about your store to start accepting payments</p>
      </div>
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
    </Page>
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

const statusClass: Record<Product["status"], string> = {
  Draft: "bg-[#58e3ff] text-[#002e3a]",
  Active: "bg-[rgb(215,255,215)] text-[rgb(0,56,0)]",
};

function Products({ state, onProduct, onAdd }: { state: PrototypeState; onProduct: (id: string) => void; onAdd: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const shown = state.products.filter((product) => product.title.toLowerCase().includes(query.trim().toLowerCase()));
  const all = shown.length > 0 && shown.every((product) => selected.includes(product.id));
  const toggle = (id: string) => setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
  return (
    <Page>
      <div className="flex h-8 items-center gap-2">
        <span className="flex items-center gap-1.5 text-[15px] font-medium tracking-[-0.15px]">
          <PIcon name="Product" size={18} />
          Products
        </span>
        <span className="ml-auto flex items-center gap-2">
          <Pill tone="dark" onClick={onAdd}>
            Add product
          </Pill>
          <button
            type="button"
            aria-label="More actions"
            className="press grid size-8 place-items-center rounded-full border border-[#e3e3e3] bg-white hover:bg-[#f7f7f7]"
          >
            <PIcon name="MenuHorizontal" size={16} />
          </button>
        </span>
      </div>

      <div className="flex flex-col rounded-2xl bg-[#f4f5f3] px-4 pb-2.5 pt-4">
        <span className="mb-3 flex h-5 items-center gap-1.5 text-[12px] text-[#171817]">
          <PIcon name="Calendar" size={14} />
          30 days
        </span>
        {[
          ["Avg. sell-through rate", "18.4%"],
          ["Products by days of inventory remaining", "18.4%"],
          ["ABC product analysis", "18.4%"],
        ].map(([label, value]) => (
          <div key={label} className="flex h-9 items-center justify-between gap-3">
            <span className="text-[12px] tracking-[-0.12px]">{label}</span>
            <span className="text-[15px] font-medium tracking-[-0.3px]">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex h-9 items-center rounded-xl border border-[#e3e3e3] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus-within:border-[#171817]">
          <button type="button" className="press flex h-full items-center gap-0.5 pl-3 pr-2.5 text-[13px] font-medium">
            All
            <PIcon name="ChevronDown" size={14} />
          </button>
          <span className="h-4 w-px bg-[#e3e3e3]" />
          <span className="pl-2.5 text-[#737572]">
            <PIcon name="Search" size={16} />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search and filter"
            aria-label="Search products"
            className="h-full min-w-0 flex-1 bg-transparent pl-1.5 pr-3 text-[13px] outline-none placeholder:text-[#8a8a8a]"
          />
        </div>

        <div>
          <div className="grid h-8 grid-cols-[16px_32px_minmax(0,1fr)_64px_56px_16px] items-center gap-x-2 rounded-[10px] bg-[#f7f7f7] pl-2 text-[12px] text-[#4a4a4a]">
            <s-checkbox
              accessibilityLabel="Select all products"
              checked={all}
              onChange={() => setSelected(all ? [] : shown.map((product) => product.id))}
            />
            <span className="col-span-2">Product</span>
            <span>Status</span>
            <span>Price</span>
          </div>
          {shown.map((product) => (
            <div
              key={product.id}
              onClick={() => onProduct(product.id)}
              className="press-row grid h-[52px] cursor-pointer grid-cols-[16px_32px_minmax(0,1fr)_64px_56px_16px] items-center gap-x-2 border-b border-[#ebebeb] pl-2 transition-colors hover:bg-[#fafafa] active:scale-[0.99]"
            >
              <span onClick={(event) => event.stopPropagation()} className="flex">
                <s-checkbox
                  accessibilityLabel={`Select ${product.title}`}
                  checked={selected.includes(product.id)}
                  onChange={() => toggle(product.id)}
                />
              </span>
              <Thumb product={product} size={32} />
              <button type="button" className="truncate text-left text-[13px] tracking-[-0.13px] text-[#303030]">
                {product.title}
              </button>
              <span className={`justify-self-start rounded-md px-1.5 py-0.5 text-[12px] font-medium leading-4 ${statusClass[product.status]}`}>{product.status}</span>
              <span className="text-[13px] tabular-nums text-[#303030]">${product.price}</span>
              <span className="text-[#4a4a4a]">
                <PIcon name="View" size={16} />
              </span>
            </div>
          ))}
          {shown.length === 0 ? <div className="py-8 text-center text-[13px] text-[#737572]">No products match “{query}”</div> : null}
        </div>
      </div>
    </Page>
  );
}

function Thumb({ product, size = 40 }: { product: Product; size?: number }) {
  const radius = size >= 48 ? 12 : 8;
  if (product.image) {
    return (
      <img
        src={product.image}
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-cover shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <span className={`grid shrink-0 place-items-center ${toneClass[product.tone]}`} style={{ width: size, height: size, borderRadius: radius }}>
      <span className="text-black/25">
        <PIcon name="Image" size={Math.round(size * 0.5)} />
      </span>
    </span>
  );
}

/* Product page edit */

function Field({ label, children, help }: { label: string; children: ReactNode; help?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="px-3 text-[13px] tracking-[-0.13px] text-[#303030]">{label}</span>
      {children}
      {help ? <span className="px-3 text-[12px] leading-[1.4] text-[#737373]">{help}</span> : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#e3e3e3] bg-white px-3 text-[13px] leading-[1.55] tracking-[-0.13px] text-[#171817] outline-none transition-colors hover:border-[#cfcfcf] focus:border-[#171817]";

function ProductEdit({
  state,
  onBack,
  onUpdate,
  onAdd,
}: {
  state: PrototypeState;
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<Product>) => void;
  onAdd: () => void;
}) {
  const [taxed, setTaxed] = useState(true);
  const [tracked, setTracked] = useState(true);
  const product = state.products.find((item) => item.id === state.selectedProductId) ?? state.products[0];
  if (!product) return null;
  return (
    <Page>
      <div className="flex h-8 items-center justify-between">
        <BackPill onBack={onBack} icon="Product" />
        <span className="flex items-center gap-2">
          <Pill tone="dark" onClick={onAdd}>
            Add product
          </Pill>
          <button
            type="button"
            aria-label="More actions"
            className="press grid size-8 place-items-center rounded-full border border-[#e3e3e3] bg-white hover:bg-[#f7f7f7]"
          >
            <PIcon name="MenuHorizontal" size={16} />
          </button>
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <Thumb product={product} size={48} />
        <H1>{product.title || "Untitled product"}</H1>
      </div>
      <Card className="gap-5 p-4">
        <Field label="Title">
          <input value={product.title} onChange={(event) => onUpdate(product.id, { title: event.target.value })} className={`${inputClass} h-9`} />
        </Field>
        <Field label="Description">
          <textarea
            rows={4}
            value={product.description}
            onChange={(event) => onUpdate(product.id, { description: event.target.value })}
            className={`${inputClass} resize-none py-2.5`}
          />
        </Field>
        <Field label="Media">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#e3e3e3] px-4 py-6">
            <span className="flex items-center gap-2">
              <Pill tone="fill" className="px-3">
                Upload new
              </Pill>
              <Pill tone="soft" className="bg-transparent px-3">
                Select existing
              </Pill>
            </span>
            <span className="text-[12px] text-[#8a8a8a]">Accepts images, videos, or 3D models</span>
          </div>
        </Field>
        <Field label="Category" help="Determines tax rates and adds metafields to improve search, filters, and cross-channel sales">
          <input readOnly value={product.title} className={`${inputClass} h-9`} />
        </Field>
      </Card>
      <section className="flex flex-col gap-4">
        <H2>Price</H2>
        <Card className="gap-3 p-4">
          <label className="flex h-9 w-fit items-center rounded-xl border border-[#e3e3e3] bg-white px-3 text-[13px] focus-within:border-[#171817]">
            $
            <input
              value={product.price}
              inputMode="decimal"
              aria-label="Price"
              onChange={(event) => onUpdate(product.id, { price: event.target.value })}
              className="w-[46px] bg-transparent outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip>Compare-at</Chip>
            <Chip>Unit price</Chip>
            <Chip onClick={() => setTaxed((value) => !value)}>
              Charge tax
              <span className="rounded bg-[#e3e3e3] px-1 text-[11px] font-medium leading-4">{taxed ? "Yes" : "No"}</span>
            </Chip>
            <span className="text-[#4a4a4a]">
              <PIcon name="ChevronDown" size={16} />
            </span>
          </div>
        </Card>
      </section>
      <Card className="gap-4 p-4">
        <Field label="Inventory">
          <input readOnly value={product.inventory} className={`${inputClass} h-9`} />
        </Field>
        <div className="px-3">
          <s-checkbox label="Track quantity" checked={tracked} onChange={() => setTracked((value) => !value)} />
        </div>
      </Card>
    </Page>
  );
}

function Chip({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press inline-flex h-7 items-center gap-1.5 rounded-lg bg-[#f1f1f1] px-2 text-[13px] tracking-[-0.13px] text-[#303030] hover:bg-[#e9e9e9]"
    >
      {children}
    </button>
  );
}

/* Setup detail and list pages reached from cards, chips, and the rail */

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
    <Page>
      <BackPill onBack={onHome} />
      <H1>{title}</H1>
      <Card className="p-2">
        {art ? <div className="relative h-[132px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#f6f6f6] to-[#ececed]">{art}</div> : null}
        <div className="flex flex-col gap-4 p-3">
          <p className="text-[15px] leading-[1.4] tracking-[-0.15px] text-[#4a4a4a]">{body}</p>
          {children}
        </div>
      </Card>
      <div className="flex gap-2">
        <Pill tone="dark" className="flex-1">
          {action}
        </Pill>
        {secondary ? (
          <Pill tone="fill" className="flex-1">
            {secondary}
          </Pill>
        ) : null}
      </div>
    </Page>
  );
}

type ListRow = { icon: PolarisIconName; label: string; meta: string; badge?: "Action" | "Draft" | "Live"; go?: () => void };

const badgeClass = {
  Action: "bg-[#ffe7c2] text-[#4f3500]",
  Draft: "bg-[#58e3ff] text-[#002e3a]",
  Live: "bg-[rgb(215,255,215)] text-[rgb(0,56,0)]",
} as const;

function ListPage({ title, rows, onHome }: { title: string; rows: ListRow[]; onHome: () => void }) {
  return (
    <Page>
      <BackPill onBack={onHome} />
      <H1>{title}</H1>
      <Card>
        <div className="flex flex-col gap-2.5 px-3 pt-3">
          {rows.map((row, index) => (
            <button key={row.label} type="button" onClick={row.go} className="press press-row group flex items-start gap-3 text-left">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f4f5f3]">
                <PIcon name={row.icon} size={16} />
              </span>
              <span
                className={`flex min-w-0 flex-1 items-center gap-2 pb-3 ${index < rows.length - 1 ? "border-b-[0.5px] border-[#e6e6e6]" : ""}`}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="truncate text-[13px] font-medium leading-4 tracking-[-0.13px]">{row.label}</span>
                  <span className="truncate text-[12px] leading-4 text-[#737572]">{row.meta}</span>
                </span>
                {row.badge ? <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${badgeClass[row.badge]}`}>{row.badge}</span> : null}
                <span className="text-[#8a8a8a] transition-transform group-hover:translate-x-0.5">
                  <PIcon name="ChevronRight" size={14} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </Card>
    </Page>
  );
}
