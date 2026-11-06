"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AgentNav } from "@/components/agent-nav";
import { ChatColumn } from "@/components/chat-column";
import { Orb } from "@/components/marks";
import { PreviewColumn } from "@/components/preview-column";
import { SearchPalette } from "@/components/search-palette";
import {
  activeState,
  personaFor,
  prototypeSnapshot,
  purposes,
  reducer,
  scriptedTurn,
  selectedAgent,
  sidekickPanels,
  sidekickStage,
  setupState,
  type Action,
  type Effect,
  type Segment,
  type PrototypeState,
} from "@/lib/prototype";
import { segmentsOf, sourcesOf } from "@/lib/turn";

const bootMs = 1500;

type Turn = { agentId: string; text: string; done: boolean; first: boolean };

export function AdminApp({ initialScenario = "setup" }: { initialScenario?: "setup" | "active" }) {
  const [state, setState] = useState<PrototypeState>(() =>
    initialScenario === "active" ? activeState() : { ...setupState("My Store", "sidekick"), signedIn: true },
  );
  const [booting, setBooting] = useState(true);
  const [offline, setOffline] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [palette, setPalette] = useState<{ open: boolean; scope?: string }>({ open: false });
  // The turn being streamed. Cleared in the same update that commits its reply, so the live view and
  // the committed message swap in one render instead of leaving a blank frame between them.
  const [live, setLive] = useState<{ agentId: string; from: number } | null>(null);
  const bootTimer = useRef<number | null>(null);

  function enter(update: (current: PrototypeState) => PrototypeState) {
    setState(update);
    if (bootTimer.current) window.clearTimeout(bootTimer.current);
    setBooting(true);
    bootTimer.current = window.setTimeout(() => setBooting(false), bootMs);
  }

  useEffect(() => {
    bootTimer.current = window.setTimeout(() => setBooting(false), bootMs);
    return () => {
      if (bootTimer.current) window.clearTimeout(bootTimer.current);
    };
  }, []);
  const turn = useRef<Turn | null>(null);
  const applied = useRef(new Set<string>());
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const dispatch = (action: Action) => setState((current) => reducer(current, action));
  const stage = sidekickStage(state);
  const panels = sidekickPanels(state);
  const panelsRef = useRef(panels);
  useEffect(() => {
    panelsRef.current = { nav: panels.nav, preview: panels.preview };
  }, [panels.nav, panels.preview]);
  const [viewport, setViewport] = useState(1440);
  useEffect(() => {
    const measure = () => setViewport(document.documentElement.clientWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  // While the conversation is alone it is already the width it will have once both sidebars are in,
  // so the choice reveals the room around it instead of squeezing the words.
  const conversationWidth = Math.max(360, viewport - (8 + 12 + 1 + 248 + 584));
  const [seenStage, setSeenStage] = useState(stage);
  const [settling, setSettling] = useState(false);
  if (stage !== seenStage) {
    setSeenStage(stage);
    if (seenStage && !stage) setSettling(true);
  }
  useEffect(() => {
    if (!settling) return;
    const timer = window.setTimeout(() => setSettling(false), 720);
    return () => window.clearTimeout(timer);
  }, [settling]);
  const chatRef = useRef<HTMLDivElement>(null);
  const placed = useRef({ stage: true, left: 0 });
  useLayoutEffect(() => {
    const node = chatRef.current;
    if (!node || booting) return;
    const left = node.getBoundingClientRect().left;
    if (placed.current.stage && !stage && state.motion && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.setProperty("--shift", `${placed.current.left - left}px`);
      node.classList.remove("conversation-settle");
      void node.offsetWidth;
      node.classList.add("conversation-settle");
    }
    placed.current = { stage, left: stage ? left : placed.current.left };
  }, [stage, viewport, state.motion, booting]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        if (!panelsRef.current.nav) return;
        setSidebarOpen((open) => !open);
      } else if (key === "k") {
        event.preventDefault();
        if (!panelsRef.current.nav) return;
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
      setLive(null);
      setState((current) => {
        const script = scriptedTurn(pending.agentId, pending.text, current.storeName, current.arrival);
        const withText = reducer(current, { type: "commit", agentId: pending.agentId, text: script.text });
        return reducer(withText, { type: "effects", effects: script.effects });
      });
    },
  });

  function finishTurn(message: UIMessage) {
    const pending = turn.current;
    if (!pending || pending.done) return;
    pending.done = true;
    setLive(null);
    const text = replyText(message);
    const scripted = scriptedEffects(message);
    setOffline(scripted !== null || !text);
    const effects = scripted ?? effectsFrom(message, applied.current);
    const segments = committedSegments(message);
    const sources = sourcesOf(message);
    let answer = text;
    setState((current) => {
      if (!text) {
        const script = scriptedTurn(pending.agentId, pending.text, current.storeName, current.arrival);
        answer = script.text;
        const withScript = reducer(current, { type: "commit", agentId: pending.agentId, text: script.text });
        return reducer(withScript, { type: "effects", effects: script.effects });
      }
      const withText = reducer(current, { type: "commit", agentId: pending.agentId, text, segments, sources, streamed: true });
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
  const liveMessage = live ? chat.messages.slice(live.from).findLast((message) => message.role === "assistant") : undefined;
  const liveSegments = live ? segmentsOf(liveMessage) : null;
  const busy = live !== null;
  const liveAgentId = live?.agentId ?? null;

  function send(text: string, target?: string) {
    const current = state;
    const agentId = target ?? (current.mode === "add" ? "sidekick" : current.selectedAgentId);
    const thread = current.threads[agentId] ?? [];
    const transcript = thread.flatMap((block) => (block.type === "text" ? [{ role: block.role, content: block.text }] : []));
    const first = !thread.some((block) => block.type === "text" && block.role === "user");
    turn.current = { agentId, text, done: false, first };
    setLive({ agentId, from: chat.messages.length });
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

  function logout() {
    setSidebarOpen(true);
    enter((current) => ({ ...setupState(current.storeName, current.arrival), motion: current.motion, signedIn: true }));
  }

  function stop() {
    const pending = turn.current;
    const partial = liveMessage ? replyText(liveMessage) : "";
    void chat.stop();
    setLive(null);
    if (!pending || pending.done) return;
    pending.done = true;
    dispatch({ type: "commit", agentId: pending.agentId, text: partial || "Stopped.", segments: liveMessage ? committedSegments(liveMessage) : undefined, streamed: Boolean(partial) });
  }

  if (booting) {
    return (
      <div className="relative h-dvh bg-[#0c0d0c]">
        <BootScreen storeName={state.storeName} />
      </div>
    );
  }

  return (
    <div
      data-shell={stage ? "conversation" : settling ? "reveal" : "workspace"}
      className={`fade-in p-partial-theme-admin-next-dark relative flex h-dvh bg-[#0c0d0c] p-1 text-white ${stage ? "justify-center gap-0" : "min-w-[1180px] gap-1"}`}
    >
        <AgentNav
          present={panels.nav}
          state={state}
          navOpen={sidebarOpen}
          onToggleNav={() => setSidebarOpen((open) => !open)}
          onSettings={() => dispatch({ type: "rail", id: "settings" })}
          onLogout={logout}
          onSelect={(id) => dispatch({ type: "select", id })}
          onAdd={() => dispatch({ type: "toggle-add" })}
          onSearch={() => dispatch({ type: "toggle-search" })}
          onQuery={(query) => dispatch({ type: "search", query })}
          onScenario={(scenario) => dispatch({ type: "scenario", scenario })}
          onArrival={(arrival) => dispatch({ type: "arrival", arrival })}
          onMenuStyle={(style) => dispatch({ type: "menu-style", style })}
        />
        <div
          aria-hidden
          className="rail-reveal my-3 shrink-0 bg-white/10"
          style={{ width: panels.nav ? 1 : 0, opacity: panels.nav ? 1 : 0 }}
        />
        <div
          ref={chatRef}
          className={`flex min-h-0 min-w-0 flex-col ${stage ? "shrink-0" : "flex-1"}`}
          style={stage ? { width: conversationWidth } : undefined}
        >
        <ChatColumn
          state={state}
          liveSegments={liveAgentId === agent.id ? liveSegments : null}
          offline={offline}
          busy={busy && liveAgentId === agent.id}
          onSwitch={(id) => dispatch({ type: "select", id })}
          onAddAgent={() => dispatch({ type: "toggle-add" })}
          locked={busy}
          onChip={(label) => dispatch({ type: "chip", label })}
          onSend={send}
          onStop={stop}
          onPurpose={(id) => dispatch({ type: "toggle-purpose", id })}
          onStart={() => dispatch({ type: "chip", label: "Start working" })}
          onAddCatalog={(id) => dispatch({ type: "add-catalog", id })}
          onCreate={(name, purpose) => dispatch({ type: "create-agent", name, purpose })}
          onEditAgent={(patch) => dispatch({ type: "edit-agent", ...patch })}
          onConversations={(open) => dispatch({ type: "conversations", open })}
          onNewChat={() => dispatch({ type: "new-chat" })}
          onOpenConversation={(id) => dispatch({ type: "open-conversation", id })}
          onDeleteConversation={(id) => dispatch({ type: "delete-conversation", id })}
          onRate={(id, value) => dispatch({ type: "rate", id, value })}
        />
        </div>
      <PreviewColumn
        present={panels.preview}
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
        onBusiness={(value) => dispatch({ type: "business-type", value })}
        onIdentity={(patch) => dispatch({ type: "identity", patch })}
        onPaymentsNext={() => dispatch({ type: "payments-next" })}
        onPaymentsBack={() => dispatch({ type: "payments-back" })}
        onProduct={(id) => dispatch({ type: "product", id })}
        onUpdateProduct={(id, patch) => dispatch({ type: "update-product", id, patch })}
        onAddProduct={() => dispatch({ type: "add-blank-product" })}
        onRail={(id) => dispatch({ type: "rail", id })}
        onSearch={(scope) => setPalette({ open: true, scope })}
      />
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
      wide: value.wide === true,
    };
  }
  if (name === "addSidekick" && typeof value.id === "string") return { type: "add-sidekick", id: value.id };
  if (name === "showArtifact" && (value.name === "payments-plan" || value.name === "best-sellers")) {
    return { type: "artifact", name: value.name };
  }
  return null;
}
