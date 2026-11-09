import { channelNav, findNav, mainNav, navFor, pageMeta, previewPages, settingsNav, type PreviewId } from "@/lib/admin-nav";
import type { ChoiceCard, ChoiceMode } from "@/lib/choices";
import { applyWorkspace, captureWorkspace, emptyView, homeFor, readLiveScroll, sameDesk, type SavedWork, type ViewState, type Workspace } from "@/lib/workspace";

export { previewPages, type PreviewId };

export const businessTypes = ["individual", "business", "nonprofit"] as const;
export type BusinessType = (typeof businessTypes)[number];

export type AgentGroup = "favorites" | "teams" | "channels" | "tools" | "hidden";

export const voiceOrbIds = ["plasma", "mercury", "twist", "aura", "marble", "strands"] as const;
export type VoiceOrbId = (typeof voiceOrbIds)[number];

export type OrbId =
  | VoiceOrbId
  | "sidekick"
  | "chief"
  | "ideas"
  | "trends"
  | "slack"
  | "grok"
  | "muse"
  | "claude"
  | "gemini"
  | "store"
  | "shop"
  | "pos"
  | "agentic"
  | "customers"
  | "orders"
  | "custom";

export const voiceOrbLabel: Record<VoiceOrbId, string> = {
  plasma: "Plasma",
  mercury: "Mercury",
  twist: "Twisted Colorful Sphere",
  aura: "Aura Field",
  marble: "Marble",
  strands: "Fluid",
};

/** Gallery defaults. Twist's pair keeps the original cosine palette until a sidekick picks another. */
export const voiceOrbTint: Record<VoiceOrbId, { from: string; to: string }> = {
  plasma: { from: "#7c3aed", to: "#06b6d4" },
  mercury: { from: "#cbd5e1", to: "#a5b4fc" },
  twist: { from: "#22d3ee", to: "#f472b6" },
  aura: { from: "#34d399", to: "#60a5fa" },
  marble: { from: "#1d4ed8", to: "#fb7185" },
  strands: { from: "#38bdf8", to: "#fb7185" },
};

/** One color for the editor. The second stop is derived so the orb keeps depth. */
export const orbSwatches = [
  { name: "Violet", color: "#7c3aed" },
  { name: "Cyan", color: "#06b6d4" },
  { name: "Emerald", color: "#10b981" },
  { name: "Amber", color: "#f59e0b" },
  { name: "Rose", color: "#f43f5e" },
  { name: "Slate", color: "#94a3b8" },
] as const;

/** The color the person picked, plus a lighter stop so the orb still has depth. */
export function orbColorPair(hex: string): { from: string; to: string } {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? [...clean].map((part) => part + part).join("") : clean.padStart(6, "0").slice(0, 6);
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return { from: "#7c3aed", to: "#c4b5fd" };
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const lift = [0.42, 0.28, 0.5];
  const to = channels.map((channel, index) => Math.round(channel + (255 - channel) * lift[index]));
  const hexOf = (rgb: number[]) => `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  return { from: hexOf(channels), to: hexOf(to) };
}

/** Branded marks stay out of the generic orb picker. */
export const exemptAvatarAgents = new Set(["slack", "grok", "muse", "claude", "gemini", "store", "shop", "pos", "agentic"]);

/** Sidekicks that stay out of the nav, the switcher, mentions, and the add list. */
export const hiddenSidekicks = new Set(["muse", "claude", "gemini", "pos", "agentic"]);

export function isListedSidekick(id: string) {
  return !hiddenSidekicks.has(id);
}

const legacyVoiceOrb: Partial<Record<string, VoiceOrbId>> = {
  sidekick: "twist",
  chief: "twist",
  ideas: "plasma",
  trends: "mercury",
  customers: "aura",
  orders: "aura",
  finance: "aura",
  analytics: "aura",
  custom: "plasma",
  particles: "twist",
  dither: "plasma",
  grain: "twist",
  gooey: "aura",
  nebula: "marble",
  crystal: "marble",
  iridescence: "plasma",
};

/** Reused styles get a different gradient so two sidekicks don't look identical. */
const reuseTint: Record<string, { from: string; to: string }> = {
  customers: { from: "#f472b6", to: "#d946ef" },
  orders: { from: "#22d3ee", to: "#2563eb" },
  finance: { from: "#fbbf24", to: "#b45309" },
  analytics: { from: "#34d399", to: "#059669" },
  custom: { from: "#4f46e5", to: "#ec4899" },
};

export function isVoiceOrb(orb: string): orb is VoiceOrbId {
  return (voiceOrbIds as readonly string[]).includes(orb);
}

/** Stable avatar identity. Retired styles and older generic ids map onto the current lineup; branded ids stay put. */
export function canonicalOrb(orb: string): OrbId {
  if (
    orb === "grok" ||
    orb === "slack" ||
    orb === "muse" ||
    orb === "claude" ||
    orb === "gemini" ||
    orb === "store" ||
    orb === "shop" ||
    orb === "pos" ||
    orb === "agentic"
  ) {
    return orb;
  }
  if (isVoiceOrb(orb)) return orb;
  return legacyVoiceOrb[orb] ?? "plasma";
}

export function defaultOrbTint(id: string, orb: string): { from: string; to: string } | undefined {
  if (reuseTint[id]) return reuseTint[id];
  if (orb === "custom" || id.startsWith("custom-")) return reuseTint.custom;
  return undefined;
}

export type Connection = { id: string; label: string; on: boolean };

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
  purpose: string;
  connections: Connection[];
  /** VoiceOrb gradient. Absent means the gallery default for `orb`. */
  orbFrom?: string;
  orbTo?: string;
};

export type Chip = { label: string; tone: "secondary" | "primary"; send?: boolean };

export type Segment = { type: "text"; text: string } | { type: "tool"; label: string };
export type Source = { title: string; url: string };

export type Block =
  | { id: string; type: "text"; role: "user" | "assistant"; text: string; typed?: boolean; segments?: Segment[]; sources?: Source[]; streamed?: boolean }
  | { id: string; type: "steps" }
  | { id: string; type: "sellers" }
  | { id: string; type: "chips"; chips: Chip[] }
  | { id: string; type: "purpose" }
  | { id: string; type: "create" }
  | {
      id: string;
      type: "choices";
      title: string;
      cards: ChoiceCard[];
      selected: string[];
      mode: ChoiceMode;
      settled?: boolean;
      replaced?: boolean;
      setKey?: string;
    }
  | { id: string; type: "status"; label: string };

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

/** Which new-store opening is playing. `tasks` is the setup list. `sidekick` finds the next step first. */
export type Arrival = "tasks" | "sidekick";

export type Effect =
  | { type: "navigate"; page: PreviewId; wide?: boolean }
  | { type: "focus"; wide: boolean }
  | { type: "complete-step"; step: number }
  | { type: "business-type"; value: BusinessType }
  | { type: "add-product"; title: string; price: string; description?: string; wide?: boolean }
  | { type: "add-sidekick"; id: string }
  | { type: "artifact"; name: "payments-plan" | "best-sellers" }
  | { type: "purpose-mode" }
  | { type: "chips"; chips: Chip[] }
  | { type: "lookbook" }
  | { type: "choose-theme"; name: string };

export type MenuStyle = "push" | "drop";

export type PrototypeState = {
  signedIn: boolean;
  storeName: string;
  scenario: Scenario;
  arrival: Arrival;
  menuStyle: MenuStyle;
  agents: Agent[];
  selectedAgentId: string;
  threads: Record<string, Block[]>;
  preview: PreviewId;
  previewWide: boolean;
  /** Search, tab, sort, open record, form draft, and scroll for the admin that is on screen. */
  view: ViewState;
  /** Last admin place for every sidekick, including ones the merchant created. */
  workspaces: Record<string, Workspace>;
  mode: "thread" | "add" | "create";
  purposes: string[];
  chiefPhase: "absent" | "purpose" | "working";
  businessType: BusinessType;
  paymentsStep: "type" | "identity" | "security" | "payout" | "done";
  completedSteps: number[];
  identity: { first: string; last: string };
  products: Product[];
  selectedProductId: string;
  searchOpen: boolean;
  search: string;
  motion: boolean;
  seq: number;
  conversations: Record<string, Conversation[]>;
  conversationsOpen: boolean;
  ratings: Record<string, "up" | "down">;
  cardsDone: string[];
  cardsDismissed: string[];
  /** The Sidekick opening is showing store designs instead of the setup list. */
  lookbook: boolean;
  /** The design the merchant chose, once they have. */
  theme: string | null;
  /** The Sidekick title intro has already played this session. Returning to Sidekick must not replay it. */
  introPlayed: boolean;
  /** The agent whose orb should show the working state while a form fills. */
  workingAgentId: string | null;
};

export type Conversation = { id: string; title: string; at: number; blocks: Block[] };

export const homeCards = [
  { id: "theme", title: "Choose your store design", chip: "Choose theme →" },
  { id: "payments", title: "You're ready to accept payments", chip: "Review payments →" },
  { id: "domain", title: "Get a custom domain", chip: "Set up domain →" },
  { id: "shipping", title: "Review shipping rates", chip: "Review rates →" },
  { id: "address", title: "Add your retail address", chip: "Add address →" },
  { id: "pos", title: "Order POS hardware", chip: "Order hardware →" },
] as const;

const day = 86_400_000;

function seedConversations(now: number): Conversation[] {
  const convo = (n: string, title: string, ago: number, ask: string, reply: string): Conversation => ({
    id: `seed-${n}`,
    title,
    at: now - ago,
    blocks: [
      { id: `seed-${n}-u`, type: "text", role: "user", text: ask },
      { id: `seed-${n}-a`, type: "text", role: "assistant", text: reply },
    ],
  });
  return [
    convo("payments", "You're ready to accept payments", day + 3_600_000, "Review payments", paymentsReply),
    convo(
      "start",
      "Getting started with your Shopify store",
      day + 7_200_000,
      "How do I get started with my Shopify store?",
      "Start with the basics: pick a theme, add a few products, and set up payments. The setup guide on Home walks through each step, and I can do most of them with you.",
    ),
    convo(
      "product",
      "Add your first product",
      2 * day + 3_600_000,
      "Help me add my first product",
      "Open **Products › Add product**, then add a title, a clear photo, a description, and a price. Set inventory if you track stock. Save it as a draft until it looks right, then make it active.",
    ),
    convo(
      "pos",
      "Order POS hardware",
      3 * day,
      "Order POS hardware",
      "The POS retail kit is a card reader, a dock, and a receipt printer. You can order it from the Shopify Hardware Store, and Point of Sale has a QR code to install the app.",
    ),
    convo(
      "theme",
      "Choose your store design",
      3 * day + 3_600_000,
      "Choose a theme",
      "Your store is on Horizon, Shopify’s free default theme. Tinker and Dwell are worth a look if you want something more editorial.",
    ),
  ];
}

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

export const sidekickMakeYourOwn =
  "You can also build your own sidekicks — agents with a job of their own. A chief of staff that keeps your week on track, a product scout that watches trends, or anything you can describe. Each one gets its own place on the left and its own conversations.";

export function sidekickArrival(storeName: string) {
  return `Let's get one real thing in place for ${storeName}.\n\nWhere should we start?`;
}

