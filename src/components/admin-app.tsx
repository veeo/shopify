"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AgentNav } from "@/components/agent-nav";
import { ChatColumn } from "@/components/chat-column";
import { Orb } from "@/components/marks";
import { OrbAudioProvider } from "@/components/orb-audio";
import { DesignSystem } from "@/components/design-system";
import { PreviewColumn } from "@/components/preview-column";
import { SearchPalette } from "@/components/search-palette";
import {
  activeState,
  personaFor,
  prototypeSnapshot,
  purposes,
  focusAskedPage,
  reducer,
  restoreWork,
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
import { bundleOf, draftOf, interpret, type ChoiceCard, type DraftSpec } from "@/lib/choices";
import { segmentsOf, sourcesOf } from "@/lib/turn";
import type { Chip, Product } from "@/lib/prototype";
import { emptyWork, readWorkSnapshot, saveWork, subscribeWork } from "@/lib/workspace";
import { useShellLayout } from "@/hooks/use-shell-layout";
import { SHELL, type AdminLayoutMode } from "@/lib/shell-layout";

const bootMs = 1500;

type Turn = { agentId: string; text: string; done: boolean; first: boolean };

export function AdminApp({ initialScenario = "active" }: { initialScenario?: "setup" | "active" }) {
  const [state, setState] = useState<PrototypeState>(() =>
    initialScenario === "active" ? activeState() : { ...setupState("My Store", "sidekick"), signedIn: true },
  );
  const [booting, setBooting] = useState(true);
  const [offline, setOffline] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agentsDrawerOpen, setAgentsDrawerOpen] = useState(false);
  const [adminSheetOpen, setAdminSheetOpen] = useState(false);
  const [palette, setPalette] = useState<{ open: boolean; scope?: string }>({ open: false });
  const [design, setDesign] = useState(false);
  const layout = useShellLayout();
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

  const client = useSyncExternalStore(subscribeWork, () => true, () => false);
  const saved = useSyncExternalStore(subscribeWork, readWorkSnapshot, emptyWork);
  const [appliedWork, setAppliedWork] = useState(false);
  if (client && !appliedWork) {
    setAppliedWork(true);
    if (saved) setState((current) => restoreWork(current, saved));
  }
  useEffect(() => {
    bootTimer.current = window.setTimeout(() => setBooting(false), bootMs);
    return () => {
      if (bootTimer.current) window.clearTimeout(bootTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!appliedWork) return;
    const custom = state.agents.filter((agent) => agent.id.startsWith("custom-"));
    const threads = Object.fromEntries(custom.map((agent) => [agent.id, state.threads[agent.id] ?? []]));
    saveWork({
      scenario: state.scenario,
      selectedAgentId: state.selectedAgentId,
      seq: state.seq,
      workspaces: state.workspaces,
      products: state.products,
      agents: custom,
      threads,
    });
  }, [appliedWork, state]);
  const turn = useRef<Turn | null>(null);
  const applied = useRef(new Set<string>());
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const dispatch = (action: Action) => setState((current) => reducer(current, action));
  const opening = sidekickStage(state);
  const [room, setRoom] = useState(false);
  const [seenOpening, setSeenOpening] = useState(opening);
  if (opening !== seenOpening) {
    setSeenOpening(opening);
    if (opening) setRoom(false);
  }
  // The title introduces Sidekick alone. The word Sidekick then slides into place as both sidebars come in, and the next step is written after that.
  const stage = opening && !room;
  const panels = sidekickPanels(state, room);
  const panelsRef = useRef(panels);
  useEffect(() => {
    panelsRef.current = { nav: panels.nav, preview: panels.preview };
  }, [panels.nav, panels.preview]);
  // The title is introduced where it will sit once both sidebars are in, so the room opens around it and the words never move.
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
  }, [stage, layout.width, state.motion, booting]);

  // When the layout band changes, collapse the rail on tight surfaces and clear overlays that no longer apply.
  const [seenLayoutMode, setSeenLayoutMode] = useState(layout.mode);
  if (layout.mode !== seenLayoutMode) {
    setSeenLayoutMode(layout.mode);
    if (layout.preferNavCollapsed) setSidebarOpen(false);
    if (layout.agents === "rail") setAgentsDrawerOpen(false);
    if (layout.admin === "docked") setAdminSheetOpen(false);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        if (!panelsRef.current.nav) return;
        if (layout.agents === "drawer") {
          setAgentsDrawerOpen((open) => !open);
          return;
        }
        setSidebarOpen((open) => !open);
      } else if (key === "k") {
        event.preventDefault();
        if (!panelsRef.current.nav) return;
        setPalette((current) => ({ open: !current.open }));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [layout.agents]);

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
    const bestSellers = /top products|best[- ]?sellers?|best[- ]?selling/i.test(pending.text);
    const scripted = scriptedEffects(message);
    setOffline(scripted !== null || !text);
    const effects = focusAskedPage(pending.text, scripted ?? effectsFrom(message, applied.current));
    const segments = committedSegments(message);
    const sources = sourcesOf(message);
    let answer = text;
    setState((current) => {
      if (!text || bestSellers) {
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

  const fillTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (fillTimer.current) window.clearTimeout(fillTimer.current);
    },
    [],
  );
  const confirmChips: Chip[] = [
    { label: "Save as draft", tone: "primary" },
    { label: "Publish", tone: "secondary" },
  ];

  function finishFill(agentId: string, title: string) {
    setState((prev) =>
      reducer(prev, {
        type: "follow-up",
        agentId,
        text: `${title} is filled in on the product form. Save it as a draft, or publish it. You can still edit any field.`,
        chips: confirmChips,
      }),
    );
  }

  function startFill(agentId: string, spec: DraftSpec) {
    if (fillTimer.current) window.clearTimeout(fillTimer.current);
    const productId = `choice-${Date.now().toString(36)}`;
    setState((prev) => reducer(prev, { type: "begin-draft", agentId, productId }));
    const steps: { label: string; patch?: Partial<Product>; draft?: Record<string, string> }[] = [
      { label: "Entering the title", patch: { title: spec.title } },
      { label: "Writing the description", patch: { description: spec.description } },
      { label: "Setting the price", patch: { price: spec.price } },
      { label: "Adding the photo", patch: { image: spec.image } },
      { label: "Adding the default variant", patch: { inventory: "14 in stock" }, draft: { variant: "Default", quantity: "14" } },
    ];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setState((prev) => {
        let next = prev;
        for (const step of steps) {
          next = reducer(next, { type: "status", agentId, label: step.label });
          if (step.patch) next = reducer(next, { type: "update-product", id: productId, patch: step.patch });
          if (step.draft && next.selectedAgentId === agentId) next = reducer(next, { type: "view", patch: { draft: step.draft } });
        }
        return next;
      });
      finishFill(agentId, spec.title);
      return;
    }
    let index = 0;
    const run = () => {
      const step = steps[index];
      setState((prev) => {
        let next = reducer(prev, { type: "status", agentId, label: step.label });
        if (step.patch) next = reducer(next, { type: "update-product", id: productId, patch: step.patch });
        if (step.draft && next.selectedAgentId === agentId) next = reducer(next, { type: "view", patch: { draft: step.draft } });
        return next;
      });
      index += 1;
      fillTimer.current = window.setTimeout(index < steps.length ? run : () => finishFill(agentId, spec.title), 720);
    };
    fillTimer.current = window.setTimeout(run, 420);
  }

  function placeChoice(agentId: string, card: ChoiceCard) {
    const draft = draftOf(card);
    if (draft) {
      startFill(agentId, draft);
      return;
    }
    if (fillTimer.current) window.clearTimeout(fillTimer.current);
    setState((prev) => {
      let next = reducer(prev, { type: "status", agentId, label: card.kind === "segment" ? "Creating the segment" : "Opening it in the admin" });
      if (card.kind === "segment") {
        next = reducer(next, { type: "preview", page: "customers", wide: true });
        next = reducer(next, { type: "view", patch: { draft: { segment: card.title, names: (card.names ?? []).join("|") } } });
      } else if (card.kind === "order") {
        next = reducer(next, { type: "preview", page: "orders", wide: true });
        next = reducer(next, { type: "view", patch: { recordId: card.orderId ?? "", draft: { action: card.action ?? "" } } });
      } else {
        next = reducer(next, { type: "preview", page: "online-store", wide: true });
        next = reducer(next, { type: "view", patch: { draft: { note: card.note ?? card.pitch } } });
      }
      return next;
    });
    const done =
      card.kind === "segment"
        ? `${card.title} is created. The customer list is filtered to it.`
        : card.kind === "order"
          ? `${card.action ?? card.title} is ready on the order.`
          : `Online Store is open. ${card.note ?? card.pitch}`;
    fillTimer.current = window.setTimeout(() => {
      setState((prev) => reducer(prev, { type: "follow-up", agentId, text: done }));
    }, 780);
  }

  function choose(blockId: string, cardId: string) {
    const agentId = state.selectedAgentId;
    const block = (state.threads[agentId] ?? []).find((item) => item.type === "choices" && item.id === blockId);
    if (!block || block.type !== "choices" || block.settled || block.replaced) return;
    const card = block.cards.find((item) => item.id === cardId);
    if (!card) return;
    if (block.mode === "multi") {
      dispatch({ type: "select-choice", agentId, blockId, cardId });
      return;
    }
    setState((prev) =>
      reducer(reducer(prev, { type: "user", agentId, text: card.title }), { type: "select-choice", agentId, blockId, cardId }),
    );
    placeChoice(agentId, card);
  }

  function bundleChoices(blockId: string) {
    const agentId = state.selectedAgentId;
    const block = (state.threads[agentId] ?? []).find((item) => item.type === "choices" && item.id === blockId);
    if (!block || block.type !== "choices" || block.settled) return;
    const cards = block.cards.filter((card) => block.selected.includes(card.id));
    if (cards.length < 2) return;
    const bundled = bundleOf(cards);
    const last = cards[cards.length - 1];
    setState((prev) =>
      reducer(
        reducer(prev, { type: "user", agentId, text: `Bundle ${cards.map((card) => card.title).join(" and ")}` }),
        { type: "select-choice", agentId, blockId, cardId: last.id, lock: true },
      ),
    );
    placeChoice(agentId, bundled);
  }

  function send(text: string, target?: string) {
    const current = state;
    if (!target && text.trim() === "Create my own sidekick") {
      dispatch({ type: "chip", label: "Create my own sidekick" });
      return;
    }
    const agentId = target ?? (current.mode === "add" ? "sidekick" : current.selectedAgentId);
    const thread = current.threads[agentId] ?? [];
    const intent = interpret(agentId, text, thread);
    if (intent) {
      if (intent.kind === "offer") {
        setState((prev) =>
          reducer(
            reducer(prev, { type: "user", agentId, text }),
            { type: "offer-choices", agentId, intro: intent.intro, title: intent.title, cards: intent.cards, mode: intent.mode, setKey: intent.setKey },
          ),
        );
        return;
      }
      if (intent.kind === "pick") {
        const block = [...thread].reverse().find((item) => item.type === "choices" && !item.replaced);
        if (block && block.type === "choices") {
          setState((prev) =>
            reducer(
              reducer(prev, { type: "user", agentId, text: intent.card.title }),
              { type: "select-choice", agentId, blockId: block.id, cardId: intent.card.id },
            ),
          );
          if (block.mode === "single") placeChoice(agentId, intent.card);
          return;
        }
      }
      if (intent.kind === "arm-multi") {
        setState((prev) => reducer(reducer(prev, { type: "user", agentId, text }), { type: "arm-multi", agentId }));
        return;
      }
      if (intent.kind === "bundle") {
        const block = [...thread].reverse().find((item) => item.type === "choices" && !item.replaced);
        if (block && block.type === "choices") {
          const bundled = bundleOf(intent.cards);
          setState((prev) =>
            reducer(
              reducer(prev, { type: "user", agentId, text: `Bundle ${intent.cards.map((card) => card.title).join(" and ")}` }),
              { type: "select-choice", agentId, blockId: block.id, cardId: intent.cards[intent.cards.length - 1].id, lock: true },
            ),
          );
          placeChoice(agentId, bundled);
          return;
        }
      }
      if (intent.kind === "regen") {
        const open = [...thread].reverse().find((item) => item.type === "choices" && !item.replaced);
        const seed = agentId === "customers" ? "who should i group" : agentId === "orders" ? "which order needs me" : agentId === "store" ? "show me theme ideas" : "what else could we sell";
        const again = interpret(agentId, seed, open?.type === "choices" ? [open] : []);
        const offer = again?.kind === "offer" ? again : null;
        if (offer && offer.kind === "offer") {
          setState((prev) =>
            reducer(
              reducer(prev, { type: "user", agentId, text }),
              { type: "offer-choices", agentId, intro: "Here’s a different set.", title: offer.title, cards: offer.cards, mode: offer.mode, setKey: offer.setKey },
            ),
          );
          return;
        }
      }
      if (intent.kind === "confirm") {
        dispatch({ type: "confirm-product", publish: intent.publish });
        return;
      }
      if (intent.kind === "cancel") {
        setState((prev) => reducer(reducer(prev, { type: "user", agentId, text }), { type: "cancel-draft", agentId }));
        return;
      }
    }
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

  const agentsDrawer = layout.agents === "drawer";
  const adminSheet = layout.admin === "sheet";
  const showAgentRail = panels.nav && !agentsDrawer;
  const navOpen = sidebarOpen;
  const agentsDrawerVisible = agentsDrawer && agentsDrawerOpen;
  const adminSheetVisible = adminSheet && adminSheetOpen;
  // Sheets ignore desktop layout modes; docked desktops honor sidebar / expanded / takeover.
  const effectiveLayout: AdminLayoutMode = adminSheet
    ? "sidebar"
    : state.adminLayout === "takeover" && !layout.allowAdminTakeover
      ? layout.allowAdminWide
        ? "expanded"
        : "sidebar"
      : state.adminLayout === "expanded" && !layout.allowAdminWide
        ? "sidebar"
        : state.adminLayout;
  const takeover = !adminSheet && effectiveLayout === "takeover" && panels.preview;
  const dockedAdminWidth =
    takeover
      ? undefined
      : effectiveLayout === "expanded" && layout.allowAdminWide
        ? SHELL.adminWide
        : Math.min(layout.adminWidth, SHELL.adminNarrow);

  function setAdminLayout(mode: AdminLayoutMode) {
    dispatch({ type: "admin-layout", mode });
  }

  return (
    <OrbAudioProvider>
    <div
      data-shell={stage ? "conversation" : settling ? "reveal" : "workspace"}
      data-layout={layout.mode}
      className={`fade-in p-partial-theme-admin-next-dark relative flex h-dvh gap-1 bg-[#0c0d0c] text-white ${
        layout.mode === "mobile" ? "p-0" : "p-1"
      }`}
    >
      {design ? (
        <DesignSystem onBack={() => setDesign(false)} />
      ) : (
      <>
        {showAgentRail ? (
          <AgentNav
            present={panels.nav}
            state={state}
            presentation="rail"
            navOpen={navOpen}
            merged={takeover}
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
            onDesignSystem={() => setDesign(true)}
            onViewSidekicks={() => setAdminLayout("sidebar")}
            onAdminOpen={(id) => dispatch({ type: "rail", id })}
            onAdminGo={(page) => dispatch({ type: "preview", page, layout: "takeover" })}
            onAdminSearch={(scope) => setPalette({ open: true, scope })}
          />
        ) : null}
        {agentsDrawer ? (
          <AgentNav
            present
            state={state}
            presentation="drawer"
            drawerOpen={agentsDrawerVisible}
            onCloseDrawer={() => setAgentsDrawerOpen(false)}
            navOpen
            onToggleNav={() => setAgentsDrawerOpen(false)}
            onSettings={() => {
              setAgentsDrawerOpen(false);
              dispatch({ type: "rail", id: "settings" });
            }}
            onLogout={logout}
            onSelect={(id) => dispatch({ type: "select", id })}
            onAdd={() => {
              setAgentsDrawerOpen(false);
              dispatch({ type: "toggle-add" });
            }}
            onSearch={() => dispatch({ type: "toggle-search" })}
            onQuery={(query) => dispatch({ type: "search", query })}
            onScenario={(scenario) => dispatch({ type: "scenario", scenario })}
            onArrival={(arrival) => dispatch({ type: "arrival", arrival })}
            onMenuStyle={(style) => dispatch({ type: "menu-style", style })}
            onDesignSystem={() => {
              setAgentsDrawerOpen(false);
              setDesign(true);
            }}
          />
        ) : null}
        <div
          aria-hidden
          className="rail-reveal my-3 shrink-0 bg-white/10"
          style={{
            width: showAgentRail && panels.nav && !takeover ? 1 : 0,
            opacity: showAgentRail && panels.nav && !takeover ? 1 : 0,
          }}
        />
        <div
          ref={chatRef}
          className={`relative flex min-h-0 flex-col ${takeover ? "pointer-events-none absolute inset-y-0 w-0 overflow-hidden opacity-0" : "min-w-0 flex-1"}`}
          aria-hidden={takeover ? true : undefined}
        >
          {!takeover ? (
            <ChatColumn
              state={state}
              liveSegments={liveAgentId === agent.id ? liveSegments : null}
              offline={offline}
              busy={busy && liveAgentId === agent.id}
              chrome={layout.chatChrome}
              showAdminButton={adminSheet && panels.preview}
              adminOpen={adminSheetVisible}
              onOpenAgents={agentsDrawer ? () => setAgentsDrawerOpen(true) : undefined}
              onOpenAdmin={adminSheet && panels.preview ? () => setAdminSheetOpen((open) => !open) : undefined}
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
              onTogglePin={(id) => dispatch({ type: "toggle-pin", id })}
              onToggleHide={(id) => dispatch({ type: "toggle-hide", id })}
              onConversations={(open) => dispatch({ type: "conversations", open })}
              onNewChat={() => dispatch({ type: "new-chat" })}
              onOpenConversation={(id) => dispatch({ type: "open-conversation", id })}
              onDeleteConversation={(id) => dispatch({ type: "delete-conversation", id })}
              onRate={(id, value) => dispatch({ type: "rate", id, value })}
              onIntroduced={() => setRoom(true)}
              onIntroFinished={() => dispatch({ type: "intro-seen" })}
              onChoose={choose}
              onBundle={bundleChoices}
            />
          ) : null}
        </div>
      <PreviewColumn
        present={panels.preview}
        presentation={adminSheet ? "sheet" : "docked"}
        sheetOpen={adminSheetVisible}
        sheetEdge={layout.adminSheetEdge}
        dockWidth={dockedAdminWidth}
        takeover={takeover}
        showLayoutControl={!adminSheet && panels.preview}
        onLayout={setAdminLayout}
        onCloseSheet={() => setAdminSheetOpen(false)}
        state={state}
        onPreview={(page, wide) =>
          dispatch({
            type: "preview",
            page,
            // Keep takeover when the page stays "wide"; otherwise honor the boolean expand/collapse.
            layout:
              wide === undefined
                ? undefined
                : wide && layout.allowAdminWide
                  ? effectiveLayout === "takeover"
                    ? "takeover"
                    : "expanded"
                  : "sidebar",
            wide: Boolean(wide) && layout.allowAdminWide,
          })
        }
        onView={(patch) => dispatch({ type: "view", patch })}
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
      </>
      )}
    </div>
    </OrbAudioProvider>
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
