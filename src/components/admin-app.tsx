"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useRef, useState } from "react";
import { AgentNav } from "@/components/agent-nav";
import { ChatColumn } from "@/components/chat-column";
import { Orb, ShopifyMark } from "@/components/marks";
import { PreviewColumn } from "@/components/preview-column";
import { ProductRail } from "@/components/product-rail";
import {
  activeState,
  personaFor,
  prototypeSnapshot,
  purposes,
  reducer,
  scriptedTurn,
  selectedAgent,
  setupState,
  type Effect,
  type PrototypeState,
} from "@/lib/prototype";

type Turn = { agentId: string; text: string; done: boolean };

export function AdminApp({ initialScenario = "setup" }: { initialScenario?: "setup" | "active" }) {
  const [state, setState] = useState<PrototypeState>(() =>
    initialScenario === "active" ? activeState() : setupState(),
  );
  const [booting, setBooting] = useState(false);
  const [offline, setOffline] = useState(false);
  const bootTimer = useRef<number | null>(null);

  function enter(update: (current: PrototypeState) => PrototypeState) {
    setState(update);
    if (bootTimer.current) window.clearTimeout(bootTimer.current);
    setBooting(true);
    bootTimer.current = window.setTimeout(() => setBooting(false), 980);
  }
  const turn = useRef<Turn | null>(null);
  const applied = useRef(new Set<string>());
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

  const chat = useChat({
    transport,
    onFinish({ message }) {
      finishTurn(message);
    },
    onError() {
      const pending = turn.current;
      if (!pending || pending.done) return;
      setOffline(true);
      pending.done = true;
      setState((current) => {
        const script = scriptedTurn(pending.agentId, pending.text, current.storeName);
        const withText = reducer(current, { type: "commit", agentId: pending.agentId, text: script.text });
        return reducer(withText, { type: "effects", effects: script.effects });
      });
    },
  });

  function finishTurn(message: UIMessage) {
    const pending = turn.current;
    if (!pending || pending.done) return;
    pending.done = true;
    const text = replyText(message);
    const scripted = scriptedEffects(message);
    setOffline(scripted !== null || !text);
    const effects = scripted ?? effectsFrom(message, applied.current);
    setState((current) => {
      if (!text) {
        const script = scriptedTurn(pending.agentId, pending.text, current.storeName);
        const withScript = reducer(current, { type: "commit", agentId: pending.agentId, text: script.text });
        return reducer(withScript, { type: "effects", effects: script.effects });
      }
      const withText = reducer(current, { type: "commit", agentId: pending.agentId, text });
      return reducer(withText, { type: "effects", effects });
    });
  }

  const agent = selectedAgent(state);
  const liveMessage = chat.messages.at(-1);
  const streaming = (chat.status === "streaming" || chat.status === "submitted") && liveMessage?.role === "assistant";
  const liveText = streaming ? replyText(liveMessage) : chat.status === "submitted" ? "" : null;
  const liveStatus = streaming ? toolStatus(liveMessage) : null;

  function send(text: string) {
    const current = state;
    const agentId = current.mode === "add" ? "sidekick" : current.selectedAgentId;
    const transcript = (current.threads[agentId] ?? []).flatMap((block) =>
      block.type === "text" ? [{ role: block.role, content: block.text }] : [],
    );
    turn.current = { agentId, text, done: false };
    setState((prev) => reducer(prev, { type: "user", agentId, text }));
    void chat.sendMessage(
      { text },
      {
        body: {
          transcript,
          prototype: {
            ...prototypeSnapshot(current),
            agentId,
            agentName: current.agents.find((item) => item.id === agentId)?.name ?? "Sidekick",
            persona: agentPersona(current, agentId),
            products: current.products.map((product) => `${product.title} ($${product.price})`),
          },
        },
      },
    );
  }

  if (!state.signedIn) {
    return (
      <Signup
        onSubmit={(storeName) => enter((current) => reducer(current, { type: "sign-in", storeName }))}
        onActive={() => enter((current) => ({ ...activeState(current.storeName), motion: current.motion }))}
      />
    );
  }

  return (
    <div className="relative flex h-dvh min-w-[1180px] gap-1 bg-[#0c0d0c] p-1 text-white">
      <div className="p-partial-theme-admin-next-dark flex min-w-0 flex-1 gap-1 bg-[#0c0d0c] text-white">
        <AgentNav
          state={state}
          onSelect={(id) => setState((current) => reducer(current, { type: "select", id }))}
          onAdd={() => setState((current) => reducer(current, { type: "toggle-add" }))}
          onSearch={() => setState((current) => reducer(current, { type: "toggle-search" }))}
          onQuery={(query) => setState((current) => reducer(current, { type: "search", query }))}
          onExperiments={() => setState((current) => reducer(current, { type: "toggle-experiments" }))}
        />
        <div className="my-3 w-px shrink-0 bg-white/10" />
        <ChatColumn
          state={state}
          liveText={liveText}
          liveStatus={liveStatus}
          offline={offline}
          busy={chat.status === "submitted" || chat.status === "streaming"}
          onChip={(label) => setState((current) => reducer(current, { type: "chip", label }))}
          onSend={send}
          onPurpose={(id) => setState((current) => reducer(current, { type: "toggle-purpose", id }))}
          onStart={() => setState((current) => reducer(current, { type: "chip", label: "Start working" }))}
          onAddCatalog={(id) => setState((current) => reducer(current, { type: "add-catalog", id }))}
          onCreate={(name, purpose) => setState((current) => reducer(current, { type: "create-agent", name, purpose }))}
          onScenario={(scenario) => setState((current) => reducer(current, { type: "scenario", scenario }))}
          onMotion={(on) => setState((current) => reducer(current, { type: "motion", on }))}
          onReset={() => setState((current) => reducer(current, { type: "reset" }))}
          onCloseExperiments={() => setState((current) => reducer(current, { type: "toggle-experiments" }))}
        />
      </div>
      <PreviewColumn
        state={state}
        onPreview={(page, wide) => setState((current) => reducer(current, { type: "preview", page, wide }))}
        onChip={(label) => setState((current) => reducer(current, { type: "chip", label }))}
        onBusiness={(value) => setState((current) => reducer(current, { type: "business-type", value }))}
        onIdentity={(patch) => setState((current) => reducer(current, { type: "identity", patch }))}
        onPaymentsNext={() => setState((current) => reducer(current, { type: "payments-next" }))}
        onProduct={(id) => setState((current) => reducer(current, { type: "product", id }))}
        onUpdateProduct={(id, patch) => setState((current) => reducer(current, { type: "update-product", id, patch }))}
        onAddProduct={() => setState((current) => reducer(current, { type: "add-blank-product" }))}
        onRail={(id) => setState((current) => reducer(current, { type: "rail", id }))}
      />
      <div className="p-partial-theme-admin-next-dark flex">
        <ProductRail preview={state.preview} onOpen={(id) => setState((current) => reducer(current, { type: "rail", id }))} />
      </div>
      <span className="sr-only">{agent.name}</span>
      {booting ? <BootScreen storeName={state.storeName} /> : null}
    </div>
  );
}

