"use client";

import { createPortal, flushSync } from "react-dom";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import { nextSort, sortLabel, useWorkspaceView } from "@/components/workspace-view";
import type { PreviewId } from "@/lib/admin-nav";
import type { AdminLayoutMode } from "@/lib/shell-layout";

/** The right side of the panel's hamburger header. Pages portal status notes and actions into it. */
const HeaderSlot = createContext<HTMLElement | null>(null);

export function HeaderSlotProvider({ slot, children }: { slot: HTMLElement | null; children: ReactNode }) {
  return <HeaderSlot.Provider value={slot}>{children}</HeaderSlot.Provider>;
}

export function HeaderExtras({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlot);
  if (!slot) return null;
  return createPortal(children, slot);
}

export const circleButton =
  "press grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#303030] shadow-[0_0_0_1px_#e3e3e3,0_1px_1px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.14)] hover:bg-[#fafafa] active:bg-[#f1f1f1]";

/* Top bar: a large title with a section menu. A deeper page lifts its parent into a smaller line above. */

function titleMotionName(label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `vt-${slug}` : undefined;
}

export type BarAction = { label: string; tone?: "primary" | "white" | "gray"; icon?: PolarisIconName; onClick?: () => void; disabled?: boolean };

export function TopBar({
  title,
  back,
  onBack,
  actions = [],
  more = [],
  aside,
  parent,
  sections,
  current,
  onSection,
  choices,
  choice,
  onChoice,
  pager,
}: {
  icon?: PolarisIconName;
  title: ReactNode;
  back?: string;
  onBack?: () => void;
  actions?: BarAction[];
  more?: { label: string; onClick?: () => void }[];
  aside?: ReactNode;
  /** The section this page sits inside, shown as the smaller word above the title. */
  parent?: { label: string; onClick?: () => void };
  sections?: { label: string; page: PreviewId }[];
  current?: PreviewId;
  onSection?: (page: PreviewId) => void;
  /** A detail view's siblings, such as the other products. */
  choices?: { id: string; label: string }[];
  choice?: string;
  onChoice?: (id: string) => void;
  pager?: { onPrev: () => void; onNext: () => void; prevDisabled?: boolean; nextDisabled?: boolean };
}) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLSpanElement>(null);
  useDismiss(open, menu, () => setOpen(false));
  const hasActions = actions.length > 0 || more.length > 0;
  const menuItems = choices ?? sections?.map((item) => ({ id: item.page, label: item.label }));
  const menuValue = choice ?? current;
  function pick(id: string) {
    if (choices) onChoice?.(id);
    else onSection?.(id as PreviewId);
  }
  const companions = hasActions ? (
    <>
      {actions.map((action) => (
        <Btn key={action.label} tone={action.tone ?? "white"} icon={action.icon} onClick={action.onClick} disabled={action.disabled}>
          {action.label}
        </Btn>
      ))}
      {more.length > 0 ? <MoreMenu items={more} /> : null}
    </>
  ) : null;
  const titleName = typeof title === "string" ? titleMotionName(title) : undefined;
  const parentMotion = parent ? titleMotionName(parent.label) : undefined;
  const parentName = parentMotion && parentMotion !== titleName ? parentMotion : undefined;
  const heading = (caret: boolean) => (
    <h2
      className="flex min-w-0 items-center gap-1 text-[22px] font-semibold leading-8 tracking-[-0.44px] text-[#171817]"
      style={titleName ? { viewTransitionName: titleName, viewTransitionClass: "title-word" } : undefined}
    >
      <span className="min-w-0 truncate">{title}</span>
      {caret ? (
        <span className={`shrink-0 text-[#616161] transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <PIcon name="ChevronDown" size={16} />
        </span>
      ) : null}
    </h2>
  );
  return (
    <header className="px-6 pb-6 pt-5">
      <div className="flex min-w-0 flex-col">
        {back ? null : (
          <div className={`grid ${parent ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              {parent ? (
                <button
                  type="button"
                  onClick={parent.onClick}
                  className="press mb-0 block max-w-full truncate rounded-md text-left text-[13px] font-medium leading-5 text-[#616161] hover:text-[#171817]"
                  style={{
                    transform: "translateY(4px)",
                    ...(parentName ? { viewTransitionName: parentName, viewTransitionClass: "title-word" } : {}),
                  }}
                >
                  {parent.label}
                </button>
              ) : (
                <span className="block h-0" />
              )}
            </div>
          </div>
        )}
        <div className="flex min-h-8 min-w-0 items-center gap-1">
          {back ? (
            <button
              type="button"
              onClick={onBack}
              className="press -ml-1 flex min-w-0 items-center gap-0.5 rounded-lg py-1 pl-0.5 pr-1.5 text-[13px] font-semibold text-[#303030] hover:bg-[#f1f1f1]"
            >
              <PIcon name="ChevronLeft" size={20} />
              <span className="truncate">{back}</span>
            </button>
          ) : menuItems && menuItems.length > 0 ? (
            <span ref={menu} className="relative min-w-0">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="press flex min-w-0 items-center gap-1 rounded-lg pr-1 text-left hover:bg-[#f6f6f6]"
              >
                {heading(true)}
              </button>
              {open ? (
                <span
                  role="menu"
                  className="pop-in absolute left-0 top-full z-30 mt-1 flex max-h-64 w-56 flex-col overflow-y-auto rounded-xl bg-white p-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.14)]"
                >
                  {menuItems.map((item) => {
                    const on = item.id === menuValue;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        aria-current={on ? "page" : undefined}
                        onClick={() => {
                          flushSync(() => setOpen(false));
                          pick(item.id);
                        }}
                        className={`press rounded-lg px-2.5 py-1.5 text-left text-[13px] ${on ? "bg-[#f1f1f1] font-medium text-[#171817]" : "text-[#303030] hover:bg-[#f6f6f6]"}`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </span>
              ) : null}
            </span>
          ) : (
            heading(false)
          )}
          {pager ? <PagerButton label="Previous product" disabled={pager.prevDisabled} onClick={pager.onPrev} icon="ChevronLeft" /> : null}
          {pager ? <PagerButton label="Next product" disabled={pager.nextDisabled} onClick={pager.onNext} icon="ChevronRight" /> : null}
          {aside || companions ? (
            <span className="ml-auto flex shrink-0 items-center gap-1.5" style={companions ? { viewTransitionName: "section-actions" } : undefined}>
              {aside}
              {companions}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function PagerButton({ label, icon, disabled, onClick }: { label: string; icon: PolarisIconName; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="press grid size-7 shrink-0 place-items-center rounded-lg text-[#303030] hover:bg-[#f6f6f6] disabled:text-[#c9c9c9]"
    >
      <PIcon name={icon} size={20} />
    </button>
  );
}

function MoreMenu({ items }: { items: { label: string; onClick?: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useDismiss(open, ref, () => setOpen(false));
  return (
    <span ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={circleButton}
      >
        <PIcon name="MenuHorizontal" size={20} />
      </button>
      {open ? (
        <span className="pop-in absolute right-0 top-8 z-40 flex w-48 flex-col rounded-xl bg-white p-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.12)]">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
              className="press rounded-lg px-2.5 py-1.5 text-left text-[13px] text-[#303030] hover:bg-[#f1f1f1]"
            >
              {item.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}

export function useDismiss(open: boolean, ref: React.RefObject<HTMLElement | null>, onDismiss: () => void) {
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const path = event.composedPath();
      if (ref.current && path.includes(ref.current)) return;
      // The trigger toggles on its own click; closing here too would reopen it.
      const id = ref.current?.id;
      if (id && path.some((node) => node instanceof Element && node.getAttribute("aria-controls") === id)) return;
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
  }, [open, ref]);
}

const layoutModeCopy: Record<AdminLayoutMode, { label: string }> = {
  sidebar: { label: "Sidebar" },
  expanded: { label: "Expanded" },
  takeover: { label: "Full" },
};

const LAYOUT_MODES: AdminLayoutMode[] = ["sidebar", "expanded", "takeover"];
const LAYOUT_IDLE_MS = 2800;
const LAYOUT_SLOT = 32;

/** Bottom-right hover pill: collapsed shows the current mode; hover expands to three glyphs. */
export function AdminLayoutControl({
  mode,
  onChange,
}: {
  mode: AdminLayoutMode;
  onChange: (mode: AdminLayoutMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const idleRef = useRef<number | null>(null);
  const index = Math.max(0, LAYOUT_MODES.indexOf(mode));

  function clearIdle() {
    if (idleRef.current !== null) {
      window.clearTimeout(idleRef.current);
      idleRef.current = null;
    }
  }

  function scheduleIdle() {
    clearIdle();
    idleRef.current = window.setTimeout(() => {
      setOpen(false);
      setPinned(false);
      idleRef.current = null;
    }, LAYOUT_IDLE_MS);
  }

  useEffect(() => () => clearIdle(), []);

  function expand() {
    setOpen(true);
    if (pinned) scheduleIdle();
    else clearIdle();
  }

  function collapseUnlessPinned() {
    if (pinned) scheduleIdle();
    else {
      clearIdle();
      setOpen(false);
    }
  }

  function pick(next: AdminLayoutMode) {
    onChange(next);
    setPinned(true);
    setOpen(true);
    scheduleIdle();
  }

  return (
    <div
      className="pointer-events-auto absolute bottom-6 right-6 z-40"
      onMouseEnter={expand}
      onMouseLeave={collapseUnlessPinned}
      onFocusCapture={expand}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) collapseUnlessPinned();
      }}
    >
      <div
        role="toolbar"
        aria-label="Admin layout"
        aria-orientation="horizontal"
        className={`flex h-10 items-center overflow-hidden bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.12)] transition-[width,border-radius,padding] duration-300 ease-[cubic-bezier(0.2,0.8,0,1)] motion-reduce:transition-none ${
          open ? "w-[104px] rounded-full px-1" : "w-10 rounded-[12px] px-0"
        }`}
      >
        <div
          className="flex items-center will-change-transform motion-reduce:transition-none"
          style={{
            width: LAYOUT_SLOT * LAYOUT_MODES.length,
            transform: open ? "translateX(0)" : `translateX(${-index * LAYOUT_SLOT}px)`,
            transition: "transform 300ms cubic-bezier(0.2, 0.8, 0, 1)",
          }}
        >
          {LAYOUT_MODES.map((item) => {
            const on = item === mode;
            const copy = layoutModeCopy[item];
            return (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={copy.label}
                tabIndex={open || on ? 0 : -1}
                onClick={() => pick(item)}
                className={`press grid size-8 shrink-0 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#005bd3] ${
                  on ? "text-[#171817]" : "text-[#9a9a9a] hover:text-[#616161]"
                }`}
              >
                <AdminLayoutGlyph mode={item} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const layoutGlyphPaths: Record<AdminLayoutMode, string> = {
  sidebar:
    "M11 1C13.2091 1 15 2.79086 15 5V11C15 13.14 13.3194 14.8879 11.2061 14.9951L11 15H5L4.79395 14.9951C2.7488 14.8913 1.10865 13.2512 1.00488 11.2061L1 11V5C1 2.79086 2.79086 1 5 1H11ZM5 2.5C3.61929 2.5 2.5 3.61929 2.5 5V11C2.5 12.3807 3.61929 13.5 5 13.5H11C12.3807 13.5 13.5 12.3807 13.5 11V5C13.5 3.61929 12.3807 2.5 11 2.5H5ZM11.25 4C11.6642 4 12 4.33579 12 4.75V11.25C12 11.6642 11.6642 12 11.25 12C10.8358 12 10.5 11.6642 10.5 11.25V4.75C10.5 4.33579 10.8358 4 11.25 4Z",
  expanded:
    "M11 1C13.2091 1 15 2.79086 15 5V11C15 13.14 13.3194 14.8879 11.2061 14.9951L11 15H5L4.79395 14.9951C2.7488 14.8913 1.10865 13.2512 1.00488 11.2061L1 11V5C1 2.79086 2.79086 1 5 1H11ZM5 2.5C3.61929 2.5 2.5 3.61929 2.5 5V11C2.5 12.3807 3.61929 13.5 5 13.5H11C12.3807 13.5 13.5 12.3807 13.5 11V5C13.5 3.61929 12.3807 2.5 11 2.5H5ZM11 4C11.5523 4 12 4.44772 12 5V11C12 11.5523 11.5523 12 11 12H9.5C8.94772 12 8.5 11.5523 8.5 11V5C8.5 4.44772 8.94772 4 9.5 4H11Z",
  takeover:
    "M11 1C13.2091 1 15 2.79086 15 5V11C15 13.14 13.3194 14.8879 11.2061 14.9951L11 15H5L4.79395 14.9951C2.7488 14.8913 1.10865 13.2512 1.00488 11.2061L1 11V5C1 2.79086 2.79086 1 5 1H11ZM5 2.5C3.61929 2.5 2.5 3.61929 2.5 5V11C2.5 12.3807 3.61929 13.5 5 13.5H11C12.3807 13.5 13.5 12.3807 13.5 11V5C13.5 3.61929 12.3807 2.5 11 2.5H5ZM11 4C11.5523 4 12 4.44772 12 5V11C12 11.5523 11.5523 12 11 12H6.5C5.94772 12 5.5 11.5523 5.5 11V5C5.5 4.44772 5.94772 4 6.5 4H11Z",
};

function AdminLayoutGlyph({ mode }: { mode: AdminLayoutMode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0" fill="currentColor">
      <path d={layoutGlyphPaths[mode]} />
    </svg>
  );
}

export function Body({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-4 px-6 pb-10 ${className}`} style={{ viewTransitionName: "admin-body" }}>
      {children}
    </div>
  );
}

/* Buttons. Primary, gray, and critical come from Polaris (s-button); the admin's white bordered header buttons don't exist there. */

export function Btn({
  tone = "white",
  icon,
  onClick,
  disabled,
  children,
  full,
}: {
  tone?: "primary" | "white" | "gray" | "plain" | "critical";
  icon?: PolarisIconName;
  onClick?: () => void;
  disabled?: boolean;
  children?: ReactNode;
  full?: boolean;
}) {
  if (tone === "white") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`press inline-flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-white px-2.5 text-[12px] font-semibold text-[#303030] shadow-[0_0_0_1px_#e3e3e3,0_1px_0_#e3e3e3] hover:bg-[#fafafa] active:bg-[#f1f1f1] disabled:text-[#b5b5b5] disabled:shadow-[0_0_0_1px_#ebebeb] ${
          icon && !children ? "w-7 px-0" : ""
        } ${full ? "w-full" : ""}`}
      >
        {icon ? (
          <span className={children ? "-ml-1" : ""}>
            <PIcon name={icon} size={18} />
          </span>
        ) : null}
        {children}
      </button>
    );
  }
  const variant = tone === "primary" ? "primary" : tone === "plain" ? "tertiary" : "secondary";
  return (
    <s-button
      variant={variant}
      tone={tone === "critical" ? "critical" : undefined}
      icon={icon ? kebab(icon) : undefined}
      disabled={disabled}
      inlineSize={full ? "fill" : undefined}
      onClick={onClick}
    >
      {children}
    </s-button>
  );
}

function kebab(name: string) {
  return name.replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase() as never;
}

export function Badge({ tone = "neutral", children, icon }: { tone?: "info" | "success" | "warning" | "caution" | "critical" | "neutral"; children: ReactNode; icon?: PolarisIconName }) {
  return (
    <s-badge tone={tone === "neutral" ? undefined : tone} icon={icon ? kebab(icon) : undefined}>
      {children}
    </s-badge>
  );
}

/* Cards and sections */

export function Card({ children, className = "", flush = false }: { children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-xl bg-white shadow-[0_0_0_1px_#e3e3e3,0_1px_0_rgba(0,0,0,0.05)] ${flush ? "" : "p-3"} ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, dotted = false, aside }: { children: ReactNode; dotted?: boolean; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className={`text-[13px] font-semibold text-[#303030] ${dotted ? "underline decoration-[#b5b5b5] decoration-dotted underline-offset-[3px]" : ""}`}>{children}</p>
      {aside}
    </div>
  );
}

export function Section({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex min-h-7 items-center justify-between gap-2 px-1">
        <h3 className="text-[13px] font-semibold text-[#303030]">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Muted({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[12px] leading-[1.45] text-[#616161] ${className}`}>{children}</p>;
}

export function Chip({ children, icon, onClick, caret = false }: { children: ReactNode; icon?: PolarisIconName; onClick?: () => void; caret?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-white px-2 text-[12px] font-medium text-[#303030] shadow-[0_0_0_1px_#e3e3e3] hover:bg-[#fafafa]"
    >
      {icon ? <PIcon name={icon} size={18} /> : null}
      {children}
      {caret ? <PIcon name="ChevronDown" size={16} /> : null}
    </button>
  );
}

export function LearnMore({ topic, onClick }: { topic: string; onClick?: () => void }) {
  return (
    <p className="py-2 text-center text-[12px] text-[#303030]">
      <button type="button" onClick={onClick} className="font-medium hover:underline">
        Learn more about {topic}
      </button>
    </p>
  );
}

/* Empty state: illustration, bold title, gray copy, black pill, and a "Learn more about X" link under the card. */

export function EmptyState({
  art,
  icon,
  title,
  body,
  cta,
  secondary,
  onCta,
  learn,
  bare = false,
}: {
  art?: string;
  icon?: PolarisIconName;
  title: string;
  body: ReactNode;
  cta?: string;
  secondary?: string;
  onCta?: () => void;
  learn?: string;
  bare?: boolean;
}) {
  const inner = (
    <div className="flex flex-col items-center px-5 py-8 text-center">
      {art ? <img src={art} alt="" className="mb-3 h-[104px] w-auto object-contain" /> : null}
      {icon ? (
        <span className="mb-2 text-[#303030]">
          <PIcon name={icon} size={20} />
        </span>
      ) : null}
      <p className="text-[14px] font-semibold text-[#303030]">{title}</p>
      <p className="mt-1 max-w-[300px] text-[12px] leading-[1.45] text-[#616161]">{body}</p>
      {cta || secondary ? (
        <div className="mt-4 flex gap-2">
          {cta ? (
            <Btn tone="primary" onClick={onCta}>
              {cta}
            </Btn>
          ) : null}
          {secondary ? <Btn tone="gray">{secondary}</Btn> : null}
        </div>
      ) : null}
    </div>
  );
  return (
    <>
      {bare ? inner : <Card flush>{inner}</Card>}
      {learn ? <LearnMore topic={learn} /> : null}
    </>
  );
}

/* Index table: light-gray header row, hairline rows, scrolls sideways in the narrow panel. */

export type Column = { label: string; width?: number; align?: "end" };

export function Table({
  columns,
  rows,
  onRow,
  toolbar,
  footer,
  select = false,
}: {
  columns: Column[];
  rows: ReactNode[][];
  onRow?: (index: number) => void;
  toolbar?: ReactNode;
  footer?: ReactNode;
  select?: boolean;
}) {
  const template = [select ? "28px" : null, ...columns.map((column) => (column.width ? `${column.width}px` : "minmax(140px,1fr)"))].filter(Boolean).join(" ");
  const min = (select ? 28 : 0) + columns.reduce((sum, column) => sum + (column.width ?? 140), 0) + 16;
  return (
    <Card flush>
      {toolbar}
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <div style={{ minWidth: min }}>
          <div className="grid h-8 items-center gap-x-3 bg-[#f7f7f7] px-3 text-[12px] font-medium text-[#616161]" style={{ gridTemplateColumns: template }}>
            {select ? <s-checkbox accessibilityLabel="Select all" /> : null}
            {columns.map((column) => (
              <span key={column.label} className={`truncate ${column.align === "end" ? "text-right" : ""}`}>
                {column.label}
              </span>
            ))}
          </div>
          {rows.map((cells, index) => (
            <div
              key={index}
              onClick={onRow ? () => onRow(index) : undefined}
              className={`grid min-h-10 items-center gap-x-3 border-t border-[#ebebeb] px-3 py-1.5 text-[12px] text-[#303030] ${onRow ? "cursor-pointer hover:bg-[#f7f7f7]" : ""}`}
              style={{ gridTemplateColumns: template }}
            >
              {select ? (
                <span onClick={(event) => event.stopPropagation()} className="flex">
                  <s-checkbox accessibilityLabel="Select row" />
                </span>
              ) : null}
              {cells.map((cell, cellIndex) => (
                <span key={cellIndex} className={`min-w-0 truncate ${columns[cellIndex]?.align === "end" ? "text-right tabular-nums" : ""}`}>
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      {footer}
    </Card>
  );
}

export function TableSearch({ placeholder, tabs = ["All"], value, onChange }: { placeholder: string; tabs?: string[]; value?: string; onChange?: (value: string) => void }) {
  const view = useWorkspaceView();
  const current = view?.tab && tabs.includes(view.tab) ? view.tab : tabs[0];
  const query = value ?? view?.query ?? "";
  const sort = view?.sort || "newest";
  return (
    <div className="flex items-center gap-1.5 border-b border-[#ebebeb] px-2 py-1.5">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          aria-pressed={tab === current}
          onClick={() => view?.setTab(tab)}
          className={`rounded-lg px-2 py-1 text-[12px] font-semibold ${tab === current ? "bg-[#ebebeb] text-[#303030]" : "text-[#616161] hover:bg-[#f7f7f7]"}`}
        >
          {tab}
        </button>
      ))}
      <label className="flex h-7 min-w-0 flex-1 items-center gap-1 rounded-lg px-1.5 text-[#616161] focus-within:bg-[#f7f7f7]">
        <PIcon name="Search" size={18} />
        <input
          value={query}
          onChange={(event) => (onChange ?? view?.setQuery)?.(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[12px] text-[#303030] outline-none placeholder:text-[#8a8a8a]"
        />
      </label>
      <button
        type="button"
        aria-label={`Sort: ${sortLabel(sort)}`}
        onClick={() => view?.setSort(nextSort(sort))}
        className="grid size-7 place-items-center rounded-lg text-[#4a4a4a] shadow-[0_0_0_1px_#e3e3e3] hover:bg-[#fafafa]"
      >
        <PIcon name="SortAscending" size={18} />
      </button>
    </div>
  );
}

export function SearchField({ placeholder, icon = "Search", trailing }: { placeholder: string; icon?: PolarisIconName; trailing?: PolarisIconName }) {
  const view = useWorkspaceView();
  return (
    <label className="flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[#616161] shadow-[0_0_0_1px_#e3e3e3] focus-within:shadow-[0_0_0_1.5px_#303030]">
      <PIcon name={icon} size={18} />
      <input
        value={view?.query ?? ""}
        onChange={(event) => view?.setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[12px] text-[#303030] outline-none placeholder:text-[#8a8a8a]"
      />
      {trailing ? <PIcon name={trailing} size={18} /> : null}
    </label>
  );
}

/* Metrics */

export function Kpi({ label, value, delta, points, onClick }: { label: string; value: string; delta?: string; points?: number[]; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press flex min-w-0 flex-col gap-1 rounded-xl bg-white p-3 text-left shadow-[0_0_0_1px_#e3e3e3,0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#fafafa]">
      <span className="truncate text-[12px] font-semibold text-[#303030] underline decoration-[#b5b5b5] decoration-dotted underline-offset-[3px]">{label}</span>
      <span className="flex items-end justify-between gap-2">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold tabular-nums text-[#303030]">{value}</span>
          <span className="text-[11px] text-[#616161]">{delta ?? "—"}</span>
        </span>
        <Sparkline points={points} />
      </span>
    </button>
  );
}

export function Sparkline({ points = [0, 0, 0, 0, 0, 0, 0, 0] }: { points?: number[] }) {
  const max = Math.max(1, ...points);
  const d = points.map((value, index) => `${index === 0 ? "M" : "L"}${(index / (points.length - 1)) * 56} ${22 - (value / max) * 18}`).join(" ");
  return (
    <svg viewBox="0 0 56 24" className="h-6 w-14 shrink-0 overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke="#4b9cf5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LineChart({
  series,
  compare,
  labels,
  ticks,
  legend,
  height = 150,
}: {
  series: number[];
  compare?: number[];
  labels: string[];
  ticks: string[];
  legend?: [string, string];
  height?: number;
}) {
  const max = Math.max(1, ...series, ...(compare ?? []));
  const path = (values: number[]) =>
    values.map((value, index) => `${index === 0 ? "M" : "L"}${((index / (values.length - 1)) * 300).toFixed(1)} ${(100 - (value / max) * 92).toFixed(1)}`).join(" ");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-0.5 text-right text-[10px] text-[#8a8a8a]" style={{ height }}>
          {[...ticks].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="min-w-0 flex-1 overflow-visible" style={{ height }} aria-hidden>
          {ticks.map((tick, index) => (
            <line key={tick} x1="0" x2="300" y1={100 - (index / (ticks.length - 1)) * 100} y2={100 - (index / (ticks.length - 1)) * 100} stroke="#ebebeb" vectorEffect="non-scaling-stroke" />
          ))}
          {compare ? <path d={path(compare)} fill="none" stroke="#a4d4fb" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" /> : null}
          <path d={path(series)} fill="none" stroke="#4b9cf5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="flex justify-between pl-7 text-[10px] text-[#8a8a8a]">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      {legend ? (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-[#616161]">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#4b9cf5]" />
            {legend[0]}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#a4d4fb]" />
            {legend[1]}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/* Rows */

export function Row({
  icon,
  title,
  body,
  aside,
  onClick,
  chevron = true,
  first = false,
}: {
  icon?: PolarisIconName;
  title: ReactNode;
  body?: ReactNode;
  aside?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  first?: boolean;
}) {
  const content = (
    <>
      {icon ? (
        <span className="text-[#4a4a4a]">
          <PIcon name={icon} size={20} />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[12px] font-medium text-[#303030]">{title}</span>
        {body ? <span className="truncate text-[12px] text-[#616161]">{body}</span> : null}
      </span>
      {aside}
      {chevron ? (
        <span className="text-[#8a8a8a]">
          <PIcon name="ChevronRight" size={18} />
        </span>
      ) : null}
    </>
  );
  const className = `flex w-full items-center gap-2.5 px-3 py-2.5 text-left ${first ? "" : "border-t border-[#ebebeb]"}`;
  // Rows without their own action can hold buttons in `aside`, which a <button> row can't contain.
  if (!onClick) return <div className={className}>{content}</div>;
  return (
    <button type="button" onClick={onClick} className={`press ${className} hover:bg-[#f7f7f7]`}>
      {content}
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange?: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange?.(!on)}
      className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${on ? "bg-[#303030]" : "bg-[#d4d4d4]"}`}
    >
      <span className={`absolute top-0.5 size-3 rounded-full bg-white shadow transition-transform ${on ? "translate-x-3.5" : "translate-x-0.5"}`} />
    </button>
  );
}

export function KeyValue({ label, value, first = false }: { label: ReactNode; value: ReactNode; first?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 text-[12px] ${first ? "" : "border-t border-[#ebebeb]"}`}>
      <span className="text-[#303030]">{label}</span>
      <span className="font-medium text-[#303030]">{value}</span>
    </div>
  );
}

export function Thumb({ src, size = 28 }: { src?: string; size?: number }) {
  return src ? (
    <img src={src} alt="" className="shrink-0 rounded-md border border-[#ebebeb] object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-md border border-[#ebebeb] bg-white text-[#8a8a8a]" style={{ width: size, height: size }}>
      <PIcon name="Image" size={16} />
    </span>
  );
}
