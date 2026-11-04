import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  type LanguageModel,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { businessTypes, personaFor, previewPages, scriptedTurn } from "@/lib/prototype";

export const maxDuration = 60;

const previewSchema = z.enum(previewPages);
const businessSchema = z.enum(businessTypes);

const tools = {
  navigatePreview: tool({
    description: "Open a page in the live Shopify admin preview. Set wide when the merchant needs the payments form.",
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
    description: "Add a draft product and open it in the preview.",
    inputSchema: z.object({
      title: z.string().min(1),
      price: z.string(),
      description: z.string().optional(),
    }),
    execute: async (input) => input,
  }),
  addSidekick: tool({
    description: "Install or connect a sidekick. Ids: chief, ideas, trends, slack, grok, muse.",
    inputSchema: z.object({
      id: z.enum(["chief", "ideas", "trends", "slack", "grok", "muse"]),
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

function scriptedResponse(agentId: string, text: string, storeName: string) {
  const turn = scriptedTurn(agentId, text, storeName);
  const stream = createUIMessageStream({
    async execute({ writer }) {
      writer.write({ type: "data-effects", data: { effects: turn.effects } });
      const id = "scripted";
      writer.write({ type: "text-start", id });
      for (const word of turn.text.split(/(\s+)/)) {
        writer.write({ type: "text-delta", id, delta: word });
        if (word.trim()) await new Promise((resolve) => setTimeout(resolve, 28));
      }
      writer.write({ type: "text-end", id });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

function chatModel(request: Request): LanguageModel | null {
  if (process.env.ANTHROPIC_API_KEY) return anthropic(process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5");
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || request.headers.has("x-vercel-oidc-token")) {
    return process.env.AI_GATEWAY_MODEL || "anthropic/claude-sonnet-5.5";
  }
  return null;
}

export async function POST(request: Request) {
  let body: {
    messages?: UIMessage[];
    transcript?: { role: "user" | "assistant"; content: string }[];
    prototype?: {
      agentId?: string;
      agentName?: string;
      persona?: string;
      storeName?: string;
      preview?: string;
      scenario?: string;
      products?: string[];
    };
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  const agentId = body.prototype?.agentId || "sidekick";
  const storeName = body.prototype?.storeName || "My Store";
  const hookMessages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...hookMessages].reverse().find((message) => message.role === "user");
  const asked = textOf(lastUser);
  if (!asked) return Response.json({ error: "Send a message." }, { status: 400 });

  const model = chatModel(request);
  if (!model) return scriptedResponse(agentId, asked, storeName);
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
      system: [
        persona,
        body.prototype?.agentName ? `Your name in this chat is ${body.prototype.agentName}.` : "",
        "You are inside a Shopify admin prototype. Use tools to change the preview, payments form, catalog, and sidekick list. Do not claim you changed something unless you called the tool.",
        "Write two to six short sentences in plain text. No markdown, bullets, or headings.",
        `Store: ${storeName}. Scenario: ${body.prototype?.scenario ?? "setup"}. Preview: ${body.prototype?.preview ?? "home-setup"}.`,
        body.prototype?.products?.length ? `Catalog: ${body.prototype.products.slice(0, 30).join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(4),
      // Gateway free tier blocks the newest Sonnet; fall back to Claude models it serves.
      providerOptions: {
        gateway: { models: ["anthropic/claude-sonnet-4.5", "anthropic/claude-haiku-5.5", "anthropic/claude-haiku-4.5"] },
      },
    });
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("chat stream failed", error);
        return "The model is unavailable right now.";
      },
    });
  } catch (error) {
    console.error("chat request failed", error);
    return scriptedResponse(agentId, asked, storeName);
  }
}
