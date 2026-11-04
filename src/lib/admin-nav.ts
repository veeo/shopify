import type { PolarisIconName } from "@/components/polaris-icons";

export const previewPages = [
  "home-setup",
  "home-active",
  "orders",
  "drafts",
  "shipping-labels",
  "abandoned-checkouts",
  "products",
  "product",
  "collections",
  "inventory",
  "purchase-orders",
  "transfers",
  "gift-cards",
  "customers",
  "segments",
  "companies",
  "growth",
  "attribution",
  "autopilot",
  "campaigns",
  "discounts",
  "metaobjects",
  "files",
  "menus",
  "blog-posts",
  "markets",
  "catalogs",
  "rollouts",
  "finance",
  "credit",
  "payouts",
  "bill-pay",
  "analytics",
  "reports",
  "live-view",
  "online-store",
  "online-store-pages",
  "online-store-preferences",
  "agentic",
  "knowledge-base",
  "pos",
  "pos-devices",
  "register-sessions",
  "pos-settings",
  "shop",
  "shop-posts",
  "shop-advertising",
  "shop-reviews",
  "shop-promise",
  "shop-settings",
  "settings",
  "settings-general",
  "plan",
  "billing",
  "users",
  "payments",
  "payments-setup",
  "checkout",
  "customer-accounts",
  "shipping",
  "taxes",
  "address",
  "settings-apps",
  "settings-channels",
  "domain",
  "customer-events",
  "settings-notifications",
  "metafields",
  "languages",
  "privacy",
  "policies",
] as const;

export type PreviewId = (typeof previewPages)[number];

export type NavChild = { label: string; page: PreviewId };
export type NavItem = {
  id: string;
  label: string;
  icon: PolarisIconName;
  page: PreviewId | "home";
  channel?: boolean;
  dot?: boolean;
  children?: NavChild[];
};

