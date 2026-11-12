"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Composer } from "@/components/chat-column";
import { Markdown } from "@/components/markdown";
import { PIcon } from "@/components/polaris-icon";
import { selectedAgent, type Block, type PrototypeState, type Segment } from "@/lib/prototype";
import type { LiveSegment } from "@/lib/turn";

/** Conversation overlay while staying in full/hybrid admin chrome. */
export function HybridChatModal({
  state,
  liveSegments,
  busy,
  locked,
  offline,
  onClose,
  onSend,
  onStop,
}: {
  state: PrototypeState;
  liveSegments: LiveSegment[] | null;
  busy: boolean;
  locked: boolean;
  offline: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const agent = selectedAgent(state);
  const thread = state.threads[agent.id] ?? [];
  const scroller = useRef<HTMLDivElement>(null);
  const liveLength = liveSegments?.reduce((sum, segment) => sum + (segment.type === "text" ? segment.text.length : 1), 0) ?? 0;

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [thread.length, liveLength, busy]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const messages = thread.filter((block): block is Block & { type: "text" } => block.type === "text");

  return createPortal(
    <div className="fixed inset-0 z-[280] grid place-items-center bg-black/55 p-4 sm:p-8" role="presentation" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hybrid-chat-title"
        className="pop-in flex h-[min(720px,calc(100vh-48px))] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d0c] text-white shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 id="hybrid-chat-title" className="truncate text-[15px] font-semibold tracking-[-0.2px]">
              {agent.name}
            </h2>
            {agent.topic ? <p className="truncate text-[12px] text-[#8e8f8b]">{agent.topic}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Close conversation"
            onClick={onClose}
            className="press grid size-8 place-items-center rounded-full text-[#c4c4c4] hover:bg-white/10 hover:text-white"
          >
            <PIcon name="X" size={18} />
          </button>
        </header>
        <div ref={scroller} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
            {messages.map((block) =>
              block.role === "user" ? (
                <div key={block.id} className="ml-auto max-w-[85%] rounded-2xl bg-white/[0.1] px-3.5 py-2 text-[14px] leading-5">
                  {block.text}
                </div>
              ) : (
                <div key={block.id} className="max-w-[95%] text-[14px] leading-5 text-[#e8e8e8]">
                  <ModalReply text={block.text} segments={block.segments} />
                </div>
              ),
            )}
            {liveSegments?.length ? (
              <div className="max-w-[95%] text-[14px] leading-5 text-[#e8e8e8]">
                <ModalReply
                  text={liveSegments.map((segment) => (segment.type === "text" ? segment.text : "")).join("")}
                  segments={liveSegments.map((segment) =>
                    segment.type === "text" ? { type: "text" as const, text: segment.text } : { type: "tool" as const, label: segment.label },
                  )}
                />
              </div>
            ) : null}
            {messages.length === 0 && !liveSegments?.length ? (
              <p className="py-8 text-center text-[13px] text-[#8e8f8b]">Start a message to continue this conversation.</p>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 border-t border-white/10 px-3 pb-3 pt-2">
          {offline ? (
            <p className="px-2 pb-2 text-[12px] text-[#8e8f8b]">You’re offline. Messages will send when you’re back.</p>
          ) : null}
          <Composer state={state} agent={agent} suggestions={[]} busy={busy} locked={locked || offline} onSend={onSend} onStop={onStop} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ModalReply({ text, segments }: { text: string; segments?: Segment[] }) {
  if (segments?.length) {
    return (
      <div className="flex flex-col gap-2">
        {segments.map((segment, index) =>
          segment.type === "tool" ? (
            <span key={`${segment.label}-${index}`} className="text-[12px] text-[#8e8f8b]">
              {segment.label}
            </span>
          ) : (
            <Markdown key={index} text={segment.text} />
          ),
        )}
      </div>
    );
  }
  return <Markdown text={text} />;
}
