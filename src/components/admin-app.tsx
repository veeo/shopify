"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentNav } from "@/components/agent-nav";
import { ChatColumn } from "@/components/chat-column";
import { Orb, ShopifyMark } from "@/components/marks";
import { PreviewColumn } from "@/components/preview-column";
import { AdminRail } from "@/components/admin-rail";
import { SearchPalette } from "@/components/search-palette";
import {
  activeState,
  personaFor,
  prototypeSnapshot,
  purposes,
  reducer,
  scriptedTurn,
  selectedAgent,
  setupState,
  type Action,
  type Effect,
  type Segment,
  type PrototypeState,
} from "@/lib/prototype";
import { segmentsOf, sourcesOf } from "@/lib/turn";

type Turn = { agentId: string; text: string; done: boolean; first: boolean };

export function AdminApp({ initialScenario = "setup" }: { initialScenario?: "setup" | "active" }) {
  const [state, setState] = useState<PrototypeState>(() =>
    initialScenario === "active" ? activeState() : setupState(),
  );
  const [booting, setBooting] = useState(false);
  const [offline, setOffline] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [palette, setPalette] = useState<{ open: boolean; scope?: string }>({ open: false });
  const [liveAgentId, setLiveAgentId] = useState<string | null>(null);
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
  const dispatch = (action: Action) => setState((current) => reducer(current, action));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        setNavOpen((open) => !open);
      } else if (key === "k") {
        event.preventDefault();
        setPalette((current) => ({ open: !current.open }));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
      setLiveAgentId(null);
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
    setLiveAgentId(null);
    const text = replyText(message);
    const scripted = scriptedEffects(message);
    setOffline(scripted !== null || !text);
    const effects = scripted ?? effectsFrom(message, applied.current);
    const segments = committedSegments(message);
    const sources = sourcesOf(message);
    let answer = text;
    setState((current) => {
      if (!text) {
        const script = scriptedTurn(pending.agentId, pending.text, current.storeName);
        answer = script.text;
        const withScript = reducer(current, { type: "commit", agentId: pending.agentId, text: script.text });
        return reducer(withScript, { type: "effects", effects: script.effects });
      }
      const withText = reducer(current, { type: "commit", agentId: pending.agentId, text, segments, sources });
      return reducer(withText, { type: "effects", effects });
    });
    if (pending.first) void nameThread(pending.agentId, pending.text, answer);
  }

  async function nameThread(agentId: string, question: string, answer: string) {
    try {
      const response = await fetch("/api/title", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, answer }),
      });
      const data = (await response.json()) as { title?: string };
      if (data.title) dispatch({ type: "title", agentId, title: data.title });
    } catch {
      // The question itself stays as the title.
    }
  }

  const agent = selectedAgent(state);
  const liveMessage = chat.messages.at(-1);
  const streaming = (chat.status === "streaming" || chat.status === "submitted") && liveMessage?.role === "assistant";
  const liveSegments = streaming ? segmentsOf(liveMessage) : null;
  const busy = chat.status === "submitted" || chat.status === "streaming";

  function send(text: string, target?: string) {
    const current = state;
    const agentId = target ?? (current.mode === "add" ? "sidekick" : current.selectedAgentId);
    const thread = current.threads[agentId] ?? [];
    const transcript = thread.flatMap((block) => (block.type === "text" ? [{ role: block.role, content: block.text }] : []));
    const first = !thread.some((block) => block.type === "text" && block.role === "user");
    turn.current = { agentId, text, done: false, first };
    setLiveAgentId(agentId);
    setState((prev) => {
      const selected = target ? reducer(prev, { type: "select", id: target }) : prev;
      return reducer(selected, { type: "user", agentId, text });
    });
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

  function stop() {
    const pending = turn.current;
    const partial = liveMessage?.role === "assistant" ? replyText(liveMessage) : "";
    void chat.stop();
    setLiveAgentId(null);
    if (!pending || pending.done) return;
    pending.done = true;
    dispatch({ type: "commit", agentId: pending.agentId, text: partial || "Stopped.", segments: liveMessage ? committedSegments(liveMessage) : undefined });
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
          navOpen={navOpen}
          onToggleNav={() => setNavOpen((open) => !open)}
          onSelect={(id) => dispatch({ type: "select", id })}
          onAdd={() => dispatch({ type: "toggle-add" })}
          onSearch={() => dispatch({ type: "toggle-search" })}
          onQuery={(query) => dispatch({ type: "search", query })}
          onExperiments={() => dispatch({ type: "toggle-experiments" })}
        />
        <div className="my-3 w-px shrink-0 bg-white/10" />
        <ChatColumn
          state={state}
          liveSegments={liveAgentId === agent.id ? liveSegments : null}
          offline={offline}
          busy={busy && liveAgentId === agent.id}
          locked={busy}
          onChip={(label) => dispatch({ type: "chip", label })}
          onSend={send}
          onStop={stop}
          onPurpose={(id) => dispatch({ type: "toggle-purpose", id })}
          onStart={() => dispatch({ type: "chip", label: "Start working" })}
          onAddCatalog={(id) => dispatch({ type: "add-catalog", id })}
          onCreate={(name, purpose) => dispatch({ type: "create-agent", name, purpose })}
          onScenario={(scenario) => dispatch({ type: "scenario", scenario })}
          onMotion={(on) => dispatch({ type: "motion", on })}
          onReset={() => dispatch({ type: "reset" })}
          onCloseExperiments={() => dispatch({ type: "toggle-experiments" })}
          onConversations={(open) => dispatch({ type: "conversations", open })}
          onNewChat={() => dispatch({ type: "new-chat" })}
          onOpenConversation={(id) => dispatch({ type: "open-conversation", id })}
          onDeleteConversation={(id) => dispatch({ type: "delete-conversation", id })}
          onRate={(id, value) => dispatch({ type: "rate", id, value })}
        />
      </div>
      <PreviewColumn
        state={state}
        onPreview={(page, wide) => dispatch({ type: "preview", page, wide })}
        onChip={(label) => dispatch({ type: "chip", label })}
        onCard={(id) => {
          if (id === "pos") window.open("https://hardware.shopify.com/", "_blank", "noopener");
          dispatch({ type: "card", id });
        }}
        onDismissCard={(id) => dispatch({ type: "dismiss-card", id })}
        onAsk={(text) => {
          if (!busy) send(text, "sidekick");
        }}
        onRecents={() => {
          dispatch({ type: "select", id: "sidekick" });
          dispatch({ type: "conversations", open: true });
        }}
        onBusiness={(value) => dispatch({ type: "business-type", value })}
        onIdentity={(patch) => dispatch({ type: "identity", patch })}
        onPaymentsNext={() => dispatch({ type: "payments-next" })}
        onProduct={(id) => dispatch({ type: "product", id })}
        onUpdateProduct={(id, patch) => dispatch({ type: "update-product", id, patch })}
        onAddProduct={() => dispatch({ type: "add-blank-product" })}
        onRail={(id) => dispatch({ type: "rail", id })}
      />
      <div className="p-partial-theme-admin-next-dark flex">
        <AdminRail
          expanded={navOpen}
          preview={state.preview}
          storeName={state.storeName}
          onOpen={(id) => dispatch({ type: "rail", id })}
          onGo={(page) => dispatch({ type: "preview", page })}
          onSearch={(scope) => setPalette({ open: true, scope })}
          onLogout={() => {
            setNavOpen(false);
            dispatch({ type: "logout" });
          }}
        />
      </div>
      {palette.open ? (
        <SearchPalette
          state={state}
          initialScope={palette.scope}
          onClose={() => setPalette({ open: false })}
          onGo={(page) => dispatch({ type: "preview", page })}
          onRail={(id) => dispatch({ type: "rail", id })}
          onProduct={(id) => dispatch({ type: "product", id })}
          onAsk={(text) => {
            if (!busy) send(text, "sidekick");
          }}
        />
      ) : null}
      <span className="sr-only">{agent.name}</span>
      {booting ? <BootScreen storeName={state.storeName} /> : null}
    </div>
  );
}

function committedSegments(message: UIMessage): Segment[] | undefined {
  const segments = segmentsOf(message).map((segment) => (segment.type === "tool" ? { type: "tool" as const, label: segment.label } : segment));
  return segments.some((segment) => segment.type === "tool") ? segments : undefined;
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
