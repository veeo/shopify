"use client";

import { useState, useRef } from "react";
import type { ChoiceCard, ChoiceMode } from "@/lib/choices";

/** The row the bestsellers list and the selectable cards share: image, then the details. */
export function ArtifactRow({
  image,
  title,
  meta,
  body,
  detail,
}: {
  image: string;
  title: string;
  meta?: string;
  body: string;
  detail?: string;
}) {
  return (
    <>
      <img src={image} alt="" className="size-16 shrink-0 rounded-2xl object-cover shadow-[inset_0_0_4px_rgba(255,255,255,0.2)] sm:size-20" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-[1.35] tracking-[-0.15px] text-white">
          {title}
          {meta ? <span className="text-[#8e8f8b]"> · {meta}</span> : null}
        </span>
        <span className="mt-1 block text-[13px] leading-[1.4] text-[#c6c6c6]">{body}</span>
        {detail ? <span className="mt-1 block text-[12px] leading-[1.4] text-[#8e8f8b]">{detail}</span> : null}
      </span>
    </>
  );
}

export function ChoiceCards({
  title,
  cards,
  selected,
  mode,
  settled,
  replaced,
  onPick,
  onBundle,
  onDifferent,
}: {
  title: string;
  cards: ChoiceCard[];
  selected: string[];
  mode: ChoiceMode;
  settled?: boolean;
  replaced?: boolean;
  onPick: (cardId: string) => void;
  onBundle: () => void;
  onDifferent: () => void;
}) {
  const group = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(0);
  const chosen = new Set(selected);
  const locked = Boolean(settled || replaced);
  function move(current: HTMLButtonElement, direction: number) {
    const buttons = [...(group.current?.querySelectorAll<HTMLButtonElement>("[data-choice]") ?? [])];
    const index = buttons.indexOf(current);
    const next = buttons[index + direction];
    next?.focus();
  }
  return (
    <div ref={group} role="group" aria-label={title} className="rise my-1 flex max-w-[560px] flex-col gap-2">
      <p className="text-[13px] text-[#8e8f8b]">{title}</p>
      {cards.map((card, index) => {
        const on = chosen.has(card.id);
        const dim = (locked && !on) || Boolean(replaced);
        return (
          <div key={card.id} className="choice-block w-full motion-reduce:animate-none" style={{ animationDelay: `${index * 90}ms` }}>
            <button
              type="button"
              data-choice={card.id}
              aria-pressed={on}
              tabIndex={locked ? (on ? 0 : -1) : index === cursor ? 0 : -1}
              disabled={locked && !on}
              onFocus={() => setCursor(index)}
              onClick={() => onPick(card.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                  event.preventDefault();
                  move(event.currentTarget, 1);
                } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  move(event.currentTarget, -1);
                }
              }}
              className={`flex w-full items-center gap-3 rounded-2xl border bg-[#171817] p-3 text-left transition-[opacity,background-color,border-color] duration-300 ${
                on ? "border-white bg-[#222]" : "border-white/10 hover:border-white/30 hover:bg-[#1c1d1c]"
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                dim ? "pointer-events-none opacity-40" : ""
              }`}
            >
              <ArtifactRow
                image={card.image}
                title={card.title}
                meta={`${card.price} · ${card.signal}`}
                body={card.pitch}
                detail={card.why}
              />
            </button>
          </div>
        );
      })}
      {mode === "multi" && !locked ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={selected.length < 2}
            onClick={onBundle}
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-[#111] disabled:opacity-40"
          >
            Bundle these
          </button>
          <button type="button" onClick={onDifferent} className="rounded-full px-3 py-1.5 text-[13px] text-[#c6c6c6] hover:bg-white/10">
            Show me different options
          </button>
        </div>
      ) : null}
      {mode === "single" && !locked ? (
        <button type="button" onClick={onDifferent} className="self-start rounded-full px-1 py-1 text-[13px] text-[#8e8f8b] hover:text-white">
          Show me different options
        </button>
      ) : null}
    </div>
  );
}
