export const previewPages = [
  "home-setup",
  "home-active",
  "payments",
  "payments-setup",
  "products",
  "product",
  "inbox",
  "notifications",
  "customers",
  "marketing",
  "analytics",
  "finance",
  "content",
  "online-store",
  "email",
  "settings",
  "theme",
  "domain",
  "shipping",
  "address",
  "pos",
] as const;

export type PreviewId = (typeof previewPages)[number];

export const businessTypes = ["individual", "business", "nonprofit"] as const;
export type BusinessType = (typeof businessTypes)[number];

export type AgentGroup = "favorites" | "teams" | "channels" | "tools" | "hidden";

export type OrbId =
  | "sidekick"
  | "chief"
  | "ideas"
  | "trends"
  | "slack"
  | "grok"
  | "muse"
  | "store"
  | "agentic"
  | "customers"
  | "orders"
  | "custom";

export type Agent = {
  id: string;
  name: string;
  group: AgentGroup;
  preview: string;
  topic: string;
  placeholder: string;
  orb: OrbId;
  unread: number;
  installed: boolean;
  persona: string;
};

export type Chip = { label: string; tone: "secondary" | "primary" };

export type Block =
  | { id: string; type: "text"; role: "user" | "assistant"; text: string }
  | { id: string; type: "steps" }
  | { id: string; type: "sellers" }
  | { id: string; type: "chips"; chips: Chip[] }
  | { id: string; type: "purpose" }
  | { id: string; type: "create" };

export type ProductTone =
  | "coral"
  | "blue"
  | "lamp"
  | "lilac"
  | "headphones"
  | "mint"
  | "sand"
  | "teal"
  | "violet"
  | "navy"
  | "amber"
  | "aqua";

export type Product = {
  id: string;
  title: string;
  price: string;
  status: "Draft" | "Active";
  tone: ProductTone;
  image?: string;
  description: string;
  inventory: string;
};

export type Scenario = "setup" | "active";

export type Effect =
  | { type: "navigate"; page: PreviewId; wide?: boolean }
  | { type: "complete-step"; step: number }
  | { type: "business-type"; value: BusinessType }
  | { type: "add-product"; title: string; price: string; description?: string }
  | { type: "add-sidekick"; id: string }
  | { type: "artifact"; name: "payments-plan" | "best-sellers" }
  | { type: "purpose-mode" };

export type PrototypeState = {
  signedIn: boolean;
  storeName: string;
  scenario: Scenario;
  agents: Agent[];
  selectedAgentId: string;
  threads: Record<string, Block[]>;
  preview: PreviewId;
  previewWide: boolean;
  mode: "thread" | "add";
  purposes: string[];
  chiefPhase: "absent" | "purpose" | "working";
  businessType: BusinessType;
  paymentsStep: "type" | "identity" | "done";
  completedSteps: number[];
  identity: { first: string; last: string };
  products: Product[];
  selectedProductId: string;
  searchOpen: boolean;
  search: string;
  experimentsOpen: boolean;
  motion: boolean;
  seq: number;
};

export const setupChips: Chip[] = [
  { label: "Review payments", tone: "secondary" },
  { label: "Choose a theme", tone: "secondary" },
  { label: "Set up domain", tone: "secondary" },
  { label: "Review shipping rates", tone: "secondary" },
  { label: "Add retail address", tone: "secondary" },
  { label: "Order POS hardware", tone: "secondary" },
];

export const sidekickHello =
  "I'm Sidekick.\n\nYour AI assistant for getting your store ready to sell. I can walk you through setup, answer questions, and help you take action — right here. What would you like to tackle first?";

export const paymentsReply =
  "For your US store, Shopify Payments setup breaks down into four main parts, it’ll take you only but 10 minutes.";

export const paymentSteps = [
  {
    n: 1,
    title: "Business details",
    body: "Choose your business type and enter the requested business information.",
    time: "2 mins",
  },
  {
    n: 2,
    title: "Identity verification",
    body: "Add your personal details and provide identification if requested.",
    time: "4 mins",
  },
  {
    n: 3,
    title: "Account security",
    body: "Turn on two-step authentication to protect your account.",
    time: "2 mins",
  },
  {
    n: 4,
    title: "Payout account",
    body: "Connect the bank account where you want to receive your money.",
    time: "2 mins",
  },
] as const;

export const purposes = [
  {
    id: "priorities",
    title: "Clarify priorities",
    body: "Help surface the most important work and keep the team aligned on what matters most.",
  },
  {
    id: "decisions",
    title: "Keep decisions moving",
    body: "Help summarize context, capture next steps, and keep blockers from slowing things down.",
  },
  {
    id: "noise",
    title: "Reduce noise",
    body: "Help filter out low-priority requests, repetitive questions, and distractions that pull you away from the work.",
  },
  {
    id: "meetings",
    title: "Prepare for meetings",
    body: "Help gather context, draft agendas, and make sure the right information is ready before a meeting starts.",
  },
  {
    id: "followups",
    title: "Follow up on commitments",
    body: "Help track action items, remind owners, and keep progress visible so nothing falls through the cracks.",
  },
] as const;

export const sellers = [
  {
    title: "Cloud Headphones",
    meta: "$64,800 · 342 orders",
    advice: "Test a carrying-case bundle. Carry the offer through email and agentic ads.",
    image: "/assets/headphones.webp",
  },
  {
    title: "Studio Desk Lamp",
    meta: "$38,400 · 216 orders",
    advice: "Make delivery and warranty clear. Match the message across paid channels.",
    image: "/assets/lamp.webp",
  },
] as const;

