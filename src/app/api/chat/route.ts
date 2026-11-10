import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { businessTypes, personaFor, previewPages, scriptedTurn, type Arrival } from "@/lib/prototype";
import { chatModel } from "@/lib/model";
import { readHelpArticle, searchDevDocs, searchHelpCenter } from "@/lib/shopify-help";

export const maxDuration = 60;

const previewSchema = z.enum(previewPages);
const businessSchema = z.enum(businessTypes);

const tools = {
  searchShopifyHelp: tool({
    description:
      "Search the Shopify Help Center (help.shopify.com) for merchant documentation. Returns article titles, URLs, and one-line summaries. Follow up with readShopifyHelpArticle before answering.",
    inputSchema: z.object({ query: z.string().min(2).describe("Plain-language search, e.g. 'Shopify Payments payout schedule'") }),
    execute: async ({ query }) => {
      const results = searchHelpCenter(query);
      return results.length ? { results } : { results, note: "No matches. Try different words or a broader topic." };
    },
  }),
  readShopifyHelpArticle: tool({
    description:
      "Read a Shopify Help Center article as Markdown. Accepts any help.shopify.com/en/manual URL, including links found inside other articles.",
    inputSchema: z.object({ url: z.string() }),
    execute: async ({ url }) => readHelpArticle(url),
  }),
  searchShopifyDevDocs: tool({
    description: "Search shopify.dev developer docs (APIs, Liquid, themes, apps, Functions). Only for developer questions.",
    inputSchema: z.object({ query: z.string().min(2) }),
    execute: async ({ query }) => searchDevDocs(query),
  }),
  navigatePreview: tool({
    description:
      "Open a page in the live Shopify admin preview. wide true grows the panel so that page takes attention. wide false shrinks it so the conversation stays in front. Grow it when they should look at or finish the page. Shrink it when you are still deciding together.",
    inputSchema: z.object({
      page: previewSchema,
      wide: z.boolean().optional(),
    }),
    execute: async (input) => input,
  }),
  completeSetupStep: tool({
    description: "Mark a Shopify Payments setup step done. Steps are 1 business details, 2 identity, 3 security, 4 payout.",
    inputSchema: z.object({ step: z.number().int().min(1).max(4) }),
    execute: async (input) => input,
  }),
  fillPaymentsForm: tool({
    description: "Choose how the merchant runs the store and open the payments form.",
    inputSchema: z.object({ businessType: businessSchema }),
    execute: async (input) => input,
  }),
  addProduct: tool({
    description: "Add a draft product and open it in the preview. Set wide true when the merchant should fill the draft in now.",
    inputSchema: z.object({
      title: z.string().min(1),
      price: z.string(),
      description: z.string().optional(),
      wide: z.boolean().optional(),
    }),
    execute: async (input) => input,
  }),
  addSidekick: tool({
    description: "Install or connect a sidekick. Recommended: chief, ideas, trends, campaigns. Team: slack, grok, muse, gemini, duet. Channels: store, shop, pos, agentic. Tools: customers, orders, finance, analytics.",
    inputSchema: z.object({
      id: z.enum(["chief", "ideas", "trends", "campaigns", "slack", "grok", "claude", "duet", "gemini", "store", "shop", "pos", "agentic", "customers", "orders", "finance", "analytics"]),
    }),
    execute: async (input) => input,
  }),
  showArtifact: tool({
    description: "Show a rich card in the chat: the payments plan or the best-sellers list.",
    inputSchema: z.object({ name: z.enum(["payments-plan", "best-sellers"]) }),
    execute: async (input) => input,
  }),
};

