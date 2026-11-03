"use client";

import { LayoutGrid, Plus, Search, Settings } from "lucide-react";
import { IconButton, Orb, ShopifyMark } from "@/components/marks";
import { visibleAgents, type AgentGroup, type PrototypeState } from "@/lib/prototype";

const groups: { id: AgentGroup; label: string | null }[] = [
  { id: "favorites", label: null },
  { id: "teams", label: "Teams" },
  { id: "channels", label: "Channels" },
  { id: "tools", label: "Tools" },
  { id: "hidden", label: "Hidden" },
];

export function AgentNav({
  state,
  onSelect,
  onAdd,
  onSearch,
  onQuery,
  onExperiments,
}: {
  state: PrototypeState;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onSearch: () => void;
  onQuery: (query: string) => void;
  onExperiments: () => void;
}) {
  const agents = visibleAgents(state);
  const showHidden = state.scenario === "active" || state.agents.some((item) => item.installed && item.group === "hidden");

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col px-3 pb-3 pt-7">
      <div className="mb-4 flex items-center gap-1 pl-2">
        <span className="grid size-8 place-items-center">
          <ShopifyMark />
        </span>
        <span className="ml-auto flex gap-1.5">
          <IconButton label="Add a sidekick" onClick={onAdd} active={state.mode === "add"}>
            <Plus size={16} />
          </IconButton>
          <IconButton label="Search sidekicks" onClick={onSearch} active={state.searchOpen}>
            <Search size={16} />
          </IconButton>
        </span>
      </div>

      {state.searchOpen ? (
        <label className="mb-3 block px-1">
          <span className="sr-only">Search sidekicks</span>
          <input
            autoFocus
            value={state.search}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search sidekicks"
            className="h-9 w-full rounded-full border border-white/10 bg-[#171817] px-3 text-[13px] text-white outline-none placeholder:text-[#737572]"
          />
        </label>
      ) : null}

      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {groups.map((group) => {
          if (group.id === "hidden" && !showHidden) return null;
          const items = agents.filter((item) => item.group === group.id);
          if (group.id !== "hidden" && items.length === 0) return null;
          return (
            <div key={group.id} className="mb-1">
              {group.label ? (
                <p className="px-3 pb-1 pt-3 text-[12px] text-[#8e8f8b]">{group.label}</p>
              ) : null}
              {group.id !== "favorites" && group.id !== "hidden" ? (
                <div className="mx-3 mb-1 h-px bg-white/10" />
              ) : null}
              {items.map((item) => {
                const selected = item.id === state.selectedAgentId && state.mode === "thread";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={`flex h-12 w-full items-center gap-2 rounded-full py-2 pl-2 pr-3 text-left transition duration-150 ease-out ${
                      selected ? "bg-[#252525] shadow-[inset_0_0_2px_rgba(255,255,255,0.1)]" : "hover:bg-white/5"
                    }`}
                  >
                    <Orb id={item.orb} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium leading-[1.3] tracking-[-0.13px]">
                        {item.name}
                      </span>
                      <span className="block truncate text-[12px] text-[#8e8f8b]">{item.preview}</span>
                    </span>
                    {item.unread > 0 ? (
                      <span className="grid size-[18px] place-items-center rounded-full bg-[#5631f4] text-[11px] font-medium">
                        {item.unread}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex h-12 items-center pl-2">
        <img src="/assets/user.png" alt="" className="size-8 rounded-full object-cover" />
        <span className="ml-auto flex gap-1.5">
          <IconButton label="Apps" onClick={onExperiments}>
            <LayoutGrid size={16} />
          </IconButton>
          <IconButton label="Experiments" onClick={onExperiments} active={state.experimentsOpen}>
            <Settings size={16} />
          </IconButton>
        </span>
      </div>
    </aside>
  );
}
