/** Selectable suggestion cards. The chat renders these; picking one does the work in the admin. */

export type ChoiceKind = "product" | "segment" | "order" | "theme";

export type ChoiceCard = {
  id: string;
  title: string;
  pitch: string;
  price: string;
  signal: string;
  why: string;
  image: string;
  kind: ChoiceKind;
  /** Product or bundle the admin form should fill. */
  draft?: { title: string; price: string; description: string; image: string };
  /** Customer names the segment keeps, joined later with |. */
  names?: string[];
  /** Order to open, and the action waiting on it. */
  orderId?: string;
  action?: string;
  /** Note to show on the online store page. */
  note?: string;
};

export type ChoiceMode = "single" | "multi";

const img = (name: string) => `/assets/products/${name}.webp`;
const theme = (name: string) => `/assets/admin/theme-${name}.png`;

const bundleDraft = {
  title: "Headphone bundle",
  price: "289.00",
  description:
    "Studio ANC Headphones, the earbuds case, and a cable. Priced to lift the $125 average order and put the $49 power bank back in a supporting role.",
  image: img("studio-anc-headphones"),
};

export const ideaSets: ChoiceCard[][] = [
  [
    {
      id: "travel-kit",
      title: "Travel charger kit",
      pitch: "Adapter, cable, and a pouch for the search that is already climbing.",
      price: "$64",
      signal: "About 52% margin",
      why: "“Travel charger” search is up 22% this week, and the portable charger is already selling.",
      image: img("travel-adapter"),
      kind: "product",
      draft: {
        title: "Travel charger kit",
        price: "64.00",
        description: "A compact travel adapter and cable for the search demand already showing up. Ships with the pouch.",
        image: img("travel-adapter"),
      },
    },
    {
      id: "desk-stand",
      title: "Desk setup stand",
      pitch: "A stand that pairs with the lamp and mouse people already buy.",
      price: "$79",
      signal: "Search up 22%",
      why: "“Desk setup” is up 22% week over week. The lamp and mouse are already in the catalog.",
      image: img("laptop-stand"),
      kind: "product",
      draft: {
        title: "Desk setup stand",
        price: "79.00",
        description: "An aluminum laptop stand for the desk setup people are searching for. Sits with the lamp and the mouse.",
        image: img("laptop-stand"),
      },
    },
    {
      id: "usbc-hub",
      title: "USB-C hub",
      pitch: "The thing the headphone thread on X is actually asking for.",
      price: "$39",
      signal: "40 unanswered replies",
      why: "About 40 people asked if the Studio ANC works through a USB-C hub. The store has not answered.",
      image: img("wireless-charging-pad"),
      kind: "product",
      draft: {
        title: "USB-C hub",
        price: "39.00",
        description: "A small USB-C hub for the Studio ANC Headphones, so calls work when the headphones are plugged into a laptop.",
        image: img("wireless-charging-pad"),
      },
    },
  ],
  [
    {
      id: "cable-kit",
      title: "Cable organizer",
      pitch: "A cheap add-on for the headphone and charger orders.",
      price: "$18",
      signal: "About 60% margin",
      why: "Accessory-only carts are the problem. This one belongs next to a headphone, not instead of it.",
      image: img("cable-organizer"),
      kind: "product",
      draft: {
        title: "Cable organizer",
        price: "18.00",
        description: "A short wrap for the headphone cable and the charger. Meant as an add-on, not a standalone offer.",
        image: img("cable-organizer"),
      },
    },
    {
      id: "speaker",
      title: "Mini speaker",
      pitch: "A desk speaker for the setup searches that are not about headphones.",
      price: "$45",
      signal: "Desk search up 22%",
      why: "Headphone search is flat. Desk setup search is not. A speaker gives that query something to land on.",
      image: img("mini-speaker"),
      kind: "product",
      draft: {
        title: "Mini speaker",
        price: "45.00",
        description: "A small desk speaker for the setup searches. Quiet enough to sit next to the lamp.",
        image: img("mini-speaker"),
      },
    },
    {
      id: "tablet",
      title: "Tablet stand",
      pitch: "The other half of a desk, for people who are not buying a laptop stand.",
      price: "$32",
      signal: "Pairs with the lamp",
      why: "The lamp is $4,450 of the month. A stand next to it is a smaller, testable add.",
      image: img("tablet-stand"),
      kind: "product",
      draft: {
        title: "Tablet stand",
        price: "32.00",
        description: "A fold-flat stand for a tablet, meant to sit with the desk lamp.",
        image: img("tablet-stand"),
      },
    },
  ],
];

export const bundleCard: ChoiceCard = {
  id: "bundle-289",
  title: "Headphone bundle",
  pitch: "Headphones, the earbuds case, and a cable, priced to lift the average order.",
  price: "$289",
  signal: "Average order is $125",
  why: "The $49 power bank is filling carts on its own. This bundle puts it back in a supporting role.",
  image: img("studio-anc-headphones"),
  kind: "product",
  draft: bundleDraft,
};