export const arrivalChips: Chip[] = [
  { label: "I have something to sell", tone: "primary" },
  { label: "I already sell somewhere", tone: "secondary" },
  { label: "Help me start", tone: "secondary" },
];

function sidekickOpening(state: PrototypeState) {
  return state.arrival === "sidekick" && state.scenario === "setup" && state.mode === "thread" && state.selectedAgentId === "sidekick";
}

function sidekickTurns(state: PrototypeState) {
  return (state.threads.sidekick ?? []).filter((block) => block.type === "text" && block.role === "user").length;
}

/** Sidekick's first moment, before a choice. The next step has not been asked yet. Once the title intro has played, coming back does not start it again. */
export function sidekickStage(state: PrototypeState) {
  return sidekickOpening(state) && !state.introPlayed && sidekickTurns(state) === 0;
}

/** The title introduces Sidekick in the place it keeps. Once that introduction settles, both sidebars come in around it, and then the next step is written. */
export function sidekickPanels(state: PrototypeState, revealed = false): { nav: boolean; preview: boolean } {
  if (!sidekickOpening(state) || state.introPlayed) return { nav: true, preview: true };
  if (sidekickTurns(state) === 0 && !revealed) return { nav: false, preview: false };
  return { nav: true, preview: true };
}

const sidekickArrivalPersona = `You are Sidekick, and this is the merchant's first moment in a brand-new Shopify store. Drive toward one concrete outcome. They just chose how to start. The agent list and the admin are already open. Do the one thing they picked.

How this conversation works:
- "I have something to sell" or "start something new": they have a product. Products is open wide. Ask what it is. When they name it, call addProduct with wide true.
- "I already sell somewhere": Products is open wide. Ask where the catalog lives today.
- "Help me start", "help me", or "show me a route": three store designs are open wide on the right (Horizon, Tinker, Dwell). Ask them to pick the one that feels like the store. When they choose, say that design is the one and ask for the first thing they sell. Don't recite a setup list.
- If they ask what you are: this conversation is how they set up and run the store. Other sidekicks can take a specific job later. Don't offer a catalog of sidekicks unless they ask.
- One next step. Don't recite the whole setup list.

The admin on the right is the real Shopify admin. You are the primary interface, and the admin is where the work shows up.
- Call navigatePreview with wide true when they should look at or finish that page. The panel grows. Use it for products, a product you just added, online-store, domain, shipping, address, pos, and payments-setup.
- Call navigatePreview with wide false when the next beat is a decision in the conversation. The panel shrinks. Home stays narrow. The payments overview stays narrow: call showArtifact payments-plan and navigatePreview payments with wide false. Open payments-setup with wide true only when they say they want to start the form.
- When they name something they sell, call addProduct with wide true so the draft opens large. Say that the price is a placeholder if they didn't give one.
- On a purely conversational reply, call navigatePreview for the page already open with wide false so a wide panel doesn't stay up.
- Never claim you opened or changed something unless you called the tool.`;

const makeYourOwnChips: Chip[] = [
  { label: "Add a chief of staff", tone: "secondary" },
  { label: "Create my own sidekick", tone: "secondary" },
  { label: "Browse sidekicks", tone: "secondary" },
];

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
    title: "Studio ANC Headphones",
    meta: "$18,640 · 76 orders",
    advice: "14 left in stock. Reorder before Monday’s ads, and show the case in the first photo.",
    image: "/assets/products/studio-anc-headphones.webp",
  },
  {
    title: "USB-C Power Bank",
    meta: "$6,370 · 130 orders",
    advice: "The sitewide 20% off is filling carts on its own. Offer it only after a headphone is added.",
    image: "/assets/products/usb-c-power-bank.webp",
  },
] as const;

/** Shared operating picture for an electronics store. Every sidekick can act on these figures. */
const storeFacts = [
  "Store facts for this electronics store, as of Saturday Nov 7, 2026. Use these numbers. Do not invent a different sales total. Home opens on Last 30 days.",
  "Last 30 days: $48,393 total sales, 386 orders, average order value $125 (down from $134 the previous 30 days). Conversion 2.7% on 14,280 sessions.",
  "Last 7 days: $11,285, 92 orders. Today: $2,079 and 14 orders, 9 of them fulfilled. Today matches the analytics cards.",
  "Studio ANC Headphones, $249: $18,640 and 76 orders, about 39% of revenue. 14 units left. Reorder before Monday’s ads.",
  "USB-C Power Bank, $49: $6,370 and 130 orders. A sitewide 20% off is creating accessory-only carts and pulling the average order down.",
  "Portable Charger, $59: $5,310 and 90 orders. Desk Lamp, $89: $4,450 and 50 orders. Wireless Mouse, $39: $3,120 and 80 orders.",
  "The Desk Lamp page says it ships in 5–7 days. Ads running this week say it ships this week.",
  "Open orders: #1078 Danielle Hudson, $369.99, paid, unfulfilled, 3 items (headphones and accessories). #1077 Maya Chen, $89, paid, unfulfilled, desk lamp. #1075 Priya Patel, $58, unpaid and unfulfilled.",
  "Shop app conversion is 1.6% against 2.7% on Online Store. The Shop listing crops the headphone photo.",
  "Returning customers are 28% of orders. People on their second order ask for a longer headphone warranty, not a points program.",
  "Search is up 22% week over week for “travel charger” and “desk setup.”",
  "A payout of $2,184.60 is on the way today. Shopping agents placed 41 orders this month, $6,840, and stall when the lamp date disagrees with the ad. The retail counter has not taken a sale this month.",
  "Already in progress: Product ideas is drafting a $289 bundle. Campaigns is lining up Monday’s headphone ads. Online store is rewriting the lamp delivery line. Orders is clearing #1078, #1077, and #1075. Shop app is fixing the listing crop. Slack has the welcome-email draft. Claude can write it. Grok still owes the USB-C hub reply. Gemini is watching the travel-charger queries.",
].join(" ");

const persona = {
  sidekick:
    "You are Sidekick, Shopify's built-in assistant, helping a merchant run an electronics store. You know Shopify deeply and can act in the admin. When the merchant wants to review payments, call showArtifact payments-plan and navigatePreview payments, then explain the plan in your own words: Shopify Payments setup has four parts (business details, identity, account security, payout bank account) and takes about 10 minutes. When they want to start Shopify Payments setup, navigate to payments-setup with wide true. Remaining setup tasks: payments, theme, domain, shipping, retail address, POS.",
  chief:
    "You are the merchant's Chief of Staff inside this electronics store. Lead with how sales are actually doing, the few things worth doing today, and what the other sidekicks are already working on. When asked for best sellers, call showArtifact best-sellers and navigatePreview home-active.",
  ideas:
    "You are Product ideas. You turn this store's carts and search into one testable product. You can add a product with the addProduct tool. The live draft is a $289 bundle: Studio ANC Headphones, the earbuds case, and a cable, meant to lift the $125 average order.",
  trends:
    "You are Trends. You watch search for this electronics catalog. Travel charger and desk setup searches are up 22% week over week. Headphones are flat in search even though they are 39% of revenue.",
  campaigns:
    "You are Campaigns. You line up ads and the restock story. Monday’s ads still say the desk lamp ships this week, and the headphone photo should lead.",
  slack:
    "You are Slackbot, connected to the merchant's Slack. #ops flagged the three open orders and that the headphone bin is down to 14 units. The welcome email draft is ready.",
  grok:
    "You are Grok bot, connected from X. The launch thread has about 40 replies asking whether the Studio ANC Headphones work for calls through a USB-C hub, and the store has not answered.",
  muse:
    "You are Muse, a creative partner for this electronics store. The live direction is the headphone restock: one desk photo and the line “Back in stock. Ships tomorrow.” Leave the lamp out of it.",
  claude:
    "You are Claude, connected for writing. The welcome email and a rewrite of the desk-lamp delivery line are the two drafts worth doing today. Include the #ops note that 14 headphones are left.",
  gemini:
    "You are Gemini, connected from Google. Search interest in “travel charger” and “desk setup” is up 22% week over week. The Shopping ad still crops the headphone photo.",
  store:
    "You are the Online store agent. You look after the theme, product pages, and delivery promises. The Desk Lamp page still says 5–7 days while this week's ads say it ships this week.",
  shop:
    "You are the Shop app agent. Shop conversion is 1.6% against 2.7% on the online store. The Shop listing crops the headphone photo, and that is the first fix.",
  pos:
    "You are Point of Sale. This electronics store sells online. The counter has not taken a sale this month. If #1078 is picked up in person, it rings up on the reader.",
  agentic:
    "You are Agentic. Shopping agents placed 41 orders and $6,840 this month. They stall on the desk lamp because the page says 5–7 days and the ad says this week.",
  customers:
    "You are the Customers agent. 28% of orders are from people who have bought before. Second-order buyers ask for a longer warranty on the headphones, not a points program.",
  orders:
    "You are the Orders agent. Be operational. Open orders right now: #1078 Danielle Hudson $369.99 paid and unfulfilled, #1077 Maya Chen $89 paid and unfulfilled, #1075 Priya Patel $58 unpaid and unfulfilled.",
  finance:
    "You are Finance. Today’s payout is $2,184.60 and it is already on the way. The headphone orders are most of it. Last 30 days of sales are $48,393.",
  analytics:
    "You are Analytics. Last 30 days: $48,393, 386 orders, conversion 2.7% on 14,280 sessions. Today is the quiet part, $2,079 from 14 orders. When asked to show analytics, call navigatePreview analytics with wide true.",
  custom: "You are a custom Sidekick the merchant just created. Help them make progress in the Shopify admin.",
};

