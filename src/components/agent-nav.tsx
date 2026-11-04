"use client";

import { IconButton, Orb, ShopifyMark } from "@/components/marks";
import { PIcon } from "@/components/polaris-icon";
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
    <aside className="flex h-full w-[248px] shrink-0 flex-col gap-4 px-3 pb-3 pt-7">
      <div className="flex items-center gap-1 pb-4 pl-2">
        <span className="grid size-8 place-items-center">
          <ShopifyMark />
        </span>
        <span className="ml-auto flex gap-1.5">
          <IconButton label="Add a sidekick" onClick={onAdd} active={state.mode === "add"}>
            <PIcon name="Plus" size={20} />
          </IconButton>
          <IconButton label={state.searchOpen ? "Close search" : "Search sidekicks"} onClick={onSearch} active={state.searchOpen}>
            <PIcon name={state.searchOpen ? "X" : "Search"} size={20} />
          </IconButton>
        </span>
      </div>

      {state.searchOpen ? (
        <div className="rise -mt-4 px-1">
          <s-search-field
            label="Search sidekicks"
            labelAccessibilityVisibility="exclusive"
            placeholder="Search sidekicks"
            value={state.search}
            onInput={(event) => onQuery(event.currentTarget.value)}
          />
        </div>
      ) : null}

      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {groups.map((group) => {
          if (group.id === "hidden" && !showHidden) return null;
          const items = agents.filter((item) => item.group === group.id);
          if (group.id !== "hidden" && items.length === 0) return null;
          return (
            <div key={group.id} className="flex flex-col gap-2">
              {group.label ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1">
                  <span className="text-[13px] leading-4 tracking-[-0.13px] text-[#7d7f7c]">{group.label}</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
              ) : null}
              <div className="flex flex-col gap-2">
                {items.map((item) => {
                  const selected = item.id === state.selectedAgentId && state.mode === "thread";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={selected ? "page" : undefined}
                      onClick={() => onSelect(item.id)}
                      className={`press press-row flex h-12 w-full items-center gap-2 rounded-full py-2 pl-2 pr-4 text-left ${
                        selected ? "btn-dark" : "hover:bg-white/[0.06] active:bg-white/10"
                      }`}
                    >
                      <span className="grid size-8 shrink-0 place-items-center">
                        <Orb id={item.orb} size={28} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold leading-[1.3] tracking-[-0.13px] text-white">
                          {item.name}
                        </span>
                        <span className="block truncate text-[12px] leading-4 text-[#8e8f8b]">{item.preview}</span>
                      </span>
                      {item.unread > 0 ? (
                        <span className="grid size-[18px] place-items-center rounded-full bg-[#5631f4] text-[11px] font-medium text-white">
                          {item.unread}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                {group.id === "hidden" && items.length === 0 ? (
                  <p className="px-2.5 text-[12px] text-[#737572]">Nothing hidden</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex h-12 items-center pl-2">
        <img src="/assets/user.png" alt="" className="size-8 rounded-full object-cover" />
        <span className="ml-auto flex gap-1.5">
          <IconButton label="Apps" onClick={onExperiments}>
            <PIcon name="Apps" size={20} />
          </IconButton>
          <IconButton label="Experiments" onClick={onExperiments} active={state.experimentsOpen} controls="experiments-menu">
            <PIcon name="Settings" size={20} />
          </IconButton>
        </span>
      </div>
    </aside>
  );
}