export const segmentCards: ChoiceCard[] = [
  {
    id: "second-order",
    title: "Second-order buyers",
    pitch: "People who already bought, and who ask for a longer headphone warranty.",
    price: "2 customers",
    signal: "28% of orders",
    why: "Returning buyers are 28% of orders. The second-order ask is warranty, not a points program.",
    image: img("studio-anc-headphones"),
    kind: "segment",
    names: ["Danielle Hudson", "Jordan Ellis"],
  },
  {
    id: "new-month",
    title: "First order this month",
    pitch: "One order so far. A second purchase is the whole job.",
    price: "3 customers",
    signal: "One order each",
    why: "Maya, Priya, and Sam have a single order. They are the group a warranty test should not start with.",
    image: img("desk-lamp"),
    kind: "segment",
    names: ["Maya Chen", "Priya Patel", "Sam Rivera"],
  },
  {
    id: "unsubscribed",
    title: "Not subscribed",
    pitch: "Buyers who never opted into email.",
    price: "2 customers",
    signal: "No email yet",
    why: "Jordan and Sam are not subscribed. A warranty offer in email will not reach them.",
    image: img("wireless-mouse"),
    kind: "segment",
    names: ["Jordan Ellis", "Sam Rivera"],
  },
];

export const orderCards: ChoiceCard[] = [
  {
    id: "order-1078",
    title: "Fulfill #1078",
    pitch: "Danielle Hudson paid $369.99 for headphones and accessories.",
    price: "$369.99",
    signal: "Paid · unfulfilled",
    why: "Three items, paid today. This is the order that should leave before the smaller ones.",
    image: img("studio-anc-headphones"),
    kind: "order",
    orderId: "#1078",
    action: "Fulfill #1078",
  },
  {
    id: "order-1077",
    title: "Fulfill #1077",
    pitch: "Maya Chen paid $89 for the desk lamp.",
    price: "$89.00",
    signal: "Paid · unfulfilled",
    why: "The lamp page still says 5–7 days. Fulfill it, then the delivery line can match the ad.",
    image: img("desk-lamp"),
    kind: "order",
    orderId: "#1077",
    action: "Fulfill #1077",
  },
  {
    id: "order-1075",
    title: "Collect #1075",
    pitch: "Priya Patel’s $58 order was never paid.",
    price: "$58.00",
    signal: "Unpaid",
    why: "Yesterday’s order is the only one waiting on payment. A reminder is the action.",
    image: img("portable-charger"),
    kind: "order",
    orderId: "#1075",
    action: "Request payment for #1075",
  },
];

export const themeCards: ChoiceCard[] = [
  {
    id: "lamp-line",
    title: "Fix the lamp promise",
    pitch: "Change the Desk Lamp page so it ships this week, like the ads.",
    price: "Horizon",
    signal: "Ads disagree",
    why: "The page says 5–7 days. Monday’s ads say this week. Agents stall on that gap.",
    image: theme("horizon"),
    kind: "theme",
    note: "Horizon · rewrite the Desk Lamp delivery line to “Ships this week.”",
  },
  {
    id: "tinker",
    title: "Try Tinker",
    pitch: "A more editorial theme for the headphone photo.",
    price: "Theme",
    signal: "Not installed",
    why: "The headphone is 39% of revenue. Tinker gives that photo more room than Horizon does.",
    image: theme("tinker"),
    kind: "theme",
    note: "Tinker · use it if the headphone photo should lead the homepage.",
  },
  {
    id: "dwell",
    title: "Try Dwell",
    pitch: "A quieter theme if the desk setup is the story.",
    price: "Theme",
    signal: "Not installed",
    why: "Desk setup search is up 22%. Dwell fits a lamp-and-stand story better than a launch.",
    image: theme("dwell"),
    kind: "theme",
    note: "Dwell · a quieter homepage for the desk setup.",
  },
];

export type Peek = {
  type: string;
  id?: string;
  cards?: ChoiceCard[];
  selected?: string[];
  mode?: ChoiceMode;
  settled?: boolean;
  replaced?: boolean;
  setKey?: string;
};

export type Intent =
  | { kind: "offer"; intro: string; title: string; cards: ChoiceCard[]; mode: ChoiceMode; setKey?: string }
  | { kind: "pick"; card: ChoiceCard }
  | { kind: "arm-multi" }
  | { kind: "bundle"; cards: ChoiceCard[] }
  | { kind: "regen" }
  | { kind: "confirm"; publish: boolean }
  | { kind: "cancel" };

const ordinals: [RegExp, number][] = [
  [/\b(first|1st|number one|top one)\b/, 0],
  [/\b(second|2nd|number two)\b/, 1],
  [/\b(third|3rd|number three)\b/, 2],
];

