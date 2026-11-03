"use client";

import { useState } from "react";
import { ChipButton, IconButton, Orb } from "@/components/marks";
import { PIcon } from "@/components/polaris-icon";
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
        <h1 className="flex min-w-0 items-baseline gap-1.5 text-[25px] font-medium leading-8 tracking-[-0.75px]">
          <span className="truncate">{title}</span>
          {topic ? <span className="truncate font-normal text-[#737373]">· {topic}</span> : null}
        </h1>
        <div className="flex gap-1.5">
          <IconButton
            label="History"
            onClick={() => {
              setHistoryOpen((open) => !open);
              setMoreOpen(false);
            }}
            active={historyOpen}
          >
            <PIcon name="Clock" size={20} />
          </IconButton>
          <IconButton
            label="More"
            onClick={() => {
              setMoreOpen((open) => !open);
              setHistoryOpen(false);
            }}
            active={moreOpen}
          >
            <PIcon name="MenuHorizontal" size={20} />
          </IconButton>
        </div>
      </header>

      {historyOpen ? (
        <Popover className="right-8 top-16 w-72 p-3">
          <p className="mb-1 px-1 text-[12px] text-[#8e8f8b]">This conversation</p>
          {history.length === 0 ? (
            <p className="px-1 py-1 text-[13px] text-white/80">No questions yet.</p>
          ) : (
            history.map((block) =>
              block.type === "text" ? (
                <p key={block.id} className="truncate rounded-lg px-1 py-1 text-[13px] text-white">
                  {block.text}
                </p>
              ) : null,
            )
          )}
        </Popover>
      ) : null}
      {moreOpen ? (
        <Popover className="right-8 top-16 w-56 p-1.5">
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
        key={state.mode === "thread" ? agent.id : state.mode}
        className={`${state.motion ? "page-in" : ""} scroll-thin min-h-0 flex-1 overflow-y-auto pb-4`}
      >
        {state.mode === "add" ? (
          <AddGrid onAdd={onAddCatalog} onChip={onChip} />
        ) : purpose ? (
          <Purpose state={state} onPurpose={onPurpose} onStart={onStart} onChip={onChip} />
        ) : (
          <div className="flex max-w-[640px] flex-col gap-2">
            {thread.map((block) => (
              <BlockView key={block.id} block={block} state={state} onChip={onChip} onCreate={onCreate} />
            ))}
            {busy && !liveText ? (
              <div className="rise flex items-center py-3 text-[#8e8f8b]" aria-live="polite">
                <span className="sr-only">{agent.name} is working</span>
                <span className="sk-dots" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            ) : null}
            {liveText ? (
              <p className="rise max-w-[560px] whitespace-pre-wrap py-2 text-[15px] leading-[1.4] tracking-[-0.15px]">
                {liveText}
                <span className="caret ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-white" />
              </p>
            ) : null}
          </div>
        )}
      </div>

      <form
        className="mt-2 flex items-center gap-2.5 rounded-full border border-[#2e302d] bg-[#252525] p-2 transition-[border-color,box-shadow] duration-150 focus-within:border-[#4a4a4a] focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
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
        <span className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Attach"
            className="press grid size-8 place-items-center rounded-full border border-white/10 text-white/80 hover:bg-white/[0.08] hover:text-white"
          >
            <PIcon name="Plus" size={20} />
          </button>
          <button
            type="button"
            aria-label="Voice mode"
            className="press grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/[0.08] hover:text-white"
          >
            <PIcon name="Sound" size={20} />
          </button>
          <button
            type="button"
            aria-label="Dictate"
            className="press grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/[0.08] hover:text-white"
          >
            <PIcon name="Microphone" size={20} />
          </button>
          <button
            type="submit"
            aria-label="Send"
            disabled={busy || !draft.trim()}
            className="press grid size-8 place-items-center rounded-full bg-white text-black shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:bg-[#eee] disabled:opacity-40"
          >
            <PIcon name="ArrowUp" size={20} />
          </button>
        </span>
      </form>

      {state.experimentsOpen ? (
        <Popover className="bottom-20 left-8 w-72 origin-bottom-left p-4">
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

function Popover({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div
      className={`pop-in absolute z-30 rounded-2xl border border-white/10 bg-[#1a1a1a] text-white shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`}
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
        <p className="max-w-[448px] rounded-[20px] bg-[#252525] px-4 py-2.5 text-[15px] leading-[1.4] tracking-[-0.15px]">
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
      <div className="rise flex flex-wrap gap-2 py-1">
        {block.chips.map((chip) => (
          <ChipButton key={chip.label} label={chip.label} tone={chip.tone} onClick={() => onChip(chip.label)} />
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
                  {done ? <PIcon name="Check" size={16} /> : step.n}
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
            Last 30 days <PIcon name="ChevronDown" size={16} />
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
        Recommended <PIcon name="ChevronDown" size={16} />
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
