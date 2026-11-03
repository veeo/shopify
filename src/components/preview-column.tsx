"use client";

import type { ReactNode } from "react";
import type { BusinessType, PreviewId, Product, ProductTone, PrototypeState } from "@/lib/prototype";

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
  return (
    <main className="min-w-0 flex-1 overflow-hidden bg-[#f1f1f1] py-3">
      <div className="h-full overflow-hidden rounded-[20px] bg-[#f1f1f1] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
        <div key={state.preview} className={`${state.motion ? "page-in" : ""} scroll-thin-light h-full overflow-y-auto`}>
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
      </div>
    </main>
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
        <ProductEdit state={state} onBack={() => props.onPreview("products")} onUpdate={props.onUpdateProduct} />
      );
    case "theme":
      return (
        <SetupDetail
          title="Themes"
          body="PITCH is installed as a draft. Publish it when the photography is ready."
          action="Publish theme"
        />
      );
    case "domain":
      return (
        <SetupDetail
          title="Domains"
          body="Primary domain is still a myshopify.com address. Connect a domain you already own."
          action="Connect domain"
        />
      );
    case "shipping":
      return (
        <SetupDetail
          title="Shipping"
          body="Domestic: $6.00 under $50. Free over $50. Calculated rates stay on at checkout."
          action="Edit rates"
        />
      );
    case "address":
      return (
        <SetupDetail
          title="Locations"
          body="Add a retail address to offer pickup. Online orders still ship from the default location."
          action="Add location"
        />
      );
    case "pos":
      return (
        <SetupDetail
          title="Point of Sale"
          body="Retail kit: reader, dock, and receipt printer. One counter. Ships in 3–5 days."
          action="Order hardware"
        />
      );
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

function Crumb({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <s-link
      slot="breadcrumb-actions"
      href="#"
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {label}
    </s-link>
  );
}

function HomeSetup({ storeName, onChip }: { storeName: string; onChip: (label: string) => void }) {
  return (
    <s-page heading={`${storeName} is coming along`} inlineSize="large">
      <s-banner slot="supplemental-start" tone="warning" heading="Trial ends in 1 day">
        Questions? (844) 982-1186
      </s-banner>
      <s-paragraph>Now let’s design your store</s-paragraph>
      <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
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
      </s-grid>
    </s-page>
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
    <s-box border="base" borderRadius="large" padding="base" background="base">
      <s-stack gap="base">
        <div className="relative h-[132px] overflow-hidden rounded-xl bg-gradient-to-b from-[#f6f6f6] to-[#ececed]">{art}</div>
        <s-stack gap="small-100">
          <s-heading>{title}</s-heading>
          <s-paragraph color="subdued">{body}</s-paragraph>
        </s-stack>
        <s-button variant="secondary" onClick={onClick}>
          {cta}
        </s-button>
      </s-stack>
    </s-box>
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
    <s-page heading="Home" inlineSize="large">
      <s-stack gap="base">
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-avatar src="/assets/visitor-a.png" alt="" size="small" />
          <s-avatar src="/assets/visitor-b.png" alt="" size="small" />
          <s-text color="subdued">82 visitors right now</s-text>
        </s-stack>
        <s-stack direction="inline" gap="small">
          <s-clickable-chip color="strong">Last 30 days</s-clickable-chip>
          <s-clickable-chip>All sales channels</s-clickable-chip>
          <s-clickable-chip>View analytics</s-clickable-chip>
        </s-stack>
        <s-box background="base" border="base" borderRadius="large" padding="base">
          <SalesChart />
        </s-box>
        <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
          <Metric up label="24%" name="Total sales" value="$48,392.50" good />
          <Metric up label="18%" name="Sessions" value="14,280" good />
          <Metric up={false} label="2%" name="Total orders" value="386" />
          <Metric up label="0.2%" name="Conversion rate" value="2.7%" good />
        </s-grid>
        <s-section heading="Recent activity">
          <s-stack gap="base">
            <Activity title="Danielle Hudson placed order #1078." meta="$369.99 · 3 items · 7 minutes ago" />
            <Activity title="Your payout is on its way." meta="$2,184.60 · Today at 8:00 AM" />
            <Activity title="Order #1071 was delivered." meta="Maya Chen · Today at 7:42 AM" />
          </s-stack>
        </s-section>
        <s-section heading="Business forward">
          <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
            <s-stack gap="small-100">
              <s-heading>Your best seller is picking up speed</s-heading>
              <s-paragraph color="subdued">
                Flora Sneakers sales are up 32%. You have 126 units left across 8 variants.
              </s-paragraph>
              <s-text type="strong">Review inventory</s-text>
            </s-stack>
            <s-stack gap="small-100">
              <s-heading>Bring customers back for a second look</s-heading>
              <s-paragraph color="subdued">
                Turn this month’s new shoppers into repeat customers with a welcome-back email.
              </s-paragraph>
              <s-text type="strong">Plan a campaign with Sidekick</s-text>
            </s-stack>
          </s-grid>
        </s-section>
      </s-stack>
    </s-page>
  );
}