export function latestChoices(thread: Peek[]) {
  for (let index = thread.length - 1; index >= 0; index -= 1) {
    const block = thread[index];
    if (block.type === "choices" && !block.replaced) return block;
  }
  return undefined;
}

export function interpret(agentId: string, text: string, thread: Peek[]): Intent | null {
  const q = text.trim().toLowerCase().replace(/[.!?]+$/, "");
  const open = latestChoices(thread);
  if (/^(save( it)? as a draft|save the draft|save draft)$/.test(q)) return { kind: "confirm", publish: false };
  if (/^(publish( it)?|publish the product)$/.test(q)) return { kind: "confirm", publish: true };
  if (/^(never mind|nevermind|cancel( that)?|go back|back out)$/.test(q)) return { kind: "cancel" };
  if (/different options|something else|other (ideas|options)|show me different|try again|another set/.test(q)) return { kind: "regen" };
  if (open && !open.settled && /bundle these|make (2|two)|both of (these|them)|these two/.test(q)) {
    const picked = (open.cards ?? []).filter((card) => open.selected?.includes(card.id));
    if (picked.length >= 2) return { kind: "bundle", cards: picked };
    return { kind: "arm-multi" };
  }
  if (open && !open.settled) {
    const spoken = spokenCard(q, open.cards ?? []);
    if (spoken) return { kind: "pick", card: spoken };
  }
  return offerFor(agentId, q, open?.setKey);
}

function spokenCard(q: string, cards: ChoiceCard[]) {
  for (const [pattern, index] of ordinals) {
    if (pattern.test(q) && cards[index]) return cards[index];
  }
  const titled = cards.find((card) => q.includes(card.title.toLowerCase()));
  return titled;
}

function offerFor(agentId: string, q: string, previousSet?: string): Intent | null {
  if (agentId === "ideas" && /what else could (i|we) sell|what should (i|we) sell|other product|new product idea/.test(q)) {
    const setKey = previousSet === "a" ? "b" : "a";
    return {
      kind: "offer",
      setKey,
      mode: "single",
      title: "Three ways to add to the catalog",
      intro: "Three that fit this store. Pick one and I’ll draft it in Products.",
      cards: setKey === "a" ? ideaSets[0] : ideaSets[1],
    };
  }
  if (
    (agentId === "ideas" || agentId === "chief") &&
    /draft the \$?289 bundle|draft the bundle|headphone bundle/.test(q)
  ) {
    return {
      kind: "offer",
      mode: "single",
      title: "The bundle I’d draft",
      intro: "This is the $289 bundle. Pick it and I’ll fill the product form.",
      cards: [bundleCard],
    };
  }
  if (agentId === "customers" && /who should i group|who is coming back|segment|group (these|customers)|warranty/.test(q)) {
    return {
      kind: "offer",
      mode: "single",
      title: "Segments worth making",
      intro: "Three groups already in the customer list. Pick one and I’ll create it and open the filtered list.",
      cards: segmentCards,
    };
  }
  if (agentId === "orders" && /which (one|order)|needs me|clear first|what should i fulfill|who should i fulfill/.test(q)) {
    return {
      kind: "offer",
      mode: "single",
      title: "Orders that need a hand",
      intro: "Three orders are still open. Pick one and I’ll open it with the action ready.",
      cards: orderCards,
    };
  }
  if (agentId === "store" && /storefront|theme idea|what else on the store|what should we change|delivery line|try tinker|try dwell/.test(q)) {
    return {
      kind: "offer",
      mode: "single",
      title: "Storefront changes",
      intro: "Three changes for the theme. Pick one and I’ll open Online Store on it.",
      cards: themeCards,
    };
  }
  return null;
}

export function bundleOf(cards: ChoiceCard[]): ChoiceCard {
  const drafts = cards.map((card) => card.draft).filter((draft): draft is NonNullable<ChoiceCard["draft"]> => Boolean(draft));
  const price = drafts.reduce((sum, draft) => sum + Number(draft.price), 0);
  const title = cards.map((card) => card.title).join(" + ");
  return {
    id: `bundle-${cards.map((card) => card.id).join("-")}`,
    title,
    pitch: "A bundle of the two you picked.",
    price: `$${price.toFixed(0)}`,
    signal: "Bundled",
    why: "Both ideas, one draft, so they are bought together instead of instead of each other.",
    image: drafts[0]?.image ?? cards[0]?.image ?? img("studio-anc-headphones"),
    kind: "product",
    draft: {
      title,
      price: price.toFixed(2),
      description: `Bundle: ${cards.map((card) => card.title).join(" and ")}. ${cards.map((card) => card.pitch).join(" ")}`,
      image: drafts[0]?.image ?? cards[0]?.image ?? img("studio-anc-headphones"),
    },
  };
}

export type DraftSpec = { title: string; price: string; description: string; image: string };

export function draftOf(card: ChoiceCard): DraftSpec | null {
  return card.draft ?? null;
}
