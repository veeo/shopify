"use client";

import { Check, ChevronLeft, ChevronRight, Eye, Home, MoreHorizontal, Plus, Search, Tag } from "lucide-react";
import type { ReactNode } from "react";
import type { PreviewId, Product, ProductTone, PrototypeState } from "@/lib/prototype";

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
}) {
  const wide = state.previewWide || state.preview === "payments-setup";
  return (
    <aside
      className={`h-full shrink-0 overflow-hidden rounded-3xl bg-white text-[#171817] ${
        state.motion ? "transition-[width] duration-200 ease-out" : ""
      }`}
      style={{ width: wide ? 584 : 393 }}
    >
      <div className="scroll-thin-light h-full overflow-y-auto">
        <Screen
          state={state}
          onPreview={onPreview}
          onChip={onChip}
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
  onPreview: (page: PreviewId, wide?: boolean) => void;
  onChip: (label: string) => void;
  onBusiness: (value: PrototypeState["businessType"]) => void;
  onIdentity: (patch: Partial<PrototypeState["identity"]>) => void;
  onPaymentsNext: () => void;
  onProduct: (id: string) => void;
  onUpdateProduct: (id: string, patch: Partial<Product>) => void;
  onAddProduct: () => void;
}) {
  const { state } = props;
  switch (state.preview) {
    case "home-active":
      return <HomeActive />;
    case "payments":
      return <Payments onSetup={() => props.onPreview("payments-setup", true)} />;
    case "payments-setup":
      return (
        <PaymentsSetup
          state={state}
          onBusiness={props.onBusiness}
          onIdentity={props.onIdentity}
          onNext={props.onPaymentsNext}
          onBack={() => props.onPreview("payments")}
        />
      );
    case "products":
      return <Products state={state} onProduct={props.onProduct} onAdd={props.onAddProduct} />;
    case "product":
      return (
        <ProductEdit
          state={state}
          onBack={() => props.onPreview("products")}
          onUpdate={props.onUpdateProduct}
        />
      );
    case "theme":
      return <SetupDetail title="Themes" body="PITCH is installed as a draft. Publish it when the photography is ready." action="Publish theme" />;
    case "domain":
      return <SetupDetail title="Domains" body="Primary domain is still a myshopify.com address. Connect a domain you already own." action="Connect domain" />;
    case "shipping":
      return <SetupDetail title="Shipping" body="Domestic: $6.00 under $50. Free over $50. Calculated rates stay on at checkout." action="Edit rates" />;
    case "address":
      return <SetupDetail title="Locations" body="Add a retail address to offer pickup. Online orders still ship from the default location." action="Add location" />;
    case "pos":
      return <SetupDetail title="Point of Sale" body="Retail kit: reader, dock, and receipt printer. One counter. Ships in 3–5 days." action="Order hardware" />;
    case "inbox":
      return <ListPage title="Inbox" rows={["Where is order #1078?", "Do you ship the lamp this week?", "Can I exchange the case?"]} />;
    case "notifications":
      return <ListPage title="Notifications" rows={["Trial ends in 1 day", "Payout of $2,184.60 is on the way", "2 orders need tracking"]} />;
    case "customers":
      return <ListPage title="Customers" rows={["Danielle Hudson · 3 orders", "Maya Chen · 1 order", "Jordan Ellis · 5 orders"]} />;
    case "marketing":
      return <ListPage title="Marketing" rows={["Welcome back · draft", "Headphones bundle · paused", "Gift sets · this week"]} />;
    case "analytics":
      return <ListPage title="Analytics" rows={["Sessions 14,280 · up 18%", "Conversion 2.7%", "Top product · Cloud Headphones"]} />;
    case "finance":
      return <ListPage title="Finance" rows={["Payout $2,184.60 · today", "Balance $18,420.12", "Shopify Payments · setup"]} />;
    case "content":
      return <ListPage title="Content" rows={["Homepage hero", "Lamp delivery note", "About the studio"]} />;
    case "online-store":
      return <ListPage title="Online Store" rows={["Theme · PITCH draft", "Pages · 4", "Navigation · main menu"]} />;
    case "email":
      return <ListPage title="Email" rows={["Welcome · tightened by Slackbot", "Abandoned checkout", "Back in stock"]} />;
    case "settings":
      return <ListPage title="Settings" rows={["Store details", "Plan · trial, 1 day left", "Payments", "Shipping and delivery"]} />;
    default:
      return <HomeSetup storeName={state.storeName} onChip={props.onChip} />;
  }
}

