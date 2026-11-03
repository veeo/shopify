"use client";

import { ArrowUp, AudioLines, ChevronDown, History, Mic, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { ChipButton, IconButton, Orb } from "@/components/marks";
import {
  catalog,
  paymentSteps,
  purposes,
  sellers,
  selectedAgent,
  type Block,
  type PrototypeState,
} from "@/lib/prototype";

export function ChatColumn({
  state,
  liveText,
  busy,
  onChip,
  onSend,
  onPurpose,
  onStart,
  onAddCatalog,
  onCreate,
  onScenario,
  onMotion,
  onReset,
  onCloseExperiments,
}: {
  state: PrototypeState;
  liveText: string | null;
  busy: boolean;
  onChip: (label: string) => void;
  onSend: (text: string) => void;
  onPurpose: (id: string) => void;
  onStart: () => void;
  onAddCatalog: (id: string) => void;
  onCreate: (name: string, purpose: string) => void;
  onScenario: (scenario: "setup" | "active") => void;
  onMotion: (on: boolean) => void;
  onReset: () => void;
  onCloseExperiments: () => void;
}) {
  const agent = selectedAgent(state);
  const purpose = state.selectedAgentId === "chief" && state.chiefPhase === "purpose" && state.mode === "thread";
  const title = state.mode === "add" ? "Add a sidekick" : purpose ? "Chief of staff" : agent.name;
  const topic = state.mode === "add" ? null : purpose ? "Set purpose" : agent.topic;
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const thread = state.threads[agent.id] ?? [];
  const history = thread.filter((block) => block.type === "text" && block.role === "user");

  function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    onSend(text);
  }

  return (
    <section className="relative flex min-w-0 flex-1 flex-col px-8 pb-3 pt-7">
      <header className="mb-3 flex items-start justify-between gap-4">
        <h1 className="flex items-baseline gap-1.5 text-[25px] font-medium leading-8 tracking-[-0.75px]">
          <span>{title}</span>
          {topic ? (
            <>
              <span className="font-normal text-[#737373]">·</span>
              <span className="font-normal text-[#737373]">{topic}</span>
            </>
          ) : null}
        </h1>
        <div className="flex gap-1.5">
          <IconButton label="History" onClick={() => setHistoryOpen((open) => !open)} active={historyOpen}>
            <History size={16} />
          </IconButton>
          <IconButton label="More" onClick={() => setMoreOpen((open) => !open)} active={moreOpen}>
            <MoreHorizontal size={16} />
          </IconButton>
        </div>
      </header>

      {historyOpen ? (
        <div className="absolute right-8 top-16 z-20 w-72 rounded-2xl border border-white/10 bg-[#171817] p-3 text-[13px] shadow-2xl">
          <p className="mb-2 text-[#8e8f8b]">This conversation</p>
          {history.length === 0 ? (
            <p className="text-white/80">No questions yet.</p>
          ) : (
            history.map((block) =>
              block.type === "text" ? (
                <p key={block.id} className="truncate py-1 text-white">
                  {block.text}
                </p>
              ) : null,
            )
          )}
        </div>
      ) : null}
      {moreOpen ? (
        <div className="absolute right-8 top-16 z-20 w-56 rounded-2xl border border-white/10 bg-[#171817] p-2 text-[13px] shadow-2xl">
          <button type="button" className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5" onClick={onReset}>
            Reset this scenario
          </button>
          <button
            type="button"
            className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5"
            onClick={() => onScenario(state.scenario === "active" ? "setup" : "active")}
          >
            {state.scenario === "active" ? "Back to new merchant" : "Open the live store"}
          </button>
        </div>
      ) : null}

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-4">
        {state.mode === "add" ? (
          <AddGrid onAdd={onAddCatalog} onChip={onChip} />
        ) : purpose ? (
          <Purpose state={state} onPurpose={onPurpose} onStart={onStart} onChip={onChip} />
        ) : (
          <div className="flex max-w-[640px] flex-col gap-2">
            {thread.map((block) => (
              <BlockView key={block.id} block={block} state={state} onChip={onChip} onCreate={onCreate} />
            ))}
            {liveText !== null ? (
              <p className="rise max-w-[560px] whitespace-pre-wrap py-2 text-[15px] leading-[1.4] tracking-[-0.15px]">
                {liveText}
                <span className="caret ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-white" />
              </p>
            ) : null}
          </div>
        )}
      </div>

      <form
        className="mt-2 flex items-center gap-2.5 rounded-full border border-[#2e302d] bg-[#252525] p-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Orb id={state.mode === "add" ? "sidekick" : agent.orb} />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={state.mode === "add" ? "Ask Sidekick…" : agent.placeholder}
          className="min-w-0 flex-1 bg-transparent text-[15px] tracking-[-0.15px] text-white outline-none placeholder:text-[#737572]"
        />
        <span className="flex items-center gap-1.5">
          <span className="grid size-8 place-items-center rounded-full border border-white/10 text-white/80">
            <Plus size={16} />
          </span>
          <span className="grid size-8 place-items-center text-white/70" aria-hidden>
            <AudioLines size={16} />
          </span>
          <span className="grid size-8 place-items-center text-white/70" aria-hidden>
            <Mic size={16} />
          </span>
          <button
            type="submit"
            aria-label="Send"
            disabled={busy || !draft.trim()}
            className="grid size-8 place-items-center rounded-full bg-white text-black disabled:opacity-40"
          >
            <ArrowUp size={16} />
          </button>
        </span>
      </form>

      {state.experimentsOpen ? (
        <div className="absolute bottom-20 left-8 z-30 w-72 rounded-2xl border border-white/10 bg-[#171817] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-medium">Experiments</p>
            <button type="button" className="text-[12px] text-[#8e8f8b]" onClick={onCloseExperiments}>
              Close
            </button>
          </div>
          <p className="mb-2 text-[12px] text-[#8e8f8b]">Scenario</p>
          <div className="mb-4 flex gap-2">
            {(["setup", "active"] as const).map((scenario) => (
              <button
                key={scenario}
                type="button"
                onClick={() => onScenario(scenario)}
                className={`h-8 flex-1 rounded-full text-[13px] ${
                  state.scenario === scenario ? "bg-white text-black" : "bg-[#252525]"
                }`}
              >
                {scenario === "setup" ? "New merchant" : "Active store"}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between text-[13px]">
            Motion
            <input
              type="checkbox"
              checked={state.motion}
              onChange={(event) => onMotion(event.target.checked)}
              className="size-4 accent-[#5631f4]"
            />
          </label>
          <button type="button" onClick={onReset} className="mt-3 text-[13px] text-[#8e8f8b] underline">
            Reset scenario
          </button>
        </div>
      ) : null}
    </section>
  );
}

function BlockView({
  block,
  state,
  onChip,
  onCreate,
}: {
  block: Block;
  state: PrototypeState;
  onChip: (label: string) => void;
  onCreate: (name: string, purpose: string) => void;
}) {
  if (block.type === "text" && block.role === "user") {
    return (
      <div className="rise flex justify-end py-0.5">
        <p className="max-w-[448px] rounded-full bg-[#252525] px-4 py-3 text-[15px] leading-[1.4] tracking-[-0.15px]">
          {block.text}
        </p>
      </div>
    );
  }
  if (block.type === "text") {
    return (
      <p className="rise max-w-[560px] whitespace-pre-wrap py-2 text-[15px] leading-[1.4] tracking-[-0.15px]">{block.text}</p>
    );
  }
  if (block.type === "chips") {
    return (
      <div className="flex flex-wrap gap-2 py-1">
        {block.chips.map((chip) => (
          <ChipButton key={chip.label} label={chip.label} tone={chip.tone} onClick={() => onChip(chip.label)} />
        ))}
      </div>
    );
  }
  if (block.type === "steps") {
    return (
      <div className="rise my-2 max-w-[520px] rounded-[20px] border border-white/10 bg-[#171817] px-3 py-1">
        {paymentSteps.map((step, index) => (
          <div key={step.n}>
            {index > 0 ? <div className="h-px bg-[#2e302d]" /> : null}
            <div className="flex items-center gap-3 py-2.5">
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                  state.completedSteps.includes(step.n) ? "bg-[#003800] text-[#00ff00]" : "bg-[#2e302d]"
                }`}
              >
                {step.n}
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
        ))}
      </div>
    );
  }
  if (block.type === "sellers") {
    return (
      <div className="rise my-2 flex max-w-[560px] flex-col gap-4 py-2">
        <div>
          <p className="text-[15px]">Your best sellers</p>
          <p className="flex items-center gap-0.5 text-[15px] text-[#8e8f8b]">
            Last 30 days <ChevronDown size={14} />
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
    <form
      className="rise my-2 max-w-[520px] rounded-[20px] border border-white/10 bg-[#171817] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onCreate(name, purpose);
      }}
    >
      <p className="mb-3 text-[15px]">Name the sidekick and give it a job.</p>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        className="mb-2 h-10 w-full rounded-xl border border-white/10 bg-[#0c0d0c] px-3 text-[14px] outline-none"
      />
      <textarea
        value={purpose}
        onChange={(event) => setPurpose(event.target.value)}
        placeholder="What should it take on?"
        className="mb-3 h-20 w-full resize-none rounded-xl border border-white/10 bg-[#0c0d0c] px-3 py-2 text-[14px] outline-none"
      />
      <button type="submit" className="h-8 rounded-full bg-white px-4 text-[13px] font-medium text-black">
        Add sidekick
      </button>
    </form>
  );
}

function AddGrid({ onAdd, onChip }: { onAdd: (id: string) => void; onChip: (label: string) => void }) {
  const cards = catalog.filter((item) => ["chief", "ideas", "trends", "slack", "grok", "muse"].includes(item.id));
  return (
    <div className="max-w-[720px]">
      <p className="mb-4 max-w-[560px] text-[15px] leading-[1.4] text-white">
        Sidekicks are AI agents that get things done for you. Choose one below or create your own.
      </p>
      <p className="mb-3 flex items-center gap-0.5 text-[15px] text-[#8e8f8b]">
        Recommended <ChevronDown size={14} />
      </p>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => {
          const connect = card.group === "teams";
          return (
            <article key={card.id} className="flex flex-col gap-4 rounded-3xl bg-[#1a1b1a] p-4">
              <Orb id={card.orb} size={48} />
              <div className="min-h-[92px]">
                <p className="text-[15px] leading-[1.4]">{card.name}</p>
                <p className="text-[13px] leading-[1.4] text-[#9a9a9a]">
                  {card.id === "chief" && "Organize your priorities, coordinate tasks, and keep your day moving."}
                  {card.id === "ideas" && "Explore fresh product concepts and turn promising ideas into plans."}
                  {card.id === "trends" && "Spot emerging trends and understand what they mean for you."}
                  {card.id === "slack" && "Connect Slack to summarize chats and share key team updates."}
                  {card.id === "grok" && "Bring Grok into your workspace to explore questions and ideas."}
                  {card.id === "muse" && "Find creative inspiration, explore new directions, and develop your ideas."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAdd(card.id)}
                className="mt-auto h-8 w-full rounded-full bg-[#252525] text-[13px] font-medium shadow-[inset_0_0_2px_rgba(255,255,255,0.1)]"
              >
                {connect ? "Connect" : "Add"}
              </button>
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
        {purposes.map((item, index) => {
          const on = state.purposes.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPurpose(item.id)}
              className={`flex w-full gap-3 py-3 text-left ${index > 0 ? "border-t border-[#2e302d]" : ""}`}
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${
                  on ? "border-[#5631f4] bg-[#5631f4]" : "border-white/20"
                }`}
              >
                {on ? <span className="text-[12px]">✓</span> : null}
              </span>
              <span>
                <span className="block text-[15px]">{item.title}</span>
                <span className="block text-[13px] leading-[1.4] text-[#9a9a9a]">{item.body}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <ChipButton label="Give me some examples" tone="secondary" onClick={() => onChip("Give me some examples")} />
        <ChipButton label="Start working" tone="primary" onClick={onStart} />
      </div>
    </div>
  );
}