function textOf(message: UIMessage | undefined) {
  if (!message) return "";
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

function scriptedResponse(agentId: string, text: string, storeName: string, arrival: Arrival) {
  const turn = scriptedTurn(agentId, text, storeName, arrival);
  const stream = createUIMessageStream({
    async execute({ writer }) {
      writer.write({ type: "data-effects", data: { effects: turn.effects } });
      await new Promise((resolve) => setTimeout(resolve, 700));
      const id = "scripted";
      writer.write({ type: "text-start", id });
      for (const word of turn.text.split(/(\s+)/)) {
        writer.write({ type: "text-delta", id, delta: word });
        if (word.trim()) await new Promise((resolve) => setTimeout(resolve, 60));
      }
      writer.write({ type: "text-end", id });
    },
  });
  return createUIMessageStreamResponse({ stream });
}


type PrototypeContext = {
  agentId?: string;
  agentName?: string;
  persona?: string;
  storeName?: string;
  preview?: string;
  scenario?: string;
  products?: string[];
  arrival?: Arrival;
};

function systemPrompt(context: PrototypeContext | undefined, persona: string, storeName: string) {
  const name = context?.agentName || "Sidekick";
  return [
    persona,
    `Your name in this conversation is ${name}. You work inside the Shopify admin for ${storeName}, alongside the merchant.`,
    "",
    "How to talk:",
    "- Sound like a sharp, warm colleague who knows Shopify inside out, not a help-desk script. Answer the actual question first, then the detail that matters.",
    "- Match length to the question. Small talk gets a sentence or two. How-to questions get a short walkthrough.",
    "- Use Markdown lightly: numbered steps for procedures, **bold** for admin labels and buttons, inline links. No headings, no tables.",
    "- Skip filler like \"Great question\" or \"I hope this helps\". Ask a follow-up question when you genuinely need one.",
    "",
    "Getting facts right:",
    "- For anything about how Shopify works (payments, payouts, fees, shipping, taxes, domains, checkout, markets, POS, apps, plans, eligibility, policies), call searchShopifyHelp, then readShopifyHelpArticle on the best match, and base your answer on what the article says. Read a second article or follow a link inside one if the first doesn't cover it.",
    "- Before you look something up, write one short sentence saying what you'll check (for example \"I'll check the setup guidance and suggest the best place to start.\"), then call the tools.",
    "- Don't paste article links into your answer. The articles you read are shown to the merchant as source chips under it.",
    "- If the Help Center doesn't cover something, say so plainly and give your best general guidance, labeled as such. Never invent settings, fees, limits, or deadlines.",
    "- Use searchShopifyDevDocs only for developer questions (APIs, Liquid, theme code, apps).",
    "- Don't look things up for greetings, opinions, or requests to change this admin.",
    "",
    "This admin:",
    "- It's a prototype with sample data. Use the admin tools to change the preview, payments form, catalog, and sidekick list when the merchant asks you to do something. Never claim you changed something unless you called the tool.",
    "- When they ask to see something already in the admin — products, top products, orders, customers, analytics, discounts, or any other page — call navigatePreview for that page with wide true. The pane grows so the page takes their attention. Do this along with the answer, for every sidekick.",
    `- Scenario: ${context?.scenario ?? "setup"}. Page open in the preview: ${context?.preview ?? "home-setup"}.${context?.arrival === "sidekick" ? " This is the Sidekick opening. The title introduces Sidekick, then the agent list and the admin come in, and then Sidekick asks where to start. Drive toward one outcome. Help me start opens three store designs. Grow the admin when a page should take their attention, and shrink it when you are still deciding." : ""}`,
    context?.products?.length ? `- Catalog: ${context.products.slice(0, 30).join(", ")}.` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export async function POST(request: Request) {
  let body: {
    messages?: UIMessage[];
    transcript?: { role: "user" | "assistant"; content: string }[];
    prototype?: PrototypeContext;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  const agentId = body.prototype?.agentId || "sidekick";
  const storeName = body.prototype?.storeName || "My Store";
  const arrival: Arrival = body.prototype?.arrival === "sidekick" ? "sidekick" : "tasks";
  const hookMessages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...hookMessages].reverse().find((message) => message.role === "user");
  const asked = textOf(lastUser);
  if (!asked) return Response.json({ error: "Send a message." }, { status: 400 });

  const model = chatModel(request);
  if (!model) return scriptedResponse(agentId, asked, storeName, arrival);
  const persona = body.prototype?.persona?.trim().slice(0, 4000) || personaFor(agentId);

  const prior: UIMessage[] = (body.transcript ?? []).slice(-12).map((message, index) => ({
    id: `prior-${index}`,
    role: message.role,
    parts: [{ type: "text" as const, text: message.content.slice(0, 2000) }],
  }));
  const messages = [...prior, lastUser!];

  try {
    const result = streamText({
      model,
      system: systemPrompt(body.prototype, persona, storeName),
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(8),
    });
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("chat stream failed", error);
        return "The model is unavailable right now.";
      },
    });
  } catch (error) {
    console.error("chat request failed", error);
    return scriptedResponse(agentId, asked, storeName, arrival);
  }
}