export const connectionChoices: Connection[] = [
  { id: "shop", label: "Shop", on: false },
  { id: "admin", label: "Shopify admin", on: false },
  { id: "slack", label: "Slack", on: false },
  { id: "x", label: "X", on: false },
  { id: "email", label: "Email", on: false },
  { id: "claude", label: "Claude", on: false },
  { id: "google", label: "Google", on: false },
];

const purposeFor: Record<string, string> = {
  sidekick: "Your AI assistant for getting your store ready to sell.",
  chief: "Set priorities and keep the store moving.",
  ideas: "Turn store signals into product concepts worth trying.",
  trends: "Watch what shoppers are searching for and suggest one next step.",
  campaigns: "Line up ads, restocks, and the story the store is telling this week.",
  slack: "Summarize team chatter and draft updates.",
  grok: "Bring in what shoppers are asking on X.",
  muse: "Offer directions, names, and campaign angles.",
  claude: "Draft the emails, product copy, and replies the store owes.",
  gemini: "Watch Google search and Shopping ads for this catalog.",
  store: "Look after merchandising, delivery promises, and theme content.",
  shop: "Watch the Shop channel and the listings shoppers see there.",
  pos: "Watch the counter, pickup, and in-person sales.",
  agentic: "Watch orders that come from shopping agents.",
  customers: "Speak for buyers and the perks they ask for.",
  orders: "Keep fulfillment moving and flag orders that need a tracking update.",
  finance: "Watch payouts, fees, and what is on the way to the bank.",
  analytics: "Read sales, sessions, and conversion for the period that is open.",
};

function connectionsFor(id: string): Connection[] {
  const on = new Set(
    id === "slack" ? ["slack"] : id === "grok" ? ["x"] : id === "claude" ? ["claude"] : id === "gemini" ? ["google"] : id === "shop" ? ["shop"] : id === "sidekick" ? ["shop", "admin"] : ["admin"],
  );
  return connectionChoices.map((item) => ({ ...item, on: on.has(item.id) }));
}

function agent(
  partial: Omit<Agent, "persona" | "installed" | "unread" | "purpose" | "connections"> & {
    unread?: number;
    installed?: boolean;
    purpose?: string;
    connections?: Connection[];
  },
): Agent {
  const { purpose, connections, ...rest } = partial;
  return {
    unread: partial.unread ?? 0,
    installed: partial.installed ?? false,
    persona: `${persona[partial.orb === "custom" ? "custom" : (partial.id as keyof typeof persona)] ?? persona.custom} ${storeFacts}`,
    purpose: purpose ?? purposeFor[partial.id] ?? partial.preview,
    connections: connections ?? connectionsFor(partial.id),
    ...rest,
    orb: canonicalOrb(partial.orb),
    orbFrom: partial.orbFrom ?? defaultOrbTint(partial.id, partial.orb)?.from,
    orbTo: partial.orbTo ?? defaultOrbTint(partial.id, partial.orb)?.to,
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
    preview: "A $289 headphone bundle could lift the average order.",
    topic: "New assortment",
    placeholder: "Ask Product ideas…",
    orb: "ideas",
  }),
  agent({
    id: "trends",
    name: "Trends",
    group: "favorites",
    preview: "Travel charger and desk setup searches are up 22%.",
    topic: "This week",
    placeholder: "Ask Trends…",
    orb: "mercury",
  }),
  agent({
    id: "campaigns",
    name: "Campaigns",
    group: "favorites",
    preview: "Monday’s ads still say the lamp ships this week.",
    topic: "This week’s ads",
    placeholder: "Ask Campaigns…",
    orb: "marble",
  }),
  agent({
    id: "grok",
    name: "Grok bot",
    group: "teams",
    preview: "X is asking if the headphones work through the hub.",
    topic: "From X",
    placeholder: "Ask Grok bot…",
    orb: "grok",
  }),
  agent({
    id: "slack",
    name: "Slackbot",
    group: "teams",
    preview: "Welcome email is ready, and #ops flagged 14 headphones left.",
    topic: "Team updates",
    placeholder: "Ask Slackbot…",
    orb: "slack",
  }),
  agent({
    id: "claude",
    name: "Claude",
    group: "teams",
    preview: "The welcome email and the lamp line are ready to draft.",
    topic: "Drafts",
    placeholder: "Ask Claude…",
    orb: "claude",
  }),
  agent({
    id: "gemini",
    name: "Gemini",
    group: "teams",
    preview: "Google is matching travel charger and desk setup.",
    topic: "From Google",
    placeholder: "Ask Gemini…",
    orb: "gemini",
  }),
  agent({
    id: "muse",
    name: "Muse",
    group: "teams",
    preview: "Back in stock. Ships tomorrow.",
    topic: "Directions",
    placeholder: "Ask Muse…",
    orb: "muse",
  }),
  agent({
    id: "store",
    name: "Online store",
    group: "channels",
    preview: "The lamp page still says 5–7 days.",
    topic: "Storefront",
    placeholder: "Ask Online store…",
    orb: "store",
  }),
  agent({
    id: "shop",
    name: "Shop app",
    group: "channels",
    preview: "Shop checkouts convert at 1.6%, behind the online store.",
    topic: "Shop",
    placeholder: "Ask Shop app…",
    orb: "shop",
  }),
  agent({
    id: "pos",
    name: "Point of Sale",
    group: "channels",
    preview: "The counter hasn’t taken a sale this month.",
    topic: "In person",
    placeholder: "Ask Point of Sale…",
    orb: "pos",
  }),
  agent({
    id: "agentic",
    name: "Agentic",
    group: "channels",
    preview: "Agent orders stall when the lamp date doesn’t match the ad.",
    topic: "Agent traffic",
    placeholder: "Ask Agentic…",
    orb: "agentic",
  }),
  agent({
    id: "customers",
    name: "Customers",
    group: "tools",
    preview: "Second orders are asking for a longer headphone warranty.",
    topic: "Buyers",
    placeholder: "Ask Customers…",
    orb: "customers",
  }),
  agent({
    id: "orders",
    name: "Orders",
    group: "tools",
    preview: "#1078 and #1077 are paid and still unfulfilled.",
    topic: "Fulfillment",
    placeholder: "Ask Orders…",
    orb: "orders",
    unread: 1,
  }),
  agent({
    id: "finance",
    name: "Finance",
    group: "tools",
    preview: "A $2,184.60 payout is on the way.",
    topic: "Payouts",
    placeholder: "Ask Finance…",
    orb: "aura",
  }),
  agent({
    id: "analytics",
    name: "Analytics",
    group: "tools",
    preview: "Last 30 days: $48,393 from 386 orders.",
    topic: "Last 30 days",
    placeholder: "Ask Analytics…",
    orb: "aura",
  }),
];