function BootScreen({ storeName }: { storeName: string }) {
  return (
    <div className="absolute inset-0 z-[200] grid place-items-center bg-[#0c0d0c] text-white">
      <div className="w-[280px] text-center">
        <div className="mx-auto mb-4 grid place-items-center">
          <Orb id="chief" size={56} />
        </div>
        <p className="text-[15px] font-medium">Opening {storeName}</p>
        <p className="mt-1 text-[13px] text-[#8e8f8b]">Sidekick is getting the admin ready</p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="sk-bar h-full origin-left bg-white" />
        </div>
      </div>
    </div>
  );
}

function agentPersona(state: PrototypeState, agentId: string) {
  const base = state.agents.find((item) => item.id === agentId)?.persona || personaFor(agentId);
  if (agentId !== "chief" || state.purposes.length === 0) return base;
  const chosen = purposes.filter((item) => state.purposes.includes(item.id)).map((item) => item.title);
  return `${base} The merchant asked you to focus on: ${chosen.join(", ")}.`;
}

function replyText(message: UIMessage) {
  return message.parts
    .flatMap((part) => (part.type === "text" && part.text.trim() ? [part.text.trim()] : []))
    .join("\n\n");
}

function toolStatus(message: UIMessage) {
  const last = message.parts.filter((part) => part.type !== "step-start").at(-1);
  if (!last?.type.startsWith("tool-") || !("state" in last) || last.state === "output-available") return null;
  const input = ("input" in last ? last.input : undefined) as { url?: string } | undefined;
  if (last.type === "tool-searchShopifyHelp") return "Searching the Shopify Help Center";
  if (last.type === "tool-searchShopifyDevDocs") return "Searching shopify.dev";
  if (last.type === "tool-readShopifyHelpArticle") {
    const found = message.parts
      .flatMap((part) => {
        if (part.type !== "tool-searchShopifyHelp" || !("output" in part)) return [];
        return ((part.output as { results?: { title: string; url: string }[] })?.results ?? []);
      })
      .find((result) => result.url === input?.url);
    if (found) return `Reading “${found.title}”`;
    const slug = input?.url?.split("/").filter(Boolean).at(-1)?.replace(/\.md$/, "").replace(/-/g, " ");
    return slug ? `Reading “${slug[0].toUpperCase()}${slug.slice(1)}”` : "Reading the Help Center";
  }
  return "Working in the admin";
}