const persona = {
  sidekick:
    "You are Sidekick, Shopify's setup assistant for a brand-new merchant. Be concrete, short, and ready to take action in the admin preview. When the merchant wants to review payments, use this wording: \"" +
    paymentsReply +
    "\" and call showArtifact payments-plan plus navigatePreview payments. When they want to set up Shopify Payments, navigate to payments-setup with wide true. Offer the setup tasks: payments, theme, domain, shipping, retail address, POS.",
  chief:
    "You are the merchant's Chief of Staff inside Shopify. You turn a busy week into priorities. You already know this week: $184,600 in sales, 1,284 orders, 2.8% conversion. Sales are up 9%; orders are up 12%. Average order value fell 2.7% to $144. Best sellers: Cloud Headphones ($64,800, 342 orders) and Studio Desk Lamp ($38,400, 216 orders). When asked for best sellers, call showArtifact best-sellers and navigatePreview home-active.",
  ideas:
    "You are Product ideas, a Shopify agent that turns store signals into product concepts. Suggest small, testable assortments. You can add a product with the addProduct tool.",
  trends:
    "You are Trends. You watch what shoppers are searching for. Gift sets are picking up this week. Keep answers to a few sentences and offer one action.",
  slack:
    "You are Slackbot, connected to the merchant's Slack. Summarize team chatter and draft updates. You tightened the welcome email copy.",
  grok:
    "You are Grok bot, connected from X. Shoppers on X keep asking for smaller sizes. Be direct and curious.",
  muse:
    "You are Muse, a creative partner. Offer directions, names, and campaign angles. Stay concrete.",
  store:
    "You are the Online store agent. You care about merchandising, delivery promises, and theme content. The lamp page needs clearer delivery times.",
  agentic:
    "You are Agentic storefronts. You watch agent-driven shopping. The lunch rush is pushing delivery times up.",
  customers:
    "You are the Customers agent. Repeat buyers want a loyalty perk. Speak in customer language, not jargon.",
  orders:
    "You are the Orders agent. Two orders still need tracking updates. Be operational and specific.",
  custom: "You are a custom Sidekick the merchant just created. Help them make progress in the Shopify admin.",
};

function agent(
  partial: Omit<Agent, "persona" | "installed" | "unread"> & { unread?: number; installed?: boolean },
): Agent {
  return {
    unread: partial.unread ?? 0,
    installed: partial.installed ?? false,
    persona: persona[partial.orb === "custom" ? "custom" : partial.id as keyof typeof persona] ?? persona.custom,
    ...partial,
  };
}

export const catalog: Agent[] = [
  agent({
    id: "chief",
    name: "Chief of staff",
    group: "favorites",
    preview: "Setting agent purpose and direction",
    topic: "Set purpose",
    placeholder: "Ask your chief of staff…",
    orb: "chief",
  }),
  agent({
    id: "ideas",
    name: "Product ideas",
    group: "favorites",
    preview: "A starter bundle could work for first-time buyers.",
    topic: "New assortment",
    placeholder: "Ask Product ideas…",
    orb: "ideas",
  }),
  agent({
    id: "trends",
    name: "Trends",
    group: "favorites",
    preview: "Searches for gift sets are picking up this week.",
    topic: "This week",
    placeholder: "Ask Trends…",
    orb: "trends",
  }),
  agent({
    id: "grok",
    name: "Grok bot",
    group: "teams",
    preview: "Shoppers on X keep asking for smaller sizes.",
    topic: "From X",
    placeholder: "Ask Grok bot…",
    orb: "grok",
  }),
  agent({
    id: "slack",
    name: "Slackbot",
    group: "teams",
    preview: "I tightened the copy for your welcome email.",
    topic: "Team updates",
    placeholder: "Ask Slackbot…",
    orb: "slack",
  }),
  agent({
    id: "muse",
    name: "Muse",
    group: "teams",
    preview: "A quieter campaign could carry the lamp.",
    topic: "Directions",
    placeholder: "Ask Muse…",
    orb: "muse",
  }),
  agent({
    id: "store",
    name: "Online store",
    group: "channels",
    preview: "Let’s clarify delivery times on the lamp page.",
    topic: "Storefront",
    placeholder: "Ask Online store…",
    orb: "store",
  }),
  agent({
    id: "agentic",
    name: "Agentic storefronts",
    group: "channels",
    preview: "The lunch rush is pushing delivery times up.",
    topic: "Agent traffic",
    placeholder: "Ask Agentic storefronts…",
    orb: "agentic",
  }),
  agent({
    id: "customers",
    name: "Customers",
    group: "tools",
    preview: "Repeat buyers are asking for a loyalty perk.",
    topic: "Buyers",
    placeholder: "Ask Customers…",
    orb: "customers",
  }),
  agent({
    id: "orders",
    name: "Orders",
    group: "tools",
    preview: "Two orders still need tracking updates.",
    topic: "Fulfillment",
    placeholder: "Ask Orders…",
    orb: "orders",
    unread: 1,
  }),
];

const sidekick = agent({
  id: "sidekick",
  name: "Sidekick",
  group: "favorites",
  preview: "Lets get started",
  topic: "Get started",
  placeholder: "Ask Sidekick…",
  orb: "sidekick",
  installed: true,
});