function PhoneBar({ title, back, action }: { title: string; back?: () => void; action?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 bg-white/90 px-4 py-4 backdrop-blur">
      {back ? (
        <button type="button" aria-label="Back" onClick={back} className="grid size-8 place-items-center rounded-full bg-[#f1f1f1]">
          <ChevronLeft size={16} />
        </button>
      ) : null}
      <h2 className="text-[25px] font-medium leading-8 tracking-[-0.75px]">{title}</h2>
      <span className="ml-auto">{action}</span>
    </div>
  );
}

function HomeSetup({ storeName, onChip }: { storeName: string; onChip: (label: string) => void }) {
  return (
    <div className="px-4 pb-8 pt-4">
      <div className="mb-4 flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#e11d2e]" />
          Trial end in 1 day
        </span>
        <span className="text-[#737572]">
          Questions? <span className="font-medium text-black underline">(844) 982-1186</span>
        </span>
      </div>
      <h2 className="mb-4 text-[25px] font-medium leading-8 tracking-[-0.75px]">
        <span className="underline decoration-dotted">{storeName}</span> is coming along
        <br />
        Now let’s design your store
      </h2>
      <div className="flex flex-col gap-4">
        <SetupCard
          art={<img src="/assets/theme-pitch.png" alt="" className="absolute left-10 top-5 h-72 w-56 rounded-md object-cover object-top shadow-xl" />}
          title="Choose your store design"
          body="Pick a theme that fits your brand, then customize from there."
          cta="Choose theme →"
          onClick={() => onChip("Choose theme →")}
        />
        <SetupCard
          art={<PayArt />}
          title="You're ready to accept payments"
          body="Review settings to accept more payment methods and add a payout account."
          cta="Review payments →"
          onClick={() => onChip("Review payments →")}
        />
        <SetupCard
          art={<DomainArt />}
          title="Get a custom domain"
          body="Give your store a branded URL that's easy to find, trust, and remember."
          cta="Set up domain →"
          onClick={() => onChip("Set up domain →")}
        />
        <SetupCard
          art={<img src="/assets/shipping-label.png" alt="" className="absolute left-1/2 top-8 w-40 -translate-x-1/2" />}
          title="Review shipping rates"
          body="Look over the defaults set up for you based on your location."
          cta="Review rates →"
          onClick={() => onChip("Review rates →")}
        />
        <SetupCard
          art={<img src="/assets/address-pin.png" alt="" className="absolute left-1/2 top-4 h-24 w-24 -translate-x-1/2 object-contain" />}
          title="Add your retail address"
          body="Add location details and set fulfillment options."
          cta="Add address →"
          onClick={() => onChip("Add address →")}
        />
        <SetupCard
          art={<img src="/assets/pos.png" alt="" className="absolute left-1/2 top-2 h-32 -translate-x-1/2 object-contain" />}
          title="Order POS hardware"
          body="Power your store with fast checkouts you can count on."
          cta="Order hardware →"
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
    <article className="rounded-3xl border border-[#e3e3e3] p-2 shadow-[0_1px_4px_rgba(0,0,0,0.04),0_3px_12px_rgba(0,0,0,0.03)]">
      <div className="relative h-[132px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#f6f6f6] to-[#ececed]">{art}</div>
      <div className="space-y-3 p-3">
        <div>
          <p className="text-[15px] font-medium leading-[1.4]">{title}</p>
          <p className="text-[15px] leading-[1.4] text-[#737572]">{body}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="h-8 rounded-full border border-[#e3e3e3] bg-white px-4 text-[13px] font-medium shadow-[0_3px_15px_rgba(0,0,0,0.03)]"
        >
          {cta}
        </button>
      </div>
    </article>
  );
}

