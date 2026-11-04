import type { UIMessage } from "ai";
import { pageMeta, previewPages, type PreviewId } from "@/lib/admin-nav";
import type { Source } from "@/lib/prototype";

export type LiveSegment = { type: "text"; text: string } | { type: "tool"; label: string; running?: boolean };

const helpTools = new Set(["searchShopifyHelp", "readShopifyHelpArticle"]);

function toolLabel(name: string, input: Record<string, unknown> | undefined, running: boolean) {
  if (helpTools.has(name)) return running ? "Checking help docs" : "Checked help docs";
  if (name === "searchShopifyDevDocs") return running ? "Checking developer docs" : "Checked developer docs";
  if (name === "navigatePreview") {
    const page = typeof input?.page === "string" && (previewPages as readonly string[]).includes(input.page) ? pageMeta(input.page as PreviewId).title : "the page";
    return running ? `Opening ${page}` : `Opened ${page}`;
  }
  if (name === "addProduct") return running ? "Adding a product" : `Added ${typeof input?.title === "string" ? `“${input.title}”` : "a product"}`;
  if (name === "fillPaymentsForm") return running ? "Filling in payments" : "Filled in payments";
  if (name === "completeSetupStep") return running ? "Updating setup" : "Updated setup";
  if (name === "addSidekick") return running ? "Adding a sidekick" : "Added a sidekick";
  return running ? "Working in the admin" : "Updated the admin";
}

/** Text and tool-status rows in the order they streamed, with consecutive help-doc lookups folded into one row. */
export function segmentsOf(message: UIMessage | undefined): LiveSegment[] {
  if (!message) return [];
  const out: LiveSegment[] = [];
  let helpRow: { type: "tool"; label: string; running?: boolean } | null = null;
  let helpRunning = false;
  for (const part of message.parts) {
    if (part.type === "text") {
      if (!part.text) continue;
      const last = out.at(-1);
      if (last?.type === "text") last.text += part.text;
      else out.push({ type: "text", text: part.text });
      helpRow = null;
      continue;
    }
    if (!part.type.startsWith("tool-")) continue;
    const name = part.type.slice("tool-".length);
    const running = !("state" in part) || (part.state !== "output-available" && part.state !== "output-error");
    const input = ("input" in part ? part.input : undefined) as Record<string, unknown> | undefined;
    if (helpTools.has(name)) {
      if (helpRow) {
        helpRunning = helpRunning || running;
        helpRow.running = helpRunning;
        helpRow.label = toolLabel(name, input, helpRunning);
        continue;
      }
      helpRunning = running;
      helpRow = { type: "tool", label: toolLabel(name, input, running), running };
      out.push(helpRow);
      continue;
    }
    helpRow = null;
    out.push({ type: "tool", label: toolLabel(name, input, running), running });
  }
  return out;
}

/** Help Center articles the model actually read, shown as source chips under the answer. */
export function sourcesOf(message: UIMessage | undefined): Source[] {
  if (!message) return [];
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const part of message.parts) {
    if (part.type !== "tool-readShopifyHelpArticle" || !("output" in part)) continue;
    const output = part.output as { title?: string; url?: string; error?: string } | undefined;
    if (!output?.url || !output.title || output.error || seen.has(output.url)) continue;
    seen.add(output.url);
    out.push({ title: output.title, url: output.url });
  }
  return out;
}
