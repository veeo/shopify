"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PreviewId } from "@/lib/admin-nav";
import type { AdminLayoutMode } from "@/lib/shell-layout";

/**
 * Chat-column toast. Polaris Frame has a toast, but this app only loads Polaris
 * web components (no `s-toast`) and does not depend on `@shopify/polaris`.
 * Same idea as that toast — one line, one action, then it leaves — drawn in the
 * chat column's dark surface and parked above the composer.
 */
export type ColumnToastAction = { label: string; onClick: () => void };

export type ColumnToastItem = {
  id: string;
  /** Bumps when the same id is replaced so the timer starts over. */
  token: number;
  message: string;
  action?: ColumnToastAction;
  /** Auto-dismiss delay. Pauses while the pointer or focus is on the toast. */
  duration?: number;
};

const DEFAULT_DURATION = 5000;

export function attachAlreadySaved(
  agent: { attachOn: boolean; attachPage: PreviewId; attachLayout: AdminLayoutMode },
  page: PreviewId,
  layout: AdminLayoutMode,
) {
  return agent.attachOn && agent.attachPage === page && agent.attachLayout === layout;
}

export function ColumnToasts({
  toasts,
  onDismiss,
  covered = false,
}: {
  toasts: ColumnToastItem[];
  onDismiss: (id: string) => void;
  /** Full admin covers the chat. Keep the toast in the column, above that cover. */
  covered?: boolean;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number; bottom: number } | null>(null);

  useEffect(() => {
    if (!covered || toasts.length === 0) return;
    const node = anchor.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      setBox({
        left: rect.left,
        width: rect.width,
        bottom: Math.max(12, window.innerHeight - rect.top),
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    if (node.parentElement) observer.observe(node.parentElement);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [covered, toasts.length]);

  if (toasts.length === 0) return null;

  const stack = (
    <div className="flex flex-col gap-2">
      {toasts.map((toast) => (
        <ColumnToast key={`${toast.id}-${toast.token}`} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );

  if (!covered) return <div className="relative z-40 mb-2">{stack}</div>;

  return (
    <>
      <div ref={anchor} className="h-0" />
      {box
        ? createPortal(
            <div className="pointer-events-auto fixed z-40" style={{ left: box.left, width: box.width, bottom: box.bottom }}>
              {stack}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ColumnToast({ toast, onDismiss }: { toast: ColumnToastItem; onDismiss: () => void }) {
  const dismiss = useRef(onDismiss);
  const action = useRef(toast.action);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    dismiss.current = onDismiss;
    action.current = toast.action;
  });
  useEffect(() => {
    if (hold) return;
    const timer = window.setTimeout(() => dismiss.current(), toast.duration ?? DEFAULT_DURATION);
    return () => window.clearTimeout(timer);
  }, [hold, toast.duration, toast.token]);

  return (
    <div
      role="status"
      aria-live="polite"
      data-column-toast={toast.id}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHold(false);
      }}
      className="rise flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[20px] border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-[13px] leading-5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <p className="min-w-0 flex-1 basis-[12rem]">{toast.message}</p>
      {toast.action ? (
        <button
          type="button"
          data-toast-action
          onClick={() => {
            action.current?.onClick();
            dismiss.current();
          }}
          className="press ml-auto shrink-0 rounded-full bg-white px-3 py-1 text-[13px] font-medium text-black hover:bg-[#eee]"
        >
          {toast.action.label}
        </button>
      ) : null}
    </div>
  );
}