function PayArt() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-[78px] top-[19px] grid h-[50px] w-[86px] place-items-center rounded-[13px] bg-[#5631f4] text-[18px] font-semibold text-white shadow-md">
        shop
      </div>
      <div className="absolute left-[121px] top-[41px] grid h-[50px] w-[87px] place-items-center rounded-[13px] bg-[#1934cf] text-[22px] font-extrabold italic tracking-tight text-white shadow-md">
        VISA
      </div>
      <div className="absolute left-[168px] top-[62px] grid h-[50px] w-[70px] place-items-center rounded-[13px] bg-white shadow-md">
        <span className="flex">
          <span className="size-5 rounded-full bg-[#eb001b]" />
          <span className="-ml-2 size-5 rounded-full bg-[#f79e1b]" />
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
        <span className="text-[12px] text-[#737572]">.com</span>
        <img src="/assets/domain-cursor.png" alt="" className="absolute -right-2 bottom-6 w-10" />
      </div>
    </div>
  );
}

function HomeActive() {
  return (
    <div className="px-4 pb-8 pt-5">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-[25px] font-medium tracking-[-0.75px]">Home</h2>
        <button type="button" className="flex items-center gap-1 text-[12px] text-[#4a4a4a]">
          <span className="flex -space-x-1.5">
            <img src="/assets/visitor-a.png" alt="" className="size-5 rounded-full object-cover ring-2 ring-white" />
            <img src="/assets/visitor-b.png" alt="" className="size-5 rounded-full object-cover ring-2 ring-white" />
          </span>
          82 visitors right now <ChevronRight size={14} />
        </button>
      </div>
      <div className="mb-4 flex gap-2 overflow-hidden">
        <span className="inline-flex h-8 items-center gap-1 rounded-full bg-black px-3 text-[13px] font-medium text-white">
          Last 30 days
        </span>
        <span className="inline-flex h-8 items-center rounded-full bg-[#f1f1f1] px-3 text-[13px]">All sales channels</span>
        <span className="inline-flex h-8 items-center rounded-full bg-[#f1f1f1] px-3 text-[13px]">View analytics</span>
      </div>
      <SalesChart />
      <div className="mt-2 divide-y divide-[#eee]">
        <Metric up label="24%" name="Total sales" value="$48,392.50" good />
        <Metric up label="18%" name="Sessions" value="14,280" good />
        <Metric up={false} label="2%" name="Total orders" value="386" />
        <Metric up label="0.2%" name="Conversion rate" value="2.7%" good />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-[20px] font-medium">Recent activity</h3>
        <button type="button" className="text-[13px] text-[#4a4a4a]">
          View all
        </button>
      </div>
      <ul className="mt-3 space-y-3 text-[14px]">
        <Activity title="Danielle Hudson placed order #1078." meta="$369.99 · 3 items · 7 minutes ago" />
        <Activity title="Your payout is on its way." meta="$2,184.60 · Today at 8:00 AM" />
        <Activity title="Order #1071 was delivered." meta="Maya Chen · Today at 7:42 AM" />
      </ul>
      <h3 className="mb-3 mt-6 text-[20px] font-medium">Business forward</h3>
      <div className="grid grid-cols-2 gap-4 text-[14px]">
        <div>
          <p className="font-medium">Your best seller is picking up speed</p>
          <p className="mt-1 text-[#4a4a4a]">Flora Sneakers sales are up 32%. You have 126 units left across 8 variants.</p>
          <p className="mt-2 text-[13px] font-medium">Review inventory →</p>
        </div>
        <div>
          <p className="font-medium">Bring customers back for a second look</p>
          <p className="mt-1 text-[#4a4a4a]">Turn this month’s new shoppers into repeat customers with a welcome-back email.</p>
          <p className="mt-2 text-[13px] font-medium">Plan a campaign with Sidekick →</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ name, value, label, good, up }: { name: string; value: string; label: string; good?: boolean; up: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${good ? "bg-[#d7ffd7] text-[#003800]" : "bg-[#f1f1f1] text-[#4a4a4a]"}`}>
        {up ? "↑" : "↓"} {label}
      </span>
      <span className="text-[14px]">{name}</span>
      <span className="ml-auto text-[16px] font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Activity({ title, meta }: { title: string; meta: string }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f4f5f3]">
        <Tag size={14} />
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="text-[13px] text-[#737572]">{meta}</span>
      </span>
    </li>
  );
}

function SalesChart() {
  return (
    <svg viewBox="0 0 340 120" className="h-32 w-full" aria-hidden>
      <path
        d="M0 90 C 30 88, 40 70, 60 68 C 90 64, 100 40, 130 48 C 160 56, 180 30, 210 36 C 240 42, 250 18, 280 28 C 310 38, 320 22, 340 30 L 340 120 L 0 120 Z"
        fill="#5631f4"
        opacity="0.18"
      />
      <path
        d="M0 90 C 30 88, 40 70, 60 68 C 90 64, 100 40, 130 48 C 160 56, 180 30, 210 36 C 240 42, 250 18, 280 28 C 310 38, 320 22, 340 30"
        fill="none"
        stroke="#5631f4"
        strokeWidth="2.5"
      />
      <path
        d="M0 78 C 40 76, 70 60, 110 66 C 150 72, 180 50, 220 58 C 260 66, 290 48, 340 54"
        fill="none"
        stroke="#c4b5fd"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
    </svg>
  );
}

function Payments({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="px-4 pb-10">
      <div className="flex items-center gap-2 py-4">
        <span className="grid size-8 place-items-center rounded-full bg-[#f1f1f1]">
          <ChevronLeft size={16} />
        </span>
        <span className="grid size-8 place-items-center rounded-full bg-[#f1f1f1]">
          <Home size={14} />
        </span>
      </div>
      <h2 className="mb-4 text-[25px] font-medium tracking-[-0.75px]">Payments</h2>
      <p className="mb-3 text-[15px] font-medium">Shopify Payments</p>
      <div className="rounded-3xl border border-[#e3e3e3] p-2 shadow-sm">
        <div className="rounded-2xl bg-[#f7f7f7] p-4">
          <p className="text-[15px] font-medium leading-[1.4]">Get up to 7.5% better performance than any other provider on Shopify</p>
          <ul className="mt-3 space-y-1 text-[13px] leading-[1.4]">
            {[
              "Tap into the 400+ million buyers who expect Shop Pay",
              "Sell in over 130 currencies and get paid in yours",
              "Access funding, credit, and a free business account for payouts and spending",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-[#4a4a4a]">No transaction fees • Card rates starting at 2.5% + $0.30</p>
        </div>
        <div className="mt-2 rounded-2xl border border-[#e6e6e6] p-4">
          <p className="mb-3 text-[15px] font-medium">Available payment methods</p>
          <div className="flex gap-2">
            <span className="grid h-6 w-10 place-items-center rounded bg-white shadow">
              <span className="flex">
                <span className="size-3 rounded-full bg-[#eb001b]" />
                <span className="-ml-1 size-3 rounded-full bg-[#f79e1b]" />
              </span>
            </span>
            <span className="grid h-6 w-10 place-items-center rounded bg-[#1934cf] text-[9px] font-extrabold italic text-white">VISA</span>
            <span className="grid h-6 w-10 place-items-center rounded bg-[#5631f4] text-[10px] font-semibold text-white">shop</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onSetup} className="h-8 flex-1 rounded-full bg-gradient-to-t from-black to-[#3d3d3d] text-[13px] font-medium text-white shadow">
          Complete setup
        </button>
        <button type="button" className="h-8 flex-1 rounded-full bg-[#ebebeb] text-[13px] font-medium">
          Learn more
        </button>
      </div>
      <Section title="More ways to pay" body="Offer methods processed offsite or through custom checkout integrations" />
      <Section title="Manual payment methods" body="Accept payments outside your online store, like bank deposits or cash on delivery" />
      <p className="mb-2 mt-6 text-[15px] font-medium">Shopify configuration</p>
      <div className="divide-y divide-[#e6e6e6] rounded-3xl border border-[#e3e3e3] px-3">
        {["Payment capture method", "Payment method customizations", "Gift card expiration", "Apple Wallet passes"].map((row) => (
          <div key={row} className="flex items-center justify-between py-3 text-[14px]">
            {row}
            <ChevronRight size={16} className="text-[#737572]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-5">
      <p className="text-[15px] font-medium">{title}</p>
      <p className="mt-1 text-[13px] text-[#4a4a4a]">{body}</p>
      <button type="button" className="mt-3 flex h-8 w-full items-center justify-center gap-1 rounded-full bg-[#ebebeb] text-[13px] font-medium">
        <Plus size={14} /> Method
      </button>
    </div>
  );
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
  return (
    <div className="px-5 pb-8">
      <div className="flex items-center gap-2 py-4">
        <button type="button" aria-label="Back" onClick={onBack} className="grid size-8 place-items-center rounded-full bg-[#f1f1f1]">
          <ChevronLeft size={16} />
        </button>
        <span className="grid size-8 place-items-center rounded-full bg-[#f1f1f1]">
          <Home size={14} />
        </span>
      </div>
      <h2 className="text-[25px] font-medium tracking-[-0.75px]">Set up Shopify Payments</h2>
      <p className="mt-1 text-[14px] text-[#4a4a4a]">Tell us about your store to start accepting payments</p>
      {(state.paymentsStep === "identity" || state.paymentsStep === "done") ? (
        <div className="mt-6 rounded-2xl border border-[#e3e3e3] p-4">
          <p className="mb-3 text-[15px] font-medium">Your name</p>
          <label className="mb-3 block text-[13px]">
            First name
            <input
              value={state.identity.first}
              onChange={(event) => onIdentity({ first: event.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-[#e3e3e3] px-3 outline-none"
            />
          </label>
          <label className="block text-[13px]">
            Last name
            <input
              value={state.identity.last}
              onChange={(event) => onIdentity({ last: event.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-[#e3e3e3] px-3 outline-none"
            />
          </label>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-[#e3e3e3] p-4">
          <p className="mb-3 text-[15px] font-medium">I am running my store as:</p>
          <div className="space-y-2">
            {(Object.keys(businessCopy) as (keyof typeof businessCopy)[]).map((key) => {
              const on = state.businessType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onBusiness(key)}
                  className={`flex w-full gap-3 rounded-xl p-3 text-left ${on ? "bg-[#f4f5f3]" : ""}`}
                >
                  <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${on ? "border-black" : "border-[#c8c8c8]"}`}>
                    {on ? <span className="size-2 rounded-full bg-black" /> : null}
                  </span>
                  <span>
                    <span className="block text-[15px] font-medium">{businessCopy[key].title}</span>
                    <span className="block text-[13px] leading-[1.4] text-[#4a4a4a]">{businessCopy[key].body}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onNext} className="h-9 rounded-full bg-black px-5 text-[13px] font-medium text-white">
          Next
        </button>
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
  return (
    <div className="px-4 pb-8 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <Tag size={16} />
        <h2 className="text-[22px] font-medium">Products</h2>
        <button type="button" onClick={onAdd} className="ml-auto h-8 rounded-full bg-black px-3 text-[13px] font-medium text-white">
          Add product
        </button>
        <span className="grid size-8 place-items-center rounded-full bg-[#f1f1f1]">
          <MoreHorizontal size={16} />
        </span>
      </div>
      <div className="rounded-2xl bg-[#f6f6f6] p-3 text-[13px]">
        {[
          ["Avg. sell-through rate", "18.4%"],
          ["Products by days of inventory remaining", "18.4%"],
          ["ABC product analysis", "18.4%"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-1.5">
            <span>{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-9 items-center gap-2 rounded-full border border-[#e3e3e3] px-3 text-[13px] text-[#737572]">
        All <ChevronRight size={12} className="rotate-90" /> <Search size={14} /> Search and filter
      </div>
      <div className="mt-2 grid grid-cols-[24px_1fr_auto_auto] items-center gap-2 px-1 py-2 text-[12px] text-[#737572]">
        <span />
        <span>Product</span>
        <span>Status</span>
        <span>Price</span>
      </div>
      {state.products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onProduct(product.id)}
          className="grid w-full grid-cols-[24px_28px_1fr_auto_auto_16px] items-center gap-2 border-t border-[#f0f0f0] py-2 text-left text-[13px]"
        >
          <span className="size-4 rounded border border-[#ccc]" />
          <Thumb product={product} />
          <span className="truncate">{product.title}</span>
          <span className="rounded-md bg-[#d7f3ff] px-1.5 py-0.5 text-[11px] font-medium text-[#083344]">{product.status}</span>
          <span>${product.price}</span>
          <Eye size={14} className="text-[#737572]" />
        </button>
      ))}
    </div>
  );
}

function Thumb({ product }: { product: Product }) {
  if (product.tone === "headphones") return <img src="/assets/headphones.png" alt="" className="size-7 rounded-md object-cover" />;
  if (product.tone === "lamp") return <img src="/assets/lamp.png" alt="" className="size-7 rounded-md object-cover" />;
  return <span className={`size-7 rounded-md ${toneClass[product.tone]}`} />;
}

function ProductEdit({
  state,
  onBack,
  onUpdate,
}: {
  state: PrototypeState;
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<Product>) => void;
}) {
  const product = state.products.find((item) => item.id === state.selectedProductId) ?? state.products[0];
  return (
    <div className="px-4 pb-10">
      <PhoneBar
        title=""
        back={onBack}
        action={
          <span className="flex items-center gap-2">
            <button type="button" className="h-8 rounded-full bg-black px-3 text-[13px] font-medium text-white">
              Add product
            </button>
            <MoreHorizontal size={16} />
          </span>
        }
      />
      <div className={`mb-3 grid size-16 place-items-center overflow-hidden rounded-2xl ${toneClass[product.tone]}`}>
        {(product.tone === "headphones" || product.tone === "lamp") ? (
          <img src={product.tone === "lamp" ? "/assets/lamp.png" : "/assets/headphones.png"} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <h2 className="mb-4 text-[25px] font-medium leading-8 tracking-[-0.5px]">{product.title}</h2>
      <div className="space-y-3 rounded-2xl border border-[#e3e3e3] p-3">
        <Field label="Title" value={product.title} onChange={(title) => onUpdate(product.id, { title })} />
        <label className="block text-[13px]">
          Description
          <textarea
            value={product.description}
            onChange={(event) => onUpdate(product.id, { description: event.target.value })}
            className="mt-1 h-28 w-full resize-none rounded-xl border border-[#e3e3e3] p-3 text-[14px] outline-none"
          />
        </label>
        <div className="rounded-xl border border-[#e3e3e3] p-3 text-center text-[13px] text-[#737572]">
          <div className="mb-2 flex justify-center gap-2">
            <span className="rounded-full bg-[#eee] px-3 py-1">Upload new</span>
            <span className="px-3 py-1">Select existing</span>
          </div>
          Accepts images, videos, or 3D models
        </div>
        <Field label="Category" value={product.title} onChange={() => undefined} />
      </div>
      <p className="mb-2 mt-5 text-[15px] font-medium">Price</p>
      <div className="rounded-2xl border border-[#e3e3e3] p-3">
        <label className="block text-[13px]">
          <span className="sr-only">Price</span>
          <input
            value={product.price}
            onChange={(event) => onUpdate(product.id, { price: event.target.value })}
            className="h-10 w-32 rounded-xl border border-[#e3e3e3] px-3 outline-none"
          />
        </label>
        <div className="mt-3 flex gap-2 text-[12px] text-[#737572]">
          <span className="rounded-full bg-[#f1f1f1] px-2 py-1">Compare-at</span>
          <span className="rounded-full bg-[#f1f1f1] px-2 py-1">Unit price</span>
          <span className="rounded-full bg-[#f1f1f1] px-2 py-1">Charge tax · Yes</span>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-[#e3e3e3] p-3">
        <p className="text-[13px] text-[#737572]">Inventory</p>
        <p className="mt-2 text-[14px]">{product.inventory}</p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-[13px]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-[#e3e3e3] px-3 text-[14px] outline-none"
      />
    </label>
  );
}

function SetupDetail({ title, body, action }: { title: string; body: string; action: string }) {
  return (
    <div className="px-4 pb-8 pt-5">
      <h2 className="text-[25px] font-medium tracking-[-0.75px]">{title}</h2>
      <p className="mt-3 text-[15px] leading-[1.45] text-[#4a4a4a]">{body}</p>
      <button type="button" className="mt-4 h-8 rounded-full bg-black px-4 text-[13px] font-medium text-white">
        {action}
      </button>
    </div>
  );
}

function ListPage({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="px-4 pb-8 pt-5">
      <h2 className="mb-4 text-[25px] font-medium tracking-[-0.75px]">{title}</h2>
      <ul className="divide-y divide-[#eee] rounded-2xl border border-[#e3e3e3]">
        {rows.map((row) => (
          <li key={row} className="flex items-center justify-between px-3 py-3 text-[14px]">
            {row}
            <ChevronRight size={16} className="text-[#737572]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