function Metric({ name, value, label, good, up }: { name: string; value: string; label: string; good?: boolean; up: boolean }) {
  return (
    <s-box border="base" borderRadius="large" padding="base" background="base">
      <s-stack gap="small">
        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
          <s-text color="subdued">{name}</s-text>
          <s-badge tone={good ? "success" : "neutral"} icon={up ? "arrow-up" : "arrow-down"}>
            {label}
          </s-badge>
        </s-stack>
        <s-heading fontSize="large-200">{value}</s-heading>
      </s-stack>
    </s-box>
  );
}

function Activity({ title, meta }: { title: string; meta: string }) {
  return (
    <s-stack direction="inline" gap="small" alignItems="center">
      <s-icon type="order" />
      <s-stack gap="small-500">
        <s-text type="strong">{title}</s-text>
        <s-text color="subdued">{meta}</s-text>
      </s-stack>
    </s-stack>
  );
}

function SalesChart() {
  return (
    <svg viewBox="0 0 340 120" className="h-32 w-full" aria-hidden>
      <path
        d="M0 90 C 30 88, 40 70, 60 68 C 90 64, 100 40, 130 48 C 160 56, 180 30, 210 36 C 240 42, 250 18, 280 28 C 310 38, 320 22, 340 30 L 340 120 L 0 120 Z"
        fill="#672ff4"
        opacity="0.18"
      />
      <path
        d="M0 90 C 30 88, 40 70, 60 68 C 90 64, 100 40, 130 48 C 160 56, 180 30, 210 36 C 240 42, 250 18, 280 28 C 310 38, 320 22, 340 30"
        fill="none"
        stroke="#672ff4"
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
    <s-page heading="Payments" inlineSize="large">
      <s-stack gap="base">
        <s-stack direction="inline" justifyContent="end">
          <s-button variant="primary" onClick={onSetup}>
            Complete setup
          </s-button>
        </s-stack>
        <s-section heading="Shopify Payments">
          <s-stack gap="base">
            <s-paragraph>Get up to 7.5% better performance than any other provider on Shopify</s-paragraph>
            <s-unordered-list>
              <s-list-item>Tap into the 400+ million buyers who expect Shop Pay</s-list-item>
              <s-list-item>Sell in over 130 currencies and get paid in yours</s-list-item>
              <s-list-item>Access funding, credit, and a free business account for payouts and spending</s-list-item>
            </s-unordered-list>
            <s-text color="subdued">No transaction fees · Card rates starting at 2.5% + $0.30</s-text>
            <s-stack direction="inline" gap="small" alignItems="center">
              <s-badge icon="credit-card">Mastercard</s-badge>
              <s-badge icon="credit-card">Visa</s-badge>
              <s-badge icon="wallet">Shop Pay</s-badge>
            </s-stack>
          </s-stack>
        </s-section>
        <s-section heading="More ways to pay" subheading="Offer methods processed offsite or through custom checkout integrations">
          <s-button icon="plus" variant="secondary">
            Method
          </s-button>
        </s-section>
        <s-section
          heading="Manual payment methods"
          subheading="Accept payments outside your online store, like bank deposits or cash on delivery"
        >
          <s-button icon="plus" variant="secondary">
            Method
          </s-button>
        </s-section>
        <s-section heading="Shopify configuration">
          <s-stack gap="small">
            {["Payment capture method", "Payment method customizations", "Gift card expiration", "Apple Wallet passes"].map(
              (row) => (
                <s-stack key={row} direction="inline" justifyContent="space-between" alignItems="center">
                  <s-text>{row}</s-text>
                  <s-icon type="chevron-right" />
                </s-stack>
              ),
            )}
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
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

function isBusiness(value: string): value is BusinessType {
  return value === "individual" || value === "business" || value === "nonprofit";
}

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
    <s-page heading="Set up Shopify Payments" inlineSize="base">
      <Crumb label="Payments" onClick={onBack} />
      <s-paragraph>Tell us about your store to start accepting payments</s-paragraph>
      <s-stack direction="inline" justifyContent="end">
        <s-button variant="primary" onClick={onNext}>
          Next
        </s-button>
      </s-stack>
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
    </s-page>
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
    <s-page heading="Products" inlineSize="large">
      <s-stack gap="base">
        <s-stack direction="inline" justifyContent="end">
          <s-button variant="primary" icon="plus" onClick={onAdd}>
            Add product
          </s-button>
        </s-stack>
        <s-section heading="Performance">
          <s-stack gap="small">
            {[
              ["Avg. sell-through rate", "18.4%"],
              ["Products by days of inventory remaining", "18.4%"],
              ["ABC product analysis", "18.4%"],
            ].map(([label, value]) => (
              <s-stack key={label} direction="inline" justifyContent="space-between" alignItems="center">
                <s-text>{label}</s-text>
                <s-text type="strong">{value}</s-text>
              </s-stack>
            ))}
          </s-stack>
        </s-section>
        <s-table>
          <s-search-field slot="filters" label="Search and filter" labelAccessibilityVisibility="exclusive" placeholder="Search and filter" />
          <s-table-header-row>
            <s-table-header listSlot="primary">Product</s-table-header>
            <s-table-header listSlot="inline">Status</s-table-header>
            <s-table-header listSlot="secondary" format="currency">
              Price
            </s-table-header>
          </s-table-header-row>
          <s-table-body>
            {state.products.map((product) => (
              <s-table-row key={product.id} clickDelegate={`open-${product.id}`}>
                <s-table-cell>
                  <s-stack direction="inline" gap="small" alignItems="center">
                    <Thumb product={product} />
                    <s-link
                      id={`open-${product.id}`}
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        onProduct(product.id);
                      }}
                    >
                      {product.title}
                    </s-link>
                  </s-stack>
                </s-table-cell>
                <s-table-cell>
                  <s-badge tone={product.status === "Active" ? "success" : "info"}>{product.status}</s-badge>
                </s-table-cell>
                <s-table-cell>${product.price}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-stack>
    </s-page>
  );
}

function Thumb({ product }: { product: Product }) {
  if (product.tone === "headphones" || product.tone === "lamp") {
    return <s-thumbnail alt="" size="small" src={product.tone === "lamp" ? "/assets/lamp.png" : "/assets/headphones.png"} />;
  }
  return <span className={`inline-block size-8 rounded-md ${toneClass[product.tone]}`} />;
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
  if (!product) return <s-page heading="Product" inlineSize="base" />;
  return (
    <s-page heading={product.title} inlineSize="base">
      <Crumb label="Products" onClick={onBack} />
      <s-stack gap="base">
        <Thumb product={product} />
        <s-section heading="Product details">
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
            <s-text color="subdued">Accepts images, videos, or 3D models</s-text>
            <s-text-field label="Category" name="category" value={product.title} readOnly />
          </s-stack>
        </s-section>
        <s-section heading="Price">
          <s-stack gap="small">
            <s-text-field
              label="Price"
              name="price"
              prefix="$"
              value={product.price}
              onInput={(event) => onUpdate(product.id, { price: event.currentTarget.value })}
            />
            <s-stack direction="inline" gap="small">
              <s-badge>Compare-at</s-badge>
              <s-badge>Unit price</s-badge>
              <s-badge tone="success">Charge tax · Yes</s-badge>
            </s-stack>
          </s-stack>
        </s-section>
        <s-section heading="Inventory">
          <s-paragraph>{product.inventory}</s-paragraph>
        </s-section>
      </s-stack>
    </s-page>
  );
}

function SetupDetail({ title, body, action }: { title: string; body: string; action: string }) {
  return (
    <s-page heading={title} inlineSize="base">
      <s-section accessibilityLabel={title}>
        <s-stack gap="base">
          <s-paragraph>{body}</s-paragraph>
          <s-button variant="primary">{action}</s-button>
        </s-stack>
      </s-section>
    </s-page>
  );
}

function ListPage({ title, rows }: { title: string; rows: string[] }) {
  return (
    <s-page heading={title} inlineSize="large">
      <s-section accessibilityLabel={title}>
        <s-stack gap="small">
          {rows.map((row) => (
            <s-stack key={row} direction="inline" justifyContent="space-between" alignItems="center">
              <s-text>{row}</s-text>
              <s-icon type="chevron-right" />
            </s-stack>
          ))}
        </s-stack>
      </s-section>
    </s-page>
  );
}
