"use client";

import { PIcon } from "@/components/polaris-icon";
import { Orb } from "@/components/marks";
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
    <aside className="flex h-full w-[200px] shrink-0 flex-col border-r border-[#e6e6e6] bg-white px-2 py-3 text-[#101010]">
      <div className="mb-2 flex items-center gap-1 px-2">
        <span className="grid size-7 place-items-center rounded-full bg-[#672ff4] text-white">
          <PIcon name="Sidekick" size={16} />
        </span>
        <span className="text-[13px] font-medium tracking-[-0.13px]">Sidekick</span>
        <span className="ml-auto flex gap-0.5">
          <button
            type="button"
            aria-label="Add a sidekick"
            aria-pressed={state.mode === "add"}
            onClick={onAdd}
            className={`grid size-7 place-items-center rounded-full transition duration-200 ease-out hover:bg-[#f3f3f3] ${
              state.mode === "add" ? "bg-[#f3f3f3]" : ""
            }`}
          >
            <PIcon name="Plus" size={16} />
          </button>
          <button
            type="button"
            aria-label="Search sidekicks"
            aria-pressed={state.searchOpen}
            onClick={onSearch}
            className={`grid size-7 place-items-center rounded-full transition duration-200 ease-out hover:bg-[#f3f3f3] ${
              state.searchOpen ? "bg-[#f3f3f3]" : ""
            }`}
          >
            <PIcon name="Search" size={16} />
          </button>
        </span>
      </div>

      {state.searchOpen ? (
        <label className="mb-2 block px-1">
          <span className="sr-only">Search sidekicks</span>
          <input
            autoFocus
            value={state.search}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search sidekicks"
            className="h-8 w-full rounded-[10px] border border-[#e6e6e6] bg-white px-3 text-[13px] text-[#101010] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-[#868686]"
          />
        </label>
      ) : null}

      <div className="scroll-thin-light flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {groups.map((group) => {
          if (group.id === "hidden" && !showHidden) return null;
          const items = agents.filter((item) => item.group === group.id);
          if (group.id !== "hidden" && items.length === 0) return null;
          return (
            <div key={group.id} className="mb-1">
              {group.label ? <p className="px-2 pb-1 pt-3 text-[12px] text-[#868686]">{group.label}</p> : null}
              {items.map((item) => {
                const selected = item.id === state.selectedAgentId && state.mode === "thread";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={`flex h-11 w-full items-center gap-2 rounded-[10px] px-2 text-left transition duration-200 ease-out ${
                      selected ? "bg-[#f3f3f3]" : "hover:bg-[#f6f6f6]"
                    }`}
                  >
                    <Orb id={item.orb} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium leading-[1.3] tracking-[-0.13px]">
                        {item.name}
                      </span>
                      <span className="block truncate text-[12px] text-[#868686]">{item.preview}</span>
                    </span>
                    {item.unread > 0 ? (
                      <span className="grid size-[18px] place-items-center rounded-full bg-[#672ff4] text-[11px] font-medium text-white">
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
      <button
        type="button"
        onClick={onExperiments}
        aria-pressed={state.experimentsOpen}
        className={`mt-2 flex h-8 items-center gap-2 rounded-[10px] px-2 text-[13px] text-[#606060] transition duration-200 ease-out hover:bg-[#f3f3f3] ${
          state.experimentsOpen ? "bg-[#f3f3f3] text-[#101010]" : ""
        }`}
      >
        <PIcon name="SettingsFilled" size={16} />
        Experiments
      </button>
    </aside>
  );
}