export const seedProducts: Product[] = [
  {
    id: "earbuds",
    title: "Wireless Earbuds Case",
    price: "29.00",
    status: "Draft",
    tone: "coral",
    image: "/assets/products/wireless-earbuds-case.webp",
    description:
      "Keep your wireless earbuds together with a case for everyday storage. At home, at work, or on the go, give your earbuds a dedicated place between listening sessions.",
    inventory: "48 in stock",
  },
  {
    id: "bank",
    title: "USB-C Power Bank",
    price: "49.00",
    status: "Draft",
    tone: "blue",
    image: "/assets/products/usb-c-power-bank.webp",
    description: "A compact 10,000 mAh power bank with a single USB-C cable for phones and earbuds.",
    inventory: "30 in stock",
  },
  {
    id: "lamp",
    title: "Desk Lamp",
    price: "89.00",
    status: "Draft",
    tone: "lamp",
    image: "/assets/products/desk-lamp.webp",
    description: "A matte task lamp with a warm beam. Delivery and warranty should stay visible on the product page.",
    inventory: "18 in stock",
  },
  {
    id: "case",
    title: "Phone Case",
    price: "24.00",
    status: "Draft",
    tone: "lilac",
    image: "/assets/products/phone-case.webp",
    description: "A slim case in a soft lilac. MagSafe compatible.",
    inventory: "64 in stock",
  },
  {
    id: "headphones",
    title: "Studio ANC Headphones",
    price: "249.00",
    status: "Draft",
    tone: "headphones",
    image: "/assets/products/studio-anc-headphones.webp",
    description: "Over-ear headphones with a carrying case. The bundle is the best seller this month.",
    inventory: "22 in stock",
  },
  {
    id: "mouse",
    title: "Wireless Mouse",
    price: "39.00",
    status: "Draft",
    tone: "mint",
    image: "/assets/products/wireless-mouse.webp",
    description: "A quiet wireless mouse for the desk set.",
    inventory: "40 in stock",
  },
  {
    id: "charger",
    title: "Portable Charger",
    price: "59.00",
    status: "Draft",
    tone: "sand",
    image: "/assets/products/portable-charger.webp",
    description: "Pocket charger for travel days.",
    inventory: "27 in stock",
  },
  {
    id: "fan",
    title: "Desk Fan",
    price: "69.00",
    status: "Draft",
    tone: "teal",
    image: "/assets/products/desk-fan.webp",
    description: "A small quiet fan for the studio desk.",
    inventory: "15 in stock",
  },
  {
    id: "adapter",
    title: "Travel Adapter",
    price: "18.00",
    status: "Draft",
    tone: "violet",
    image: "/assets/products/travel-adapter.webp",
    description: "A universal adapter that folds flat.",
    inventory: "80 in stock",
  },
  {
    id: "stand",
    title: "Tablet Stand",
    price: "32.00",
    status: "Draft",
    tone: "navy",
    image: "/assets/products/tablet-stand.webp",
    description: "An aluminum stand for checkout or the kitchen counter.",
    inventory: "36 in stock",
  },
  {
    id: "speaker",
    title: "Mini Speaker",
    price: "45.00",
    status: "Draft",
    tone: "amber",
    image: "/assets/products/mini-speaker.webp",
    description: "A pocket speaker with a warm finish.",
    inventory: "21 in stock",
  },
  {
    id: "pad",
    title: "Wireless Charging Pad",
    price: "38.00",
    status: "Draft",
    tone: "aqua",
    image: "/assets/products/wireless-charging-pad.webp",
    description: "A low charging pad for the nightstand.",
    inventory: "44 in stock",
  },
  {
    id: "laptop-stand",
    title: "Laptop Stand",
    price: "54.00",
    status: "Draft",
    tone: "navy",
    image: "/assets/products/laptop-stand.webp",
    description: "A folding aluminum stand that lifts the screen to eye level.",
    inventory: "26 in stock",
  },
  {
    id: "cables",
    title: "Cable Organizer",
    price: "14.00",
    status: "Draft",
    tone: "mint",
    image: "/assets/products/cable-organizer.webp",
    description: "A silicone clip that keeps five cables in place on the desk.",
    inventory: "90 in stock",
  },
  {
    id: "ring",
    title: "Phone Ring Holder",
    price: "12.00",
    status: "Draft",
    tone: "lilac",
    image: "/assets/products/phone-ring-holder.webp",
    description: "A ring grip that doubles as a kickstand.",
    inventory: "120 in stock",
  },
  {
    id: "socket",
    title: "Pop Socket",
    price: "15.00",
    status: "Draft",
    tone: "amber",
    image: "/assets/products/pop-socket.webp",
    description: "A collapsible grip in sunny yellow.",
    inventory: "75 in stock",
  },
];

function id(state: PrototypeState) {
  state.seq += 1;
  return `b${state.seq}`;
}

function push(state: PrototypeState, agentId: string, block: Block) {
  state.threads[agentId] = [...(state.threads[agentId] ?? []), block];
}

function patchAgent(state: PrototypeState, agentId: string, patch: Partial<Agent>) {
  state.agents = state.agents.map((item) => (item.id === agentId ? { ...item, ...patch } : item));
}

export function setupState(storeName = "My Store"): PrototypeState {
  const kick = { ...sidekick, installed: true };
  return {
    signedIn: false,
    storeName,
    scenario: "setup",
    agents: [kick],
    selectedAgentId: "sidekick",
    threads: {
      sidekick: [
        { id: "hello", type: "text", role: "assistant", text: sidekickHello },
        { id: "hello-chips", type: "chips", chips: setupChips },
      ],
    },
    preview: "home-setup",
    previewWide: false,
    mode: "thread",
    purposes: ["priorities", "decisions", "noise"],
    chiefPhase: "absent",
    businessType: "individual",
    paymentsStep: "type",
    completedSteps: [],
    identity: { first: "", last: "" },
    products: seedProducts.map((product) => ({ ...product })),
    selectedProductId: "earbuds",
    searchOpen: false,
    search: "",
    experimentsOpen: false,
    motion: true,
    seq: 10,
  };
}

