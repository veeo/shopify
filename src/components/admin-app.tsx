"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useRef, useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { AgentNav } from "@/components/agent-nav";
import { ChatColumn } from "@/components/chat-column";
import { ShopifyMark } from "@/components/marks";
import { PIcon } from "@/components/polaris-icon";
import { PreviewColumn } from "@/components/preview-column";
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
  const [booting, setBooting] = useState(false);
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
        onSubmit={(storeName) => enter((current) => reducer(current, { type: "sign-in", storeName }))}
        onActive={() => enter((current) => ({ ...activeState(current.storeName), motion: current.motion }))}
      />
    );
  }

  return (
    <div className="relative flex h-dvh min-w-[1280px] bg-[#f1f1f1] text-[#101010]">
      <AdminNav
        storeName={state.storeName}
        preview={state.preview}
        onOpen={(id) => setState((current) => reducer(current, { type: "rail", id }))}
        onSearch={() => setState((current) => reducer(current, { type: "toggle-search" }))}
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
      <div className="flex w-[600px] shrink-0 py-3 pr-3">
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-[20px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_12px_28px_rgba(0,0,0,0.05)]">
      <AgentNav
        state={state}
        onSelect={(id) => setState((current) => reducer(current, { type: "select", id }))}
        onAdd={() => setState((current) => reducer(current, { type: "toggle-add" }))}
        onSearch={() => setState((current) => reducer(current, { type: "toggle-search" }))}
        onQuery={(query) => setState((current) => reducer(current, { type: "search", query }))}
        onExperiments={() => setState((current) => reducer(current, { type: "toggle-experiments" }))}
      />
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
        </div>
      </div>
      <span className="sr-only">{agent.name}</span>
      {booting ? <BootScreen storeName={state.storeName} /> : null}
    </div>
  );
}

function BootScreen({ storeName }: { storeName: string }) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-[#f6f6f6] text-[#101010]">
      <div className="w-[280px] text-center">
        <div className="sk-pulse mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#672ff4] text-white">
          <PIcon name="Sidekick" />
        </div>
        <p className="text-[15px] font-medium">Opening {storeName}</p>
        <p className="mt-1 text-[13px] text-[#606060]">Sidekick is getting the admin ready</p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#e6e6e6]">
          <div className="sk-bar h-full origin-left bg-[#101010]" />
        </div>
      </div>
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
    <main className="grid min-h-dvh place-items-center bg-[#f6f6f6] px-6 text-[#101010]">
      <form
        className="w-full max-w-[420px] rounded-[20px] bg-white p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.06)]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(storeName);
        }}
      >
        <ShopifyMark tone="dark" className="mb-8 h-8 w-7" />
        <h1 className="text-[26px] font-medium tracking-[-0.4px]">Create your store</h1>
        <p className="mt-2 text-[14px] leading-[1.45] text-[#606060]">
          You’ll land with Sidekick expanded, ready to set up payments, a theme, and the rest of the store.
        </p>
        <label className="mt-6 block text-[13px] text-[#606060]">
          Store name
          <input
            required
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-[#e6e6e6] bg-white px-3 text-[15px] text-[#101010] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none"
          />
        </label>
        <label className="mt-3 block text-[13px] text-[#606060]">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@store.com"
            className="mt-1 h-10 w-full rounded-xl border border-[#e6e6e6] bg-white px-3 text-[15px] text-[#101010] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-[#868686]"
          />
        </label>
        <label className="mt-3 block text-[13px] text-[#606060]">
          Password
          <input
            required
            type="password"
            minLength={4}
            placeholder="••••••••"
            className="mt-1 h-10 w-full rounded-xl border border-[#e6e6e6] bg-white px-3 text-[15px] text-[#101010] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => onSubmit(storeName)}
          className="mt-6 h-10 w-full rounded-full bg-[#0c0c0c] text-[14px] font-medium text-white"
        >
          Create store
        </button>
        <button type="button" onClick={onActive} className="mt-4 w-full text-[13px] text-[#606060]">
          Skip to the live store
        </button>
      </form>
    </main>
  );
}