export const mainNav: NavItem[] = [
  { id: "home", label: "Home", icon: "Home", page: "home" },
  {
    id: "orders",
    label: "Orders",
    icon: "Order",
    page: "orders",
    children: [
      { label: "Drafts", page: "drafts" },
      { label: "Shipping labels", page: "shipping-labels" },
      { label: "Abandoned checkouts", page: "abandoned-checkouts" },
    ],
  },
  {
    id: "products",
    label: "Products",
    icon: "Product",
    page: "products",
    children: [
      { label: "Collections", page: "collections" },
      { label: "Inventory", page: "inventory" },
      { label: "Purchase orders", page: "purchase-orders" },
      { label: "Transfers", page: "transfers" },
      { label: "Gift cards", page: "gift-cards" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: "Person",
    page: "customers",
    children: [
      { label: "Segments", page: "segments" },
      { label: "Companies", page: "companies" },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    icon: "Gauge",
    page: "growth",
    children: [
      { label: "Attribution", page: "attribution" },
      { label: "Autopilot", page: "autopilot" },
      { label: "Campaigns", page: "campaigns" },
    ],
  },
  { id: "discounts", label: "Discounts", icon: "Discount", page: "discounts" },
  {
    id: "content",
    label: "Content",
    icon: "Content",
    page: "metaobjects",
    children: [
      { label: "Metaobjects", page: "metaobjects" },
      { label: "Files", page: "files" },
      { label: "Menus", page: "menus" },
      { label: "Blog posts", page: "blog-posts" },
    ],
  },
  {
    id: "markets",
    label: "Markets",
    icon: "Markets",
    page: "markets",
    children: [
      { label: "Catalogs", page: "catalogs" },
      { label: "Rollouts", page: "rollouts" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "Bank",
    page: "finance",
    children: [
      { label: "Credit", page: "credit" },
      { label: "Payouts", page: "payouts" },
      { label: "Bill Pay", page: "bill-pay" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "ChartVertical",
    page: "analytics",
    children: [
      { label: "Reports", page: "reports" },
      { label: "Live View", page: "live-view" },
    ],
  },
];

export const channelNav: NavItem[] = [
  {
    id: "online-store",
    label: "Online Store",
    icon: "Store",
    page: "online-store",
    channel: true,
    children: [
      { label: "Pages", page: "online-store-pages" },
      { label: "Preferences", page: "online-store-preferences" },
    ],
  },
  {
    id: "agentic",
    label: "Agentic",
    icon: "AgenticStorefront",
    page: "agentic",
    channel: true,
    children: [{ label: "Knowledge base", page: "knowledge-base" }],
  },
  {
    id: "pos",
    label: "Point of Sale",
    icon: "PointOfSale",
    page: "pos",
    channel: true,
    children: [
      { label: "Devices", page: "pos-devices" },
      { label: "Register sessions", page: "register-sessions" },
      { label: "Settings", page: "pos-settings" },
    ],
  },
  {
    id: "shop",
    label: "Shop",
    icon: "LogoShop",
    page: "shop",
    channel: true,
    dot: true,
    children: [
      { label: "Posts", page: "shop-posts" },
      { label: "Advertising", page: "shop-advertising" },
      { label: "Reviews", page: "shop-reviews" },
      { label: "Promise", page: "shop-promise" },
      { label: "Settings", page: "shop-settings" },
    ],
  },
];

export type SettingsRow = { label: string; icon: PolarisIconName; page: PreviewId };

export const settingsNav: SettingsRow[] = [
  { label: "Plan", icon: "Plan", page: "plan" },
  { label: "Billing", icon: "Receipt", page: "billing" },
  { label: "Users", icon: "Person", page: "users" },
  { label: "Payments", icon: "Payment", page: "payments" },
  { label: "Checkout", icon: "Cart", page: "checkout" },
  { label: "Customer accounts", icon: "PersonLock", page: "customer-accounts" },
  { label: "Shipping and delivery", icon: "Delivery", page: "shipping" },
  { label: "Taxes and duties", icon: "Tax", page: "taxes" },
  { label: "Locations", icon: "Location", page: "address" },
  { label: "Apps", icon: "Apps", page: "settings-apps" },
  { label: "Sales channels", icon: "Channels", page: "settings-channels" },
  { label: "Domains", icon: "Globe", page: "domain" },
  { label: "Customer events", icon: "Cursor", page: "customer-events" },
  { label: "Notifications", icon: "Notification", page: "settings-notifications" },
  { label: "Metafields and metaobjects", icon: "Metafields", page: "metafields" },
  { label: "Languages", icon: "Language", page: "languages" },
  { label: "Customer privacy", icon: "Lock", page: "privacy" },
  { label: "Policies", icon: "PageList", page: "policies" },
];

const allNav = [...mainNav, ...channelNav];

/** The top-level nav item (and child page, if any) that a preview page belongs to. */
export function navFor(page: PreviewId): { id: string; child: PreviewId | null } {
  if (page === "home-setup" || page === "home-active") return { id: "home", child: null };
  if (page === "product") return { id: "products", child: null };
  if (page === "settings" || page === "settings-general" || page === "payments-setup" || settingsNav.some((row) => row.page === page)) {
    return { id: "settings", child: null };
  }
  for (const item of allNav) {
    if (item.page === page && !item.children?.some((child) => child.page === page)) return { id: item.id, child: null };
    if (item.children?.some((child) => child.page === page)) return { id: item.id, child: page };
  }
  return { id: "home", child: null };
}

/** Title, icon, and parent for the panel's top bar. */
export function pageMeta(page: PreviewId): { title: string; icon: PolarisIconName; parent: NavItem | null } {
  for (const item of allNav) {
    const child = item.children?.find((entry) => entry.page === page);
    if (child) return { title: child.label, icon: item.icon, parent: item.page === page ? null : item };
    if (item.page === page) return { title: item.label, icon: item.icon, parent: null };
  }
  const row = settingsNav.find((entry) => entry.page === page);
  if (row) return { title: row.label, icon: row.icon, parent: null };
  return { title: "Home", icon: "Home", parent: null };
}

export function findNav(id: string) {
  return allNav.find((item) => item.id === id) ?? null;
}