function activeThread(agentId: string): Block[] {
  if (agentId === "chief") {
    return [
      {
        id: "c1",
        type: "text",
        role: "assistant",
        text: "This week: $184,600 in sales, 1,284 orders and 2.8% conversion. Sales are up 9%; orders are up 12%.",
      },
      { id: "c2", type: "text", role: "user", text: "Why are sales growing slower than orders?" },
      {
        id: "c3",
        type: "text",
        role: "assistant",
        text: "Average order value fell 2.7% to $144. I’d check product mix and discounts before increasing spend.",
      },
      { id: "c4", type: "text", role: "user", text: "Show me our two best sellers. What should we improve?" },
      { id: "c5", type: "sellers" },
      {
        id: "c6",
        type: "chips",
        chips: [
          { label: "Review in more detail", tone: "secondary" },
          { label: "Confirm changes", tone: "primary" },
        ],
      },
    ];
  }
  const item = catalog.find((agent) => agent.id === agentId);
  return [
    {
      id: `${agentId}-intro`,
      type: "text",
      role: "assistant",
      text: item?.preview ?? "Ready when you are.",
    },
  ];
}

export function activeState(storeName = "My Store"): PrototypeState {
  const base = setupState(storeName);
  const installed = catalog.map((item) => ({
    ...item,
    installed: true,
    preview: item.id === "chief" ? "Improving sales compared to orders" : item.preview,
    topic: item.id === "chief" ? "Improve sales" : item.topic,
  }));
  const threads: Record<string, Block[]> = { sidekick: base.threads.sidekick };
  for (const item of installed) threads[item.id] = activeThread(item.id);
  return {
    ...base,
    signedIn: true,
    scenario: "active",
    agents: installed,
    selectedAgentId: "chief",
    threads,
    preview: "home-active",
    chiefPhase: "working",
    previewWide: false,
  };
}

export function visibleAgents(state: PrototypeState) {
  const query = state.search.trim().toLowerCase();
  return state.agents.filter((item) => item.installed && (!query || item.name.toLowerCase().includes(query)));
}

function ensureInstalled(state: PrototypeState, sourceId: string) {
  const existing = state.agents.find((item) => item.id === sourceId);
  if (existing?.installed) return existing;
  const source = catalog.find((item) => item.id === sourceId);
  if (!source) return null;
  const next = { ...source, installed: true };
  if (existing) {
    state.agents = state.agents.map((item) => (item.id === sourceId ? next : item));
  } else {
    state.agents = [...state.agents, next];
  }
  if (!state.threads[sourceId]) state.threads[sourceId] = [];
  return next;
}

export function applyEffects(state: PrototypeState, effects: Effect[]) {
  for (const effect of effects) {
    if (effect.type === "navigate") {
      state.preview = effect.page;
      state.previewWide = effect.wide ?? effect.page === "payments-setup";
    } else if (effect.type === "complete-step") {
      if (!state.completedSteps.includes(effect.step)) state.completedSteps = [...state.completedSteps, effect.step];
    } else if (effect.type === "business-type") {
      state.businessType = effect.value;
      state.paymentsStep = "identity";
      state.preview = "payments-setup";
      state.previewWide = true;
      if (!state.completedSteps.includes(1)) state.completedSteps = [...state.completedSteps, 1];
    } else if (effect.type === "add-product") {
      const product: Product = {
        id: id(state),
        title: effect.title,
        price: effect.price.replace(/[^0-9.]/g, "") || "0.00",
        status: "Draft",
        tone: "coral",
        description: effect.description || "Added from Sidekick.",
        inventory: "0 in stock",
      };
      state.products = [product, ...state.products];
      state.selectedProductId = product.id;
      state.preview = "product";
      state.previewWide = false;
    } else if (effect.type === "add-sidekick") {
      const added = ensureInstalled(state, effect.id);
      if (!added) continue;
      if (effect.id === "chief") {
        state.chiefPhase = "purpose";
        patchAgent(state, "chief", { preview: "Setting agent purpose and direction", topic: "Set purpose" });
        state.selectedAgentId = "chief";
        state.mode = "thread";
        state.preview = state.scenario === "active" ? "home-active" : "home-setup";
      } else {
        state.selectedAgentId = added.id;
        state.mode = "thread";
        if ((state.threads[added.id] ?? []).length === 0) {
          push(state, added.id, {
            id: id(state),
            type: "text",
            role: "assistant",
            text: added.preview,
          });
        }
      }
    } else if (effect.type === "purpose-mode") {
      ensureInstalled(state, "chief");
      state.chiefPhase = "purpose";
      state.selectedAgentId = "chief";
      state.mode = "thread";
    } else if (effect.type === "artifact" && effect.name === "payments-plan") {
      const thread = state.threads.sidekick ?? [];
      const has = thread.some((block) => block.type === "steps");
      if (!has) {
        push(state, "sidekick", { id: id(state), type: "steps" });
        push(state, "sidekick", {
          id: id(state),
          type: "chips",
          chips: [
            { label: "Learn more", tone: "secondary" },
            { label: "Set up Shopify Payments", tone: "primary" },
          ],
        });
      }
      patchAgent(state, "sidekick", { topic: "Review payments", preview: "Payments setup is about 10 minutes." });
      state.preview = "payments";
      state.previewWide = false;
      state.selectedAgentId = "sidekick";
      state.mode = "thread";
    } else if (effect.type === "artifact" && effect.name === "best-sellers") {
      const agentId = state.agents.some((item) => item.id === "chief" && item.installed) ? "chief" : state.selectedAgentId;
      const thread = state.threads[agentId] ?? [];
      if (!thread.some((block) => block.type === "sellers")) {
        push(state, agentId, { id: id(state), type: "sellers" });
        push(state, agentId, {
          id: id(state),
          type: "chips",
          chips: [
            { label: "Review in more detail", tone: "secondary" },
            { label: "Confirm changes", tone: "primary" },
          ],
        });
      }
      state.preview = "home-active";
      state.previewWide = false;
    }
  }
}