function scriptedEffects(message: UIMessage): Effect[] | null {
  for (const part of message.parts) {
    if (part.type !== "data-effects" || !("data" in part)) continue;
    const data = part.data as { effects?: Effect[] };
    return Array.isArray(data.effects) ? data.effects : [];
  }
  return null;
}

function effectsFrom(message: UIMessage, seen: Set<string>) {
  const effects: Effect[] = [];
  for (const part of message.parts) {
    if (!part.type.startsWith("tool-")) continue;
    if (!("state" in part) || part.state !== "output-available" || !("toolCallId" in part)) continue;
    if (seen.has(part.toolCallId)) continue;
    seen.add(part.toolCallId);
    const name = part.type.slice("tool-".length);
    const input = "input" in part ? part.input : undefined;
    const effect = mapTool(name, input);
    if (effect) effects.push(effect);
  }
  return effects;
}

function mapTool(name: string, input: unknown): Effect | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (name === "navigatePreview" && typeof value.page === "string") {
    return { type: "navigate", page: value.page as Effect & { type: "navigate" } extends { page: infer P } ? P : never, wide: value.wide === true };
  }
  if (name === "completeSetupStep" && typeof value.step === "number") return { type: "complete-step", step: value.step };
  if (name === "fillPaymentsForm" && typeof value.businessType === "string") {
    return { type: "business-type", value: value.businessType as PrototypeState["businessType"] };
  }
  if (name === "addProduct" && typeof value.title === "string") {
    return {
      type: "add-product",
      title: value.title,
      price: typeof value.price === "string" ? value.price : "0.00",
      description: typeof value.description === "string" ? value.description : undefined,
    };
  }
  if (name === "addSidekick" && typeof value.id === "string") return { type: "add-sidekick", id: value.id };
  if (name === "showArtifact" && (value.name === "payments-plan" || value.name === "best-sellers")) {
    return { type: "artifact", name: value.name };
  }
  return null;
}

function Signup({ onSubmit, onActive }: { onSubmit: (storeName: string) => void; onActive: () => void }) {
  const [storeName, setStoreName] = useState("My Store");
  const [email, setEmail] = useState("");
  return (
    <main className="p-partial-theme-admin-next-dark grid min-h-dvh place-items-center bg-[#0c0d0c] px-6 text-white">
      <div className="w-full max-w-[440px]">
        <ShopifyMark className="mb-6 h-8 w-7" />
        <s-section
          heading="Create your store"
          subheading="You’ll land with Sidekick expanded, ready to set up payments, a theme, and the rest of the store."
        >
          <s-stack gap="base">
            <s-text-field
              label="Store name"
              name="store-name"
              required
              value={storeName}
              onInput={(event) => setStoreName(event.currentTarget.value)}
            />
            <s-email-field
              label="Email"
              name="email"
              required
              autocomplete="email"
              placeholder="you@store.com"
              value={email}
              onInput={(event) => setEmail(event.currentTarget.value)}
            />
            <s-password-field label="Password" name="password" required minLength={4} autocomplete="new-password" />
            <s-button variant="primary" inlineSize="fill" onClick={() => onSubmit(storeName || "My Store")}>
              Create store
            </s-button>
            <s-button variant="tertiary" inlineSize="fill" onClick={onActive}>
              Skip to the live store
            </s-button>
          </s-stack>
        </s-section>
      </div>
    </main>
  );
}
