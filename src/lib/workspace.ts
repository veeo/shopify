import type { PreviewId } from "@/lib/admin-nav";
import { adminLayoutFromWide, isAdminWideLayout, type AdminLayoutMode } from "@/lib/shell-layout";

/** Filters, the open record, and the draft sitting on top of the admin page. */
export type ViewState = {
  query: string;
  tab: string;
  sort: string;
  recordId: string;
  draft: Record<string, string>;
  scroll: number;
};

/** Where one sidekick left the admin. */
export type Workspace = ViewState & {
  page: PreviewId;
  wide: boolean;
  /** Preferred docked layout; older saves only have `wide`. */
  layout?: AdminLayoutMode;
};

export type WorkspaceScenario = "setup" | "active";

export function emptyView(): ViewState {
  return { query: "", tab: "All", sort: "newest", recordId: "", draft: {}, scroll: 0 };
}

/** Opening one of these sidekicks shows its admin page in the wide panel. */
const expandedTools = new Set(["customers", "orders", "finance", "analytics"]);

function place(page: PreviewId, wide: boolean, extra?: Partial<ViewState>): Workspace {
  return { ...emptyView(), page, wide, ...extra };
}

/**
 * First visit for each sidekick. A saved workspace wins over this, except the
 * tool sidekicks, which always open their own page in the wide panel.
 * `custom` covers sidekicks the merchant creates.
 */
export const sidekickHomes: Record<string, Workspace> = {
  chief: place("home-active", false),
  sidekick: place("home-active", false),
  ideas: place("products", false, { query: "headphone" }),
  trends: place("analytics", false),
  campaigns: place("campaigns", false),
  grok: place("home-active", false),
  slack: place("orders", false, { tab: "Unfulfilled" }),
  claude: place("products", false, { tab: "Draft" }),
  duet: place("products", false, { tab: "Draft" }),
  gemini: place("analytics", false),
  muse: place("home-active", false),
  store: place("online-store", false),
  shop: place("shop", false),
  pos: place("pos", false),
  agentic: place("agentic", false),
  customers: place("customers", true),
  orders: place("orders", true, { tab: "Unfulfilled" }),
  finance: place("finance", true),
  analytics: place("analytics", true),
  custom: place("home-active", false),
};

export function homeFor(agentId: string, scenario: WorkspaceScenario = "active"): Workspace {
  if (scenario === "setup" && (agentId === "sidekick" || agentId === "chief")) {
    return place("home-setup", false);
  }
  const known = sidekickHomes[agentId];
  if (known) return { ...known, draft: { ...known.draft } };
  return { ...sidekickHomes.custom, draft: {} };
}

type Capturable = {
  preview: PreviewId;
  adminLayout: AdminLayoutMode;
  selectedProductId: string;
  products: { id: string; title: string; description: string; price: string; status: string }[];
  view: ViewState;
};

/** The admin as it is on screen right now, including a product form's fields. */
export function captureWorkspace(state: Capturable, scroll = state.view.scroll): Workspace {
  const product = state.preview === "product" ? state.products.find((item) => item.id === state.selectedProductId) : undefined;
  const draft = product
    ? {
        ...state.view.draft,
        title: product.title,
        description: product.description,
        price: product.price,
        status: product.status,
      }
    : { ...state.view.draft };
  return {
    page: state.preview,
    wide: isAdminWideLayout(state.adminLayout),
    layout: state.adminLayout,
    query: state.view.query,
    tab: state.view.tab || "All",
    sort: state.view.sort || "newest",
    recordId: state.preview === "product" ? state.selectedProductId : state.view.recordId,
    draft,
    scroll,
  };
}

type EditableProduct = { id: string; title: string; description: string; price: string; status: "Draft" | "Active" };