function learnMore() {
  return "Shopify Payments charges no transaction fees. Card rates start at 2.5% + $0.30. Shop Pay, Visa, and Mastercard are ready once payout details are in. Most stores finish in about 10 minutes.";
}

export function runChip(state: PrototypeState, label: string) {
  const agentId = state.selectedAgentId;
  if (label === "Review payments" || label === "Review payments →") {
    push(state, "sidekick", { id: id(state), type: "text", role: "user", text: "Review payments" });
    push(state, "sidekick", { id: id(state), type: "text", role: "assistant", text: paymentsReply });
    applyEffects(state, [{ type: "artifact", name: "payments-plan" }]);
    return;
  }
  if (label === "Set up Shopify Payments" || label === "Complete setup") {
    state.preview = "payments-setup";
    state.previewWide = true;
    state.selectedAgentId = "sidekick";
    state.mode = "thread";
    return;
  }
  if (label === "Learn more") {
    push(state, "sidekick", { id: id(state), type: "text", role: "assistant", text: learnMore() });
    return;
  }
  if (label === "Choose a theme" || label === "Choose theme →") {
    push(state, "sidekick", { id: id(state), type: "text", role: "user", text: "Choose a theme" });
    push(state, "sidekick", {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "PITCH is a strong start for a product-led store. It keeps the type large and the product photography full-bleed. I opened it in the preview so you can react before publishing.",
    });
    patchAgent(state, "sidekick", { topic: "Choose a theme", preview: "PITCH is ready to preview." });
    state.preview = "theme";
    state.previewWide = false;
    return;
  }
  if (label === "Set up domain" || label === "Set up domain →") {
    push(state, "sidekick", { id: id(state), type: "text", role: "user", text: "Set up domain" });
    push(state, "sidekick", {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "A custom domain is the address customers remember. Connect one you own, or buy one in the preview. I left mystore.myshopify.com in place until you choose.",
    });
    patchAgent(state, "sidekick", { topic: "Domain", preview: "Connect a domain you own." });
    state.preview = "domain";
    return;
  }
  if (label === "Review shipping rates" || label === "Review rates →") {
    push(state, "sidekick", { id: id(state), type: "text", role: "user", text: "Review shipping rates" });
    push(state, "sidekick", {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "I set domestic shipping from your location: $6 under $50, free over $50, and calculated rates at checkout. Tell me if you want flat, free, or local pickup instead.",
    });
    patchAgent(state, "sidekick", { topic: "Shipping", preview: "Free over $50, $6 under." });
    state.preview = "shipping";
    return;
  }
  if (label === "Add retail address" || label === "Add address →") {
    push(state, "sidekick", { id: id(state), type: "text", role: "user", text: "Add retail address" });
    push(state, "sidekick", {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "Add the retail location customers can visit or pick up from. I opened the address form in the preview.",
    });
    patchAgent(state, "sidekick", { topic: "Retail address", preview: "Add a pickup location." });
    state.preview = "address";
    return;
  }
  if (label === "Order POS hardware" || label === "Order hardware →") {
    push(state, "sidekick", { id: id(state), type: "text", role: "user", text: "Order POS hardware" });
    push(state, "sidekick", {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "POS hardware is the reader, dock, and receipt printer. The retail kit in the preview covers a single counter. Say the word and I’ll add it as a draft order.",
    });
    patchAgent(state, "sidekick", { topic: "POS", preview: "Retail kit is ready to order." });
    state.preview = "pos";
    return;
  }
  if (label === "Tell me more about creating a sidekick") {
    push(state, agentId, {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "A sidekick is an agent with a job: a persona, a place in the nav, and tools that can change the admin. Add a recommended one, connect Slack, Grok, or Muse, or name your own. Each keeps a separate conversation.",
    });
    return;
  }
  if (label === "Create my own sidekick") {
    state.mode = "thread";
    push(state, "sidekick", { id: id(state), type: "create" });
    state.selectedAgentId = "sidekick";
    return;
  }
  if (label === "Give me some examples") {
    push(state, "chief", {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "A Monday note that names the three decisions waiting on you. A filter that hides “quick question” pings until after lunch. A meeting brief with the last payout, the open orders, and the question you actually need answered.",
    });
    return;
  }
  if (label === "Start working") {
    state.chiefPhase = "working";
    const chosen = purposes.filter((item) => state.purposes.includes(item.id)).map((item) => item.title.toLowerCase());
    const focus = chosen.length ? chosen.join(", ") : "whatever is most urgent";
    patchAgent(state, "chief", {
      preview: "Ready when you are.",
      topic: "Get to work",
      placeholder: "Ask your chief of staff…",
    });
    state.threads.chief = [
      {
        id: id(state),
        type: "text",
        role: "assistant",
        text: `I’ll focus on ${focus}. This week is already moving: sales are ahead of orders, so I’ll watch average order value before anyone spends more. Ask me what to do next, or open the live store.`,
      },
      {
        id: id(state),
        type: "chips",
        chips: [
          { label: "What should I do next?", tone: "secondary" },
          { label: "Show the live store", tone: "primary" },
        ],
      },
    ];
    state.selectedAgentId = "chief";
    state.mode = "thread";
    return;
  }
  if (label === "Show the live store") {
    state.scenario = "active";
    state.preview = "home-active";
    state.previewWide = false;
    const missing = catalog.filter((item) => !state.agents.some((agent) => agent.id === item.id && agent.installed));
    for (const item of missing) {
      state.agents.push({ ...item, installed: true });
      if (!state.threads[item.id]) state.threads[item.id] = activeThread(item.id);
    }
    patchAgent(state, "chief", { preview: "Improving sales compared to orders", topic: "Improve sales" });
    return;
  }
  if (label === "What should I do next?") {
    push(state, "chief", { id: id(state), type: "text", role: "user", text: label });
    push(state, "chief", {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "Finish payout setup, then look at the two best sellers before adding spend. Headphones can carry a bundle. The lamp needs a clearer delivery promise.",
    });
    return;
  }
  if (label === "Review in more detail") {
    push(state, agentId, { id: id(state), type: "text", role: "user", text: label });
    push(state, agentId, {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "Headphones convert when the case is in the first image. The lamp loses people on shipping: the page says 5–7 days and ads say this week. I’d make both pages say “ships tomorrow” and put the bundle price next to the headphones.",
    });
    state.preview = "products";
    return;
  }
  if (label === "Confirm changes") {
    push(state, agentId, { id: id(state), type: "text", role: "user", text: label });
    push(state, agentId, {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "Confirmed. I’ll keep the bundle recommendation on Cloud Headphones and the delivery note on Studio Desk Lamp. Nothing is published until you edit the product.",
    });
    patchAgent(state, "chief", { preview: "Bundle and delivery notes are confirmed." });
    state.preview = "home-active";
    return;
  }
  push(state, agentId, { id: id(state), type: "text", role: "user", text: label });
  push(state, agentId, {
    id: id(state),
    type: "text",
    role: "assistant",
    text: "Noted. Tell me if you want that opened in the preview.",
  });
}