const sidekick = agent({
  id: "sidekick",
  name: "Sidekick",
  group: "favorites",
  preview: "Lets get started",
  topic: "Get started",
  placeholder: "Work with Sidekick",
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

/** Scripted replies added by `run` play back like a live reply: a short think, then the words stream in. */
function revealNew(state: PrototypeState, run: () => void) {
  const before = Object.fromEntries(Object.entries(state.threads).map(([agentId, thread]) => [agentId, new Set(thread.map((block) => block.id))]));
  run();
  for (const [agentId, thread] of Object.entries(state.threads)) {
    state.threads[agentId] = thread.map((block) =>
      block.type === "text" && block.role === "assistant" && block.typed !== false && !before[agentId]?.has(block.id)
        ? { ...block, typed: true }
        : block,
    );
  }
  return state;
}

/** Moves the agent's current thread into its conversation list and starts a fresh one. */
function archive(state: PrototypeState, agentId: string) {
  const thread = state.threads[agentId] ?? [];
  if (thread.some((block) => block.type === "text" && block.role === "user")) {
    const agent = state.agents.find((item) => item.id === agentId);
    const firstAsk = thread.find((block) => block.type === "text" && block.role === "user");
    const title = agent?.topic || (firstAsk?.type === "text" ? firstAsk.text : "New conversation");
    state.conversations[agentId] = [{ id: id(state), title, at: Date.now(), blocks: thread }, ...(state.conversations[agentId] ?? [])];
  }
  state.threads[agentId] = [];
  patchAgent(state, agentId, { topic: "" });
}

function patchAgent(state: PrototypeState, agentId: string, patch: Partial<Agent>) {
  state.agents = state.agents.map((item) => (item.id === agentId ? { ...item, ...patch } : item));
}

export function setupState(storeName = "My Store", arrival: Arrival = "sidekick"): PrototypeState {
  const kick = {
    ...sidekick,
    installed: true,
    ...(arrival === "sidekick"
      ? {
          persona: sidekickArrivalPersona,
          preview: "With you from the first step",
          topic: "",
          purpose: "Find the next step, then do it in the admin.",
        }
      : {}),
  };
  return {
    signedIn: false,
    storeName,
    scenario: "setup",
    arrival,
    menuStyle: "push",
    agents: [kick],
    selectedAgentId: "sidekick",
    threads: {
      sidekick:
        arrival === "sidekick"
          ? [
              { id: "arrive", type: "text", role: "assistant", text: sidekickArrival(storeName), typed: true },
              { id: "arrive-chips", type: "chips", chips: arrivalChips },
            ]
          : [
              { id: "hello", type: "text", role: "assistant", text: sidekickHello, typed: true },
              { id: "hello-chips", type: "chips", chips: setupChips },
              { id: "hello-make", type: "text", role: "assistant", text: sidekickMakeYourOwn, typed: true },
              { id: "hello-make-chips", type: "chips", chips: makeYourOwnChips },
            ],
    },
    preview: "home-setup",
    previewWide: false,
    view: emptyView(),
    workspaces: { sidekick: homeFor("sidekick", "setup") },
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
    motion: true,
    seq: 10,
    conversations: arrival === "sidekick" ? {} : { sidekick: seedConversations(Date.now()) },
    conversationsOpen: false,
    ratings: {},
    cardsDone: [],
    cardsDismissed: [],
    lookbook: false,
    theme: null,
    introPlayed: false,
    workingAgentId: null,
  };
}

function activeThread(agentId: string): Block[] {
  if (agentId === "chief") {
    return [
      {
        id: "c1",
        type: "text",
        role: "assistant",
        text: "The last 30 days are at $48,393, from 386 orders. Average order value slipped to $125 from $134. Today is the quiet part of that: $2,079 from 14 orders.\n\nThree things I’d do. End the sitewide 20% on the USB-C Power Bank and offer it only after a headphone is in the cart. Studio ANC Headphones have 14 left and they’re $18,640 of these 30 days, so the reorder has to leave before Monday’s ads. Three orders still need a hand: #1078 and #1077 are paid and unfulfilled, and #1075 from yesterday hasn’t been paid.\n\nThe other sidekicks are already on pieces of it. Product ideas is drafting a headphone, case, and cable bundle at $289. Online store is fixing the desk lamp page, which still says 5–7 days while the ads say this week. Orders has those three orders. Shop app is looking at why Shop checkouts convert at 1.6% against 2.7% on the online store.",
        typed: true,
      },
      {
        id: "c2",
        type: "chips",
        chips: [
          { label: "What should I do first?", tone: "primary" },
          { label: "Show the best sellers", tone: "secondary" },
        ],
      },
    ];
  }
  const greeting = activeGreetings[agentId];
  const item = catalog.find((agent) => agent.id === agentId);
  if (!greeting) {
    return [{ id: `${agentId}-intro`, type: "text", role: "assistant", text: item?.preview ?? "Ready when you are.", typed: true }];
  }
  return [
    { id: `${agentId}-intro`, type: "text", role: "assistant", text: greeting.text, typed: true },
    {
      id: `${agentId}-intro-chips`,
      type: "chips",
      chips: greeting.asks.map((label, index) => ({ label, tone: index === 0 ? "primary" : "secondary", send: true })),
    },
  ];
}

const activeGreetings: Record<string, { text: string; asks: [string, string] }> = {
  ideas: {
    text: "Carts that skip the headphones are mostly a $49 power bank, which is why the average order is $125. A bundle of the Studio ANC Headphones, the earbuds case, and a cable at $289 would put the bank back in a supporting role. I can draft it.",
    asks: ["Draft the $289 bundle", "What else could we sell?"],
  },
  trends: {
    text: "Search is up 22% week over week for “travel charger” and “desk setup.” The power bank and the portable charger are catching it. Headphone search is flat, even though those 76 orders are $18,640 of the month.",
    asks: ["Which products fit the search?", "What’s driving the trend?"],
  },
  campaigns: {
    text: "Monday’s ads still say the desk lamp ships this week. The headphone photo should lead, and the restock can use the line “Back in stock. Ships tomorrow.” I can line those up.",
    asks: ["Line up Monday’s ads", "What should the restock say?"],
  },
  grok: {
    text: "The headphone launch thread on X has about 40 replies asking if the Studio ANC works for calls when it’s plugged into a USB-C hub. Nobody from the store has answered. One reply there would cover it.",
    asks: ["Draft a reply for X", "Summarize what people are saying"],
  },
  slack: {
    text: "In #ops this morning: #1078, #1077, and #1075 still need a hand, and the headphone bin is down to 14 units. The welcome email draft is ready whenever you want it.",
    asks: ["Show me the email draft", "What did the team flag?"],
  },
  claude: {
    text: "Two drafts are worth doing today. The welcome email, and a rewrite of the desk-lamp line so it says it ships this week. I’d include the note that 14 headphones are left.",
    asks: ["Draft the welcome email", "Rewrite the lamp line"],
  },
  gemini: {
    text: "On Google, “travel charger” and “desk setup” are up 22% week over week. The Shopping ad still crops the headphone, so people see the earcup and not the product.",
    asks: ["What is Google matching?", "Fix the Shopping ad"],
  },
  muse: {
    text: "For the headphone restock: one photo of the Studio ANC on a desk, and the line “Back in stock. Ships tomorrow.” I’d leave the lamp out of this one.",
    asks: ["Give me three headlines", "Name the campaign"],
  },
  store: {
    text: "The Desk Lamp page still says it ships in 5–7 days. The ads running this week say it ships this week. That gap is on the product page and in the cart. I can rewrite the delivery line.",
    asks: ["What should we change on the storefront?", "Show me theme ideas"],
  },
  shop: {
    text: "Shop brought in sessions and converted at 1.6% over the last 30 days. The online store converted at 2.7%. The Shop listing crops the headphone photo, so the grid shows the earcup and not the product. That’s the first fix.",
    asks: ["Fix the Shop listing crop", "How does Shop compare to the online store?"],
  },
  pos: {
    text: "The counter hasn’t taken a sale this month. This store is online. If Danielle picks up #1078 in person, that’s the order the reader should ring.",
    asks: ["Any in-person sales?", "What about pickup?"],
  },
  agentic: {
    text: "Shopping agents placed 41 orders this month, $6,840. The ones that stall do it on the desk lamp, because the page says 5–7 days and the ad says this week.",
    asks: ["Where do agent orders stall?", "How much are they worth?"],
  },
  customers: {
    text: "28% of this month’s orders are from people who’ve bought before. The ones on their second order keep asking for two years of warranty on the headphones, not a points program. That’s the smaller test.",
    asks: ["Who should I group?", "Who is coming back?"],
  },
  orders: {
    text: "Three orders need a hand. #1078 Danielle Hudson, $369.99, paid, headphones and accessories, not fulfilled. #1077 Maya Chen, $89, paid, desk lamp, not fulfilled. #1075 Priya Patel, $58, not paid and not fulfilled. Everything older than yesterday has shipped.",
    asks: ["Which order needs me?", "Which one should I clear first?"],
  },
  finance: {
    text: "Today’s payout is $2,184.60 and it’s already on the way. The headphone orders are most of that. The last 30 days of sales behind it are $48,393.",
    asks: ["When does the payout land?", "What is it made of?"],
  },
  analytics: {
    text: "The last 30 days are $48,393 from 386 orders. Conversion is 2.7% on 14,280 sessions. Today is the quiet part of that: $2,079 from 14 orders.",
    asks: ["Show me analytics", "How does today compare?"],
  },
};

export function activeState(storeName = "My Store"): PrototypeState {
  const base = setupState(storeName, "tasks");
  const installed = catalog.filter((item) => isListedSidekick(item.id)).map((item) => ({
    ...item,
    installed: true,
    preview: item.id === "chief" ? "Last 30 days: $48,393" : item.preview,
    topic: item.id === "chief" ? "Last 30 days" : item.topic,
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
    view: emptyView(),
    workspaces: { chief: homeFor("chief", "active") },
  };
}

export function visibleAgents(state: PrototypeState) {
  const query = state.search.trim().toLowerCase();
  return state.agents.filter((item) => item.installed && isListedSidekick(item.id) && (!query || item.name.toLowerCase().includes(query)));
}

function ensureInstalled(state: PrototypeState, sourceId: string) {
  if (!isListedSidekick(sourceId)) return null;
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
    } else if (effect.type === "focus") {
      state.previewWide = effect.wide;
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
      state.previewWide = effect.wide ?? false;
      state.view = {
        ...state.view,
        recordId: product.id,
        scroll: 0,
        draft: { title: product.title, description: product.description, price: product.price, status: product.status },
      };
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
    } else if (effect.type === "chips") {
      push(state, "sidekick", { id: id(state), type: "chips", chips: effect.chips });
    } else if (effect.type === "lookbook") {
      state.lookbook = true;
    } else if (effect.type === "choose-theme") {
      state.theme = effect.name;
      state.lookbook = true;
      state.preview = "online-store";
      state.previewWide = true;
      if (!state.cardsDone.includes("theme")) state.cardsDone.push("theme");
      patchAgent(state, "sidekick", { topic: effect.name, preview: `${effect.name} is the design.` });
    }
  }
}

function learnMore() {
  return "Shopify Payments charges no transaction fees. Card rates start at 2.5% + $0.30. Shop Pay, Visa, and Mastercard are ready once payout details are in. Most stores finish in about 10 minutes.";
}

const workPages = new Set<PreviewId>(["products", "product", "payments-setup", "shipping", "domain", "address", "online-store", "pos", "orders"]);

const showVerb = /\b(show|open|pull up|bring up|display)\b|\blet me see\b|\blook at\b|\b(see|view) (my|the|our)\b/i;

function mentions(text: string, label: string) {
  const escaped = label.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\b)${escaped}\\b`, "i").test(text);
}

function showLine(page: PreviewId, top = false) {
  if (page === "products" && top) {
    return "Products are open. Studio ANC Headphones lead the last 30 days at $18,640 from 76 orders. The USB-C Power Bank is next at $6,370.";
  }
  if (page === "products") return "Products are open. The headphones are $18,640 of the last 30 days, and the power bank is next.";
  if (page === "orders") return "Orders are open. #1078 and #1077 are paid and still unfulfilled, and #1075 hasn’t been paid.";
  if (page === "home-active") return "Home is open. The last 30 days are $48,393 from 386 orders.";
  if (page === "customers") return "Customers are open. 28% of this month’s orders are from people who have bought before.";
  if (page === "analytics") return "Analytics is open. Today is $2,079 from 14 orders.";
  return `${pageMeta(page).title} is open.`;
}

/** A request to look at a page that already exists in the admin. The right pane should grow. */
export function askedAdminPage(text: string): { page: PreviewId; line: string } | null {
  if (!showVerb.test(text)) return null;
  const q = text.toLowerCase();
  if (/top products|best[- ]?sellers?|best[- ]?selling/.test(q)) return { page: "products", line: showLine("products", true) };
  if (/online store|storefront/.test(q)) return { page: "online-store", line: showLine("online-store") };
  if (/live store|\bdashboard\b|\bhome\b/.test(q)) return { page: "home-active", line: showLine("home-active") };
  if (/point of sale|\bpos\b/.test(q)) return { page: "pos", line: showLine("pos") };
  const entries: { label: string; page: PreviewId }[] = [];
  for (const item of [...mainNav, ...channelNav]) {
    if (item.page !== "home") entries.push({ label: item.label, page: item.page });
    for (const child of item.children ?? []) {
      if (/^(pages|settings|posts|files|menus|reports)$/i.test(child.label)) continue;
      entries.push({ label: child.label, page: child.page });
    }
  }
  for (const row of settingsNav) entries.push({ label: row.label, page: row.page });
  entries.sort((a, b) => b.label.length - a.label.length);
  for (const entry of entries) {
    if (!mentions(q, entry.label)) continue;
    return { page: entry.page, line: showLine(entry.page) };
  }
  if (/\bproducts?\b|\bcatalog\b/.test(q)) return { page: "products", line: showLine("products") };
  if (/\borders\b/.test(q)) return { page: "orders", line: showLine("orders") };
  return null;
}

/** Show requests open that admin page in the large pane, whichever agent answered. */
export function focusAskedPage(text: string, effects: Effect[]): Effect[] {
  const asked = askedAdminPage(text);
  if (!asked) return effects;
  const rest = effects.filter((effect) => effect.type !== "navigate" && effect.type !== "focus");
  return [...rest, { type: "navigate", page: asked.page, wide: true }];
}

/** The Sidekick opening. Exact phrases from the first chips, plus the same words typed. */
const themeChoice: Record<string, string> = {
  Horizon: "Horizon it is. Clear, and ready for a catalog. Tell me the first thing you sell and I'll put it on this page.",
  Tinker: "Tinker it is. Made for objects, with some air around them. Tell me the first thing you sell and I'll put it on this page.",
  Dwell: "Dwell it is. Quiet, and right for a home store. Tell me the first thing you sell and I'll put it on this page.",
};

function arrivalIntent(text: string, storeName: string): { text: string; effects: Effect[]; follow?: Chip[]; topic?: string } | null {
  const q = text.trim().toLowerCase().replace(/[.!?]+$/, "");
  const chosen = q.match(/^let's go with (horizon|tinker|dwell)$/);
  if (chosen) {
    const name = chosen[1].charAt(0).toUpperCase() + chosen[1].slice(1);
    return {
      topic: name,
      text: themeChoice[name],
      effects: [{ type: "choose-theme", name }],
    };
  }
  if (q === "i have something to sell" || q === "start something new" || q === "start a new store") {
    return {
      topic: "First product",
      text: "Tell me the first thing you sell. A name is enough, and I'll add it here as a draft.",
      effects: [{ type: "navigate", page: "products", wide: true }],
    };
  }
  if (q === "i already sell somewhere" || q === "i already have a store" || q === "bring a store i already have") {
    return {
      topic: "Existing catalog",
      text: "I opened Products. Nothing in here is for sale yet. Where do the real products live today, a spreadsheet or another shop?",
      effects: [{ type: "navigate", page: "products", wide: true }],
    };
  }
  if (
    q === "help me start" ||
    q === "help me" ||
    q === "help me find a way in" ||
    q === "show me a route" ||
    q === "show me the store" ||
    q === "show me around" ||
    q === "look around" ||
    q === "just show me around"
  ) {
    return {
      topic: "A design",
      text: `Three designs for ${storeName} are on the right. Pick the one that feels like the store.`,
      effects: [
        { type: "navigate", page: "online-store", wide: true },
        { type: "lookbook" },
      ],
    };
  }
  if (q === "add a product") {
    return {
      topic: "First product",
      text: "Products are open. Nothing here is for sale yet. Tell me the first thing you sell and I'll add it as a draft.",
      effects: [{ type: "navigate", page: "products", wide: true }],
    };
  }
  if (q === "get paid") {
    return {
      topic: "Get paid",
      text: "Getting paid is Shopify Payments. Four short parts, about ten minutes. The plan is here. Say when you want to start and I'll open the form.",
      effects: [{ type: "artifact", name: "payments-plan" }],
    };
  }
  if (q === "set up shipping") {
    return {
      topic: "Shipping",
      text: "Orders to the United States can go Standard or Express. I opened shipping so you can see the rates. We can change them once you know where you ship from.",
      effects: [{ type: "navigate", page: "shipping", wide: true }],
    };
  }
  return null;
}

function productFrom(text: string) {
  if (text.includes("?")) return null;
  const match = text.match(/\b(?:sell(?:ing)?|called|i make|we make)\s+(.+)/i);
  if (!match) return null;
  const title = match[1]
    .replace(/[.!].*$/, "")
    .trim()
    .replace(/^(?:an?|the)\s+/i, "");
  if (title.length < 2 || title.length > 48) return null;
  if (/^(somewhere|online|already|today)\b/i.test(title)) return null;
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function presentForSidekick(turn: { text: string; effects: Effect[] }, text: string, storeName: string) {
  const intent = arrivalIntent(text, storeName);
  if (intent) {
    return {
      text: intent.text,
      effects: intent.follow ? [...intent.effects, { type: "chips" as const, chips: intent.follow }] : intent.effects,
    };
  }
  const title = productFrom(text);
  if (title && turn.effects.every((effect) => effect.type !== "add-product")) {
    return {
      text: `I added “${title}” as a draft and opened it. Add a price and a photo over there, then save it when it looks like yours.`,
      effects: [
        {
          type: "add-product" as const,
          title,
          price: "0.00",
          description: "Drafted with Sidekick. Add a photo and a price before it goes live.",
          wide: true,
        },
      ],
    };
  }
  const checklist = `I can keep setting up ${storeName}. Ask me to review payments, choose a theme, set up a domain, review shipping, add a retail address, or order POS hardware.`;
  const effects = turn.effects.map((effect) => {
    if (effect.type === "navigate" && effect.wide === undefined) return { ...effect, wide: workPages.has(effect.page) };
    if (effect.type === "add-product" && effect.wide === undefined) return { ...effect, wide: true };
    return effect;
  });
  const moved = effects.some((effect) => effect.type === "navigate" || effect.type === "add-product" || effect.type === "artifact" || effect.type === "business-type");
  if (!moved) effects.push({ type: "focus", wide: false });
  const reply =
    turn.text === checklist
      ? `Tell me what you want to do with ${storeName}. Name something you sell and I'll open a draft. Payments, shipping, a theme, or a domain opens that page.`
      : turn.text;
  return { text: reply, effects };
}

export function runChip(state: PrototypeState, label: string) {
  const agentId = state.selectedAgentId;
  if (label === "Save as draft" || label === "Publish") {
    confirmProduct(state, label === "Publish");
    return;
  }
  if (label === "Open the product") {
    push(state, agentId, { id: id(state), type: "text", role: "user", text: label });
    state.preview = "product";
    state.previewWide = true;
    push(state, agentId, { id: id(state), type: "text", role: "assistant", text: "Here’s the draft. You can still edit any field." });
    return;
  }
  if (state.arrival === "sidekick" && agentId === "sidekick") {
    const intent = arrivalIntent(label, state.storeName);
    if (intent) {
      push(state, "sidekick", { id: id(state), type: "text", role: "user", text: label });
      push(state, "sidekick", { id: id(state), type: "text", role: "assistant", text: intent.text, typed: false });
      if (intent.follow) push(state, "sidekick", { id: id(state), type: "chips", chips: intent.follow });
      applyEffects(state, intent.effects);
      if (intent.topic) patchAgent(state, "sidekick", { topic: intent.topic, preview: intent.text });
      return;
    }
  }
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
      text: "Your store is on Horizon, Shopify’s free default theme. It’s a clean start, and Tinker and Dwell are worth a look if you want something more editorial. I opened Online Store so you can compare them before you customize.",
    });
    patchAgent(state, "sidekick", { topic: "Choose a theme", preview: "Horizon is live. Compare themes." });
    state.preview = "online-store";
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
      text: "Shipping is set up for your United States market with two options, Standard and Express, based on your location. Shipping rates now live in Markets, so I opened Shipping and delivery where you can review them.",
    });
    patchAgent(state, "sidekick", { topic: "Shipping", preview: "Standard and Express for the US." });
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
      text: "POS hardware is the reader, dock, and receipt printer. I opened Point of Sale. Shop POS hardware is under Recommended for you, and you can sign in to the POS app with the QR code.",
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
      text: "A sidekick is an agent with a job: a persona, a place in the nav, and tools that can change the admin. Add a recommended one, connect Slack, Grok, Claude, or Gemini, or name your own. Each keeps a separate conversation.",
    });
    return;
  }
  if (label === "Add a chief of staff") {
    push(state, "sidekick", { id: id(state), type: "text", role: "user", text: label });
    applyEffects(state, [{ type: "add-sidekick", id: "chief" }]);
    return;
  }
  if (label === "Browse sidekicks") {
    state.mode = "add";
    return;
  }
  if (label === "Create my own sidekick") {
    state.mode = "create";
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
        text: `I’ll focus on ${focus}. The last 30 days are $48,393 from 386 orders, and the average order slipped to $125. I’d end the power-bank discount, reorder the headphones, and clear #1078, #1077, and #1075. Ask me what to do first, or open the live store.`,
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
    state.previewWide = true;
    const missing = catalog.filter((item) => isListedSidekick(item.id) && !state.agents.some((agent) => agent.id === item.id && agent.installed));
    for (const item of missing) {
      state.agents.push({ ...item, installed: true });
      if (!state.threads[item.id]) state.threads[item.id] = activeThread(item.id);
    }
    patchAgent(state, "chief", { preview: "Last 30 days: $48,393", topic: "Last 30 days" });
    return;
  }
  if (label === "What should I do next?" || label === "What should I do first?") {
    push(state, "chief", { id: id(state), type: "text", role: "user", text: label });
    push(state, "chief", {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "Reorder the Studio ANC Headphones first. Fourteen units won’t cover Monday’s ads, and they’re $18,640 of this month. Then turn off the sitewide 20% on the USB-C Power Bank. Then clear #1078 and #1077, both paid and still unfulfilled.",
    });
    return;
  }
  if (label === "Show the best sellers") {
    push(state, "chief", { id: id(state), type: "text", role: "user", text: label });
    push(state, "chief", { id: id(state), type: "sellers" });
    push(state, "chief", {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "Studio ANC Headphones are $18,640 from 76 orders. The USB-C Power Bank is next at $6,370 from 130 orders, mostly because of the 20% off.",
    });
    state.preview = "products";
    state.previewWide = true;
    return;
  }
  if (label === "Review in more detail") {
    push(state, agentId, { id: id(state), type: "text", role: "user", text: label });
    push(state, agentId, {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "The headphones convert when the case is in the first image. The lamp loses people on shipping: the page says 5–7 days and the ads say this week. I’d make the lamp say “ships this week” and put the $289 bundle next to the headphones.",
    });
    state.preview = "products";
    state.previewWide = true;
    return;
  }
  if (label === "Confirm changes") {
    push(state, agentId, { id: id(state), type: "text", role: "user", text: label });
    push(state, agentId, {
      id: id(state),
      type: "text",
      role: "assistant",
      text: "Confirmed. I’ll keep the $289 bundle on the Studio ANC Headphones and the delivery note on the Desk Lamp. Nothing is published until you edit the product.",
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

export function scriptedTurn(agentId: string, text: string, storeName: string, arrival: Arrival = "tasks") {
  const turn = scriptedReply(agentId, text, storeName);
  const presented = arrival === "sidekick" && agentId === "sidekick" ? presentForSidekick(turn, text, storeName) : turn;
  return { text: presented.text, effects: focusAskedPage(text, presented.effects) };
}

function scriptedReply(agentId: string, text: string, storeName: string): { text: string; effects: Effect[] } {
  const asked = askedAdminPage(text);
  if (asked) return { text: asked.line, effects: [{ type: "navigate", page: asked.page, wide: true }] };
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
      text: "This month’s best sellers are the Studio ANC Headphones, $18,640 from 76 orders, and the USB-C Power Bank, $6,370 from 130 orders. I’d reorder the headphones and stop the sitewide discount on the bank.",
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
    effects.push({ type: "navigate", page: "online-store" });
    return { text: "Horizon is your current theme. I opened Online Store so you can preview it or compare Tinker and Dwell.", effects };
  }
  if (/domain/.test(q)) {
    effects.push({ type: "navigate", page: "domain" });
    return { text: `Your store is still on a myshopify.com address. Connect a domain whenever you’re ready.`, effects };
  }
  if (/shipping|rates/.test(q)) {
    effects.push({ type: "navigate", page: "shipping" });
    return { text: "Your United States market ships with Standard and Express. I opened Shipping and delivery in the preview.", effects };
  }
  if (/address|retail|pickup/.test(q)) {
    effects.push({ type: "navigate", page: "address" });
    return { text: "Add the retail address in the preview. That unlocks pickup and local delivery.", effects };
  }
  if (/pos|hardware|reader/.test(q)) {
    effects.push({ type: "navigate", page: "pos" });
    return { text: "POS hardware is a reader, dock, and printer. I opened Point of Sale; Shop POS hardware is under Recommended for you.", effects };
  }
  if (/home|dashboard/.test(q)) {
    effects.push({ type: "navigate", page: "home-active" });
    return { text: "Here’s the live Home dashboard.", effects };
  }
  if (/\border/.test(q)) {
    effects.push({ type: "navigate", page: "orders" });
    return { text: "Orders are open in the preview.", effects };
  }
  if (/product/.test(q)) {
    effects.push({ type: "navigate", page: "products" });
    return { text: "Products are in the preview. Everything is still a draft.", effects };
  }
  const fallback: Record<string, string> = {
    sidekick: `I can keep setting up ${storeName}. Ask me to review payments, choose a theme, set up a domain, review shipping, add a retail address, or order POS hardware.`,
    chief: "The last 30 days are $48,393 from 386 orders, and the average order slipped to $125. I’d reorder the headphones, end the power-bank discount, and clear the three open orders.",
    ideas: "A $289 bundle of the Studio ANC Headphones, the earbuds case, and a cable is the draft I’d add. It puts the $49 power bank back in a supporting role.",
    trends: "Travel charger and desk setup searches are up 22% this week. Headphone search is flat even though those orders are $18,640.",
    campaigns: "Monday’s ads should lead with the headphones and say the lamp ships this week. The restock line is “Back in stock. Ships tomorrow.”",
    slack: "The welcome email is drafted. #ops also flagged #1078, #1077, #1075, and 14 headphones left.",
    grok: "X is waiting on whether the Studio ANC Headphones work for calls through a USB-C hub. I can draft that reply.",
    muse: "The restock line is “Back in stock. Ships tomorrow.” One desk photo of the headphones, and leave the lamp out.",
    claude: "I can draft the welcome email and rewrite the lamp line so it says the lamp ships this week.",
    gemini: "Google is matching travel charger and desk setup, up 22% this week. The Shopping ad still crops the headphones.",
    store: "The Desk Lamp page should say it ships this week, matching the ads. I can open the product if you want to edit it.",
    shop: "Shop converts at 1.6% against 2.7% on the online store. The listing crop on the headphones is the first fix.",
    pos: "No counter sales this month. Pickup for #1078 is the in-person order to watch.",
    agentic: "Shopping agents placed 41 orders, $6,840. They stall when the lamp page says 5–7 days and the ad says this week.",
    customers: "28% of orders are from returning buyers. The ask on the second order is a longer headphone warranty, not points.",
    orders: "#1078 and #1077 are paid and unfulfilled. #1075 is unpaid. I can open orders in the preview.",
    finance: "Today’s payout is $2,184.60 and it’s on the way. The last 30 days behind it are $48,393.",
    analytics: "Last 30 days: $48,393, 386 orders, 2.7% conversion. Today is $2,079 from 14 orders.",
    custom: "Tell me what you want this sidekick to take off your plate.",
  };
  return { text: fallback[agentId] ?? (agentId.startsWith("custom-") ? fallback.custom : fallback.sidekick), effects };
}

export type Action =
  | { type: "sign-in"; storeName: string }
  | { type: "boot-active" }
  | { type: "select"; id: string }
  | { type: "toggle-add" }
  | { type: "toggle-search" }
  | { type: "search"; query: string }
  | { type: "scenario"; scenario: Scenario }
  | { type: "arrival"; arrival: Arrival }
  | { type: "menu-style"; style: MenuStyle }
  | { type: "reset" }
  | { type: "chip"; label: string }
  | { type: "user"; agentId: string; text: string }
  | { type: "commit"; agentId: string; text: string; segments?: Segment[]; sources?: Source[]; streamed?: boolean }
  | { type: "effects"; effects: Effect[] }
  | { type: "business-type"; value: BusinessType }
  | { type: "identity"; patch: Partial<PrototypeState["identity"]> }
  | { type: "payments-next" }
  | { type: "payments-back" }
  | { type: "toggle-purpose"; id: string }
  | { type: "add-catalog"; id: string }
  | { type: "create-agent"; name: string; purpose: string }
  | { type: "edit-agent"; id: string; name: string; purpose: string; orb: OrbId; connections: Connection[]; orbFrom?: string; orbTo?: string }
  | { type: "intro-seen" }
  | { type: "preview"; page: PreviewId; wide?: boolean }
  | { type: "view"; patch: Partial<Omit<ViewState, "draft">> & { draft?: Record<string, string> } }
  | { type: "product"; id: string }
  | { type: "update-product"; id: string; patch: Partial<Product> }
  | { type: "rail"; id: string }
  | { type: "add-blank-product" }
  | { type: "card"; id: string }
  | { type: "dismiss-card"; id: string }
  | { type: "new-chat" }
  | { type: "conversations"; open: boolean }
  | { type: "open-conversation"; id: string }
  | { type: "delete-conversation"; id: string }
  | { type: "title"; agentId: string; title: string }
  | { type: "rate"; id: string; value: "up" | "down" }
  | { type: "logout" }
  | { type: "offer-choices"; agentId: string; intro: string; title: string; cards: ChoiceCard[]; mode: ChoiceMode; setKey?: string }
  | { type: "select-choice"; agentId: string; blockId: string; cardId: string; lock?: boolean }
  | { type: "arm-multi"; agentId: string }
  | { type: "begin-draft"; agentId: string; productId: string }
  | { type: "status"; agentId: string; label: string }
  | { type: "follow-up"; agentId: string; text: string; chips?: Chip[] }
  | { type: "confirm-product"; publish: boolean }
  | { type: "cancel-draft"; agentId: string };

export function reducer(state: PrototypeState, action: Action): PrototypeState {
  const next = reduceInner(state, action);
  if (next === state) return state;
  return settleWorkspace(state, next, action);
}

function reduceInner(state: PrototypeState, action: Action): PrototypeState {
  const next: PrototypeState = {
    ...state,
    agents: state.agents.map((item) => ({ ...item })),
    threads: Object.fromEntries(Object.entries(state.threads).map(([key, blocks]) => [key, [...blocks]])),
    completedSteps: [...state.completedSteps],
    purposes: [...state.purposes],
    products: state.products.map((product) => ({ ...product })),
    identity: { ...state.identity },
    conversations: Object.fromEntries(Object.entries(state.conversations).map(([key, list]) => [key, [...list]])),
    ratings: { ...state.ratings },
    cardsDone: [...state.cardsDone],
    cardsDismissed: [...state.cardsDismissed],
    view: { ...state.view, draft: { ...state.view.draft } },
    workspaces: Object.fromEntries(Object.entries(state.workspaces).map(([key, workspace]) => [key, { ...workspace, draft: { ...workspace.draft } }])),
  };

  switch (action.type) {
    case "sign-in": {
      next.signedIn = true;
      next.storeName = action.storeName.trim() || "My Store";
      return next;
    }
    case "boot-active":
      return { ...activeState(state.storeName), motion: state.motion, menuStyle: state.menuStyle };
    case "menu-style":
      next.menuStyle = action.style;
      return next;
    case "select": {
      const installed = next.agents.some((item) => item.id === action.id && item.installed);
      if (!installed) {
        if (!hiddenSidekicks.has(action.id)) return state;
        const source = catalog.find((item) => item.id === action.id);
        if (!source) return state;
        const revealed = { ...source, installed: true, unread: 0 };
        next.agents = next.agents.some((item) => item.id === action.id)
          ? next.agents.map((item) => (item.id === action.id ? revealed : item))
          : [...next.agents, revealed];
        if (!next.threads[action.id]?.length) next.threads[action.id] = activeThread(action.id);
      }
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
    case "scenario":
      return action.scenario === "active"
        ? { ...activeState(next.storeName), arrival: state.arrival, motion: true, signedIn: true, menuStyle: state.menuStyle }
        : { ...setupState(next.storeName, state.arrival), motion: true, signedIn: true, menuStyle: state.menuStyle };
    case "arrival":
      return { ...setupState(state.storeName, action.arrival), motion: true, signedIn: true, menuStyle: state.menuStyle };
    case "reset":
      return state.scenario === "active"
        ? { ...activeState(state.storeName), arrival: state.arrival, motion: state.motion, signedIn: true, menuStyle: state.menuStyle }
        : { ...setupState(state.storeName, state.arrival), motion: state.motion, signedIn: true, menuStyle: state.menuStyle };
    case "chip":
      return revealNew(next, () => runChip(next, action.label));
    case "user": {
      const first = !(next.threads[action.agentId] ?? []).some((block) => block.type === "text" && block.role === "user");
      push(next, action.agentId, { id: id(next), type: "text", role: "user", text: action.text });
      patchAgent(next, action.agentId, first ? { preview: action.text, topic: action.text } : { preview: action.text });
      next.conversationsOpen = false;
      if (first && next.arrival === "sidekick" && action.agentId === "sidekick") {
        const intent = arrivalIntent(action.text, next.storeName);
        if (intent) {
          applyEffects(next, intent.effects);
          if (intent.topic) patchAgent(next, "sidekick", { topic: intent.topic, preview: intent.text });
        }
      }
      return next;
    }
    case "title":
      patchAgent(next, action.agentId, { topic: action.title });
      return next;
    case "card": {
      const card = homeCards.find((item) => item.id === action.id);
      if (!card) return state;
      archive(next, "sidekick");
      next.selectedAgentId = "sidekick";
      next.mode = "thread";
      next.conversationsOpen = false;
      const before = next.preview;
      revealNew(next, () => runChip(next, card.chip));
      if (card.id === "pos") next.preview = before;
      patchAgent(next, "sidekick", { topic: card.title });
      if (!next.cardsDone.includes(card.id)) next.cardsDone.push(card.id);
      return next;
    }
    case "dismiss-card":
      if (!next.cardsDismissed.includes(action.id)) next.cardsDismissed.push(action.id);
      return next;
    case "new-chat":
      archive(next, next.selectedAgentId);
      next.mode = "thread";
      next.conversationsOpen = false;
      return next;
    case "conversations":
      next.conversationsOpen = action.open;
      next.mode = "thread";
      return next;
    case "open-conversation": {
      const agentId = next.selectedAgentId;
      const list = next.conversations[agentId] ?? [];
      const found = list.find((item) => item.id === action.id);
      if (!found) return state;
      next.conversations[agentId] = list.filter((item) => item.id !== action.id);
      archive(next, agentId);
      next.threads[agentId] = found.blocks;
      patchAgent(next, agentId, { topic: found.title });
      next.conversationsOpen = false;
      return next;
    }
    case "delete-conversation": {
      const agentId = next.selectedAgentId;
      next.conversations[agentId] = (next.conversations[agentId] ?? []).filter((item) => item.id !== action.id);
      return next;
    }
    case "rate":
      if (next.ratings[action.id] === action.value) delete next.ratings[action.id];
      else next.ratings[action.id] = action.value;
      return next;
    case "logout":
      return { ...setupState(state.storeName, state.arrival), motion: state.motion };
    case "commit": {
      const text = action.text.trim();
      if (!text) return state;
      const thread = next.threads[action.agentId] ?? [];
      const last = thread[thread.length - 1];
      if (last?.type === "text" && last.role === "assistant" && last.text === text) return state;
      push(next, action.agentId, { id: id(next), type: "text", role: "assistant", text, segments: action.segments, sources: action.sources, streamed: action.streamed });
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
      const label =
        next.businessType === "individual" ? "an individual" : next.businessType === "business" ? "a registered business" : "a non-profit";
      if (next.paymentsStep === "type") {
        next.paymentsStep = "identity";
        if (!next.completedSteps.includes(1)) next.completedSteps.push(1);
        push(next, "sidekick", {
          id: id(next),
          type: "text",
          role: "assistant",
          text: `Saved. You’re running the store as ${label}. Next is identity verification — about 4 minutes. I left the form in the preview.`,
        });
      } else if (next.paymentsStep === "identity") {
        next.paymentsStep = "security";
        if (!next.completedSteps.includes(2)) next.completedSteps.push(2);
        push(next, "sidekick", {
          id: id(next),
          type: "text",
          role: "assistant",
          text: "Identity is saved. Next is account security: turn on two-step authentication before you connect a payout account.",
        });
      } else if (next.paymentsStep === "security") {
        next.paymentsStep = "payout";
        if (!next.completedSteps.includes(3)) next.completedSteps.push(3);
        push(next, "sidekick", {
          id: id(next),
          type: "text",
          role: "assistant",
          text: "Account security is noted. The last step is the bank account where payouts should land.",
        });
      } else if (next.paymentsStep === "payout") {
        next.paymentsStep = "done";
        if (!next.completedSteps.includes(4)) next.completedSteps.push(4);
        push(next, "sidekick", {
          id: id(next),
          type: "text",
          role: "assistant",
          text: "Payout details are saved on this prototype. Shopify Payments setup is complete.",
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
    case "payments-back": {
      if (next.paymentsStep === "identity") next.paymentsStep = "type";
      else if (next.paymentsStep === "security") next.paymentsStep = "identity";
      else if (next.paymentsStep === "payout") next.paymentsStep = "security";
      else if (next.paymentsStep === "done") next.paymentsStep = "payout";
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
      if (!source || !isListedSidekick(action.id)) return state;
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
            typed: true,
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
      created.persona = `You are ${name}, a custom Shopify sidekick for this electronics store. Purpose: ${action.purpose || "help the merchant"}. ${persona.custom} ${storeFacts}`;
      next.agents = [...next.agents, created];
      const job = action.purpose.trim().replace(/\.+$/, "");
      const task = /^[A-Z][a-z]/.test(job) ? job.charAt(0).toLowerCase() + job.slice(1) : job;
      next.threads[slug] = [
        {
          id: id(next),
          type: "text",
          role: "assistant",
          text: task ? `I’m ${name}. I’ll ${task}. What should we do first?` : `I’m ${name}. Tell me what you want me to take on.`,
          typed: true,
        },
      ];
      next.selectedAgentId = slug;
      next.mode = "thread";
      return next;
    }
    case "intro-seen":
      next.introPlayed = true;
      return next;
    case "edit-agent": {
      const current = next.agents.find((item) => item.id === action.id);
      if (!current) return state;
      const name = action.name.trim() || current.name;
      const purpose = action.purpose.trim() || current.purpose;
      const placeholder = current.placeholder.includes(current.name) ? current.placeholder.replaceAll(current.name, name) : current.placeholder;
      patchAgent(next, action.id, {
        name,
        purpose,
        orb: action.orb,
        connections: action.connections.map((item) => ({ ...item })),
        placeholder,
        persona: `You are ${name}, a Shopify sidekick. Purpose: ${purpose}.`,
        orbFrom: action.orbFrom,
        orbTo: action.orbTo,
      });
      return next;
    }
    case "preview":
      if (action.page === next.preview) {
        next.previewWide = action.wide ?? action.page === "payments-setup";
        return next;
      }
      openPage(next, action.page, action.wide);
      return next;
    case "view":
      next.view = {
        ...next.view,
        ...action.patch,
        draft: action.patch.draft ? { ...next.view.draft, ...action.patch.draft } : next.view.draft,
      };
      if (action.patch.recordId !== undefined && next.preview === "product") next.selectedProductId = action.patch.recordId;
      return next;
    case "product":
      next.selectedProductId = action.id;
      next.preview = "product";
      next.previewWide = false;
      next.view = { ...next.view, recordId: action.id, scroll: 0 };
      return next;
    case "update-product":
      next.products = next.products.map((product) =>
        product.id === action.id ? { ...product, ...action.patch } : product,
      );
      return next;
    case "add-blank-product": {
      const product: Product = {
        id: id(next),
        title: "",
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
      next.view = { ...emptyView(), query: next.view.query, tab: next.view.tab, sort: next.view.sort, recordId: product.id };
      return next;
    }
    case "rail": {
      const page = railPage(action.id, next);
      openPage(next, page, false);
      return next;
    }
    case "offer-choices": {
      const thread = next.threads[action.agentId] ?? [];
      const replaced = thread.map((block) => (block.type === "choices" && !block.replaced ? { ...block, replaced: true, settled: true } : block));
      next.threads[action.agentId] = replaced;
      push(next, action.agentId, { id: id(next), type: "text", role: "assistant", text: action.intro, typed: true });
      push(next, action.agentId, {
        id: id(next),
        type: "choices",
        title: action.title,
        cards: action.cards,
        selected: [],
        mode: action.mode,
        setKey: action.setKey,
      });
      return next;
    }
    case "select-choice": {
      next.threads[action.agentId] = (next.threads[action.agentId] ?? []).map((block) => {
        if (block.type !== "choices" || block.id !== action.blockId) return block;
        const selected = action.lock
          ? block.selected.includes(action.cardId) ? block.selected : [...block.selected, action.cardId]
          : block.mode === "multi"
            ? block.selected.includes(action.cardId)
              ? block.selected.filter((item) => item !== action.cardId)
              : [...block.selected, action.cardId]
            : [action.cardId];
        return { ...block, selected, settled: block.mode === "single" || Boolean(action.lock) };
      });
      return next;
    }
    case "arm-multi": {
      next.threads[action.agentId] = (next.threads[action.agentId] ?? []).map((block) =>
        block.type === "choices" && !block.replaced ? { ...block, mode: "multi" } : block,
      );
      push(next, action.agentId, {
        id: id(next),
        type: "text",
        role: "assistant",
        text: "Pick two and I’ll bundle them into one draft.",
        typed: true,
      });
      return next;
    }
    case "begin-draft": {
      const product: Product = {
        id: action.productId,
        title: "",
        price: "",
        status: "Draft",
        tone: "sand",
        description: "",
        inventory: "0 in stock",
      };
      next.products = [product, ...next.products];
      next.selectedProductId = product.id;
      next.preview = "product";
      next.previewWide = true;
      next.view = { ...emptyView(), recordId: product.id };
      next.workingAgentId = action.agentId;
      return next;
    }
    case "status": {
      const thread = (next.threads[action.agentId] ?? []).filter((block) => block.type !== "status");
      next.threads[action.agentId] = [...thread, { id: `${action.agentId}-status`, type: "status", label: action.label }];
      next.workingAgentId = action.agentId;
      return next;
    }
    case "follow-up": {
      next.threads[action.agentId] = (next.threads[action.agentId] ?? []).filter((block) => block.type !== "status");
      next.workingAgentId = null;
      push(next, action.agentId, { id: id(next), type: "text", role: "assistant", text: action.text, typed: true });
      if (action.chips?.length) push(next, action.agentId, { id: id(next), type: "chips", chips: action.chips });
      return next;
    }
    case "confirm-product":
      confirmProduct(next, action.publish);
      return next;
    case "cancel-draft": {
      next.workingAgentId = null;
      next.threads[action.agentId] = (next.threads[action.agentId] ?? [])
        .filter((block) => block.type !== "status")
        .map((block) => (block.type === "choices" && !block.replaced ? { ...block, settled: true } : block));
      if (next.preview === "product") {
        next.preview = "products";
        next.previewWide = false;
        next.view = emptyView();
      }
      push(next, action.agentId, {
        id: id(next),
        type: "text",
        role: "assistant",
        text: "Okay. I left that draft in Products. Nothing was published.",
        typed: true,
      });
      return next;
    }
    default:
      return state;
  }
}

function confirmProduct(state: PrototypeState, publish: boolean) {
  const agentId = state.selectedAgentId;
  const product = state.products.find((item) => item.id === state.selectedProductId);
  const title = product?.title.trim() || "Untitled product";
  state.products = state.products.map((item) =>
    item.id === state.selectedProductId ? { ...item, status: publish ? "Active" : "Draft" } : item,
  );
  state.preview = "products";
  state.previewWide = true;
  state.view = { ...emptyView() };
  state.workingAgentId = null;
  state.threads[agentId] = (state.threads[agentId] ?? []).filter((block) => block.type !== "status");
  const kept = publish ? "published" : "saved as a draft";
  push(state, agentId, { id: id(state), type: "text", role: "user", text: publish ? "Publish" : "Save as draft" });
  push(state, agentId, {
    id: id(state),
    type: "text",
    role: "assistant",
    text: `${title} is ${kept}. It’s in the products list.`,
    typed: true,
  });
  push(state, agentId, { id: id(state), type: "chips", chips: [{ label: "Open the product", tone: "primary" }] });
}

const freshActions = new Set<Action["type"]>(["scenario", "reset", "arrival", "boot-active", "logout", "sign-in"]);
const restoringActions = new Set<Action["type"]>(["select", "add-catalog", "create-agent"]);

function openPage(state: PrototypeState, page: PreviewId, wide?: boolean) {
  if (sameDesk(state.preview, page)) state.view = { ...state.view, recordId: "", scroll: 0 };
  else state.view = emptyView();
  state.preview = page;
  state.previewWide = wide ?? page === "payments-setup";
}

function settleWorkspace(prev: PrototypeState, next: PrototypeState, action: Action): PrototypeState {
  if (freshActions.has(action.type)) return next;
  const live = readLiveScroll();
  if (next.selectedAgentId !== prev.selectedAgentId) {
    next.workspaces = { ...next.workspaces, [prev.selectedAgentId]: captureWorkspace(prev, live ?? prev.view.scroll) };
  }
  if (restoringActions.has(action.type)) {
    applyWorkspace(next, next.selectedAgentId, next.scenario);
    return next;
  }
  if (action.type !== "view" && next.preview !== prev.preview && !sameDesk(prev.preview, next.preview)) {
    next.view = emptyView();
  }
  const samePlace = next.preview === prev.preview && next.selectedAgentId === prev.selectedAgentId;
  const scroll = samePlace ? (live ?? next.view.scroll) : next.view.scroll;
  next.workspaces = { ...next.workspaces, [next.selectedAgentId]: captureWorkspace(next, scroll) };
  return next;
}

export function restoreWork(state: PrototypeState, saved: SavedWork): PrototypeState {
  if (saved.scenario !== state.scenario || !saved.workspaces) return state;
  const customAgents = (Array.isArray(saved.agents) ? (saved.agents as Agent[]) : []).filter(
    (agent) => agent && typeof agent.id === "string" && agent.id.startsWith("custom-"),
  );
  const agents = state.agents.map((agent) => ({ ...agent }));
  for (const agent of customAgents) {
    const index = agents.findIndex((item) => item.id === agent.id);
    if (index >= 0) agents[index] = { ...agents[index], ...agent, installed: true };
    else agents.push({ ...agent, installed: true });
  }
  const threads = { ...state.threads };
  for (const agent of customAgents) {
    const blocks = saved.threads?.[agent.id];
    if (Array.isArray(blocks)) threads[agent.id] = blocks as Block[];
  }
  const products: Product[] =
    Array.isArray(saved.products) && saved.products.length
      ? saved.products.map((product) => ({ ...product, tone: product.tone as Product["tone"], status: product.status === "Active" ? "Active" : "Draft" }))
      : state.products;
  const workspaces: Record<string, Workspace> = {};
  for (const [id, workspace] of Object.entries(saved.workspaces)) {
    if (!workspace || !(previewPages as readonly string[]).includes(workspace.page)) continue;
    workspaces[id] = { ...emptyView(), ...workspace, draft: { ...(workspace.draft ?? {}) } };
  }
  const selected = agents.some((agent) => agent.id === saved.selectedAgentId && agent.installed) ? saved.selectedAgentId : state.selectedAgentId;
  const next: PrototypeState = {
    ...state,
    agents,
    threads,
    products,
    workspaces,
    selectedAgentId: selected,
    seq: Math.max(state.seq, saved.seq || 0),
    view: emptyView(),
  };
  applyWorkspace(next, selected, next.scenario);
  return next;
}

function railPage(id: string, state: PrototypeState): PreviewId {
  if (id === "home") return state.scenario === "active" || state.chiefPhase === "working" ? "home-active" : "home-setup";
  const item = findNav(id);
  if (item && item.page !== "home") return item.page;
  return (previewPages as readonly string[]).includes(id) ? (id as PreviewId) : state.preview;
}

export function railForPreview(page: PreviewId): string {
  return navFor(page).id;
}

export function personaFor(id: string) {
  if (id === "sidekick") return persona.sidekick;
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
    arrival: state.arrival,
    businessType: state.businessType,
    paymentsStep: state.paymentsStep,
    completedSteps: state.completedSteps,
    installedAgents: state.agents.filter((item) => item.installed).map((item) => item.id),
    productTitles: state.products.slice(0, 8).map((product) => product.title),
  };
}
