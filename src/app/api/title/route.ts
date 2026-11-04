import { generateText } from "ai";
import { chatModel } from "@/lib/model";

export const maxDuration = 20;

/** Short conversation title from the first exchange, like the admin's "Setting up your Shopify store". */
export async function POST(request: Request) {
  let body: { question?: string; answer?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }
  const question = body.question?.trim().slice(0, 600) ?? "";
  if (!question) return Response.json({ error: "Send a question." }, { status: 400 });
  const fallback = fallbackTitle(question);
  const model = chatModel(request);
  if (!model) return Response.json({ title: fallback });
  try {
    const { text } = await generateText({
      model,
      system:
        "Write a title for this conversation in the Shopify admin. 2 to 6 words, sentence case, no quotes or trailing punctuation. Prefer a gerund phrase that names the task, like \"Setting up your Shopify store\" or \"Choosing a theme\".",
      prompt: `Merchant: ${question}\n\nAssistant: ${body.answer?.slice(0, 1200) ?? ""}`,
      maxOutputTokens: 24,
    });
    const title = text.trim().replace(/^["'“]|["'”.]$/g, "").split("\n")[0].slice(0, 60);
    return Response.json({ title: title || fallback });
  } catch {
    return Response.json({ title: fallback });
  }
}

function fallbackTitle(question: string) {
  const trimmed = question.replace(/[?.!]+$/, "").split("\n")[0];
  const words = trimmed.split(/\s+/);
  const title = trimmed.length <= 60 ? trimmed : `${words.slice(0, 8).join(" ")}…`;
  return title.charAt(0).toUpperCase() + title.slice(1);
}