export function scriptedTurn(agentId: string, text: string, storeName: string): { text: string; effects: Effect[] } {
  const q = text.toLowerCase();
  const effects: Effect[] = [];
  if (/review payment|shopify payment|payout/.test(q)) {
    effects.push({ type: "artifact", name: "payments-plan" });
    return { text: paymentsReply, effects };
  }
  if (/set up shopify payments|complete setup|business type|i am an individual|running my store/.test(q)) {
    effects.push({ type: "navigate", page: "payments-setup", wide: true });
    if (/individual/.test(q)) effects.push({ type: "business-type", value: "individual" });
    if (/non-?profit/.test(q)) effects.push({ type: "business-type", value: "nonprofit" });
    if (/registered business|\bbusiness\b/.test(q) && !/non-?profit/.test(q)) {
      effects.push({ type: "business-type", value: "business" });
    }
    return {
      text: "I opened Shopify Payments. Tell me whether you’re an individual, a registered business, or a non-profit, and I’ll fill that in.",
      effects,
    };
  }
  if (/best seller|headphones|desk lamp/.test(q)) {
    effects.push({ type: "artifact", name: "best-sellers" });
    return {
      text: "Your best sellers over the last 30 days are Cloud Headphones and the Studio Desk Lamp. I’d bundle a case with the headphones and make the lamp’s delivery promise match the ads.",
      effects,
    };
  }
  if (/add (a )?product|create (a )?product|new product/.test(q)) {
    const title = text.match(/called\s+(.+)$/i)?.[1]?.trim() || "Sidekick draft product";
    effects.push({
      type: "add-product",
      title,
      price: "24.00",
      description: "Drafted with Sidekick. Add photos and a price before publishing.",
    });
    return { text: `I added “${title}” as a draft and opened it in the preview.`, effects };
  }
  if (/chief of staff/.test(q)) {
    effects.push({ type: "add-sidekick", id: "chief" });
    return { text: "Chief of staff is in the nav. Choose a few purposes, then start working.", effects };
  }
  if (/theme/.test(q)) {
    effects.push({ type: "navigate", page: "theme" });
    return { text: "PITCH is on the preview. It’s a good fit if the product photography can carry the page.", effects };
  }
  if (/domain/.test(q)) {
    effects.push({ type: "navigate", page: "domain" });
    return { text: `Your store is still on a myshopify.com address. Connect a domain whenever you’re ready.`, effects };
  }
  if (/shipping|rates/.test(q)) {
    effects.push({ type: "navigate", page: "shipping" });
    return { text: "Domestic rates are $6 under $50 and free after that. I opened them in the preview.", effects };
  }
  if (/address|retail|pickup/.test(q)) {
    effects.push({ type: "navigate", page: "address" });
    return { text: "Add the retail address in the preview. That unlocks pickup and local delivery.", effects };
  }
  if (/pos|hardware|reader/.test(q)) {
    effects.push({ type: "navigate", page: "pos" });
    return { text: "The retail kit is a reader, dock, and printer. I opened it so you can order when the counter is ready.", effects };
  }
  if (/home|dashboard/.test(q)) {
    effects.push({ type: "navigate", page: "home-active" });
    return { text: "Here’s the live Home dashboard.", effects };
  }
  if (/inbox/.test(q)) {
    effects.push({ type: "navigate", page: "inbox" });
    return { text: "Inbox is open. Two customers are waiting on shipping.", effects };
  }
  if (/product/.test(q)) {
    effects.push({ type: "navigate", page: "products" });
    return { text: "Products are in the preview. Everything is still a draft.", effects };
  }
  const fallback: Record<string, string> = {
    sidekick: `I can keep setting up ${storeName}. Ask me to review payments, choose a theme, set up a domain, review shipping, add a retail address, or order POS hardware.`,
    chief: "Sales are up 9% and orders are up 12%, but average order value slipped to $144. I can pull the two best sellers or name the next decision.",
    ideas: "A starter bundle for first-time buyers still looks right: headphones, case, and a cable. I can add it as a draft product.",
    trends: "Gift-set searches are up this week. Smaller sizes are showing up in questions from X.",
    slack: "The welcome email is tighter. I can summarize anything else the team parked in Slack.",
    grok: "Shoppers on X keep asking for smaller sizes. Want a reply, or a product draft?",
    muse: "Try a quieter campaign for the lamp: one photo, one sentence about shipping tomorrow.",
    store: "The lamp page should say when it ships. I can open products if you want to edit it.",
    agentic: "Agent traffic is bunching at lunch and delivery promises are slipping. I’d cap same-day orders at noon.",
    customers: "Repeat buyers are asking for a loyalty perk. A $10 note after the second order is the smallest test.",
    orders: "Two orders still need tracking. I can open orders in the preview.",
    custom: "Tell me what you want this sidekick to take off your plate.",
  };
  return { text: fallback[agentId] ?? fallback.sidekick, effects };
}

