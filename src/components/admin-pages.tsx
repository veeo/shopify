"use client";

import { useState, type ReactNode } from "react";
import {
  Badge,
  Body,
  Btn,
  Card,
  CardTitle,
  Chip,
  EmptyState,
  Kpi,
  LearnMore,
  LineChart,
  Muted,
  Row,
  SearchField,
  Section,
  Table,
  TableSearch,
  Thumb,
  Toggle,
  TopBar,
  type BarAction,
} from "@/components/admin-ui";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { navFor, pageMeta, sectionChoices, settingsNav, type PreviewId } from "@/lib/admin-nav";
import type { PrototypeState } from "@/lib/prototype";

export type PageNav = {
  go: (page: PreviewId) => void;
  rail: (id: string) => void;
  chip: (label: string) => void;
  ask: (text: string) => void;
};

type Props = { state: PrototypeState; nav: PageNav };

/** Standard page chrome: the top bar comes from the nav model so titles and icons stay in sync with the rail. */
function Shell({
  page,
  nav,
  actions,
  more,
  aside,
  back,
  children,
}: {
  page: PreviewId;
  nav: PageNav;
  actions?: BarAction[];
  more?: { label: string; onClick?: () => void }[];
  aside?: ReactNode;
  back?: { label: string; page: PreviewId };
  children: ReactNode;
}) {
  const meta = pageMeta(page);
  const sections = sectionChoices(page);
  return (
    <>
      <TopBar
        title={meta.title}
        back={back?.label}
        onBack={back ? () => nav.go(back.page) : undefined}
        actions={actions}
        more={more}
        aside={aside}
        sections={sections ?? undefined}
        current={page}
        onSection={(next) => nav.go(next)}
      />
      <Body>{children}</Body>
    </>
  );
}

function H1({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <h2 className="flex items-center gap-2 text-[20px] font-bold leading-7 tracking-[-0.3px] text-[#303030]">{children}</h2>
      {aside}
    </div>
  );
}

const days = ["Oct 5", "Oct 12", "Oct 19", "Oct 26", "Nov 2"];
const hours = ["12 AM", "6 AM", "12 PM", "6 PM"];
const flat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const salesCurve = [820, 1140, 980, 1420, 1310, 1660, 1540, 1890, 1720, 2080, 1960, 2310];
const compareCurve = [700, 860, 920, 1010, 1180, 1120, 1290, 1340, 1460, 1390, 1580, 1610];

/* Orders */

const orderRows = [
  { id: "#1078", date: "Today at 9:42 AM", customer: "Danielle Hudson", total: "$369.99", paid: true, fulfilled: false, items: "3 items" },
  { id: "#1077", date: "Today at 8:15 AM", customer: "Maya Chen", total: "$89.00", paid: true, fulfilled: false, items: "1 item" },
  { id: "#1076", date: "Yesterday at 6:02 PM", customer: "Jordan Ellis", total: "$214.50", paid: true, fulfilled: true, items: "2 items" },
  { id: "#1075", date: "Yesterday at 2:31 PM", customer: "Priya Patel", total: "$58.00", paid: false, fulfilled: false, items: "1 item" },
  { id: "#1074", date: "Nov 2 at 11:08 AM", customer: "Sam Rivera", total: "$142.75", paid: true, fulfilled: true, items: "2 items" },
  { id: "#1073", date: "Nov 2 at 9:47 AM", customer: "Alex Kim", total: "$96.20", paid: true, fulfilled: true, items: "1 item" },
];

function Orders({ state, nav }: Props) {
  const active = state.scenario === "active";
  return (
    <Shell
      page="orders"
      nav={nav}
      actions={active ? [{ label: "Export" }, { label: "Create order", tone: "primary" }] : []}
      more={active ? [{ label: "View drafts", onClick: () => nav.go("drafts") }, { label: "Abandoned checkouts", onClick: () => nav.go("abandoned-checkouts") }] : []}
    >
      {active ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Kpi label="Orders" value="14" delta="↑ 8%" points={[3, 5, 4, 7, 6, 9, 8, 11]} />
            <Kpi label="Items ordered" value="23" delta="↑ 12%" points={[4, 6, 5, 8, 9, 10, 12, 13]} />
            <Kpi label="Orders fulfilled" value="9" points={[2, 3, 3, 5, 4, 6, 7, 9]} />
            <Kpi label="Returns" value="$0.00" />
          </div>
          <Table
            select
            toolbar={<TableSearch placeholder="Search and filter" tabs={["All", "Unfulfilled", "Unpaid"]} />}
            columns={[
              { label: "Order", width: 64 },
              { label: "Date", width: 132 },
              { label: "Customer", width: 120 },
              { label: "Total", width: 72, align: "end" },
              { label: "Payment status", width: 112 },
              { label: "Fulfillment status", width: 120 },
              { label: "Items", width: 64 },
            ]}
            rows={orderRows.map((row) => [
              <span key="id" className="font-semibold">
                {row.id}
              </span>,
              row.date,
              row.customer,
              row.total,
              <Badge key="paid" tone={row.paid ? "neutral" : "warning"} icon={row.paid ? undefined : "AlertCircle"}>
                {row.paid ? "Paid" : "Payment pending"}
              </Badge>,
              <Badge key="ful" tone={row.fulfilled ? "neutral" : "caution"}>
                {row.fulfilled ? "Fulfilled" : "Unfulfilled"}
              </Badge>,
              row.items,
            ])}
          />
          <LearnMore topic="orders" />
        </>
      ) : (
        <EmptyState
          art="/assets/admin/empty-orders.png"
          title="Your orders will show here"
          body="This is where you’ll fulfill orders, collect payments, and track order progress."
          cta="Create order"
          learn="orders"
        />
      )}
    </Shell>
  );
}

/* Customers */

const customerRows = [
  ["Danielle Hudson", "Subscribed", "Brooklyn NY, United States", "3 orders", "$612.40"],
  ["Maya Chen", "Subscribed", "Oakland CA, United States", "1 order", "$89.00"],
  ["Jordan Ellis", "Not subscribed", "Austin TX, United States", "5 orders", "$1,204.95"],
  ["Priya Patel", "Subscribed", "Chicago IL, United States", "2 orders", "$116.00"],
  ["Sam Rivera", "Not subscribed", "Denver CO, United States", "1 order", "$142.75"],
];