/** Copies a sidekick's saved place onto the live admin. First visits use `homeFor`. */
export function applyWorkspace<P extends EditableProduct>(
  state: Omit<Capturable, "products"> & { products: P[]; workspaces: Record<string, Workspace> },
  agentId: string,
  scenario: WorkspaceScenario,
) {
  const saved = state.workspaces[agentId];
  let workspace = saved ? { ...saved, draft: { ...saved.draft } } : homeFor(agentId, scenario);
  const home = sidekickHomes[agentId];
  if (home && expandedTools.has(agentId)) {
    workspace = workspace.page === home.page ? { ...workspace, wide: true } : { ...home, draft: { ...home.draft } };
  }
  state.workspaces = { ...state.workspaces, [agentId]: workspace };
  const productMissing = workspace.page === "product" && !state.products.some((item) => item.id === workspace.recordId);
  state.preview = productMissing ? "products" : workspace.page;
  state.adminLayout = productMissing
    ? "sidebar"
    : workspace.layout ?? adminLayoutFromWide(workspace.wide);
  state.view = {
    query: workspace.query,
    tab: workspace.tab || "All",
    sort: workspace.sort || "newest",
    recordId: productMissing ? "" : workspace.recordId,
    draft: { ...workspace.draft },
    scroll: workspace.scroll,
  };
  if (!productMissing && workspace.page === "product" && workspace.recordId) {
    state.selectedProductId = workspace.recordId;
    const { title, description, price, status } = workspace.draft;
    if (title !== undefined || description !== undefined || price !== undefined || status !== undefined) {
      state.products = state.products.map((product) =>
        product.id === workspace.recordId
          ? {
              ...product,
              title: title ?? product.title,
              description: description ?? product.description,
              price: price ?? product.price,
              status: status === "Active" || status === "Draft" ? status : product.status,
            }
          : product,
      );
    }
  }
}

let scrollReader: () => number | null = () => null;

/** The preview pane registers this so a sidekick switch saves the scroll that is on screen. */
export function bindScrollReader(reader: () => number | null) {
  scrollReader = reader;
  return () => {
    scrollReader = () => null;
  };
}

export function readLiveScroll() {
  try {
    return scrollReader();
  } catch {
    return null;
  }
}

const storageKey = "sidekick-workspaces-v2";

export type SavedProduct = EditableProduct & { tone: string; image?: string; inventory: string };

export type SavedWork = {
  scenario: WorkspaceScenario;
  selectedAgentId: string;
  seq: number;
  workspaces: Record<string, Workspace>;
  products: SavedProduct[];
  agents: unknown[];
  threads: Record<string, unknown[]>;
};

let rawCache: string | null | undefined;
let workCache: SavedWork | null = null;

function parseWork(raw: string | null): SavedWork | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedWork;
    if (!parsed || typeof parsed !== "object" || !parsed.workspaces) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Stable snapshot for useSyncExternalStore. Same storage text returns the same object. */
export function readWorkSnapshot(): SavedWork | null {
  const raw = window.localStorage.getItem(storageKey);
  if (raw === rawCache) return workCache;
  rawCache = raw;
  workCache = parseWork(raw);
  return workCache;
}

export function subscribeWork(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function emptyWork(): SavedWork | null {
  return null;
}

export function loadWork(): SavedWork | null {
  if (typeof window === "undefined") return null;
  return readWorkSnapshot();
}

export function saveWork(payload: SavedWork) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(payload);
    if (raw === rawCache) return;
    rawCache = raw;
    workCache = payload;
    window.localStorage.setItem(storageKey, raw);
  } catch {
    // A full disk should not block the admin.
  }
}

/** Pages that share one search, so opening a record does not throw away the list filter. */
export function sameDesk(a: PreviewId, b: PreviewId) {
  const groups: PreviewId[][] = [
    ["products", "product"],
    ["orders", "drafts", "shipping-labels", "abandoned-checkouts"],
    ["customers", "segments", "companies"],
    ["online-store", "online-store-pages", "online-store-preferences"],
  ];
  return groups.some((group) => group.includes(a) && group.includes(b));
}