export type Action =
  | { type: "sign-in"; storeName: string }
  | { type: "boot-active" }
  | { type: "select"; id: string }
  | { type: "toggle-add" }
  | { type: "toggle-search" }
  | { type: "search"; query: string }
  | { type: "toggle-experiments" }
  | { type: "scenario"; scenario: Scenario }
  | { type: "motion"; on: boolean }
  | { type: "reset" }
  | { type: "chip"; label: string }
  | { type: "user"; agentId: string; text: string }
  | { type: "commit"; agentId: string; text: string }
  | { type: "effects"; effects: Effect[] }
  | { type: "business-type"; value: BusinessType }
  | { type: "identity"; patch: Partial<PrototypeState["identity"]> }
  | { type: "payments-next" }
  | { type: "toggle-purpose"; id: string }
  | { type: "add-catalog"; id: string }
  | { type: "create-agent"; name: string; purpose: string }
  | { type: "preview"; page: PreviewId; wide?: boolean }
  | { type: "product"; id: string }
  | { type: "update-product"; id: string; patch: Partial<Product> }
  | { type: "rail"; id: string }
  | { type: "add-blank-product" };

export function reducer(state: PrototypeState, action: Action): PrototypeState {
  const next: PrototypeState = {
    ...state,
    agents: state.agents.map((item) => ({ ...item })),
    threads: Object.fromEntries(Object.entries(state.threads).map(([key, blocks]) => [key, [...blocks]])),
    completedSteps: [...state.completedSteps],
    purposes: [...state.purposes],
    products: state.products.map((product) => ({ ...product })),
    identity: { ...state.identity },
  };

  switch (action.type) {
    case "sign-in": {
      next.signedIn = true;
      next.storeName = action.storeName.trim() || "My Store";
      return next;
    }
    case "boot-active":
      return { ...activeState(state.storeName), motion: state.motion };
    case "select": {
      if (!next.agents.some((item) => item.id === action.id && item.installed)) return state;
      next.selectedAgentId = action.id;
      next.mode = "thread";
      next.searchOpen = false;
      patchAgent(next, action.id, { unread: 0 });
      return next;
    }
    case "toggle-add":
      next.mode = next.mode === "add" ? "thread" : "add";
      next.searchOpen = false;
      return next;
    case "toggle-search":
      next.searchOpen = !next.searchOpen;
      if (!next.searchOpen) next.search = "";
      return next;
    case "search":
      next.search = action.query;
      next.searchOpen = true;
      return next;
    case "toggle-experiments":
      next.experimentsOpen = !next.experimentsOpen;
      return next;
    case "scenario":
      return action.scenario === "active"
        ? { ...activeState(next.storeName), motion: next.motion, signedIn: true }
        : { ...setupState(next.storeName), motion: next.motion, signedIn: true };
    case "motion":
      next.motion = action.on;
      return next;
    case "reset":
      return state.scenario === "active"
        ? { ...activeState(state.storeName), motion: state.motion, signedIn: true }
        : { ...setupState(state.storeName), motion: state.motion, signedIn: true };
    case "chip":
      runChip(next, action.label);
      return next;
    case "user":
      push(next, action.agentId, { id: id(next), type: "text", role: "user", text: action.text });
      patchAgent(next, action.agentId, { preview: action.text });
      return next;
    case "commit": {
      const text = action.text.trim();
      if (!text) return state;
      const thread = next.threads[action.agentId] ?? [];
      const last = thread[thread.length - 1];
      if (last?.type === "text" && last.role === "assistant" && last.text === text) return state;
      push(next, action.agentId, { id: id(next), type: "text", role: "assistant", text });
      patchAgent(next, action.agentId, { preview: text.replace(/\s+/g, " ").slice(0, 72) });
      return next;
    }
    case "effects":
      applyEffects(next, action.effects);
      return next;
    case "business-type":
      next.businessType = action.value;
      return next;
    case "identity":
      next.identity = { ...next.identity, ...action.patch };
      return next;
    case "payments-next": {
      if (next.paymentsStep === "type") {
        next.paymentsStep = "identity";
        if (!next.completedSteps.includes(1)) next.completedSteps.push(1);
        const label =
          next.businessType === "individual"
            ? "an individual"
            : next.businessType === "business"
              ? "a registered business"
              : "a non-profit";
        push(next, "sidekick", {
          id: id(next),
          type: "text",
          role: "assistant",
          text: `Saved. You’re running the store as ${label}. Next is identity verification — about 4 minutes. I left the form in the preview.`,
        });
      } else {
        next.paymentsStep = "done";
        if (!next.completedSteps.includes(2)) next.completedSteps.push(2);
        push(next, "sidekick", {
          id: id(next),
          type: "text",
          role: "assistant",
          text: "Identity details are saved on this prototype. Account security is next: turn on two-step authentication before you connect a payout account.",
        });
        push(next, "sidekick", {
          id: id(next),
          type: "chips",
          chips: [
            { label: "Learn more", tone: "secondary" },
            { label: "Review payments", tone: "primary" },
          ],
        });
      }
      next.selectedAgentId = "sidekick";
      return next;
    }
    case "toggle-purpose": {
      next.purposes = next.purposes.includes(action.id)
        ? next.purposes.filter((item) => item !== action.id)
        : [...next.purposes, action.id];
      return next;
    }
    case "add-catalog": {
      const source = catalog.find((item) => item.id === action.id);
      if (!source) return state;
      ensureInstalled(next, action.id);
      if (action.id === "chief") {
        next.chiefPhase = "purpose";
        patchAgent(next, "chief", { preview: "Setting agent purpose and direction", topic: "Set purpose" });
        next.selectedAgentId = "chief";
        next.mode = "thread";
      } else {
        const verb = source.group === "teams" ? "Connected" : "Added";
        next.threads[action.id] = [
          {
            id: id(next),
            type: "text",
            role: "assistant",
            text: `${verb} ${source.name}. ${source.preview}`,
          },
        ];
        next.selectedAgentId = action.id;
        next.mode = "thread";
      }
      return next;
    }
    case "create-agent": {
      const name = action.name.trim() || "New sidekick";
      const slug = `custom-${next.seq + 1}`;
      const created = agent({
        id: slug,
        name,
        group: "favorites",
        preview: action.purpose.trim() || "Waiting for a first task.",
        topic: "New",
        placeholder: `Ask ${name}…`,
        orb: "custom",
        installed: true,
      });
      created.persona = `You are ${name}, a custom Shopify sidekick. Purpose: ${action.purpose || "help the merchant"}. ${persona.custom}`;
      next.agents = [...next.agents, created];
      next.threads[slug] = [
        {
          id: id(next),
          type: "text",
          role: "assistant",
          text: action.purpose.trim()
            ? `I’m ${name}. I’ll ${action.purpose.trim().replace(/\.$/, "")}. What should we do first?`
            : `I’m ${name}. Tell me what you want me to take on.`,
        },
      ];
      next.selectedAgentId = slug;
      next.mode = "thread";
      return next;
    }
    case "preview":
      next.preview = action.page;
      next.previewWide = action.wide ?? action.page === "payments-setup";
      return next;
    case "product":
      next.selectedProductId = action.id;
      next.preview = "product";
      next.previewWide = false;
      return next;
    case "update-product":
      next.products = next.products.map((product) =>
        product.id === action.id ? { ...product, ...action.patch } : product,
      );
      return next;
    case "add-blank-product": {
      const product: Product = {
        id: id(next),
        title: "New product",
        price: "0.00",
        status: "Draft",
        tone: "sand",
        description: "",
        inventory: "0 in stock",
      };
      next.products = [product, ...next.products];
      next.selectedProductId = product.id;
      next.preview = "product";
      next.previewWide = false;
      return next;
    }
    case "rail": {
      const page = railPage(action.id, next);
      next.preview = page;
      next.previewWide = false;
      return next;
    }
    default:
      return state;
  }
}

