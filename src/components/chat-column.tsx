"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChipButton, IconButton, Orb } from "@/components/marks";
import { Markdown } from "@/components/markdown";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { pageMeta } from "@/lib/admin-nav";
import {
  catalog,
  paymentSteps,
  purposes,
  sellers,
  selectedAgent,
  type Agent,
  type Block,
  type Conversation,
  type PrototypeState,
  type Segment,
  type Source,
} from "@/lib/prototype";
import type { LiveSegment } from "@/lib/turn";

export function ChatColumn({
  state,
  liveSegments,
  busy,
  locked,
  offline,
  onChip,
  onSend,
  onStop,
  onPurpose,
  onStart,
  onAddCatalog,
  onCreate,
  onScenario,
  onMotion,
  onReset,
  onCloseExperiments,
  onConversations,
  onNewChat,
  onOpenConversation,
  onDeleteConversation,
  onRate,
}: {
  state: PrototypeState;
  liveSegments: LiveSegment[] | null;
  busy: boolean;
  locked: boolean;
  offline: boolean;
  onChip: (label: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onPurpose: (id: string) => void;
  onStart: () => void;
  onAddCatalog: (id: string) => void;
  onCreate: (name: string, purpose: string) => void;
  onScenario: (scenario: "setup" | "active") => void;
  onMotion: (on: boolean) => void;
  onReset: () => void;
  onCloseExperiments: () => void;
  onConversations: (open: boolean) => void;
  onNewChat: () => void;
  onOpenConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRate: (id: string, value: "up" | "down") => void;
}) {
  const agent = selectedAgent(state);
  const purpose = state.selectedAgentId === "chief" && state.chiefPhase === "purpose" && state.mode === "thread";
  const listing = state.mode === "thread" && state.conversationsOpen;
  const title = state.mode === "add" ? "Add a sidekick" : purpose ? "Chief of staff" : agent.name;
  const topic = state.mode === "add" ? null : purpose ? "Set purpose" : agent.topic;
  const [moreOpen, setMoreOpen] = useState(false);
  const [typedDone, setTypedDone] = useState(() => new Set(typedOnce));
  const markTyped = useCallback((id: string) => {
    typedOnce.add(id);
    setTypedDone(new Set(typedOnce));
  }, []);
  const thread = state.threads[agent.id] ?? [];
  const scroller = useRef<HTMLDivElement>(null);
  const liveLength = liveSegments?.reduce((sum, segment) => sum + (segment.type === "text" ? segment.text.length : 1), 0) ?? 0;

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    if (node.scrollHeight - node.scrollTop - node.clientHeight < 240) node.scrollTop = node.scrollHeight;
  }, [thread.length, liveLength, busy]);

  return (
    <section className="relative flex min-w-0 flex-1 flex-col px-8 pb-3 pt-7">
      {listing ? (
        <ConversationsView
          agentName={agent.name}
          current={thread.some((block) => block.type === "text" && block.role === "user") ? agent.topic || "Current conversation" : null}
          list={state.conversations[agent.id] ?? []}
          onBack={() => onConversations(false)}
          onNewChat={onNewChat}
          onOpen={onOpenConversation}
          onDelete={onDeleteConversation}
        />
      ) : (
        <>
          <header className="mb-3 flex items-start justify-between gap-4">
            <h1 className="min-w-0 flex-1 text-[25px] font-medium leading-8 tracking-[-0.75px]">
              {state.mode === "thread" && !purpose ? (
                <button
                  type="button"
                  onClick={() => onConversations(true)}
                  aria-label={`${title}${topic ? ` · ${topic}` : ""}. Show conversations`}
                  className="group -mx-2 flex max-w-full items-baseline gap-1.5 rounded-xl px-2 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <span className="max-w-[70%] shrink-0 truncate">{title}</span>
                  {topic ? <span className="min-w-0 truncate font-normal text-[#737373]">· {topic}</span> : null}
                  <span className="shrink-0 translate-y-1 self-center text-[#8e8f8b] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <PIcon name="ChevronDown" size={20} />
                  </span>
                </button>
              ) : (
                <span className="flex items-baseline gap-1.5">
                  <span className="truncate">{title}</span>
                  {topic ? <span className="truncate font-normal text-[#737373]">· {topic}</span> : null}
                </span>
              )}
            </h1>
            <div className="flex gap-1.5">
              {state.mode === "thread" ? (
                <>
                  <Tip label="Conversations">
                    <IconButton label="Conversations" onClick={() => onConversations(true)}>
                      <PIcon name="ClockRevert" size={20} />
                    </IconButton>
                  </Tip>
                  <Tip label="New chat">
                    <IconButton label="New chat" onClick={onNewChat}>
                      <PIcon name="Compose" size={20} />
                    </IconButton>
                  </Tip>
                </>
              ) : null}
              <IconButton label="More" onClick={() => setMoreOpen((open) => !open)} active={moreOpen} controls="more-menu">
                <PIcon name="MenuHorizontal" size={20} />
              </IconButton>
            </div>
          </header>

          {moreOpen ? (
            <Popover id="more-menu" onDismiss={() => setMoreOpen(false)} className="right-8 top-16 w-56 p-1.5">
              <MenuItem
                onClick={() => {
                  setMoreOpen(false);
                  onReset();
                }}
              >
                Reset this scenario
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMoreOpen(false);
                  onScenario(state.scenario === "active" ? "setup" : "active");
                }}
              >
                {state.scenario === "active" ? "Back to new merchant" : "Open the live store"}
              </MenuItem>
            </Popover>
          ) : null}

          <div
            ref={scroller}
            key={state.mode === "thread" ? agent.id : state.mode}
            className={`${state.motion ? "page-in" : ""} scroll-thin min-h-0 flex-1 overflow-y-auto pb-4`}
          >
            {state.mode === "add" ? (
              <AddGrid onAdd={onAddCatalog} onChip={onChip} />
            ) : purpose ? (
              <Purpose state={state} onPurpose={onPurpose} onStart={onStart} onChip={onChip} />
            ) : (
              <div className="flex max-w-[640px] flex-col gap-2">
                {visibleBlocks(thread, typedDone).map((block, index, list) =>
                  block.type === "text" && block.typed && !typedDone.has(block.id) ? (
                    <TypeOut
                      key={block.id}
                      text={block.text}
                      instant={!state.motion}
                      delay={block.id === "hello" ? 1100 : 350}
                      onDone={() => markTyped(block.id)}
                    />
                  ) : (
                    <BlockView
                      key={block.id}
                      block={block}
                      answer={isAnswer(list, index)}
                      state={state}
                      rating={state.ratings[block.id]}
                      onRate={(value) => onRate(block.id, value)}
                      onChip={onChip}
                      onAsk={(text) => {
                        if (!locked) onSend(text);
                      }}
                      onCreate={onCreate}
                    />
                  ),
                )}
                {busy ? <LiveTurn segments={liveSegments ?? []} /> : null}
              </div>
            )}
          </div>
        </>
      )}

      {offline && state.mode === "thread" && !listing ? (
        <p className="mb-1 mt-2 px-4 text-[12px] text-[#8e8f8b]">
          Claude isn’t connected on this deployment, so this reply is scripted.
        </p>
      ) : null}
      <Composer
        key={state.mode === "add" ? "add" : agent.id}
        state={state}
        agent={agent}
        suggestions={suggestionsFor(state)}
        busy={busy}
        locked={locked}
        onSend={onSend}
        onStop={onStop}
      />

      {state.experimentsOpen ? (
        <Popover
          id="experiments-menu"
          onDismiss={onCloseExperiments}
          className="bottom-20 left-8 w-72 origin-bottom-left p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-medium">Experiments</p>
            <s-button variant="tertiary" onClick={onCloseExperiments}>
              Close
            </s-button>
          </div>
          <p className="mb-2 text-[12px] text-[#8e8f8b]">Scenario</p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(["setup", "active"] as const).map((scenario) => (
              <s-button
                key={scenario}
                variant={state.scenario === scenario ? "primary" : "secondary"}
                inlineSize="fill"
                onClick={() => onScenario(scenario)}
              >
                {scenario === "setup" ? "New merchant" : "Active store"}
              </s-button>
            ))}
          </div>
          <s-switch label="Motion" checked={state.motion} onChange={(event) => onMotion(event.currentTarget.checked)} />
          <div className="mt-3">
            <s-button variant="tertiary" onClick={onReset}>
              Reset scenario
            </s-button>
          </div>
        </Popover>
      ) : null}
    </section>
  );
}