function Customers({ state, nav }: Props) {
  const active = state.scenario === "active";
  const [open, setOpen] = useState(false);
  return (
    <Shell page="customers" nav={nav} actions={[{ label: "Import" }, { label: "Add customer", tone: "primary" }]} more={[{ label: "Export" }]}>
      <Card flush>
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-9 w-full items-center justify-between px-3 text-left text-[12px] text-[#8a8a8a]">
          Describe your segment
          <PIcon name={open ? "ChevronUp" : "ChevronDown"} size={18} />
        </button>
        {open ? (
          <div className="flex items-center justify-between border-t border-[#ebebeb] px-3 py-2">
            <span className="font-mono text-[11px] text-[#8a8a8a]">Start a query</span>
            <Btn tone="gray">Save</Btn>
          </div>
        ) : null}
      </Card>
      <SearchField placeholder="Search customers" trailing="LayoutColumns3" />
      {active ? (
        <Table
          select
          columns={[
            { label: "Customer name", width: 128 },
            { label: "Email subscription", width: 120 },
            { label: "Location", width: 168 },
            { label: "Orders", width: 64 },
            { label: "Amount spent", width: 96, align: "end" },
          ]}
          rows={customerRows.map(([name, sub, place, orders, spent]) => [
            <span key="n" className="font-semibold">
              {name}
            </span>,
            <Badge key="s" tone={sub === "Subscribed" ? "success" : "neutral"}>
              {sub}
            </Badge>,
            place,
            orders,
            spent,
          ])}
        />
      ) : (
        <EmptyState bare icon="Search" title="No customers match this segment criteria" body="Try editing the segment to view matching customers" />
      )}
      <LearnMore topic="customers" />
    </Shell>
  );
}

/* Growth */

function Growth({ state, nav }: Props) {
  const active = state.scenario === "active";
  const [hero, setHero] = useState(true);
  return (
    <Shell page="growth" nav={nav}>
      {hero ? (
        <div className="relative flex flex-col gap-2 px-1 pt-2">
          <span className="absolute right-0 top-1">
            <Btn tone="gray" icon="X" onClick={() => setHero(false)}>
              Dismiss
            </Btn>
          </span>
          <img src="/assets/admin/growth-autopilot.png" alt="" className="h-[72px] w-auto self-start object-contain" />
          <h2 className="text-[20px] font-bold leading-7 tracking-[-0.3px] text-[#303030]">Run your marketing on autopilot</h2>
          <Muted>Campaign Autopilot promotes your products across top channels, and keeps refining the strategy while you stay in control.</Muted>
          <div className="flex gap-2 pt-1">
            <Btn tone="primary" onClick={() => nav.go("autopilot")}>
              Get started
            </Btn>
            <Btn tone="gray">Learn more</Btn>
          </div>
        </div>
      ) : null}
      <Section
        title="Marketing performance"
        aside={
          <span className="flex gap-1.5">
            <Chip icon="Calendar" caret>
              Last 30 days
            </Chip>
            <Btn tone="plain" onClick={() => nav.go("attribution")}>
              View details
            </Btn>
          </span>
        }
      >
        <Card className="flex flex-col gap-2">
          <CardTitle dotted>Sales attributed to marketing</CardTitle>
          <p className="text-[18px] font-semibold text-[#303030]">
            {active ? "$4,812.30" : "$0.00"} <span className="text-[12px] font-normal text-[#616161]">{active ? "↑ 14%" : "—"}</span>
          </p>
          <LineChart
            series={active ? salesCurve.map((value) => value * 0.4) : flat}
            compare={active ? compareCurve.map((value) => value * 0.4) : undefined}
            ticks={active ? ["$0", "$500", "$1K"] : ["$0", "$5", "$10"]}
            labels={days}
            legend={["Oct 5 – Nov 4, 2026", "Sep 4 – Oct 4, 2026"]}
          />
        </Card>
        <Card className="flex flex-col gap-2">
          <CardTitle dotted>Sessions by traffic type</CardTitle>
          <div className="flex gap-4 text-[11px] text-[#616161]">
            <span className="flex flex-col">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#1aa7ec]" /> direct
              </span>
              <span className="font-semibold text-[#303030]">{active ? 1840 : 6}</span>
            </span>
            <span className="flex flex-col">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#7646f0]" /> organic
              </span>
              <span className="font-semibold text-[#303030]">{active ? 620 : 1}</span>
            </span>
          </div>
          <div className="flex h-8 gap-0.5 overflow-hidden rounded">
            <span className="bg-[#1aa7ec]" style={{ flex: active ? 1840 : 6 }} />
            <span className="bg-[#7646f0]" style={{ flex: active ? 620 : 1 }} />
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          <Card className="flex h-24 flex-col justify-between">
            <span className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1 font-semibold">
                <PIcon name="Store" size={16} /> Direct
              </span>
              <span className="text-[#616161]">{active ? "1,840 sessions" : "6 sessions"}</span>
            </span>
            <span className="text-[16px] font-semibold">{active ? "$3,120.40" : "$0.00"}</span>
          </Card>
          <Card className="flex h-24 flex-col justify-between">
            <span className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1 font-semibold">
                <span className="text-[13px] font-bold text-[#00809d]">b</span> Bing
              </span>
              <span className="text-[#616161]">{active ? "212 sessions" : "1 session"}</span>
            </span>
            <span className="text-[16px] font-semibold">{active ? "$410.00" : "$0.00"}</span>
          </Card>
        </div>
      </Section>
      <Section title="Campaign Autopilot">
        <Card className="flex items-center justify-between gap-3">
          <Muted>Connect channels to automatically promote your products with managed campaigns.</Muted>
          <Btn tone="gray" onClick={() => nav.go("autopilot")}>
            Get started
          </Btn>
        </Card>
      </Section>
      <Section title="Recent campaigns">
        <Card className="flex items-center justify-between gap-3">
          <Muted>
            <b className="font-semibold text-[#303030]">Create</b> campaigns to evaluate how marketing initiatives drive business goals.
          </Muted>
          <Btn tone="gray" onClick={() => nav.go("campaigns")}>
            Create campaign
          </Btn>
        </Card>
      </Section>
    </Shell>
  );
}

const attributionColumns = [
  "Traffic type",
  "Total sales",
  "Sessions",
  "Orders",
  "Conversion rate",
  "Ad spend",
  "ROAS",
  "CPA",
  "CAC",
  "Impressions",
  "Clicks",
  "CTR",
  "Average order value",
  "New customers",
  "Returning customers",
];

function Attribution({ state, nav }: Props) {
  const active = state.scenario === "active";
  const cells = (name: string, sales: string, sessions: string, orders: string) => [
    name,
    "Organic",
    sales,
    sessions,
    orders,
    active ? "2.1%" : "0",
    "—",
    "—",
    "—",
    "—",
    "—",
    "—",
    "—",
    "—",
    active ? "4" : "0",
    active ? "2" : "0",
  ];
  return (
    <Shell
      page="attribution"
      nav={nav}
      aside={
        <Chip caret onClick={() => undefined}>
          Performance
        </Chip>
      }
    >
      <div className="-mx-6 flex gap-1.5 overflow-x-auto px-6 [scrollbar-width:none]">
        <Chip icon="Calendar" caret>
          Last 30 days
        </Chip>
        <Chip icon="Calendar" caret>
          Sep 4 – Oct 4, 2026
        </Chip>
        <Chip icon="ChartVertical" caret>
          Last non-direct click
        </Chip>
        <Chip icon="Filter" caret>
          Marketing traffic
        </Chip>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Kpi label="Total sales" value={active ? "$410.00" : "$0.00"} points={active ? [1, 2, 2, 3, 2, 4, 3, 5] : undefined} />
        <Kpi label="Orders" value={active ? "4" : "0"} />
        <Kpi label="Average order value" value={active ? "$102.50" : "—"} />
        <Kpi label="Sessions" value={active ? "212" : "0"} />
      </div>
      {(["channels", "campaigns"] as const).map((kind) => (
        <Section key={kind} title={`Top performing marketing ${kind}`} aside={<Btn tone="plain">View all</Btn>}>
          <Table
            columns={[{ label: kind === "channels" ? "Marketing channel" : "Marketing campaign", width: 120 }, ...(kind === "campaigns" ? [{ label: "Marketing channel", width: 110 }] : []), ...attributionColumns.map((label) => ({ label, width: 96 }))]}
            rows={[
              kind === "channels"
                ? cells("Bing", active ? "$410.00" : "$0.00", active ? "212" : "1", active ? "4" : "0")
                : ["organic", ...cells("Bing", active ? "$410.00" : "$0.00", active ? "212" : "1", active ? "4" : "0")],
            ]}
          />
        </Section>
      ))}
    </Shell>
  );
}

function Autopilot({ nav }: Props) {
  return (
    <Shell page="autopilot" nav={nav}>
      <s-banner tone="warning" heading="Complete your store setup to use Autopilot">
        Autopilot can’t run campaigns yet. Complete these setup steps to continue: remove your store password.{" "}
        <s-link onClick={() => nav.ask("Help me remove my store password so Autopilot can run")}>Set up with Sidekick</s-link>
      </s-banner>
      <p className="px-1 text-[22px] leading-[1.25] tracking-[-0.4px] text-[#303030]">
        Autopilot is analyzing your store’s <b>catalog</b>, <b>pricing</b>, <b>profit margins</b>, and <b>sales</b> history to identify performance trends and uncover
        opportunities to grow.
      </p>
      <Section
        title={
          <span className="flex items-center gap-1.5">
            <PIcon name="Clock" size={18} /> Activity
          </span>
        }
      >
        <div className="flex flex-col gap-3 pl-3">
          <span className="text-[12px] text-[#616161]">Today</span>
          {[
            ["Analyzing your store’s catalogue and inventory", "9:55 AM", false],
            ["Autopilot is initializing", "9:55 AM", true],
          ].map(([label, time, live]) => (
            <div key={label as string} className="flex items-center gap-2.5 text-[12px] text-[#303030]">
              <span className={`size-2 rounded-full ${live ? "animate-pulse bg-[#29845a]" : "bg-[#303030]"}`} />
              <span className="flex-1">{label}</span>
              <span className="text-[#616161]">{time}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Configuration">
        <Card flush>
          <Row first icon="Globe" title="Regions" chevron={false} aside={<Badge>United States</Badge>} />
          <Row icon="Language" title="Languages" chevron={false} aside={<Badge>English</Badge>} />
          <div className="flex flex-wrap justify-end gap-1.5 border-t border-[#ebebeb] px-3 py-2">
            <Chip icon="Plus">Target return on ad spend</Chip>
            <Chip icon="Plus">Customer acquisition cost</Chip>
          </div>
          <Row icon="Lock" title="Permissions" chevron={false} aside={<Chip caret>Manage approved</Chip>} />
          <Row icon="Plus" title="Connect to a channel" chevron={false} />
        </Card>
      </Section>
    </Shell>
  );
}

function Campaigns({ nav }: Props) {
  return (
    <Shell page="campaigns" nav={nav} actions={[{ label: "Create campaign", tone: "primary" }]}>
      <div>
        <Chip>1 unassigned activity</Chip>
      </div>
      <Card flush>
        <TableSearch placeholder="Search campaigns" />
        <EmptyState
          bare
          art="/assets/admin/empty-campaigns.png"
          title="Centralize your campaign tracking"
          body="Create a campaign to evaluate how your marketing initiatives drive business goals. Capture online and offline touchpoints, add campaign activities from multiple marketing channels, and monitor results."
          cta="Create campaign"
          secondary="Learn more"
        />
      </Card>
    </Shell>
  );
}

/* Discounts and content */

function Discounts({ state, nav }: Props) {
  const active = state.scenario === "active";
  return (
    <Shell page="discounts" nav={nav} actions={[{ label: "Export", disabled: !active }, { label: "Create discount", tone: "primary" }]}>
      {active ? (
        <Table
          toolbar={<TableSearch placeholder="Search and filter" tabs={["All", "Active", "Scheduled"]} />}
          columns={[
            { label: "Title", width: 150 },
            { label: "Status", width: 80 },
            { label: "Method", width: 90 },
            { label: "Type", width: 140 },
            { label: "Used", width: 56, align: "end" },
          ]}
          rows={[
            ["WELCOME10", <Badge key="a" tone="success">Active</Badge>, "Code", "Amount off order", "38"],
            ["Headphones bundle", <Badge key="b">Expired</Badge>, "Automatic", "Buy X get Y", "112"],
            ["Free shipping over $75", <Badge key="c" tone="success">Active</Badge>, "Automatic", "Free shipping", "64"],
          ]}
        />
      ) : (
        <EmptyState
          art="/assets/admin/empty-discounts.png"
          title="Manage discounts and promotions"
          body={
            <>
              Add discount codes and automatic discounts that apply at checkout. You can also use discounts with <u>compare at prices</u>.
            </>
          }
          cta="Create discount"
          learn="discounts"
        />
      )}
    </Shell>
  );
}

function Metaobjects({ nav }: Props) {
  return (
    <Shell page="metaobjects" nav={nav} actions={[{ label: "Manage" }, { label: "Add definition", tone: "primary" }]}>
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Available on storefront", "0 entries"],
          ["Web pages", "0 entries"],
          ["Active", "2 entries"],
          ["Draft", "0 entries"],
        ].map(([label, value]) => (
          <Card key={label} className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold">{label}</span>
            <span className="text-[12px] text-[#616161]">{value}</span>
          </Card>
        ))}
      </div>
      <Card className="flex flex-col gap-2">
        <CardTitle>Recent entries</CardTitle>
        {["Delivery countries", "Shop Pay"].map((entry) => (
          <span key={entry} className="text-[12px] text-[#303030]">
            {entry} <span className="text-[#616161]">— Knowledge Base Facts</span>
          </span>
        ))}
        <button type="button" onClick={() => nav.go("knowledge-base")} className="self-start text-[12px] font-medium text-[#005bd3] hover:underline">
          View all 2 entries
        </button>
      </Card>
      <Card flush>
        <div className="flex items-center gap-1.5 border-b border-[#ebebeb] px-2 py-1.5">
          <Chip caret>Custom</Chip>
          <span className="flex flex-1 items-center gap-1 text-[12px] text-[#8a8a8a]">
            <PIcon name="Search" size={16} /> Searching in metaobject definitions…
          </span>
        </div>
        <EmptyState bare icon="Search" title="No definitions found" body="Try changing the filters or search term" />
      </Card>
    </Shell>
  );
}

function Files({ nav }: Props) {
  return (
    <Shell page="files" nav={nav} actions={[{ label: "New folder", icon: "Folder" }, { label: "Files", icon: "Plus", tone: "primary" }]}>
      <EmptyState art="/assets/admin/empty-files.png" title="Upload and manage your files" body="Files can be images, videos, documents, and more." secondary="Upload files" learn="files" />
    </Shell>
  );
}

function Menus({ nav }: Props) {
  return (
    <Shell page="menus" nav={nav} actions={[{ label: "Add menu", tone: "primary" }]}>
      <Table
        columns={[
          { label: "Menu", width: 140 },
          { label: "Menu items", width: 200 },
        ]}
        rows={[
          ["Main menu", "Home, Catalog, Contact"],
          ["Footer menu", "Search, Privacy Policy, Refund Policy"],
        ]}
      />
      <LearnMore topic="menus" />
    </Shell>
  );
}

function BlogPosts({ nav }: Props) {
  return (
    <Shell page="blog-posts" nav={nav} actions={[{ label: "Manage blogs" }, { label: "Add blog post", tone: "primary" }]}>
      <EmptyState
        art="/assets/admin/empty-files.png"
        title="Write a blog post"
        body="Blog posts are a great way to build a community around your products and your brand."
        cta="Create blog post"
        learn="blogs"
      />
    </Shell>
  );
}

/* Markets */

function Markets({ nav }: Props) {
  const [promo, setPromo] = useState(true);
  return (
    <Shell page="markets" nav={nav} actions={[{ label: "Graph view", icon: "Connect" }, { label: "Create market", tone: "primary" }]}>
      <Card flush>
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <span className="grid size-7 place-items-center rounded-lg text-[#4a4a4a] shadow-[0_0_0_1px_#e3e3e3]">
            <PIcon name="ChevronRight" size={16} />
          </span>
          <span className="flex-1">
            <SearchField placeholder="Search in all markets" />
          </span>
          <span className="grid size-7 place-items-center rounded-lg text-[#4a4a4a]">
            <PIcon name="Filter" size={16} />
          </span>
        </div>
        <Table
          columns={[
            { label: "Market ↕", width: 120 },
            { label: "Status", width: 72 },
            { label: "Includes", width: 120 },
            { label: "Customizations", width: 100 },
          ]}
          rows={[
            [
              <span key="m" className="flex items-center gap-1.5">
                <PIcon name="Globe" size={16} /> United States
              </span>,
              <Badge key="s" tone="success">
                Active
              </Badge>,
              <span key="i">🇺🇸 United States</span>,
              <PIcon key="c" name="Delivery" size={16} />,
            ],
          ]}
        />
        {promo ? (
          <div className="flex items-center gap-2 border-t border-[#ebebeb] bg-[#f4efff] px-3 py-2 text-[12px] font-medium text-[#5c2ed1]">
            <PIcon name="Sidekick" size={16} />
            <button type="button" onClick={() => nav.ask("Help me create an international market")} className="flex-1 text-left hover:underline">
              Create International Market
            </button>
            <button type="button" aria-label="Dismiss" onClick={() => setPromo(false)} className="text-[#616161]">
              <PIcon name="X" size={16} />
            </button>
          </div>
        ) : null}
      </Card>
      <LearnMore topic="markets" />
    </Shell>
  );
}

/* Finance */

function Finance({ state, nav }: Props) {
  const active = state.scenario === "active";
  return (
    <Shell page="finance" nav={nav} actions={[{ label: "Pay bills" }]} more={[{ label: "Documents" }]}>
      <Section title={<span className="flex items-center gap-1">Payout balance <PIcon name="Info" size={16} /></span>}>
        <Card className="flex items-start justify-between gap-3">
          <span className="flex flex-col gap-6">
            <span className="text-[14px] font-semibold">{active ? "$2,184.60" : "$0.00"}</span>
            <button type="button" onClick={() => nav.go("payouts")} className="text-left text-[12px] text-[#005bd3] hover:underline">
              View payouts
            </button>
          </span>
          <span className="flex w-32 flex-col gap-3 rounded-lg bg-[#f1f1f1] p-2 text-[11px]">
            <span>🇺🇸 USD</span>
            <span className="font-semibold">{active ? "$2,184.60" : "$0.00"}</span>
          </span>
        </Card>
      </Section>
      {active ? (
        <Section title="Recent payouts">
          <Table
            columns={[
              { label: "Date", width: 110 },
              { label: "Status", width: 90 },
              { label: "Amount", width: 90, align: "end" },
            ]}
            rows={[
              ["Today", <Badge key="a" tone="info">In transit</Badge>, "$2,184.60"],
              ["Nov 1, 2026", <Badge key="b" tone="success">Paid</Badge>, "$1,906.12"],
              ["Oct 29, 2026", <Badge key="c" tone="success">Paid</Badge>, "$2,422.80"],
            ]}
          />
        </Section>
      ) : (
        <Card className="flex flex-col items-center gap-2 py-5 text-center">
          <img src="/assets/admin/finance-start.png" alt="" className="h-24 w-auto" />
          <p className="text-[16px] font-semibold">Start getting paid</p>
          <Muted className="max-w-[300px]">
            Set up Shopify Payments, the highest-converting payment provider, and get a Shopify Balance account for payouts and business expenses
          </Muted>
          <Btn tone="primary" onClick={() => nav.go("payments")}>
            Activate Shopify Payments
          </Btn>
        </Card>
      )}
      <Section title="Taxes">
        <Card flush>
          <Row first title="Set up tax collection" onClick={() => nav.go("taxes")} />
        </Card>
      </Section>
      <Section title="Tools">
        <Card flush>
          <Row first title="Install Bill Pay" body="Schedule and pay bills to any vendor" chevron={false} onClick={() => nav.go("bill-pay")} />
        </Card>
      </Section>
      <p className="px-2 text-[11px] leading-[1.5] text-[#616161]">
        Shopify is a tech company, not a bank. Shopify partners with Stripe Payments Company for money transmission services and account services with funds held at Fifth
        Third Bank, Members FDIC. Shopify Credit and Shopify Balance Visa® Commercial Credit cards are powered by Stripe and issued by Celtic Bank pursuant to a license from
        Visa U.S.A. Inc.
      </p>
      <p className="px-2 text-[11px] text-[#616161]">
        Learn more about <u>Shopify Finance</u>
      </p>
    </Shell>
  );
}

/* Analytics */

function Analytics({ state, nav }: Props) {
  const active = state.scenario === "active";
  const breakdown = active
    ? [
        ["Gross sales", "$1,964.20"],
        ["Discounts", "-$121.70"],
        ["Sales reversals", "$0.00"],
        ["Net sales", "$1,842.50"],
        ["Shipping charges", "$84.00"],
        ["Return fees", "$0.00"],
        ["Taxes", "$152.01"],
        ["Total sales", "$2,078.51"],
      ]
    : ["Gross sales", "Discounts", "Sales reversals", "Net sales", "Shipping charges", "Return fees", "Taxes", "Total sales"].map((label) => [label, "$0.00"]);
  return (
    <Shell
      page="analytics"
      nav={nav}
      aside={<span className="truncate text-[12px] text-[#616161]">Last refreshed: 9:56 AM</span>}
      actions={[{ label: "New exploration", tone: "primary" }]}
      more={[{ label: "Try targets" }, { label: "Reports", onClick: () => nav.go("reports") }, { label: "Live View", onClick: () => nav.go("live-view") }]}
    >
      <s-banner tone="info">
        Beginning Sept 21, 2026, sessions and related metrics may shift as Shopify Analytics enables better visibility into real shopper activity. <s-link>Learn more</s-link>
      </s-banner>
      <div className="flex gap-1.5">
        <Chip icon="Calendar" caret>
          Today
        </Chip>
        <Chip icon="Calendar" caret>
          Nov 3, 2026
        </Chip>
        <Chip>USD $</Chip>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Kpi label="Gross sales" value={active ? "$1,964.20" : "$0.00"} delta={active ? "↑ 24%" : undefined} points={active ? [2, 3, 3, 5, 4, 6, 7, 8] : undefined} />
        <Kpi label="Returning customer rate" value={active ? "31%" : "—"} points={active ? [3, 3, 4, 3, 4, 5, 4, 5] : undefined} />
        <Kpi label="Orders fulfilled" value={active ? "9" : "0"} points={active ? [1, 2, 2, 3, 4, 3, 5, 6] : undefined} />
        <Kpi label="Orders" value={active ? "14" : "0"} delta={active ? "↓ 2%" : undefined} points={active ? [4, 5, 3, 6, 5, 4, 6, 5] : undefined} />
      </div>
      <Card className="flex flex-col gap-2">
        <CardTitle dotted>Total sales over time</CardTitle>
        <p className="text-[18px] font-semibold">{active ? "$2,078.51" : "$0.00"}</p>
        <LineChart
          series={active ? salesCurve : flat}
          compare={active ? compareCurve : undefined}
          ticks={active ? ["$0", "$1K", "$2K"] : ["$0", "$5", "$10"]}
          labels={hours}
          legend={["Nov 4, 2026", "Nov 3, 2026"]}
        />
      </Card>
      <Card className="flex flex-col gap-1">
        <CardTitle dotted>Total sales breakdown</CardTitle>
        {breakdown.map(([label, value], index) => (
          <div key={label} className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] ${index % 2 ? "bg-[#f7f7f7]" : ""}`}>
            <span className="text-[#005bd3]">{label}</span>
            <span className="flex gap-3 font-semibold">
              {value} <span className="font-normal text-[#8a8a8a]">—</span>
            </span>
          </div>
        ))}
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Card className="flex h-32 flex-col">
          <CardTitle dotted>Total sales by sales channel</CardTitle>
          <span className="m-auto text-[11px] text-[#616161]">{active ? "Online Store · $2,078.51" : "No data for this date range"}</span>
        </Card>
        <Card className="flex h-32 flex-col">
          <CardTitle dotted>Total sales by product</CardTitle>
          <span className="m-auto text-center text-[11px] text-[#616161]">{active ? "Cloud Headphones · $899.97" : "No data for this date range"}</span>
        </Card>
      </div>
      <Card className="flex flex-col gap-2">
        <CardTitle dotted>Conversion rate breakdown</CardTitle>
        <p className="text-[16px] font-semibold">{active ? "2.3%" : "—"}</p>
        <div className="grid grid-cols-4 gap-1 text-[11px]">
          {[
            ["Sessions", active ? "612" : "0"],
            ["Added to cart", active ? "8.2%" : "0%"],
            ["Reached checkout", active ? "3.9%" : "0%"],
            ["Completed checkout", active ? "2.3%" : "0%"],
          ].map(([label, value]) => (
            <span key={label} className="flex flex-col border-l border-[#ebebeb] pl-1.5">
              <span className="truncate text-[#616161]">{label}</span>
              <span className="font-semibold">{value}</span>
            </span>
          ))}
        </div>
      </Card>
    </Shell>
  );
}

function Reports({ nav }: Props) {
  return (
    <Shell page="reports" nav={nav} actions={[{ label: "New exploration", tone: "primary" }]}>
      <Table
        toolbar={<TableSearch placeholder="Search reports" tabs={["All", "Sales", "Customers"]} />}
        columns={[
          { label: "Name", width: 180 },
          { label: "Category", width: 96 },
          { label: "Last viewed", width: 90 },
        ]}
        rows={[
          ["Total sales over time", "Sales", "Today"],
          ["Sessions over time", "Behavior", "—"],
          ["Total sales by product", "Sales", "—"],
          ["Conversion rate over time", "Behavior", "—"],
          ["Customer cohort analysis", "Customers", "—"],
          ["Inventory remaining", "Inventory", "—"],
        ]}
      />
    </Shell>
  );
}

function LiveView({ state, nav }: Props) {
  const active = state.scenario === "active";
  return (
    <Shell page="live-view" nav={nav}>
      <Card className="relative h-40 overflow-hidden bg-gradient-to-b from-[#0b1b3a] to-[#0d2b55]">
        <span className="absolute inset-x-0 top-6 mx-auto size-28 rounded-full bg-[radial-gradient(circle_at_35%_35%,#3b7be0,#0d2b55)] shadow-[0_0_60px_rgba(59,123,224,0.4)]" />
        {active ? <span className="absolute left-[46%] top-16 size-2 animate-ping rounded-full bg-[#7dd3fc]" /> : null}
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Kpi label="Visitors right now" value={active ? "82" : "0"} />
        <Kpi label="Total sales" value={active ? "$1,842.50" : "$0.00"} />
        <Kpi label="Sessions" value={active ? "612" : "0"} />
        <Kpi label="Orders" value={active ? "14" : "0"} />
      </div>
    </Shell>
  );
}

/* Sales channels */

const themes = [
  { name: "Horizon", art: "/assets/admin/theme-horizon.png" },
  { name: "Tinker", art: "/assets/admin/theme-tinker.png" },
  { name: "Dwell", art: "/assets/admin/theme-dwell.png" },
];

function OnlineStore({ state, nav }: Props) {
  return (
    <Shell page="online-store" nav={nav} actions={[{ label: "Private", icon: "Lock" }, { label: "Preview store" }]} more={[{ label: "Pages", onClick: () => nav.go("online-store-pages") }, { label: "Preferences", onClick: () => nav.go("online-store-preferences") }]}>
      <div className="relative overflow-hidden rounded-xl shadow-[0_0_0_1px_#e3e3e3]">
        <div className="flex items-center justify-between bg-white px-3 py-1.5 text-[9px]">
          <span className="font-semibold">{state.storeName}</span>
          <span className="flex gap-2 text-[#616161]">
            <span>Home</span>
            <span>Catalog</span>
            <span>Contact</span>
          </span>
        </div>
        <img src="/assets/admin/store-hero.png" alt="" className="h-[210px] w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10 text-white">
          <span className="text-[15px] font-semibold">mystore.myshopify.com</span>
          <span className="text-[11px] text-white/80">Horizon · Added: Sunday at 3:57 pm</span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => nav.go("settings-general")}
              className="press flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[11px] backdrop-blur-sm hover:bg-white/30"
            >
              <PIcon name="Store" size={16} />
              <span className="truncate">Add business details to launch store</span>
              <PIcon name="ChevronRight" size={14} />
            </button>
            <Btn>Edit theme</Btn>
          </span>
        </div>
      </div>
      <Section
        title="Discover themes"
        aside={
          <span className="flex gap-1">
            <Btn tone="gray">Visit Theme Store</Btn>
            <Btn tone="gray" icon="Plus">
              New
            </Btn>
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-x-2 gap-y-3">
          {themes.map((theme) => (
            <div key={theme.name} className="flex flex-col gap-1.5">
              <img src={theme.art} alt="" className="aspect-square w-full rounded-lg object-cover object-top shadow-[0_0_0_1px_#e3e3e3]" />
              <span className="flex items-center justify-between">
                <span className="flex flex-col text-[12px]">
                  <span className="font-semibold">{theme.name}</span>
                  <span className="text-[#616161]">by Shopify</span>
                </span>
                <Btn tone="gray" onClick={() => nav.ask(`Should I use the ${theme.name} theme?`)}>
                  Add
                </Btn>
              </span>
            </div>
          ))}
        </div>
      </Section>
    </Shell>
  );
}

function OnlineStorePages({ nav }: Props) {
  return (
    <Shell page="online-store-pages" nav={nav} actions={[{ label: "Add page", tone: "primary" }]}>
      <Table
        select
        toolbar={<TableSearch placeholder="Search pages" tabs={["All", "Visible", "Hidden"]} />}
        columns={[
          { label: "Title", width: 150 },
          { label: "Visibility", width: 80 },
          { label: "Updated", width: 96 },
        ]}
        rows={[
          ["Contact", <Badge key="v" tone="success">Visible</Badge>, "Sunday"],
          ["Data Sharing Opt-out", <Badge key="w" tone="success">Visible</Badge>, "Sunday"],
        ]}
      />
    </Shell>
  );
}

function OnlineStorePreferences({ state, nav }: Props) {
  return (
    <Shell page="online-store-preferences" nav={nav} actions={[{ label: "Save", tone: "primary", disabled: true }]}>
      <Section title="Title and meta description">
        <Card className="flex flex-col gap-3">
          <s-text-field label="Homepage title" value={state.storeName} />
          <s-text-area label="Meta description" rows={3} placeholder="Enter a description to get a better ranking on search engines like Google" />
        </Card>
      </Section>
      <Section title="Password protection">
        <Card className="flex flex-col gap-3">
          <s-checkbox label="Restrict access to visitors with the password" checked />
          <s-text-field label="Password" value="ohsow" />
          <s-text-area label="Message for your visitors" rows={2} placeholder="Opening soon" />
        </Card>
      </Section>
    </Shell>
  );
}

const agentChannels = [
  { name: "ChatGPT", art: "/assets/admin/ch-chatgpt.png" },
  { name: "Meta AI and Muse", art: "/assets/admin/ch-meta.png" },
  { name: "Microsoft Copilot", art: "/assets/admin/ch-copilot.png" },
  { name: "Shop", art: "/assets/admin/ch-shop.png" },
  { name: "Other channels", art: "/assets/admin/ch-other.png" },
];

function Agentic({ nav }: Props) {
  const [managed, setManaged] = useState(true);
  return (
    <Shell page="agentic" nav={nav}>
      <p className="px-1 pt-2 text-[20px] font-semibold leading-[1.25] tracking-[-0.3px] text-[#303030]">
        Agentic Storefronts aren’t live — but your products may still be surfacing in AI agents.
      </p>
      <Section title="Get ready for Agentic Storefronts">
        <Card className="flex flex-col gap-1.5 p-1.5">
          <div className="flex items-start gap-2 rounded-lg bg-[#f7f7f7] p-2.5">
            <span className="text-[#29845a]">
              <PIcon name="CheckCircle" size={18} />
            </span>
            <span className="flex flex-col">
              <span className="text-[12px] font-semibold">Make sure catalog access is enabled</span>
              <span className="text-[12px] text-[#616161]">Allow your products to be searchable by AI agents</span>
            </span>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-[#f7f7f7] p-2.5">
            <span className="text-[#8a8a8a]">
              <PIcon name="CircleDashed" size={18} />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-[12px] font-semibold">Update policies</span>
              <span className="text-[12px] text-[#616161]">Update your policies so AI agents can read them</span>
            </span>
            <Btn tone="gray" onClick={() => nav.go("policies")}>
              Review
            </Btn>
          </div>
        </Card>
        <p className="px-1 text-center text-[11px] text-[#616161]">
          By selling on these sales channels, you agree to Agentic Storefronts <u>Supplemental Terms</u>
        </p>
      </Section>
      <Section title="Channels">
        <Card flush>
          <div className="flex items-center justify-between px-3 py-2.5 text-[12px] font-semibold">
            Allow Shopify to manage for me
            <Toggle on={managed} onChange={setManaged} label="Allow Shopify to manage for me" />
          </div>
          {agentChannels.map((channel) => (
            <div key={channel.name} className="flex items-center gap-2.5 border-t border-[#ebebeb] px-3 py-2 text-[12px]">
              <span className="size-1.5 rounded-full border border-[#8a8a8a]" />
              <img src={channel.art} alt="" className="size-5 rounded object-contain" />
              {channel.name}
            </div>
          ))}
        </Card>
      </Section>
      <Section title="Sources">
        <Card flush>
          <Row first title="Knowledge Base" chevron={false} aside={<span className="text-[12px] text-[#616161]">2 of 2 published</span>} onClick={() => nav.go("knowledge-base")} />
          <Row
            title="Shopify Catalog"
            chevron={false}
            aside={
              <Badge tone="warning" icon="AlertCircle">
                Ineligible
              </Badge>
            }
          />
        </Card>
      </Section>
      <LearnMore topic="Agentic Storefronts" />
    </Shell>
  );
}

function KnowledgeBase({ nav }: Props) {
  return (
    <Shell page="knowledge-base" nav={nav} actions={[{ label: "Add fact", tone: "primary" }]}>
      <Table
        columns={[
          { label: "Fact", width: 150 },
          { label: "Status", width: 80 },
          { label: "Type", width: 140 },
        ]}
        rows={[
          ["Delivery countries", <Badge key="a" tone="success">Published</Badge>, "Knowledge Base Facts"],
          ["Shop Pay", <Badge key="b" tone="success">Published</Badge>, "Knowledge Base Facts"],
        ]}
      />
      <LearnMore topic="the knowledge base" />
    </Shell>
  );
}

function PointOfSale({ state, nav }: Props) {
  const active = state.scenario === "active";
  const [recs, setRecs] = useState(["hardware", "news"]);
  return (
    <Shell page="pos" nav={nav} actions={[{ label: "Manage locations", onClick: () => nav.go("address") }]} more={[{ label: "Manage staff", onClick: () => nav.go("users") }, { label: "Devices", onClick: () => nav.go("pos-devices") }]}>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-b from-[#0a1229] to-[#071a3c] px-5 py-5 text-white">
        <span className="flex flex-col gap-1">
          <span className="text-[17px] font-semibold leading-tight">Sign in and start selling with POS</span>
          <span className="text-[11px] text-white/70">Scan QR code to download app</span>
        </span>
        <img src="/assets/admin/pos-qr.png" alt="" className="size-20 rounded-lg bg-[#1d2333] p-1.5" />
      </div>
      <s-banner tone="info" heading="Enjoy 3 months of POS Pro for $1/month">
        Add POS Pro and enjoy your first 3 months for $1/month per location
        <s-button slot="secondary-actions">Select a POS plan</s-button>
      </s-banner>
      <Section
        title="Analytics"
        aside={
          <Chip icon="Calendar" caret>
            Last 30 days
          </Chip>
        }
      >
        <Card className="flex flex-col gap-2">
          <CardTitle dotted>Gross sales</CardTitle>
          <p className="text-[16px] font-semibold">{active ? "$612.00" : "$0.00"}</p>
          <LineChart series={active ? salesCurve.map((value) => value / 5) : flat} ticks={active ? ["$0", "$250", "$500"] : ["$0", "$5", "$10"]} labels={days} height={110} />
        </Card>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Orders", active ? "6" : "0"],
            ["Discounts", "$0.00"],
            ["Returns", "$0.00"],
          ].map(([label, value]) => (
            <Card key={label} className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold">{label}</span>
              <span className="text-[12px]">{value}</span>
            </Card>
          ))}
        </div>
      </Section>
      {recs.length > 0 ? (
        <Card className="flex flex-col gap-2">
          <CardTitle>Recommended for you</CardTitle>
          {recs.map((rec) => {
            const hardware = rec === "hardware";
            return (
              <div key={rec} className="flex items-center gap-2.5 rounded-lg p-2 shadow-[0_0_0_1px_#ebebeb]">
                <img src={hardware ? "/assets/admin/pos-hardware.png" : "/assets/admin/pos-whats-new.png"} alt="" className="size-9 rounded object-cover" />
                <span className="flex min-w-0 flex-1 flex-col text-[12px]">
                  <span className="font-semibold">{hardware ? "Shop POS hardware" : "What’s new in Shopify POS 11.17"}</span>
                  <span className="truncate text-[#616161]">{hardware ? "Offer best-in-class checkouts at the counter and in store" : "Stay current on every Shopify POS release"}</span>
                </span>
                <Btn tone="gray" onClick={hardware ? () => nav.chip("Order hardware →") : undefined}>
                  {hardware ? "Shop hardware" : "See the latest"}
                </Btn>
                <button type="button" aria-label="Dismiss" onClick={() => setRecs((list) => list.filter((item) => item !== rec))} className="text-[#616161]">
                  <PIcon name="X" size={16} />
                </button>
              </div>
            );
          })}
        </Card>
      ) : null}
    </Shell>
  );
}

function Shop({ nav }: Props) {
  return (
    <Shell page="shop" nav={nav} more={[{ label: "Settings", onClick: () => nav.go("shop-settings") }]}>
      <Card className="flex flex-col gap-2">
        <img src="/assets/admin/shop-eligibility.png" alt="" className="h-14 w-auto self-end object-contain" />
        <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold">
          Your store isn’t currently eligible to sell on Shop <Badge tone="caution">Action required</Badge>
        </span>
        <Muted>Your store doesn’t meet the requirements to sell on Shop. Go to Settings for a closer look at Shop’s eligibility guidelines.</Muted>
        <span>
          <Btn tone="primary" onClick={() => nav.go("shop-settings")}>
            Review requirements
          </Btn>
        </span>
      </Card>
      <Card flush>
        <div className="flex items-center gap-3 overflow-x-auto px-3 py-2.5 [scrollbar-width:none]">
          <Chip icon="Calendar">30 days</Chip>
          {[
            ["Shop orders", "0"],
            ["Shop sales", "$0"],
            ["Referral orders", "0"],
            ["Referral sales", "$0"],
          ].map(([label, value]) => (
            <span key={label} className="flex shrink-0 flex-col text-[12px]">
              <span className="font-semibold">{label}</span>
              {value}
            </span>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col gap-2">
        <img src="/assets/admin/shop-posts.png" alt="" className="h-16 w-auto self-end rounded-lg object-contain" />
        <CardTitle>Extend your reach with Posts</CardTitle>
        <Muted>Sync videos from Instagram or create something new. Get your posts in front of shoppers already browsing to buy on your store and Shop’s feed.</Muted>
        <span className="flex gap-2">
          <Btn tone="gray">Connect apps</Btn>
          <Btn tone="primary" onClick={() => nav.go("shop-posts")}>
            Create post
          </Btn>
        </span>
      </Card>
      <Card flush>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="text-[13px] font-semibold">Store</span>
          <Badge tone="warning">Not eligible</Badge>
          <Badge>0 followers</Badge>
          <span className="ml-auto">
            <Btn tone="primary">Customize</Btn>
          </span>
        </div>
        <div className="flex h-28 items-end justify-center gap-3 bg-[#f7f7f7] px-4 pt-4">
          <span className="flex h-full w-32 flex-col items-center justify-center gap-1 rounded-t-2xl bg-white text-[10px] text-[#616161] shadow-[0_0_0_1px_#e3e3e3]">
            <PIcon name="Image" size={16} />
            <span className="font-semibold text-[#303030]">Customize header</span>
            Add a logo and cover photo
          </span>
          <span className="flex h-full w-32 flex-col items-center justify-center gap-1 rounded-t-2xl bg-white text-[10px] text-[#616161] shadow-[0_0_0_1px_#e3e3e3]">
            <PIcon name="PlusCircle" size={16} />
            Add collections
          </span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <span className="grid size-8 place-items-center rounded-lg text-[12px] font-semibold shadow-[0_0_0_1px_#e3e3e3]">MS</span>
          <span className="flex min-w-0 flex-1 flex-col text-[12px]">
            <span className="font-semibold">My Store</span>
            <span className="truncate text-[#616161]">Add description and contact information</span>
          </span>
          <Btn tone="gray">Edit details</Btn>
        </div>
      </Card>
      <Card className="flex items-center gap-3">
        <span className="flex flex-1 flex-col gap-1.5">
          <CardTitle>Marketing</CardTitle>
          <Muted>Drive more sales and repeat purchases with Shop Campaigns and post-purchase offers</Muted>
          <span className="flex gap-2">
            <Btn tone="plain" disabled>
              Create campaign
            </Btn>
            <Btn tone="gray" disabled>
              Create offer
            </Btn>
          </span>
        </span>
        <img src="/assets/admin/shop-marketing.png" alt="" className="h-16 w-auto object-contain" />
      </Card>
    </Shell>
  );
}

/* Generic empty pages for nav children the tour didn't capture */

type Generic = { title: string; body: string; cta?: string; secondary?: string; art?: string; icon?: PolarisIconName; learn?: string; actions?: BarAction[] };

const generic: Partial<Record<PreviewId, Generic>> = {
  drafts: {
    title: "Manually create orders and invoices",
    body: "Use draft orders to take orders over the phone, email invoices to customers, and collect payments.",
    cta: "Create draft order",
    art: "/assets/admin/empty-orders.png",
    learn: "draft orders",
  },
  "shipping-labels": {
    title: "Buy and print shipping labels",
    body: "Save on shipping with discounted rates, then print labels right from your orders.",
    cta: "Calculate rates",
    art: "/assets/admin/empty-orders.png",
    learn: "shipping labels",
  },
  "abandoned-checkouts": {
    title: "Abandoned checkouts will show here",
    body: "See when customers put an item in their cart but don’t check out. You can also email customers a link to their cart.",
    art: "/assets/admin/empty-orders.png",
    learn: "abandoned checkouts",
  },
  "purchase-orders": {
    title: "Manage your purchase orders",
    body: "Track and receive inventory ordered from suppliers.",
    cta: "Create purchase order",
    art: "/assets/admin/empty-files.png",
    learn: "purchase orders",
  },
  transfers: {
    title: "Move inventory between locations",
    body: "Move and track inventory between your business locations.",
    cta: "Create transfer",
    art: "/assets/admin/empty-files.png",
    learn: "transfers",
  },
  "gift-cards": {
    title: "Start selling gift cards",
    body: "Add gift card products to sell or create gift cards and send them directly to your customers.",
    cta: "Add gift card product",
    secondary: "Create gift card",
    art: "/assets/admin/empty-discounts.png",
    learn: "gift cards",
  },
  companies: {
    title: "Manage your B2B companies",
    body: "Add companies to sell wholesale with custom catalogs, payment terms, and pricing.",
    cta: "Add company",
    icon: "Organization",
    learn: "companies",
  },
  catalogs: {
    title: "Customize product availability and pricing",
    body: "Create catalogs to set product prices and availability for specific markets and B2B companies.",
    cta: "Create catalog",
    icon: "CatalogProduct",
    learn: "catalogs",
  },
  rollouts: {
    title: "Roll out changes to your markets",
    body: "Schedule and preview changes to markets, then publish them all at once.",
    cta: "Create rollout",
    icon: "Calendar",
    learn: "rollouts",
  },
  credit: {
    title: "Shopify Credit",
    body: "Earn cash back on top business expenses with a credit card made for Shopify merchants.",
    cta: "Check eligibility",
    art: "/assets/admin/finance-start.png",
    learn: "Shopify Credit",
  },
  payouts: {
    title: "Your payouts will show here",
    body: "Set up Shopify Payments to get paid. Payouts go to your bank or Shopify Balance account.",
    cta: "Activate Shopify Payments",
    art: "/assets/admin/finance-start.png",
    learn: "payouts",
  },
  "bill-pay": {
    title: "Pay bills to any vendor",
    body: "Schedule and pay bills by ACH, card, or check, all from Shopify.",
    cta: "Install Bill Pay",
    art: "/assets/admin/finance-start.png",
    learn: "Bill Pay",
  },
  "pos-devices": {
    title: "Manage your POS hardware",
    body: "Pair card readers, printers, and scanners with Shopify POS.",
    cta: "Shop hardware",
    art: "/assets/admin/pos-hardware.png",
    learn: "POS hardware",
  },
  "register-sessions": {
    title: "No register sessions yet",
    body: "Open a register in Shopify POS to track cash and payments by session.",
    icon: "CashDollar",
    learn: "register sessions",
  },
  "shop-posts": {
    title: "Create your first post",
    body: "Share videos and photos with shoppers browsing the Shop app.",
    cta: "Create post",
    secondary: "Connect apps",
    art: "/assets/admin/shop-posts.png",
  },
  "shop-advertising": {
    title: "Reach new shoppers on Shop",
    body: "Run Shop Campaigns and only pay when you get a new customer.",
    cta: "Create campaign",
    art: "/assets/admin/shop-marketing.png",
  },
  "shop-reviews": {
    title: "Collect product reviews",
    body: "Shoppers can review products they bought through Shop. Reviews show on your store page.",
    icon: "Star",
  },
  "shop-promise": {
    title: "Show delivery promises",
    body: "Display fast delivery badges on eligible products in Shop and at checkout.",
    cta: "Check eligibility",
    icon: "Delivery",
  },
};

function GenericPage({ page, nav }: { page: PreviewId; nav: PageNav }) {
  const spec = generic[page]!;
  return (
    <Shell page={page} nav={nav} actions={spec.actions}>
      <EmptyState art={spec.art} icon={spec.icon} title={spec.title} body={spec.body} cta={spec.cta} secondary={spec.secondary} learn={spec.learn} />
    </Shell>
  );
}

/* Products sub-pages with tables */

function Collections({ state, nav }: Props) {
  return (
    <Shell page="collections" nav={nav} actions={[{ label: "Create collection", tone: "primary" }]}>
      <Table
        select
        toolbar={<TableSearch placeholder="Search collections" />}
        columns={[
          { label: "Title", width: 140 },
          { label: "Products", width: 72, align: "end" },
          { label: "Product conditions", width: 150 },
        ]}
        rows={[
          ["Home page", String(state.products.length), "—"],
          ["New arrivals", "6", "Product date is in the last 30 days"],
        ]}
      />
    </Shell>
  );
}

function Inventory({ state, nav }: Props) {
  return (
    <Shell page="inventory" nav={nav} actions={[{ label: "Import" }]} more={[{ label: "Export" }]}>
      <Table
        select
        toolbar={<TableSearch placeholder="Search and filter" tabs={["All"]} />}
        columns={[
          { label: "Product", width: 170 },
          { label: "SKU", width: 70 },
          { label: "Unavailable", width: 80, align: "end" },
          { label: "Committed", width: 76, align: "end" },
          { label: "Available", width: 72, align: "end" },
          { label: "On hand", width: 64, align: "end" },
        ]}
        rows={state.products.slice(0, 10).map((product) => {
          const count = Number.parseInt(product.inventory, 10) || 0;
          return [
            <span key="p" className="flex items-center gap-2">
              <Thumb src={product.image} size={24} />
              <span className="truncate">{product.title}</span>
            </span>,
            <span key="s" className="text-[#8a8a8a]">
              No SKU
            </span>,
            "0",
            "0",
            String(count),
            String(count),
          ];
        })}
      />
    </Shell>
  );
}

function Segments({ nav }: Props) {
  return (
    <Shell page="segments" nav={nav} actions={[{ label: "Create segment", tone: "primary" }]}>
      <Table
        toolbar={<TableSearch placeholder="Search segments" />}
        columns={[
          { label: "Name", width: 220 },
          { label: "% of customers", width: 96, align: "end" },
        ]}
        rows={[
          ["Customers who have purchased at least once", "0%"],
          ["Email subscribers", "0%"],
          ["Abandoned checkouts in the last 30 days", "0%"],
          ["Customers who have purchased more than once", "0%"],
          ["Customers who haven’t purchased", "0%"],
        ]}
      />
    </Shell>
  );
}

/* Settings */

function SettingsHome({ state, nav }: Props) {
  return (
    <>
      <TopBar title="Settings" />
      <Body>
        <SearchField placeholder="Search settings" />
        <Card flush>
          <button type="button" onClick={() => nav.go("settings-general")} className="press flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#f7f7f7]">
            <span className="grid size-7 place-items-center rounded-md bg-[#36fba1] text-[11px] font-bold text-[#0b3b26]">MS</span>
            <span className="flex flex-1 flex-col text-[12px]">
              <span className="font-semibold">{state.storeName}</span>
              <span className="text-[#616161]">mystore.myshopify.com</span>
            </span>
            <PIcon name="MenuHorizontal" size={18} />
          </button>
          {settingsNav.map((row) => (
            <Row key={row.page} icon={row.icon} title={row.label} onClick={() => nav.go(row.page)} />
          ))}
        </Card>
      </Body>
    </>
  );
}

function SettingsShell({ page, nav, title, children, aside }: { page: PreviewId; nav: PageNav; title?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  const sections = sectionChoices(page);
  return (
    <>
      <TopBar
        title={page === "settings-general" ? "General" : pageMeta(page).title}
        sections={sections ?? undefined}
        current={page}
        onSection={(next) => nav.go(next)}
        aside={title ? undefined : aside}
      />
      <Body>
        {title ? <H1 aside={aside}>{title}</H1> : null}
        {children}
      </Body>
    </>
  );
}

function SettingsGeneral({ state, nav }: Props) {
  return (
    <SettingsShell
      page="settings-general"
      nav={nav}
      title={
        <>
          <span className="grid size-7 place-items-center rounded-md bg-[#ffd400] text-[11px] font-bold text-[#4f3f00]">MS</span>
          {state.storeName}
        </>
      }
      aside={<Badge>Establishing seller health</Badge>}
    >
      <Card flush>
        <div className="flex items-center gap-1.5 bg-[#f7f7f7] px-3 py-2.5 text-[12px] font-semibold">
          <PIcon name="Lock" size={16} /> Unlock good seller health to sell on <u>agentic and other channels</u>
        </div>
        <Row icon="CircleDashed" title="Add business details" onClick={() => nav.ask("Help me add my business details")} />
        <Row icon="CircleDashed" title="Fulfill your first order" onClick={() => nav.rail("orders")} />
      </Card>
      <Section title="Business details">
        <Muted className="-mt-2 px-1">Business entity used for financial products, markets, apps, and taxes in this shop</Muted>
        <Card flush>
          <Row first title={`${state.storeName} - entity`} body="United States" chevron={false} aside={<PIcon name="MenuHorizontal" size={18} />} />
        </Card>
      </Section>
      <Section title="Store contact details">
        <Card flush>
          <Row first icon="Store" title={state.storeName} body="Store email · No phone number" />
          <Row icon="Location" title="Store address" body="United States" onClick={() => nav.go("address")} />
        </Card>
      </Section>
      <Section title="Store defaults">
        <Card flush>
          <Row first title="Currency display" body="To manage the currencies customers see, go to Markets" chevron={false} aside={<Badge>US Dollar (USD $)</Badge>} />
        </Card>
        <Card className="flex flex-col gap-3">
          <s-select label="Backup Region" details="Determines settings for customers outside of your markets">
            <s-option value="us">United States</s-option>
          </s-select>
          <div className="grid grid-cols-2 gap-2">
            <s-select label="Unit system">
              <s-option value="imperial">Imperial system</s-option>
              <s-option value="metric">Metric system</s-option>
            </s-select>
            <s-select label="Default weight unit">
              <s-option value="lb">Pound (lb)</s-option>
              <s-option value="kg">Kilogram (kg)</s-option>
            </s-select>
          </div>
          <s-select label="Time zone" details="Sets the time for when orders and analytics are recorded">
            <s-option value="et">(GMT-05:00) Eastern Time (US & Canada)</s-option>
          </s-select>
        </Card>
      </Section>
    </SettingsShell>
  );
}

function Plan({ nav }: Props) {
  return (
    <SettingsShell page="plan" nav={nav}>
      <Section
        title="Plan details"
        aside={
          <span className="flex gap-1.5">
            <Btn tone="critical">Cancel plan</Btn>
            <Btn tone="gray">Change plan</Btn>
          </span>
        }
      >
        <Card className="flex flex-col gap-3">
          <span className="flex flex-col">
            <span className="text-[14px] font-semibold">
              Basic <span className="font-normal text-[#8a8a8a] line-through">$39</span>
            </span>
            <span className="text-[12px] text-[#616161]">$1 USD/month until February 3, 2027</span>
          </span>
          <div className="flex flex-col gap-1.5 rounded-lg bg-[#f7f7f7] p-3 text-[12px]">
            <span className="font-semibold">Card rates</span>
            <span>• 2.9% + $0.30 online</span>
            <span>• 2.6% + $0.10 in person</span>
            <span className="flex items-center gap-1">
              <PIcon name="Check" size={16} /> Up to 87% shipping discount
            </span>
          </div>
        </Card>
        <p className="px-1 text-[11px] text-[#616161]">
          View <u>terms of service</u> and <u>privacy policy</u>
        </p>
      </Section>
    </SettingsShell>
  );
}

function Shipping({ nav }: Props) {
  const [open, setOpen] = useState(true);
  return (
    <SettingsShell page="shipping" nav={nav}>
      <Section title="Shipping">
        <Card flush>
          <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
            <span className="flex flex-1 flex-col text-[12px]">
              <span className="font-semibold">Shipping options</span>
              <span className="text-[#616161]">Manage where you ship and what it costs</span>
            </span>
            <span className="text-[12px] text-[#616161]">1 market</span>
            <PIcon name={open ? "ChevronUp" : "ChevronDown"} size={16} />
          </button>
          {open ? (
            <div className="flex flex-col gap-2 px-3 pb-3">
              <div className="flex items-start gap-2 rounded-lg p-2.5 text-[12px] shadow-[0_0_0_1px_#e3e3e3]">
                <PIcon name="Info" size={16} />
                <span className="flex flex-1 flex-col">
                  <span className="font-semibold">Shipping has moved to Markets</span>
                  <span className="text-[#616161]">
                    Your shipping rates haven’t changed—just where you manage them. <u>Learn more</u>
                  </span>
                </span>
                <Btn tone="gray">Switch back</Btn>
              </div>
              <div className="overflow-hidden rounded-lg text-[12px] shadow-[0_0_0_1px_#e3e3e3]">
                <div className="grid grid-cols-[1fr_1.4fr] bg-[#f7f7f7] px-2.5 py-1.5 font-medium text-[#616161]">
                  <span>Market</span>
                  <span>Options</span>
                </div>
                <button type="button" onClick={() => nav.rail("markets")} className="grid w-full grid-cols-[1fr_1.4fr] items-center px-2.5 py-2 text-left hover:bg-[#f7f7f7]">
                  <span className="flex items-center gap-1.5">
                    <PIcon name="Globe" size={16} /> United States
                  </span>
                  <span className="flex gap-1">
                    <Badge>Standard</Badge>
                    <Badge>Express</Badge>
                  </span>
                </button>
              </div>
            </div>
          ) : null}
          <Row title="Estimated delivery dates" body="Show customers when they can expect their orders to arrive" chevron={false} aside={<span className="shrink-0 text-[12px] text-[#616161]">Automated dates</span>} />
          <Row title="Shipping labels" body="Buy discounted shipping labels and manage preferred carriers" chevron={false} aside={<Btn tone="gray" icon="Calculator">Calculate rates</Btn>} />
          <Row title="Packages" body="Set package sizes to get accurate shipping rates" chevron={false} aside={<span className="shrink-0 text-[12px] text-[#616161]">1 box</span>} />
          <Row title="Carrier accounts" body="Connect your existing carrier account to use your own rates" chevron={false} aside={<span className="text-[12px] text-[#616161]">None</span>} />
        </Card>
      </Section>
      <Section title="Additional delivery methods">
        <Card flush>
          <Row first icon="Delivery" title="Local delivery" aside={<Badge>Off</Badge>} />
          <Row icon="Store" title="Pickup in store" aside={<Badge>Off</Badge>} onClick={() => nav.go("address")} />
        </Card>
      </Section>
      <Section title="Documents" aside={<Chip caret>Create document</Chip>}>
        <Table
          columns={[
            { label: "Name", width: 150 },
            { label: "Date modified ↓", width: 110 },
          ]}
          rows={[
            ["Pick list", "Not modified"],
            ["Packing Slip", "Not modified"],
            ["Invoice", "Not modified"],
          ]}
        />
      </Section>
    </SettingsShell>
  );
}

function Domains({ nav }: Props) {
  return (
    <SettingsShell page="domain" nav={nav} aside={<Btn tone="gray">Buy new domain</Btn>}>
      <Card className="flex items-center gap-3">
        <span className="flex flex-1 flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold">
            Get a custom domain <Badge tone="info">Get $20 back</Badge>
          </span>
          <Muted>Give your store a branded URL that’s easy to find, trust, and remember.</Muted>
        </span>
      </Card>
      <Table
        columns={[
          { label: "Domain name", width: 170 },
          { label: "Status", width: 80 },
        ]}
        rows={[
          [
            <span key="d" className="flex flex-col">
              <span className="font-semibold">mystore.myshopify.com</span>
              <span className="text-[#616161]">Primary for Online Store</span>
            </span>,
            <Badge key="s" tone="success">
              Connected
            </Badge>,
          ],
        ]}
      />
      <Card className="flex flex-col gap-3">
        <s-text-field label="Connect existing domain" placeholder="example.com" name="domain" />
        <span>
          <Btn tone="primary" onClick={() => nav.ask("Help me connect a domain I already own")}>
            Next
          </Btn>
        </span>
      </Card>
    </SettingsShell>
  );
}

function Locations({ state, nav }: Props) {
  return (
    <SettingsShell page="address" nav={nav} aside={<Btn tone="primary">Add location</Btn>}>
      <Muted className="px-1">Manage the places you stock inventory, fulfill orders, and sell products.</Muted>
      <Card flush>
        <Row first icon="Location" title="Shop location" body="United States" aside={<Badge>Default</Badge>} />
      </Card>
      <Section title="Add your retail address">
        <Card className="flex flex-col gap-3">
          <s-text-field label="Location name" placeholder={`${state.storeName} retail`} name="location" />
          <s-text-field label="Address" placeholder="Street and number" name="address" autocomplete="address-line1" />
          <div className="grid grid-cols-2 gap-2">
            <s-text-field label="City" name="city" autocomplete="address-level2" />
            <s-text-field label="ZIP code" name="zip" autocomplete="postal-code" />
          </div>
          <s-checkbox label="Fulfill online orders from this location" checked />
          <span>
            <Btn tone="primary">Save</Btn>
          </span>
        </Card>
      </Section>
    </SettingsShell>
  );
}

type SettingsSpec = { intro?: string; sections: { title: string; rows: [string, string?, string?][] }[] };

const settingsSpecs: Partial<Record<PreviewId, SettingsSpec>> = {
  billing: {
    sections: [
      { title: "Billing profile", rows: [["Payment method", "No payment method added", "Add"], ["Billing currency", "US Dollar (USD $)"]] },
      { title: "Bills", rows: [["Upcoming bill", "$1.00 on Dec 3, 2026"], ["Past bills", "No bills yet"]] },
    ],
  },
  users: {
    sections: [
      { title: "Store owner", rows: [["My Store Admin", "Owner · Last active now"]] },
      { title: "Staff", rows: [["Add staff", "Give people access to your admin", "Add"]] },
      { title: "Security", rows: [["Two-step authentication", "Recommended for all staff"]] },
    ],
  },
  checkout: {
    sections: [
      { title: "Customize checkout", rows: [["Checkout and accounts editor", "Horizon theme", "Customize"]] },
      { title: "Customer contact method", rows: [["Email or phone", "Customers can check out with either"]] },
      { title: "Tipping", rows: [["Show tipping options at checkout", "Off"]] },
    ],
  },
  "customer-accounts": {
    sections: [
      { title: "Customer accounts", rows: [["Sign in links", "Show in online store header and checkout"], ["Self-serve returns", "Off"], ["Store credit", "Off"]] },
    ],
  },
  taxes: {
    intro: "Manage how your store charges sales tax and duties.",
    sections: [
      { title: "Manage sales tax collection", rows: [["United States", "Not collecting", "Collect sales tax"]] },
      { title: "Duties and import taxes", rows: [["Collect duties and import taxes", "Off"]] },
    ],
  },
  "settings-apps": {
    sections: [{ title: "Installed apps", rows: [["Messaging", "Shopify"]] }, { title: "App development", rows: [["Develop apps", "Build custom apps for your store"]] }],
  },
  "settings-channels": {
    sections: [{ title: "Installed sales channels", rows: [["Online Store"], ["Agentic"], ["Point of Sale"], ["Shop"]] }],
  },
  "customer-events": {
    intro: "Track and share customer behavior with pixels from apps and custom code.",
    sections: [{ title: "Pixels", rows: [["App pixels", "No app pixels"], ["Custom pixels", "None", "Add custom pixel"]] }],
  },
  "settings-notifications": {
    sections: [
      { title: "Notifications", rows: [["Customer notifications", "Order, shipping, and account emails"], ["Staff notifications", "New orders and alerts"], ["Webhooks", "None"]] },
    ],
  },
  metafields: {
    sections: [
      { title: "Metafield definitions", rows: [["Products", "0"], ["Variants", "0"], ["Collections", "0"], ["Customers", "0"], ["Orders", "0"]] },
      { title: "Metaobject definitions", rows: [["Knowledge Base Facts", "2 entries"]] },
    ],
  },
  languages: {
    sections: [{ title: "Published languages", rows: [["English", "Default"]] }, { title: "Unpublished languages", rows: [["Add a language", "Translate your store", "Add"]] }],
  },
  privacy: {
    sections: [
      { title: "Customer privacy", rows: [["Cookie banner", "Off"], ["Data sharing opt-out page", "Visible"], ["Privacy policy", "Not set"]] },
    ],
  },
  policies: {
    intro: "Policies are linked in the footer of checkout and can be added to your online store menu.",
    sections: [
      {
        title: "Written policies",
        rows: [["Return and refund policy", "No policy set"], ["Privacy policy", "Automated"], ["Terms of service", "No policy set"], ["Shipping policy", "No policy set"], ["Contact information", "Required"]],
      },
    ],
  },
  "pos-settings": {
    sections: [
      { title: "Point of Sale", rows: [["POS plan", "POS Lite"], ["Staff", "1 staff member"], ["Locations", "Shop location"], ["Receipts", "Default receipt"]] },
    ],
  },
  "shop-settings": {
    sections: [
      { title: "Eligibility", rows: [["Store requirements", "Action required"], ["Product catalog", "Under review"]] },
      { title: "Store page", rows: [["Logo and cover", "Not set"], ["Description", "Not set"]] },
    ],
  },
};

function SettingsGeneric({ page, nav }: { page: PreviewId; nav: PageNav }) {
  const spec = settingsSpecs[page]!;
  const inSettings = navFor(page).id === "settings";
  const content = (
    <>
      {spec.intro ? <Muted className="px-1">{spec.intro}</Muted> : null}
      {spec.sections.map((section) => (
        <Section key={section.title} title={section.title}>
          <Card flush>
            {section.rows.map(([label, value, action], index) => (
              <Row
                key={label}
                first={index === 0}
                title={label}
                body={value}
                chevron={!action}
                aside={action ? <Btn tone="gray">{action}</Btn> : undefined}
              />
            ))}
          </Card>
        </Section>
      ))}
    </>
  );
  return inSettings ? (
    <SettingsShell page={page} nav={nav}>
      {content}
    </SettingsShell>
  ) : (
    <Shell page={page} nav={nav}>
      {content}
    </Shell>
  );
}

/** Renders the admin page for `page`, or null when the preview column draws it itself. */
export function AdminPage({ page, state, nav }: { page: PreviewId; state: PrototypeState; nav: PageNav }) {
  const props = { state, nav };
  switch (page) {
    case "orders":
      return <Orders {...props} />;
    case "customers":
      return <Customers {...props} />;
    case "segments":
      return <Segments {...props} />;
    case "collections":
      return <Collections {...props} />;
    case "inventory":
      return <Inventory {...props} />;
    case "growth":
      return <Growth {...props} />;
    case "attribution":
      return <Attribution {...props} />;
    case "autopilot":
      return <Autopilot {...props} />;
    case "campaigns":
      return <Campaigns {...props} />;
    case "discounts":
      return <Discounts {...props} />;
    case "metaobjects":
      return <Metaobjects {...props} />;
    case "files":
      return <Files {...props} />;
    case "menus":
      return <Menus {...props} />;
    case "blog-posts":
      return <BlogPosts {...props} />;
    case "markets":
      return <Markets {...props} />;
    case "finance":
      return <Finance {...props} />;
    case "analytics":
      return <Analytics {...props} />;
    case "reports":
      return <Reports {...props} />;
    case "live-view":
      return <LiveView {...props} />;
    case "online-store":
      return <OnlineStore {...props} />;
    case "online-store-pages":
      return <OnlineStorePages {...props} />;
    case "online-store-preferences":
      return <OnlineStorePreferences {...props} />;
    case "agentic":
      return <Agentic {...props} />;
    case "knowledge-base":
      return <KnowledgeBase {...props} />;
    case "pos":
      return <PointOfSale {...props} />;
    case "shop":
      return <Shop {...props} />;
    case "settings":
      return <SettingsHome {...props} />;
    case "settings-general":
      return <SettingsGeneral {...props} />;
    case "plan":
      return <Plan {...props} />;
    case "shipping":
      return <Shipping {...props} />;
    case "domain":
      return <Domains {...props} />;
    case "address":
      return <Locations {...props} />;
    default:
      if (generic[page]) return <GenericPage page={page} nav={nav} />;
      if (settingsSpecs[page]) return <SettingsGeneric page={page} nav={nav} />;
      return null;
  }
}