function railPage(id: string, state: PrototypeState): PreviewId {
  switch (id) {
    case "home":
      return state.scenario === "active" || state.chiefPhase === "working" ? "home-active" : "home-setup";
    case "inbox":
      return "inbox";
    case "notifications":
      return "notifications";
    case "products":
      return "products";
    case "customers":
      return "customers";
    case "marketing":
      return "marketing";
    case "analytics":
      return "analytics";
    case "finance":
      return "finance";
    case "content":
      return "content";
    case "online-store":
      return "online-store";
    case "email":
      return "email";
    case "settings":
      return "settings";
    default:
      return state.preview;
  }
}

export function railForPreview(page: PreviewId): string {
  switch (page) {
    case "home-setup":
    case "home-active":
    case "theme":
    case "domain":
    case "shipping":
    case "address":
    case "pos":
      return "home";
    case "payments":
    case "payments-setup":
      return "finance";
    case "products":
    case "product":
      return "products";
    default:
      return page;
  }
}

export function personaFor(id: string) {
  if (id === "sidekick") {
    return "You are Sidekick, Shopify's setup assistant for a brand-new merchant. Be concrete, short, and ready to take action in the admin preview. When the merchant wants to review payments, use this wording and then call the tools: \"" +
      paymentsReply +
      "\" Call showArtifact with payments-plan and navigatePreview to payments. When they want to set up Shopify Payments, navigate to payments-setup with wide true.";
  }
  return catalog.find((item) => item.id === id)?.persona ?? "You are a custom Shopify sidekick. Help the merchant take a concrete next step in the admin.";
}

export function selectedAgent(state: PrototypeState) {
  return state.agents.find((item) => item.id === state.selectedAgentId) ?? state.agents[0];
}

export function prototypeSnapshot(state: PrototypeState) {
  const agent = selectedAgent(state);
  return {
    storeName: state.storeName,
    scenario: state.scenario,
    agentId: agent.id,
    agentName: agent.name,
    persona: agent.persona,
    preview: state.preview,
    previewWide: state.previewWide,
    businessType: state.businessType,
    paymentsStep: state.paymentsStep,
    completedSteps: state.completedSteps,
    installedAgents: state.agents.filter((item) => item.installed).map((item) => item.id),
    productTitles: state.products.slice(0, 8).map((product) => product.title),
  };
}