/** Dark label pill above the trigger, shown after the admin's ~0.5s hover delay. */
export function Tip({
  label,
  children,
  side = "top",
  keys,
}: {
  label: string;
  children: React.ReactNode;
  side?: "top" | "top-start" | "bottom" | "right" | "left";
  keys?: string[];
}) {
  const place = {
    top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
    "top-start": "bottom-full left-0 mb-1.5",
    bottom: "top-full left-1/2 mt-1.5 -translate-x-1/2",
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
  }[side];
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-[#1a1a1a] px-2 py-1 text-[12px] font-medium leading-4 text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-opacity duration-100 group-hover/tip:opacity-100 group-hover/tip:delay-500 group-has-[:focus-visible]/tip:opacity-100 ${place}`}
      >
        {label}
        {keys?.map((key) => (
          <kbd key={key} className="rounded bg-white/15 px-1 font-sans text-[10px] font-semibold uppercase leading-4 tracking-wide text-white/80">
            {key}
          </kbd>
        ))}
      </span>
    </span>
  );
}

function relativeTime(at: number, now: number) {
  const minutes = Math.max(1, Math.round((now - at) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function dayGroup(at: number, now: number) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const today = start.getTime();
  if (at >= today) return "Today";
  if (at >= today - 86_400_000) return "Yesterday";
  if (at >= today - 6 * 86_400_000) return "This week";
  return "Older";
}

function ConversationsView({
  agentName,
  current,
  list,
  onBack,
  onNewChat,
  onOpen,
  onDelete,
}: {
  agentName: string;
  current: string | null;
  list: Conversation[];
  onBack: () => void;
  onNewChat: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [now] = useState(() => Date.now());
  const [menu, setMenu] = useState<string | null>(null);
  const rows = [...(current ? [{ id: "current", title: current, at: now }] : []), ...list.toSorted((a, b) => b.at - a.at)];
  const groups = ["Today", "Yesterday", "This week", "Older"].map((name) => ({
    name,
    rows: rows.filter((row) => dayGroup(row.at, now) === name),
  }));

  return (
    <div className="page-in flex min-h-0 flex-1 flex-col">
      <header className="mb-3 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Tip label="Back" side="bottom">
            <IconButton label="Back to conversation" onClick={onBack}>
              <PIcon name="ArrowLeft" size={20} />
            </IconButton>
          </Tip>
          <h1 className="truncate text-[25px] font-medium leading-8 tracking-[-0.75px]">Conversations</h1>
        </div>
        <Tip label="New chat" side="bottom">
          <IconButton label="New chat" onClick={onNewChat}>
            <PIcon name="Compose" size={20} />
          </IconButton>
        </Tip>
      </header>
      <p className="mb-2 text-[13px] text-[#8e8f8b]">{agentName}</p>
      <div className="scroll-thin min-h-0 max-w-[640px] flex-1 overflow-y-auto pb-4">
        {rows.length === 0 ? <p className="py-6 text-[15px] text-[#8e8f8b]">No conversations yet.</p> : null}
        {groups.map((group) =>
          group.rows.length ? (
            <section key={group.name} className="mb-4">
              <h2 className="mb-1 px-3 text-[12px] font-medium text-[#8e8f8b]">{group.name}</h2>
              <ul>
                {group.rows.map((row) => (
                  <li key={row.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => (row.id === "current" ? onBack() : onOpen(row.id))}
                      className="press press-row flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] leading-5 hover:bg-white/[0.06]"
                    >
                      <span className="min-w-0 flex-1 truncate">{row.title}</span>
                      <span className="shrink-0 text-[13px] text-[#8e8f8b] transition-opacity group-hover:opacity-0">
                        {relativeTime(row.at, now)}
                      </span>
                    </button>
                    {row.id === "current" ? null : (
                      <button
                        type="button"
                        aria-label={`More actions for ${row.title}`}
                        aria-expanded={menu === row.id}
                        onClick={() => setMenu(menu === row.id ? null : row.id)}
                        className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-[#c4c4c4] opacity-0 transition-opacity hover:bg-white/10 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <PIcon name="MenuHorizontal" size={18} />
                      </button>
                    )}
                    {menu === row.id ? (
                      <div className="pop-in absolute right-2 top-full z-20 w-36 rounded-xl border border-white/10 bg-[#1a1a1a] p-1 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                        <button
                          type="button"
                          onClick={() => {
                            setMenu(null);
                            onDelete(row.id);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-[#ff8a80] hover:bg-white/[0.06]"
                        >
                          <PIcon name="Delete" size={18} />
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>
    </div>
  );
}

const genericSuggestions = [
  "What should I focus on today?",
  "Summarize what changed this week",
  "What can you help me with?",
  "Show me what you’ve been working on",
];

const pageSuggestions: Record<string, string[]> = {
  "home-setup": ["Help me choose a theme", "Customize my current theme", "Which theme should I use?", "What themes are popular?"],
  "home-active": ["How are sales this week?", "Which products are selling best?", "What should I work on today?", "Find orders that need attention"],
  products: ["Help me add my first product", "Write a product description", "How should I price my products?", "How do collections work?"],
  product: ["Write a description for this product", "Suggest a price", "What makes a good product photo?", "Add tags for this product"],
  payments: ["Which payment methods should I offer?", "How do payouts work?", "What are the transaction fees?", "Set up Shopify Payments"],
  "online-store": ["Help me choose a theme", "Customize my current theme", "Which theme should I use?", "What themes are popular?"],
  "settings-shipping": ["What shipping rates should I charge?", "Should I offer free shipping?", "How do I print shipping labels?", "Add an express rate"],
};

export function suggestionsFor(state: PrototypeState) {
  if (state.mode === "add") return ["Tell me more about creating a sidekick", "Which sidekick should I add first?", "Create my own sidekick", "What can sidekicks do?"];
  if (state.selectedAgentId !== "sidekick") {
    const asks = (state.threads[state.selectedAgentId] ?? [])
      .flatMap((block) => (block.type === "chips" ? block.chips.filter((chip) => chip.send).map((chip) => chip.label) : []))
      .slice(-2);
    return [...asks, ...genericSuggestions].slice(0, 4);
  }
  return pageSuggestions[state.preview] ?? [`Help me with ${pageMeta(state.preview).title}`, ...genericSuggestions].slice(0, 4);
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function speechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as Record<string, unknown>;
  return (scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

const skills = ["Write product descriptions", "Analyze sales", "Plan a campaign", "Set up shipping"];
const apps = ["Messaging", "Shop", "Point of Sale"];

export function Composer({
  state,
  agent,
  suggestions,
  busy,
  locked,
  onSend,
  onStop,
  light = false,
  rotating,
  onRecents,
}: {
  state: PrototypeState;
  agent: Agent;
  suggestions: string[];
  busy: boolean;
  locked: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  light?: boolean;
  rotating?: string[];
  onRecents?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [target, setTarget] = useState(false);
  const [roll, setRoll] = useState(0);
  const input = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const base = useRef("");
  const showSuggestions = focused && !draft.trim() && !busy && !plusOpen;
  const rolling = Boolean(rotating?.length) && !focused && !draft;
  const placeholder = state.mode === "add" && !light ? "Ask Sidekick…" : focused || light ? `Work with ${agent.name}` : agent.placeholder;

  useEffect(() => () => recognition.current?.stop(), []);
  useEffect(() => {
    if (!rotating?.length) return;
    const timer = window.setInterval(() => setRoll((value) => (value + 1) % rotating.length), 3500);
    return () => window.clearInterval(timer);
  }, [rotating]);

  function submit(text = draft) {
    const value = text.trim();
    if (!value || locked) return;
    const context = [
      files.length ? `Attached: ${files.join(", ")}` : "",
      target ? `Target: ${pageMeta(state.preview).title}` : "",
    ].filter(Boolean);
    setDraft("");
    setFiles([]);
    setTarget(false);
    recognition.current?.stop();
    if (light) input.current?.blur();
    onSend(context.length ? `${value}\n\n(${context.join(" · ")})` : value);
  }

  function insert(text: string) {
    setDraft((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}${text}`);
    setPlusOpen(false);
    requestAnimationFrame(() => input.current?.focus());
  }

  function dictate() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const denied = "Sidekick couldn’t access your microphone.";
    const Recognition = speechRecognition();
    if (!Recognition) {
      setNotice(denied);
      return;
    }
    const session = new Recognition();
    session.lang = navigator.language || "en-US";
    session.interimResults = true;
    session.continuous = true;
    base.current = draft ? `${draft.trimEnd()} ` : "";
    session.onresult = (event) => {
      const heard = Array.from(event.results, (result) => result[0]?.transcript ?? "").join("");
      setDraft(base.current + heard);
    };
    session.onerror = () => {
      setNotice(denied);
      setListening(false);
    };
    session.onend = () => setListening(false);
    recognition.current = session;
    try {
      session.start();
      setNotice(null);
      setListening(true);
    } catch {
      setNotice(denied);
    }
  }

  const tone = light
    ? {
        form: "rounded-2xl bg-white shadow-[0_0_0_1px_#e8e8e8,0_2px_12px_rgba(0,0,0,0.05)] focus-within:shadow-[0_0_0_1px_#cfcfcf,0_8px_28px_rgba(0,0,0,0.1)]",
        text: "min-h-[40px] px-3 pt-2.5 text-[13px] leading-[1.4] text-[#303030] placeholder:text-[#8a8a8a]",
        icon: "grid size-7 place-items-center rounded-lg text-[#303030] hover:bg-[#f1f1f1]",
        on: "bg-[#fee9e8] text-[#c70a24]",
        send: "grid size-7 place-items-center rounded-lg bg-[#303030] text-white hover:bg-black",
        notice: "bg-[#fee9e8] text-[#8e1f0b]",
        noticeIcon: "text-[#c70a24]",
        suggestion: "text-[12px] text-[#303030] hover:bg-[#f7f7f7]",
        suggestionIcon: "text-[#616161]",
        chip: "bg-[#f1f1f1] text-[#303030]",
      }
    : {
        form: "rounded-[20px] border border-[#2e302d] bg-[#121312] focus-within:border-[#4a4a4a] focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]",
        text: "min-h-[44px] px-4 pt-3 text-[15px] leading-5 tracking-[-0.15px] text-white placeholder:text-[#737572]",
        icon: "grid size-8 place-items-center rounded-full border border-white/10 bg-[#252525] text-white hover:bg-[#2f2f2f]",
        on: "bg-[#4a1f1b] text-[#ff8a80]",
        send: "grid size-8 place-items-center rounded-full bg-white text-black shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:bg-[#eee]",
        notice: "bg-[#2a1716] text-[#ffd2cc]",
        noticeIcon: "text-[#ff6d5e]",
        suggestion: "text-[13px] text-[#c4c4c4] hover:bg-white/[0.05] hover:text-white",
        suggestionIcon: "text-[#8e8f8b]",
        chip: "bg-white/[0.08] text-white/90",
      };
  const iconSize = light ? 18 : 20;

  return (
    <div
      className={`relative ${light ? "" : "mt-2"}`}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <form
        className={`relative flex flex-col transition-[border-color,box-shadow] duration-150 ${tone.form}`}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {notice ? (
          <div role="alert" className={`rise mx-2 mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] ${tone.notice}`}>
            <span className={tone.noticeIcon}>
              <PIcon name="AlertCircle" size={18} />
            </span>
            <span className="min-w-0 flex-1">{notice}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)} className="grid size-6 place-items-center rounded-md hover:bg-black/10">
              <PIcon name="X" size={16} />
            </button>
          </div>
        ) : null}
        {files.length || target ? (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
            {target ? <Attachment className={tone.chip} icon="Target" label={pageMeta(state.preview).title} onRemove={() => setTarget(false)} /> : null}
            {files.map((name) => (
              <Attachment key={name} className={tone.chip} icon="File" label={name} onRemove={() => setFiles((list) => list.filter((item) => item !== name))} />
            ))}
          </div>
        ) : null}
        <span className="relative">
          <textarea
            ref={input}
            rows={1}
            value={draft}
            aria-label={`Work with ${agent.name}`}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={rolling ? "" : placeholder}
            className={`block max-h-40 w-full resize-none bg-transparent outline-none [field-sizing:content] ${tone.text}`}
          />
          {rolling && rotating ? (
            <span key={roll} aria-hidden className={`placeholder-roll pointer-events-none absolute left-0 top-0 ${tone.text} text-[#8a8a8a]`}>
              {rotating[roll]}
            </span>
          ) : null}
        </span>
        <div className={`flex items-center gap-1 ${light ? "px-2 pb-2" : "gap-1.5 px-2.5 pb-2.5"}`}>
          <Orb id={state.mode === "add" && !light ? "sidekick" : agent.orb} size={light ? 20 : 24} />
          {listening ? (
            <span className={`ml-1 flex items-center gap-1.5 text-[12px] ${light ? "text-[#616161]" : "text-[#8e8f8b]"}`}>
              <span className="size-1.5 animate-pulse rounded-full bg-[#ff6d5e]" />
              Listening…
            </span>
          ) : null}
          <span className={`ml-auto flex items-center ${light ? "gap-0.5" : "gap-1.5"}`}>
            {onRecents ? (
              <>
                <button type="button" onClick={onRecents} className="press flex h-7 items-center gap-1 rounded-lg px-1.5 text-[12px] font-medium text-[#303030] hover:bg-[#f1f1f1]">
                  <PIcon name="ClockRevert" size={18} />
                  Recents
                </button>
                <span className="mx-1 h-4 w-px bg-[#e3e3e3]" />
              </>
            ) : null}
            <Tip label={plusOpen ? "Close" : "Add files and more"}>
              <button
                type="button"
                aria-label="Add files and more"
                aria-expanded={plusOpen}
                aria-controls="plus-menu"
                onClick={() => setPlusOpen((open) => !open)}
                className={`press ${tone.icon}`}
              >
                <span className={`transition-transform duration-200 ${plusOpen ? "rotate-45" : ""}`}>
                  <PIcon name="Plus" size={iconSize} />
                </span>
              </button>
            </Tip>
            {busy ? (
              <Tip label="Stop">
                <button type="button" aria-label="Stop generating" onClick={onStop} className={`press ${tone.icon}`}>
                  <span className={`size-2.5 rounded-[3px] ${light ? "bg-[#303030]" : "bg-white"}`} />
                </button>
              </Tip>
            ) : (
              <Tip label={listening ? "Stop dictating" : "Dictate"}>
                <button type="button" aria-label="Dictate" aria-pressed={listening} onClick={dictate} className={`press ${tone.icon} ${listening ? tone.on : ""}`}>
                  <PIcon name="Microphone" size={iconSize} />
                </button>
              </Tip>
            )}
            {draft.trim() && !busy ? (
              <button type="submit" aria-label="Send" disabled={locked} className={`press fade-in disabled:opacity-40 ${tone.send}`}>
                <PIcon name="ArrowUp" size={iconSize} />
              </button>
            ) : null}
          </span>
        </div>
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? [], (file) => file.name);
            setFiles((list) => [...new Set([...list, ...picked])]);
            event.target.value = "";
          }}
        />
      </form>

      {showSuggestions ? (
        <ul role="listbox" aria-label="Suggestions" className={`rise mt-2 flex flex-col ${light ? "px-1" : ""}`}>
          {suggestions.map((text) => (
            <li key={text} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submit(text)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${tone.suggestion}`}
              >
                <span className={tone.suggestionIcon}>
                  <PIcon name="ArrowRight" size={16} />
                </span>
                {text}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {plusOpen ? (
        <PlusMenu
          state={state}
          light={light}
          onDismiss={() => setPlusOpen(false)}
          onFiles={() => {
            setPlusOpen(false);
            fileInput.current?.click();
          }}
          onTarget={() => {
            setTarget(true);
            setPlusOpen(false);
            input.current?.focus();
          }}
          onInsert={insert}
          onVoice={() => {
            setPlusOpen(false);
            setNotice("Voice calls aren’t available in this prototype yet.");
          }}
        />
      ) : null}
    </div>
  );
}

function Attachment({ icon, label, className, onRemove }: { icon: PolarisIconName; label: string; className: string; onRemove: () => void }) {
  return (
    <span className={`flex max-w-[220px] items-center gap-1 rounded-lg py-0.5 pl-1.5 pr-0.5 text-[12px] ${className}`}>
      <PIcon name={icon} size={16} />
      <span className="truncate">{label}</span>
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="grid size-5 place-items-center rounded hover:bg-black/10">
        <PIcon name="X" size={14} />
      </button>
    </span>
  );
}

function PlusMenu({
  state,
  light,
  onDismiss,
  onFiles,
  onTarget,
  onInsert,
  onVoice,
}: {
  state: PrototypeState;
  light: boolean;
  onDismiss: () => void;
  onFiles: () => void;
  onTarget: () => void;
  onInsert: (text: string) => void;
  onVoice: () => void;
}) {
  const [sub, setSub] = useState<"mention" | "skills" | "apps" | null>(null);
  const [generate, setGenerate] = useState(true);
  const agents = state.agents.filter((item) => item.installed);
  const row = `flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left ${light ? "text-[12px] text-[#303030] hover:bg-[#f1f1f1]" : "text-[13px] text-white hover:bg-white/[0.07]"}`;
  const divider = `my-1 h-px ${light ? "bg-[#ebebeb]" : "bg-white/10"}`;

  return (
    <Popover
      id="plus-menu"
      light={light}
      onDismiss={onDismiss}
      className={light ? "right-0 top-[calc(100%+6px)] w-56 origin-top-right p-1.5" : "bottom-[calc(100%+8px)] right-0 w-64 origin-bottom-right p-1.5"}
    >
      {sub ? (
        <>
          <button type="button" onClick={() => setSub(null)} className={row}>
            <PIcon name="ChevronLeft" size={16} />
            {sub === "mention" ? "Mention" : sub === "skills" ? "Skills" : "Apps"}
          </button>
          <div className={divider} />
          {(sub === "mention" ? agents.map((item) => item.name) : sub === "skills" ? skills : apps).map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onInsert(sub === "skills" ? `/${label.toLowerCase().replace(/\s+/g, "-")} ` : `@${label} `)}
              className={row}
            >
              {sub === "mention" ? <Orb id={agents.find((item) => item.name === label)?.orb ?? "sidekick"} size={18} /> : null}
              <span className="truncate">{label}</span>
            </button>
          ))}
        </>
      ) : (
        <>
          <button type="button" onClick={onFiles} className={row}>
            <PIcon name="File" size={18} />
            Files
          </button>
          <button type="button" onClick={onFiles} className={row}>
            <PIcon name="Upload" size={18} />
            Upload from device
          </button>
          <button type="button" onClick={onTarget} className={row}>
            <PIcon name="Target" size={18} />
            Target
          </button>
          <button type="button" onClick={() => setSub("mention")} className={row}>
            <PIcon name="Mention" size={18} />
            <span className="flex-1">Mention</span>
            <Kbd light={light}>@</Kbd>
            <PIcon name="ChevronRight" size={16} />
          </button>
          <button type="button" onClick={() => setSub("skills")} className={row}>
            <PIcon name="Wand" size={18} />
            <span className="flex-1">Skills</span>
            <Kbd light={light}>/</Kbd>
            <PIcon name="ChevronRight" size={16} />
          </button>
          <div className={divider} />
          <button type="button" role="switch" aria-checked={generate} onClick={() => setGenerate((on) => !on)} className={row}>
            <PIcon name="Apps" size={18} />
            <span className="flex-1">Generate apps</span>
            <span className={`relative h-4 w-7 rounded-full transition-colors ${generate ? (light ? "bg-[#303030]" : "bg-white") : light ? "bg-[#d4d4d4]" : "bg-white/20"}`}>
              <span
                className={`absolute top-0.5 size-3 rounded-full transition-[left,background-color] duration-150 ${generate ? "left-[14px]" : "left-0.5"} ${
                  generate === !light ? "bg-[#1a1a1a]" : "bg-white"
                }`}
              />
            </span>
          </button>
          <button type="button" onClick={() => setSub("apps")} className={row}>
            <PIcon name="Apps" size={18} />
            <span className="flex-1">Apps</span>
            <span className="flex -space-x-1">
              <AppDot className="bg-[#5c6ac4]" icon="Chat" />
              <AppDot className="bg-[#5433eb]" icon="LogoShop" />
              <AppDot className="bg-[#008060]" icon="PointOfSale" />
            </span>
            <PIcon name="ChevronRight" size={16} />
          </button>
          <div className={divider} />
          <button type="button" onClick={onVoice} className={row}>
            <PIcon name="Sound" size={18} />
            Voice Call
          </button>
        </>
      )}
    </Popover>
  );
}

function Kbd({ children, light }: { children: React.ReactNode; light: boolean }) {
  return (
    <kbd className={`grid h-4 min-w-4 place-items-center rounded px-1 font-sans text-[11px] leading-none ${light ? "bg-[#ebebeb] text-[#616161]" : "bg-white/15 text-white/80"}`}>
      {children}
    </kbd>
  );
}

function AppDot({ className, icon }: { className: string; icon: PolarisIconName }) {
  return (
    <span className={`grid size-4 place-items-center rounded-[5px] text-white ring-1 ring-[#1a1a1a] ${className}`}>
      <PIcon name={icon} size={12} />
    </span>
  );
}

const braille = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function Spinner() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % braille.length), 80);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span aria-hidden className="inline-block w-3 text-center font-mono text-[13px] leading-none">
      {braille[frame]}
    </span>
  );
}

function ToolRow({ label, running }: { label: string; running?: boolean }) {
  return (
    <p className="rise flex items-center gap-1.5 py-1 text-[13px] text-[#8e8f8b]">
      {running ? <Spinner /> : <PIcon name="Check" size={16} />}
      <span className={running ? "shimmer-text" : ""}>{label}</span>
    </p>
  );
}

/** Streaming text: each newly arrived word mounts with a short fade, so the last few words trail in. */
function StreamText({ text }: { text: string }) {
  const lines = text.replace(/\*\*/g, "").split("\n");
  let word = 0;
  return (
    <div className="max-w-[560px] py-1 text-[15px] leading-[1.4] tracking-[-0.15px]">
      {lines.map((line, index) => {
        if (!line.trim()) return <span key={index} className="block h-3" />;
        const bullet = /^\s*([-*•]|\d+\.)\s+/.exec(line);
        const body = bullet ? line.slice(bullet[0].length) : line;
        const words = body.split(/(\s+)/).map((token, at) =>
          /^\s+$/.test(token) ? (
            token
          ) : (
            <span key={`${index}-${at}`} className="word-in" data-word={word++}>
              {token}
            </span>
          ),
        );
        return bullet ? (
          <span key={index} className="flex gap-2 pl-1">
            <span className="text-[#8e8f8b]">{/\d/.test(bullet[1]) ? bullet[1] : "•"}</span>
            <span>{words}</span>
          </span>
        ) : (
          <span key={index} className="block">
            {words}
          </span>
        );
      })}
    </div>
  );
}

function LiveTurn({ segments }: { segments: LiveSegment[] }) {
  const last = segments.at(-1);
  const waiting = segments.length === 0 || (last?.type === "tool" && !last.running);
  return (
    <div className="flex flex-col" aria-live="polite">
      {segments.map((segment, index) =>
        segment.type === "tool" ? <ToolRow key={index} label={segment.label} running={segment.running} /> : <StreamText key={index} text={segment.text} />,
      )}
      {waiting ? (
        <p className="rise flex items-center gap-2 py-1.5 text-[13px] text-[#8e8f8b]">
          <Spinner />
          <span className="shimmer-text">Working on it</span>
        </p>
      ) : null}
    </div>
  );
}

function SourceChips({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="press flex max-w-[260px] items-center gap-1 rounded-md bg-white/[0.08] px-2 py-1 text-[12px] leading-4 text-white/85 transition-colors hover:bg-white/[0.14]"
        >
          <span className="truncate">{source.title}</span>
        </a>
      ))}
    </div>
  );
}

function ActionRow({ text, rating, onRate }: { text: string; rating?: "up" | "down"; onRate: (value: "up" | "down") => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const button = "press grid size-7 place-items-center rounded-lg transition-colors hover:bg-white/[0.08] hover:text-white";
  return (
    <div className="mt-3 flex items-center gap-0.5 text-[#8e8f8b]">
      <Tip label={copied ? "Copied" : "Copy"} side="top-start">
        <button
          type="button"
          aria-label="Copy message"
          onClick={() => {
            void navigator.clipboard?.writeText(text).catch(() => undefined);
            setCopied(true);
          }}
          className={button}
        >
          <PIcon name={copied ? "ClipboardCheck" : "Clipboard"} size={18} />
        </button>
      </Tip>
      <Tip label="Helpful">
        <button
          type="button"
          aria-label="Rate this response positive"
          aria-pressed={rating === "up"}
          onClick={() => onRate("up")}
          className={`${button} ${rating === "up" ? "bg-white/[0.12] text-white" : ""}`}
        >
          <PIcon name="ThumbsUp" size={18} />
        </button>
      </Tip>
      <Tip label="Unhelpful">
        <button
          type="button"
          aria-label="Rate this response negative"
          aria-pressed={rating === "down"}
          onClick={() => onRate("down")}
          className={`${button} ${rating === "down" ? "bg-white/[0.12] text-white" : ""}`}
        >
          <PIcon name="ThumbsDown" size={18} />
        </button>
      </Tip>
    </div>
  );
}

function AssistantText({
  block,
  answer,
  rating,
  onRate,
}: {
  block: Block & { type: "text" };
  answer: boolean;
  rating?: "up" | "down";
  onRate: (value: "up" | "down") => void;
}) {
  const segments: Segment[] = block.segments ?? [{ type: "text", text: block.text }];
  return (
    <div className="rise max-w-[560px] py-2 text-[15px] leading-[1.4] tracking-[-0.15px]">
      {segments.map((segment, index) =>
        segment.type === "tool" ? (
          <ToolRow key={index} label={segment.label} />
        ) : (
          <div key={index} className="py-0.5">
            <Markdown text={segment.text} />
          </div>
        ),
      )}
      {block.sources?.length ? <SourceChips sources={block.sources} /> : null}
      {answer ? <ActionRow text={block.text} rating={rating} onRate={onRate} /> : null}
    </div>
  );
}

function Popover({
  id,
  light = false,
  onDismiss,
  className,
  children,
}: {
  id: string;
  light?: boolean;
  onDismiss: () => void;
  className: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const path = event.composedPath();
      if (ref.current && path.includes(ref.current)) return;
      // The trigger toggles on its own click; closing here too would reopen it.
      if (path.some((node) => node instanceof Element && node.getAttribute("aria-controls") === id)) return;
      dismiss.current();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss.current();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [id]);
  return (
    <div
      ref={ref}
      id={id}
      className={`pop-in absolute z-30 rounded-2xl ${
        light
          ? "bg-white text-[#303030] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.14)]"
          : "border border-white/10 bg-[#1a1a1a] text-white shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press press-row block w-full rounded-xl px-3 py-2 text-left text-[13px] hover:bg-white/[0.06] active:bg-white/10"
    >
      {children}
    </button>
  );
}

function isAnswer(list: Block[], index: number) {
  for (let at = index - 1; at >= 0; at -= 1) {
    const prior = list[at];
    if (prior.type === "text") return prior.role === "user";
  }
  return false;
}

function BlockView({
  block,
  answer,
  state,
  rating,
  onRate,
  onChip,
  onAsk,
  onCreate,
}: {
  block: Block;
  answer: boolean;
  state: PrototypeState;
  rating?: "up" | "down";
  onRate: (value: "up" | "down") => void;
  onChip: (label: string) => void;
  onAsk: (text: string) => void;
  onCreate: (name: string, purpose: string) => void;
}) {
  if (block.type === "text" && block.role === "user") {
    return (
      <div className="rise flex justify-end py-0.5">
        <p className="max-w-[448px] whitespace-pre-wrap rounded-[20px] bg-[#2a2a2a] px-4 py-2.5 text-[15px] leading-[1.4] tracking-[-0.15px]">
          {block.text}
        </p>
      </div>
    );
  }
  if (block.type === "text") return <AssistantText block={block} answer={answer} rating={rating} onRate={onRate} />;
  if (block.type === "chips") {
    return (
      <div className="rise flex flex-wrap gap-2 py-1">
        {block.chips.map((chip) => (
          <ChipButton
            key={chip.label}
            label={chip.label}
            tone={chip.tone}
            onClick={() => (chip.send ? onAsk(chip.label) : onChip(chip.label))}
          />
        ))}
      </div>
    );
  }
  if (block.type === "steps") {
    return (
      <div className="rise my-2 max-w-[520px] rounded-[20px] border border-white/10 bg-[#171817] px-3 py-1">
        {paymentSteps.map((step, index) => {
          const done = state.completedSteps.includes(step.n);
          return (
            <div key={step.n}>
              {index > 0 ? <div className="h-px bg-[#2e302d]" /> : null}
              <div className="flex items-center gap-3 py-2.5">
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors duration-300 ${
                    done ? "bg-[#003800] text-[#00ff00]" : "bg-[#2e302d]"
                  }`}
                >
                  {done ? <PIcon name="Check" size={20} /> : step.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-[1.4] tracking-[-0.15px]">{step.title}</span>
                  <span className="block text-[13px] leading-[1.4] tracking-[-0.13px] text-[#9a9a9a]">{step.body}</span>
                </span>
                <span className="rounded-full bg-[#003800] px-1.5 py-1 text-[11px] font-medium tracking-[-0.44px] text-[#00ff00]">
                  {step.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  if (block.type === "sellers") {
    return (
      <div className="rise my-2 flex max-w-[560px] flex-col gap-4 py-2">
        <div>
          <p className="text-[15px]">Your best sellers</p>
          <p className="flex items-center gap-0.5 text-[15px] text-[#8e8f8b]">
            Last 30 days <PIcon name="ChevronDown" size={20} />
          </p>
        </div>
        {sellers.map((item) => (
          <div key={item.title} className="flex items-center gap-4">
            <img src={item.image} alt="" className="size-24 rounded-2xl object-cover shadow-[inset_0_0_4px_rgba(255,255,255,0.2)]" />
            <div>
              <p className="text-[15px] text-[#8e8f8b]">
                {item.title} · {item.meta}
              </p>
              <p className="mt-1 text-[15px] leading-[1.4]">{item.advice}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "create") return <CreateForm onCreate={onCreate} />;
  return null;
}

function CreateForm({ onCreate }: { onCreate: (name: string, purpose: string) => void }) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  return (
    <div className="rise my-2 max-w-[520px] rounded-[20px] border border-white/10 bg-[#171817] p-4">
      <p className="mb-3 text-[15px]">Name the sidekick and give it a job.</p>
      <s-stack gap="base">
        <s-text-field label="Name" name="sidekick-name" value={name} onInput={(event) => setName(event.currentTarget.value)} />
        <s-text-area
          label="What should it take on?"
          name="sidekick-purpose"
          rows={3}
          value={purpose}
          onInput={(event) => setPurpose(event.currentTarget.value)}
        />
        <s-stack direction="inline">
          <s-button variant="primary" onClick={() => onCreate(name, purpose)}>
            Add sidekick
          </s-button>
        </s-stack>
      </s-stack>
    </div>
  );
}

const addCopy: Record<string, string> = {
  chief: "Organize your priorities, coordinate tasks, and keep your day moving.",
  ideas: "Explore fresh product concepts and turn promising ideas into plans.",
  trends: "Spot emerging trends and understand what they mean for you.",
  slack: "Connect Slack to summarize chats and share key team updates.",
  grok: "Bring Grok into your workspace to explore questions and ideas.",
  muse: "Find creative inspiration, explore new directions, and develop your ideas.",
};

function AddGrid({ onAdd, onChip }: { onAdd: (id: string) => void; onChip: (label: string) => void }) {
  const cards = catalog.filter((item) => item.id in addCopy);
  return (
    <div className="max-w-[720px]">
      <p className="mb-4 max-w-[560px] text-[15px] leading-[1.4] text-white">
        Sidekicks are AI agents that get things done for you. Choose one below or create your own.
      </p>
      <p className="mb-3 flex items-center gap-0.5 text-[15px] text-[#8e8f8b]">
        Recommended <PIcon name="ChevronDown" size={20} />
      </p>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card, index) => {
          const connect = card.group === "teams";
          return (
            <article
              key={card.id}
              className="rise flex flex-col gap-4 rounded-3xl bg-[#1a1b1a] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-colors duration-150 hover:bg-[#1f201f]"
              style={{ animationDelay: `${index * 40}ms`, animationFillMode: "backwards" }}
            >
              <Orb id={card.orb} size={48} />
              <div className="min-h-[92px]">
                <p className="text-[15px] leading-[1.4]">{card.name}</p>
                <p className="text-[13px] leading-[1.4] text-[#9a9a9a]">{addCopy[card.id]}</p>
              </div>
              <div className="mt-auto">
                <s-button inlineSize="fill" onClick={() => onAdd(card.id)}>
                  {connect ? "Connect" : "Add"}
                </s-button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ChipButton label="Tell me more about creating a sidekick" tone="secondary" onClick={() => onChip("Tell me more about creating a sidekick")} />
        <ChipButton label="Create my own sidekick" tone="primary" onClick={() => onChip("Create my own sidekick")} />
      </div>
    </div>
  );
}

function Purpose({
  state,
  onPurpose,
  onStart,
  onChip,
}: {
  state: PrototypeState;
  onPurpose: (id: string) => void;
  onStart: () => void;
  onChip: (label: string) => void;
}) {
  return (
    <div className="max-w-[560px]">
      <div className="space-y-3 py-2 text-[15px] leading-[1.4]">
        <p>Think of me as your Chief of Staff — a partner for turning a busy week into clear priorities and next steps.</p>
        <p>I can help you prepare for meetings, move decisions forward, and follow through on commitments.</p>
        <p>Where would you like me to focus? Choose a few areas below to shape how I support you.</p>
      </div>
      <div className="my-3 rounded-[20px] border border-white/10 bg-[#171817] px-4">
        {purposes.map((item, index) => (
          <div key={item.id} className={`py-3 ${index > 0 ? "border-t border-[#2e302d]" : ""}`}>
            <s-checkbox
              label={item.title}
              details={item.body}
              checked={state.purposes.includes(item.id)}
              onChange={() => onPurpose(item.id)}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <ChipButton label="Give me some examples" tone="secondary" onClick={() => onChip("Give me some examples")} />
        <ChipButton label="Start working" tone="primary" onClick={onStart} />
      </div>
    </div>
  );
}

const typedOnce = new Set<string>();

function visibleBlocks(thread: Block[], done: Set<string>) {
  const pending = thread.findIndex((block) => block.type === "text" && block.typed && !done.has(block.id));
  return pending === -1 ? thread : thread.slice(0, pending + 1);
}

function TypeOut({
  text,
  instant,
  delay,
  onDone,
}: {
  text: string;
  instant: boolean;
  delay: number;
  onDone: () => void;
}) {
  const [count, setCount] = useState(0);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const reduce = instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shown = 0;
    let timer = 0;
    const tick = () => {
      shown = reduce ? text.length : Math.min(text.length, shown + 2);
      setCount(shown);
      if (shown >= text.length) {
        done.current();
        return;
      }
      const pause = /[.!?]\s*$/.test(text.slice(0, shown)) ? 220 : 16;
      timer = window.setTimeout(tick, pause);
    };
    timer = window.setTimeout(tick, reduce ? 0 : delay);
    return () => window.clearTimeout(timer);
  }, [text, instant, delay]);
  return (
    <p className="max-w-[560px] whitespace-pre-wrap py-2 text-[15px] leading-[1.4] tracking-[-0.15px]" aria-label={text}>
      <span aria-hidden>{text.slice(0, count)}</span>
      <span className="caret ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-white" aria-hidden />
    </p>
  );
}
