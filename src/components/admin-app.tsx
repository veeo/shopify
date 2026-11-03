"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useRef, useState } from "react";
import { AgentNav } from "@/components/agent-nav";
import { ChatColumn } from "@/components/chat-column";
import { ShopifyMark } from "@/components/marks";
import { PreviewColumn } from "@/components/preview-column";
import { ProductRail } from "@/components/product-rail";
import {
  activeState,
  personaFor,
  prototypeSnapshot,
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
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("")
      .trim();
    const effects = effectsFrom(message, applied.current);
    setState((current) => {
      const spoken = text || scriptedTurn(pending.agentId, pending.text, current.storeName).text;
      const withText = reducer(current, { type: "commit", agentId: pending.agentId, text: spoken });
      const nextEffects =
        effects.length > 0 ? effects : scriptedTurn(pending.agentId, pending.text, current.storeName).effects;
      return reducer(withText, { type: "effects", effects: nextEffects });
    });
  }

  const agent = selectedAgent(state);
  const liveMessage = chat.messages.at(-1);
  const liveText =
    (chat.status === "streaming" || chat.status === "submitted") && liveMessage?.role === "assistant"
      ? liveMessage.parts
          .filter((part) => part.type === "text")
          .map((part) => ("text" in part ? part.text : ""))
          .join("")
      : chat.status === "submitted"
        ? ""
        : null;

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
            persona: personaFor(agentId),
          },
        },
      },
    );
  }

  if (!state.signedIn) {
    return (
      <Signup
        onSubmit={(storeName) => setState((current) => reducer(current, { type: "sign-in", storeName }))}
        onActive={() => setState((current) => ({ ...activeState(current.storeName), motion: current.motion }))}
      />
    );
  }

  return (
    <div className="flex h-dvh min-w-[1180px] gap-1 bg-[#0c0d0c] p-1 text-white">
      <AgentNav
        state={state}
        onSelect={(id) => setState((current) => reducer(current, { type: "select", id }))}
        onAdd={() => setState((current) => reducer(current, { type: "toggle-add" }))}
        onSearch={() => setState((current) => reducer(current, { type: "toggle-search" }))}
        onQuery={(query) => setState((current) => reducer(current, { type: "search", query }))}
        onExperiments={() => setState((current) => reducer(current, { type: "toggle-experiments" }))}
      />
      <div className="w-px shrink-0 bg-white/10" />
      <ChatColumn
        state={state}
        liveText={liveText}
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
      />
      <ProductRail preview={state.preview} onOpen={(id) => setState((current) => reducer(current, { type: "rail", id }))} />
      <span className="sr-only">{agent.name}</span>
    </div>
  );
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
    <main className="grid min-h-dvh place-items-center bg-[#0c0d0c] px-6 text-white">
      <form
        className="w-full max-w-[420px]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(storeName);
        }}
      >
        <ShopifyMark className="mb-8 h-8 w-7" />
        <h1 className="text-[32px] font-medium tracking-[-0.8px]">Create your store</h1>
        <p className="mt-2 text-[15px] leading-[1.45] text-[#8e8f8b]">
          You’ll land with Sidekick, ready to set up payments, a theme, and the rest of the store.
        </p>
        <label className="mt-6 block text-[13px] text-[#8e8f8b]">
          Store name
          <input
            required
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#171817] px-3 text-[15px] text-white outline-none"
          />
        </label>
        <label className="mt-3 block text-[13px] text-[#8e8f8b]">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@store.com"
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#171817] px-3 text-[15px] text-white outline-none placeholder:text-[#737572]"
          />
        </label>
        <label className="mt-3 block text-[13px] text-[#8e8f8b]">
          Password
          <input
            required
            type="password"
            minLength={4}
            placeholder="••••••••"
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#171817] px-3 text-[15px] text-white outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => onSubmit(storeName)}
          className="mt-6 h-11 w-full rounded-full bg-white text-[14px] font-medium text-black"
        >
          Create store
        </button>
        <button type="button" onClick={onActive} className="mt-4 w-full text-[13px] text-[#8e8f8b]">
          Skip to the live store
        </button>
      </form>
    </main>
  );
}
