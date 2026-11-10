"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Card, CardTitle, TopBar } from "@/components/admin-ui";
import { ChoiceCards } from "@/components/choice-cards";
import { ChipButton, Orb } from "@/components/marks";
import { PIcon, type PolarisIconName } from "@/components/polaris-icon";
import type { ChoiceCard } from "@/lib/choices";
import { voiceOrbIds, voiceOrbLabel, voiceOrbTint, type VoiceOrbId } from "@/lib/prototype";
import type { OrbState } from "@/voiceorbs/lib/orb-state";

const groups = [
  { id: "foundations", label: "Foundations" },
  { id: "actions", label: "Actions" },
  { id: "feedback", label: "Feedback" },
  { id: "forms", label: "Forms" },
  { id: "layout", label: "Layout and structure" },
  { id: "media", label: "Media" },
  { id: "overlays", label: "Overlays" },
  { id: "typography", label: "Typography" },
  { id: "sidekick", label: "Sidekick" },
  { id: "admin", label: "Admin recreations" },
] as const;

type GroupId = (typeof groups)[number]["id"];

/** Components this prototype renders in the admin or the sidekick. */
const used = new Set(["s-badge", "s-banner", "s-button", "s-checkbox", "s-link", "s-option", "s-search-field", "s-select", "s-stack", "s-text-area", "s-text-field"]);

const foundationIcons: PolarisIconName[] = [
  "Home",
  "Order",
  "Product",
  "Person",
  "ChartVertical",
  "CashDollar",
  "Discount",
  "Content",
  "Markets",
  "Store",
  "PointOfSale",
  "Apps",
  "Settings",
  "Search",
  "Notification",
  "QuestionCircle",
];

const colors = [
  ["Shell", "#0c0d0c"],
  ["Panel", "#171817"],
  ["Paper", "#ffffff"],
  ["Paper muted", "#f6f6f6"],
  ["Hairline", "#e3e3e3"],
  ["Body", "#303030"],
  ["Subdued", "#616161"],
  ["Link", "#005bd3"],
  ["Sidekick", "#5631f4"],
  ["Store", "#36fba1"],
  ["Critical", "#eb1700"],
  ["Warning", "#b98900"],
] as const;

const orbStates: { id: OrbState; label: string }[] = [
  { id: "idle", label: "Idle" },
  { id: "listening", label: "Listening" },
  { id: "thinking", label: "Thinking" },
  { id: "speaking", label: "Speaking" },
];

const sampleCards: ChoiceCard[] = [
  {
    id: "headphones",
    title: "Studio ANC Headphones",
    pitch: "A bundle that lifts the average order.",
    price: "$289",
    signal: "39% of revenue",
    why: "14 left, and Monday’s ads still feature them.",
    image: "/assets/headphones.webp",
    kind: "product",
  },
  {
    id: "lamp",
    title: "Desk Lamp",
    pitch: "The page still says 5–7 days.",
    price: "$89",
    signal: "Ads say this week",
    why: "The delivery line and the ad don’t match.",
    image: "/assets/lamp.webp",
    kind: "product",
  },
];

export function DesignSystem({ onBack }: { onBack: () => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const [active, setActive] = useState<GroupId>("foundations");

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    function pick() {
      if (lock.current || !root) return;
      const line = root.getBoundingClientRect().top + 32;
      let current: GroupId = groups[0].id;
      for (const group of groups) {
        const node = document.getElementById(group.id);
        if (node && node.getBoundingClientRect().top <= line) current = group.id;
      }
      setActive(current);
    }
    pick();
    root.addEventListener("scroll", pick, { passive: true });
    return () => root.removeEventListener("scroll", pick);
  }, []);

  function show(id: GroupId) {
    setActive(id);
    lock.current = true;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
    window.setTimeout(() => {
      lock.current = false;
    }, 700);
  }

  return (
    <div className="p-partial-theme-admin-next-light flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-[20px] bg-[#f6f6f7] text-[#303030]">
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-[#e3e3e3] bg-white">
        <div className="px-2 pb-1 pt-3">
          <button
            type="button"
            onClick={onBack}
            className="press flex h-9 w-full items-center gap-1.5 rounded-lg px-2 text-left text-[13px] font-medium text-[#303030] hover:bg-[#f6f6f6]"
          >
            <PIcon name="ArrowLeft" size={16} />
            Admin
          </button>
        </div>
        <p className="px-4 pb-1 pt-2 text-[12px] font-medium text-[#616161]">Components</p>
        <nav aria-label="Design system" className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {groups.map((group) => {
            const on = active === group.id;
            return (
              <button
                key={group.id}
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => show(group.id)}
                className={`flex h-8 w-full items-center rounded-lg px-2 text-left text-[13px] ${
                  on ? "bg-[#f1f1f1] font-medium text-[#171817]" : "text-[#303030] hover:bg-[#f6f6f6]"
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[960px] flex-col gap-14 px-8 pb-[40vh] pt-8">
          <header className="flex flex-col gap-2">
            <p className="text-[12px] font-medium text-[#616161]">Design system</p>
            <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.4px] text-[#171817]">Polaris and Sidekick</h1>
            <p className="max-w-[68ch] text-[14px] leading-5 text-[#616161]">
              Live components from the Polaris web components library, grouped the way the docs group them. A Used badge marks the ones this prototype already renders. Sidekick and the admin chrome are ours.
            </p>
          </header>
          <Foundations />
          <Actions />
          <Feedback />
          <Forms />
          <Layout />
          <Media />
          <Overlays />
          <Typography />
          <Sidekick />
          <Admin />
        </div>
      </div>
    </div>
  );
}

function Group({ id, title, note, children }: { id: GroupId; title: string; note: string; children: ReactNode }) {
  return (
    <section id={id} data-group={id} className="scroll-mt-6 flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.2px] text-[#171817]">{title}</h2>
        <p className="max-w-[68ch] text-[13px] leading-5 text-[#616161]">{note}</p>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Specimen({ tag, title, children }: { tag?: string; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="text-[13px] font-semibold text-[#303030]">{title}</h3>
        {tag && used.has(tag) ? <span className="rounded-full bg-[#eaf4ff] px-1.5 py-0.5 text-[11px] font-medium leading-4 text-[#005bd3]">Used</span> : null}
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl bg-white p-4 shadow-[0_0_0_1px_#e3e3e3]">{children}</div>
    </div>
  );
}

function Variant({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[88px] flex-col items-start gap-1.5">
      <span className="text-[11px] leading-4 text-[#8a8a8a]">{label}</span>
      {children}
    </div>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex w-[104px] flex-col gap-1.5">
      <span className="h-10 rounded-lg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" style={{ background: value }} />
      <span className="text-[12px] font-medium text-[#303030]">{name}</span>
      <span className="text-[11px] uppercase text-[#8a8a8a]">{value}</span>
    </div>
  );
}

function Foundations() {
  return (
    <Group id="foundations" title="Foundations" note="Color, type, spacing, radius, shadow, and icons this prototype uses. Polaris components below carry their own tokens.">
      <Specimen title="Color">
        {colors.map(([name, value]) => (
          <Swatch key={name} name={name} value={value} />
        ))}
      </Specimen>
      <Specimen title="Type">
        <Variant label="28 / semibold">
          <span className="text-[28px] font-semibold leading-9 tracking-[-0.4px]">Page title</span>
        </Variant>
        <Variant label="20 / semibold">
          <span className="text-[20px] font-semibold leading-7">Section</span>
        </Variant>
        <Variant label="15 / regular">
          <span className="text-[15px] leading-[1.4]">Sidekick message</span>
        </Variant>
        <Variant label="13 / medium">
          <span className="text-[13px] font-medium">Row label</span>
        </Variant>
        <Variant label="12 / regular">
          <span className="text-[12px] text-[#616161]">Meta and help</span>
        </Variant>
      </Specimen>
      <Specimen title="Spacing">
        {[4, 8, 12, 16, 24, 32].map((size) => (
          <Variant key={size} label={`${size}px`}>
            <span className="block rounded bg-[#005bd3]" style={{ width: size, height: 16 }} />
          </Variant>
        ))}
      </Specimen>
      <Specimen title="Radius">
        {[
          ["8", "8px"],
          ["12", "12px"],
          ["16", "16px"],
          ["20", "20px"],
          ["Full", "999px"],
        ].map(([label, radius]) => (
          <Variant key={label} label={label}>
            <span className="block size-10 bg-[#f1f1f1] shadow-[inset_0_0_0_1px_#e3e3e3]" style={{ borderRadius: radius }} />
          </Variant>
        ))}
      </Specimen>
      <Specimen title="Shadow">
        <Variant label="Card">
          <span className="grid h-12 w-28 place-items-center rounded-xl bg-white text-[12px] shadow-[0_0_0_1px_#e3e3e3,0_1px_0_rgba(0,0,0,0.05)]">Card</span>
        </Variant>
        <Variant label="Popover">
          <span className="grid h-12 w-28 place-items-center rounded-2xl bg-white text-[12px] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.16)]">Menu</span>
        </Variant>
        <Variant label="Circle button">
          <span className="grid size-8 place-items-center rounded-full bg-white text-[12px] shadow-[0_0_0_1px_#e3e3e3,0_1px_1px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.14)]">Aa</span>
        </Variant>
      </Specimen>
      <Specimen title="Icons">
        {foundationIcons.map((name) => (
          <Variant key={name} label={name}>
            <span className="grid size-8 place-items-center rounded-lg bg-[#f6f6f6] text-[#303030]">
              <PIcon name={name} size={20} />
            </span>
          </Variant>
        ))}
      </Specimen>
    </Group>
  );
}

function Actions() {
  return (
    <Group id="actions" title="Actions" note="Buttons, links, and menus. The docs keep Link and Menu here rather than in a separate navigation group.">
      <Specimen tag="s-button" title="Button">
        <Variant label="Primary">
          <s-button variant="primary">Save</s-button>
        </Variant>
        <Variant label="Secondary">
          <s-button variant="secondary">Cancel</s-button>
        </Variant>
        <Variant label="Tertiary">
          <s-button variant="tertiary">Learn more</s-button>
        </Variant>
        <Variant label="Critical">
          <s-button variant="primary" tone="critical">
            Delete
          </s-button>
        </Variant>
        <Variant label="Icon">
          <s-button variant="secondary" icon="plus" accessibilityLabel="Add" />
        </Variant>
        <Variant label="Disabled">
          <s-button variant="primary" disabled>
            Save
          </s-button>
        </Variant>
        <Variant label="Loading">
          <s-button variant="primary" loading>
            Saving
          </s-button>
        </Variant>
      </Specimen>
      <Specimen tag="s-button-group" title="Button group">
        <Variant label="Gap">
          <s-button-group>
            <s-button slot="secondary-actions" variant="secondary">
              Export
            </s-button>
            <s-button slot="primary-action" variant="primary">
              Save
            </s-button>
          </s-button-group>
        </Variant>
        <Variant label="None">
          <s-button-group gap="none">
            <s-button slot="secondary-actions" variant="secondary">
              Day
            </s-button>
            <s-button slot="secondary-actions" variant="secondary">
              Week
            </s-button>
            <s-button slot="secondary-actions" variant="secondary">
              Month
            </s-button>
          </s-button-group>
        </Variant>
      </Specimen>
      <Specimen tag="s-clickable" title="Clickable">
        <s-clickable padding="base" borderRadius="base" background="subdued">
          <s-text>Open the order</s-text>
        </s-clickable>
        <s-clickable padding="base" borderRadius="base" disabled>
          <s-text>Disabled</s-text>
        </s-clickable>
      </Specimen>
      <Specimen tag="s-clickable-chip" title="Clickable chip">
        <s-clickable-chip>Headphones</s-clickable-chip>
        <s-clickable-chip color="strong">In stock</s-clickable-chip>
        <s-clickable-chip removable>Desk lamp</s-clickable-chip>
        <s-clickable-chip disabled>Archived</s-clickable-chip>
      </Specimen>
      <Specimen tag="s-link" title="Link">
        <s-link href="https://shopify.dev/docs/api/app-home/polaris-web-components" target="_blank">
          Polaris web components
        </s-link>
      </Specimen>
      <Specimen tag="s-menu" title="Menu">
        <s-button commandFor="ds-menu" command="--toggle" variant="secondary">
          Order actions
        </s-button>
        <s-menu id="ds-menu" accessibilityLabel="Order actions">
          <s-button icon="edit">Edit order</s-button>
          <s-button icon="delivery">Fulfill</s-button>
          <s-button icon="delete" tone="critical">
            Cancel
          </s-button>
        </s-menu>
      </Specimen>
      <Library tag="s-press-button" title="Press button">
        <s-press-button>Filter</s-press-button>
        <s-press-button pressed>Pressed</s-press-button>
        <s-press-button disabled>Disabled</s-press-button>
        <s-press-button loading>Loading</s-press-button>
      </Library>
    </Group>
  );
}

function Feedback() {
  return (
    <Group id="feedback" title="Feedback" note="Status, alerts, empty pages, progress, and loading.">
      <Specimen tag="s-badge" title="Badge">
        {(["neutral", "info", "success", "caution", "warning", "critical"] as const).map((tone) => (
          <Variant key={tone} label={tone}>
            <s-badge tone={tone}>{tone}</s-badge>
          </Variant>
        ))}
        <Variant label="Large">
          <s-badge size="large" tone="info">
            New
          </s-badge>
        </Variant>
        <Variant label="Icon">
          <s-badge tone="success" icon="check-circle">
            Paid
          </s-badge>
        </Variant>
      </Specimen>
      <Specimen tag="s-banner" title="Banner">
        <div className="flex w-full flex-col gap-3">
          <s-banner tone="info" heading="Sessions may shift">
            Shopify Analytics is counting shoppers differently from Sept 21.
          </s-banner>
          <s-banner tone="success" heading="Payout sent">
            $2,184.60 is on the way.
          </s-banner>
          <s-banner tone="warning" heading="Finish store setup">
            Autopilot stays off until the store password is removed.
          </s-banner>
          <s-banner tone="critical" heading="Payment failed" dismissible>
            The card on file was declined.
          </s-banner>
        </div>
      </Specimen>
      <Specimen tag="s-empty-state" title="Empty state">
        <div className="w-full">
          <s-empty-state heading="No orders yet">
            <s-paragraph>Orders show up here after the first checkout.</s-paragraph>
            <s-button slot="primary-action" variant="primary">
              Share the store
            </s-button>
          </s-empty-state>
        </div>
      </Specimen>
      <Specimen tag="s-progress" title="Progress">
        <div className="flex w-full flex-col gap-3">
          <Variant label="64 of 100">
            <div className="w-64">
              <s-progress value={64} max={100} accessibilityLabel="Upload" />
            </div>
          </Variant>
          <Variant label="Success">
            <div className="w-64">
              <s-progress value={100} max={100} tone="success" accessibilityLabel="Complete" />
            </div>
          </Variant>
          <Variant label="Critical">
            <div className="w-64">
              <s-progress value={20} max={100} tone="critical" accessibilityLabel="Failed" />
            </div>
          </Variant>
        </div>
      </Specimen>
      <Specimen tag="s-spinner" title="Spinner">
        <Variant label="Base">
          <s-spinner accessibilityLabel="Loading" />
        </Variant>
        <Variant label="Large">
          <s-spinner size="large" accessibilityLabel="Loading" />
        </Variant>
        <Variant label="Larger">
          <s-spinner size="large-100" accessibilityLabel="Loading" />
        </Variant>
      </Specimen>
    </Group>
  );
}

function Forms() {
  return (
    <Group id="forms" title="Forms" note="Fields, choices, and pickers. Each one shows a resting state and an error, disabled, or alternate state.">
      <Specimen tag="s-text-field" title="Text field">
        <s-text-field label="Product title" value="Studio ANC Headphones" name="title" />
        <s-text-field label="SKU" placeholder="ANC-001" name="sku" />
        <s-text-field label="Vendor" value="Northwind" name="vendor" disabled />
        <s-text-field label="Handle" value="studio anc" name="handle" error="Use letters, numbers, and hyphens." />
      </Specimen>
      <Specimen tag="s-text-area" title="Text area">
        <div className="w-full max-w-md">
          <s-text-area label="Description" rows={3} value="Over-ear headphones with a case and a cable." name="description" />
        </div>
        <div className="w-full max-w-md">
          <s-text-area label="Note" rows={2} placeholder="Add a note" name="note" error="Add a note before saving." />
        </div>
      </Specimen>
      <Specimen tag="s-search-field" title="Search field">
        <div className="w-64">
          <s-search-field label="Search products" labelAccessibilityVisibility="exclusive" placeholder="Search products" />
        </div>
        <div className="w-64">
          <s-search-field label="Search orders" value="1078" disabled />
        </div>
      </Specimen>
      <Specimen tag="s-checkbox" title="Checkbox">
        <s-checkbox label="Charge taxes" checked />
        <s-checkbox label="Track quantity" details="Shopify updates the count when an order is placed." />
        <s-checkbox label="Some variants selected" indeterminate />
        <s-checkbox label="Archived" disabled />
        <s-checkbox label="Requires shipping" error="Choose a shipping profile." />
      </Specimen>
      <Specimen tag="s-switch" title="Switch">
        <s-switch label="Continue selling when out of stock" checked />
        <s-switch label="Gift card" />
        <s-switch label="Locked" checked disabled />
      </Specimen>
      <Specimen tag="s-choice-list" title="Choice list">
        <s-choice-list label="Fulfillment" name="fulfillment">
          <s-choice value="ship">Ship</s-choice>
          <s-choice value="pickup">Pickup</s-choice>
        </s-choice-list>
        <s-choice-list label="Channels" name="channels" multiple>
          <s-choice value="online">Online store</s-choice>
          <s-choice value="shop">Shop</s-choice>
          <s-choice value="pos" disabled>
            Point of Sale
          </s-choice>
        </s-choice-list>
      </Specimen>
      <Specimen tag="s-select" title="Select">
        <s-select label="Status" name="status" value="active">
          <s-option value="active">Active</s-option>
          <s-option value="draft">Draft</s-option>
        </s-select>
        <s-select label="Region" name="region">
          <s-option-group label="North America">
            <s-option value="us">United States</s-option>
            <s-option value="ca">Canada</s-option>
          </s-option-group>
          <s-option value="uk">United Kingdom</s-option>
        </s-select>
        <s-select label="Vendor" name="vendor-disabled" disabled>
          <s-option value="northwind">Northwind</s-option>
        </s-select>
        <s-select label="Category" name="category" error="Choose a category." placeholder="Choose">
          <s-option value="audio">Audio</s-option>
        </s-select>
      </Specimen>
      <Specimen tag="s-email-field" title="Email field">
        <s-email-field label="Email" name="email" value="vee@example.com" />
        <s-email-field label="Reply-to" name="reply" value="not-an-email" error="Enter a valid email." />
      </Specimen>
      <Specimen tag="s-password-field" title="Password field">
        <s-password-field label="Password" name="password" value="ohsow" />
        <s-password-field label="Confirm" name="confirm" disabled />
      </Specimen>
      <Specimen tag="s-url-field" title="URL field">
        <s-url-field label="Store URL" name="url" placeholder="example.com" />
        <s-url-field label="Redirect" name="redirect" value="ftp://files" error="Enter a URL that starts with https." />
      </Specimen>
      <Specimen tag="s-number-field" title="Number field">
        <s-number-field label="Quantity" name="qty" value="14" />
        <s-number-field label="Weight" name="weight" placeholder="0" error="Enter a weight." />
      </Specimen>
      <Specimen tag="s-money-field" title="Money field">
        <s-money-field label="Price" name="price" value="289.00" />
        <s-money-field label="Compare at" name="compare" value="-1" error="Enter a price of 0 or more." />
      </Specimen>
      <Specimen tag="s-color-field" title="Color field">
        <s-color-field label="Brand" name="brand" value="#005bd3" />
        <s-color-field label="Accent" name="accent" value="#5631f4" alpha />
      </Specimen>
      <Specimen tag="s-color-picker" title="Color picker">
        <s-color-picker name="picker" value="#005bd3" />
      </Specimen>
      <Specimen tag="s-date-field" title="Date field">
        <s-date-field label="Publish date" name="publish" />
        <s-date-field label="Backorder" name="backorder" disabled />
      </Specimen>
      <Specimen tag="s-date-picker" title="Date picker">
        <s-date-picker name="range" type="single" />
        <s-date-picker name="span" type="range" />
      </Specimen>
      <Specimen tag="s-drop-zone" title="Drop zone">
        <div className="w-full max-w-sm">
          <s-drop-zone label="Product photo" name="photo" accessibilityLabel="Upload a product photo" />
        </div>
        <div className="w-full max-w-sm">
          <s-drop-zone label="Disabled" name="photo-off" disabled />
        </div>
      </Specimen>
    </Group>
  );
}

function Layout() {
  return (
    <Group id="layout" title="Layout and structure" note="Containers, lists, and the page shell. Child pieces such as grid items and table cells render inside their parent.">
      <Specimen tag="s-box" title="Box">
        <s-box padding="base" background="subdued" borderRadius="base">
          <s-text>Subdued</s-text>
        </s-box>
        <s-box padding="base" background="strong" borderRadius="base">
          <s-text>Strong</s-text>
        </s-box>
        <s-box padding="base" borderWidth="base" borderColor="base" borderRadius="base">
          <s-text>Bordered</s-text>
        </s-box>
      </Specimen>
      <Specimen tag="s-stack" title="Stack">
        <s-stack direction="inline" gap="small">
          <s-badge tone="info">Inline</s-badge>
          <s-badge>Gap small</s-badge>
        </s-stack>
        <s-stack direction="block" gap="small-200">
          <s-text>First</s-text>
          <s-text>Second</s-text>
        </s-stack>
      </Specimen>
      <Specimen tag="s-divider" title="Divider">
        <div className="flex w-48 flex-col gap-2">
          <s-text>Above</s-text>
          <s-divider />
          <s-text>Below</s-text>
        </div>
        <div className="flex h-8 items-center gap-3">
          <s-text>Left</s-text>
          <s-divider direction="block" />
          <s-text>Right</s-text>
        </div>
      </Specimen>
      <Specimen tag="s-grid" title="Grid">
        <div className="w-full">
          <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="base">
            {["One", "Two", "Three"].map((item) => (
              <s-grid-item key={item}>
                <s-box padding="base" background="subdued" borderRadius="base">
                  <s-text>{item}</s-text>
                </s-box>
              </s-grid-item>
            ))}
          </s-grid>
        </div>
      </Specimen>
      <Specimen tag="s-ordered-list" title="Ordered list">
        <s-ordered-list>
          <s-list-item>Confirm the payout.</s-list-item>
          <s-list-item>Fulfill order #1078.</s-list-item>
          <s-list-item>Fix the lamp delivery line.</s-list-item>
        </s-ordered-list>
      </Specimen>
      <Specimen tag="s-unordered-list" title="Unordered list">
        <s-unordered-list>
          <s-list-item>Headphones</s-list-item>
          <s-list-item>Case</s-list-item>
          <s-list-item>Cable</s-list-item>
        </s-unordered-list>
      </Specimen>
      <Specimen tag="s-section" title="Section">
        <div className="w-full">
          <s-section heading="Shipping" subheading="Where this order is going">
            <s-text>Ships this week.</s-text>
          </s-section>
        </div>
      </Specimen>
      <Specimen tag="s-table" title="Table">
        <div className="w-full">
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Product</s-table-header>
              <s-table-header>Inventory</s-table-header>
              <s-table-header>Status</s-table-header>
            </s-table-header-row>
            <s-table-body>
              <s-table-row>
                <s-table-cell>Studio ANC Headphones</s-table-cell>
                <s-table-cell>14</s-table-cell>
                <s-table-cell>Active</s-table-cell>
              </s-table-row>
              <s-table-row>
                <s-table-cell>Desk Lamp</s-table-cell>
                <s-table-cell>40</s-table-cell>
                <s-table-cell>Draft</s-table-cell>
              </s-table-row>
            </s-table-body>
          </s-table>
        </div>
        <div className="w-full">
          <s-table variant="list" loading>
            <s-table-header-row>
              <s-table-header listSlot="primary">Order</s-table-header>
            </s-table-header-row>
            <s-table-body>
              <s-table-row>
                <s-table-cell>#1078</s-table-cell>
              </s-table-row>
            </s-table-body>
          </s-table>
        </div>
      </Specimen>
      <Specimen tag="s-page" title="Page">
        <div className="w-full overflow-hidden rounded-lg border border-[#e3e3e3]">
          <s-page heading="Orders" inlineSize="small">
            <s-paragraph>14 orders today. #1078 and #1077 are paid and still unfulfilled.</s-paragraph>
            <s-button slot="primary-action" variant="primary">
              Create order
            </s-button>
          </s-page>
        </div>
      </Specimen>
      <Specimen tag="s-query-container" title="Query container">
        <s-query-container containerName="card">
          <s-box padding="base" background="subdued" borderRadius="base">
            <s-text>Named container “card”, for children that query it.</s-text>
          </s-box>
        </s-query-container>
      </Specimen>
      <Library tag="s-scroll-box" title="Scroll box">
        <s-scroll-box overflow="auto" padding="base" background="subdued" borderRadius="base" maxBlockSize="120px">
          <s-stack direction="block" gap="small">
            <s-text>First line inside the scroll box.</s-text>
            <s-text>Second line, still inside the same box.</s-text>
            <s-text>Third line, so the box has something to scroll.</s-text>
            <s-text>Fourth line.</s-text>
          </s-stack>
        </s-scroll-box>
      </Library>
    </Group>
  );
}

function Media() {
  return (
    <Group id="media" title="Media" note="Avatars, icons, images, and thumbnails.">
      <Specimen tag="s-avatar" title="Avatar">
        <Variant label="Initials">
          <s-avatar initials="MS" alt="My Store" />
        </Variant>
        <Variant label="Small">
          <s-avatar initials="MS" size="small" alt="My Store" />
        </Variant>
        <Variant label="Large">
          <s-avatar initials="MS" size="large" alt="My Store" />
        </Variant>
        <Variant label="Image">
          <s-avatar src="/assets/user.png" alt="Account" />
        </Variant>
      </Specimen>
      <Specimen tag="s-icon" title="Icon">
        {(["order", "product", "person", "alert-circle", "check-circle"] as const).map((type) => (
          <Variant key={type} label={type}>
            <s-icon type={type} />
          </Variant>
        ))}
        <Variant label="Small">
          <s-icon type="star" size="small" />
        </Variant>
      </Specimen>
      <Specimen tag="s-image" title="Image">
        <s-image src="/assets/headphones.webp" alt="Studio ANC Headphones" inlineSize="auto" />
      </Specimen>
      <Specimen tag="s-thumbnail" title="Thumbnail">
        <Variant label="Small">
          <s-thumbnail src="/assets/headphones.webp" alt="Headphones" size="small" />
        </Variant>
        <Variant label="Base">
          <s-thumbnail src="/assets/lamp.webp" alt="Desk lamp" />
        </Variant>
        <Variant label="Large">
          <s-thumbnail src="/assets/headphones.webp" alt="Headphones" size="large" />
        </Variant>
      </Specimen>
    </Group>
  );
}

function Overlays() {
  return (
    <Group id="overlays" title="Overlays" note="Open one to see it. They stay closed until you ask, so the page underneath remains usable.">
      <Specimen tag="s-modal" title="Modal">
        <s-button commandFor="ds-modal" command="--show" variant="secondary">
          Open modal
        </s-button>
        <s-modal id="ds-modal" heading="Archive this product?" size="small">
          <s-paragraph>The product stays in the list and comes off the storefront.</s-paragraph>
          <s-button slot="secondary-actions" commandFor="ds-modal" command="--hide">
            Cancel
          </s-button>
          <s-button slot="primary-action" variant="primary" commandFor="ds-modal" command="--hide">
            Archive
          </s-button>
        </s-modal>
      </Specimen>
      <Specimen tag="s-popover" title="Popover">
        <s-button commandFor="ds-popover" command="--toggle" variant="secondary">
          Delivery
        </s-button>
        <s-popover id="ds-popover">
          <s-box padding="base">
            <s-paragraph>The lamp page still says 5–7 days. The ads say this week.</s-paragraph>
          </s-box>
        </s-popover>
      </Specimen>
    </Group>
  );
}

function Typography() {
  return (
    <Group id="typography" title="Typography" note="Text styles, chips, and the tooltip that explains a control.">
      <Specimen tag="s-heading" title="Heading">
        <div className="flex w-full flex-col gap-2">
          <s-heading>Orders</s-heading>
          <s-heading>Products</s-heading>
        </div>
      </Specimen>
      <Specimen tag="s-paragraph" title="Paragraph">
        <s-paragraph>14 orders today. Two are paid and still unfulfilled.</s-paragraph>
        <s-paragraph color="subdued">Last refreshed at 9:56 AM.</s-paragraph>
        <s-paragraph tone="critical">The payout failed.</s-paragraph>
      </Specimen>
      <Specimen tag="s-text" title="Text">
        <s-text type="strong">Strong</s-text>
        <s-text color="subdued">Subdued</s-text>
        <s-text tone="success">Paid</s-text>
        <s-text tone="warning">Low stock</s-text>
        <s-text tone="critical">Overdue</s-text>
        <s-text fontVariantNumeric="tabular-nums">$2,184.60</s-text>
      </Specimen>
      <Specimen tag="s-number" title="Number">
        <s-number>$48,392.50</s-number>
        <s-number>2.7%</s-number>
      </Specimen>
      <Specimen tag="s-chip" title="Chip">
        <s-chip>Headphones</s-chip>
        <s-chip color="strong">Bestseller</s-chip>
        <s-chip color="subdued">Draft</s-chip>
        <s-chip removable>Lamp</s-chip>
      </Specimen>
      <Specimen tag="s-tooltip" title="Tooltip">
        <s-button interestFor="ds-tip" variant="tertiary" icon="info" accessibilityLabel="About this payout" />
        <s-tooltip id="ds-tip">Today’s payout is $2,184.60 and it’s already on the way.</s-tooltip>
      </Specimen>
    </Group>
  );
}

function Sidekick() {
  return (
    <Group id="sidekick" title="Sidekick" note="Pieces this prototype draws itself: orbs, choice cards, chat, the composer, status, and suggestion chips.">
      <div className="flex flex-col gap-4 rounded-2xl bg-[#0c0d0c] p-5 text-white">
        <OrbGallery />
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-[#c6c6c6]">Chat</p>
          <div className="flex justify-end">
            <p className="max-w-[360px] rounded-[20px] bg-[#2a2a2a] px-4 py-2.5 text-[15px] leading-[1.4]">What should I do first?</p>
          </div>
          <p className="max-w-[520px] text-[15px] leading-[1.45] text-white">
            End the sitewide 20% on the power bank, and reorder the headphones before Monday’s ads. Two orders are paid and still unfulfilled.
          </p>
          <p role="status" className="flex items-center gap-2 py-1 text-[13px] text-[#c6c6c6]">
            <span className="size-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
            Opening orders
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-[#c6c6c6]">Suggestions</p>
          <div className="flex max-w-sm flex-col">
            {["Show the best sellers", "What should I do first?"].map((text) => (
              <span key={text} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-[#c4c4c4]">
                <PIcon name="ArrowRight" size={16} />
                {text}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <ChipButton label="Show the best sellers" tone="primary" onClick={() => undefined} />
            <ChipButton label="What should I do first?" tone="secondary" onClick={() => undefined} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-[#c6c6c6]">Composer</p>
          <div className="flex max-w-[560px] flex-col rounded-[22px] bg-[#1a1b1a] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <p className="px-4 pb-1 pt-3 text-[15px] text-[#8e8f8b]">Ask your chief of staff…</p>
            <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
              <Orb id="chief" size={32} orbState="idle" />
              <span className="ml-auto grid size-8 place-items-center text-[#c6c6c6]">
                <PIcon name="Plus" size={20} />
              </span>
              <span className="grid size-8 place-items-center text-[#c6c6c6]">
                <PIcon name="Microphone" size={20} />
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-[#c6c6c6]">Choice cards and artifacts</p>
          <ChoicePreview />
        </div>
      </div>
    </Group>
  );
}

/** Demo levels so listening/speaking in the gallery match a live mic without opening one. */
const DEMO_LEVEL: Partial<Record<OrbState, number>> = {
  listening: 0.55,
  speaking: 0.72,
  thinking: 0.28,
};

/**
 * One style at a time across the four voice states. Browsers cap WebGL contexts, so a full
 * style×state matrix goes black — this keeps four live orbs, the same path as nav/composer.
 */
function OrbGallery() {
  const [style, setStyle] = useState<VoiceOrbId>("orbit");
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-medium text-[#c6c6c6]">Orbs</p>
      <p className="max-w-[640px] text-[12px] leading-[1.45] text-[#8e8f8b]">
        Same WebGL styles as the nav and composer, drawn at 144px into the slot. Pick a style, then compare idle with the
        live voice states. Idle stays calm and circular. Listening and speaking push a demo level into the surface —
        thinking wakes without audio. Hover and selected match rest.
      </p>
      <div className="flex flex-wrap gap-2">
        {voiceOrbIds.map((id) => {
          const on = id === style;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setStyle(id)}
              className={`rounded-lg px-2.5 py-1.5 text-[12px] transition-colors ${
                on ? "bg-white/[0.12] text-white" : "text-[#8e8f8b] hover:bg-white/[0.06] hover:text-[#c6c6c6]"
              }`}
              aria-pressed={on}
            >
              {voiceOrbLabel[id]}
            </button>
          );
        })}
      </div>
      <div className="grid max-w-[560px] grid-cols-4 gap-4 overflow-visible pt-1">
        {orbStates.map((state) => (
          <div key={state.id} className="flex flex-col items-center gap-2 overflow-visible">
            <span className="inline-grid size-16 place-items-center overflow-visible">
              <StyleOrb id={style} state={state.id} />
            </span>
            <span className="text-[11px] font-medium text-[#8e8f8b]">{state.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StyleOrb({ id, state }: { id: VoiceOrbId; state: OrbState }) {
  const tint = id === "twist" ? undefined : voiceOrbTint[id];
  const levelRef = useRef(DEMO_LEVEL[state] ?? -1);
  useEffect(() => {
    levelRef.current = DEMO_LEVEL[state] ?? -1;
  }, [state]);
  return (
    <Orb
      id={id}
      size={56}
      orbState={state}
      levelRef={levelRef}
      colorFrom={tint?.from}
      colorTo={tint?.to}
    />
  );
}

function ChoicePreview() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <ChoiceCards
      title="What else could I sell?"
      cards={sampleCards}
      selected={selected}
      mode="single"
      onPick={(id) => setSelected([id])}
      onBundle={() => undefined}
      onDifferent={() => setSelected([])}
    />
  );
}

function Admin() {
  return (
    <Group id="admin" title="Admin recreations" note="Look-alikes of the admin chrome in this prototype. They are not official Polaris components.">
      <Specimen title="Sidebar">
        <div className="w-[200px] rounded-xl bg-[#1a1a1a] p-2 text-white">
          <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-[#8a8a8a]">Look-alike</p>
          <span className="mb-1 flex h-8 items-center gap-2 rounded-[10px] bg-white/[0.08] px-2 text-[13px] text-[#b5b5b5]">
            <PIcon name="Search" size={16} />
            Search
          </span>
          {[
            ["Home", "Home"],
            ["Order", "Orders"],
            ["Product", "Products"],
          ].map(([icon, label]) => (
            <span key={label} className={`flex h-8 items-center gap-2 rounded-[10px] px-2 text-[13px] ${label === "Orders" ? "bg-[#303030] text-white" : "text-[#b5b5b5]"}`}>
              <PIcon name={icon as PolarisIconName} size={18} />
              {label}
            </span>
          ))}
        </div>
      </Specimen>
      <Specimen title="Top bar">
        <div className="w-full rounded-xl border border-[#e3e3e3] bg-white">
          <p className="px-4 pt-3 text-[11px] font-medium uppercase tracking-wide text-[#8a8a8a]">Look-alike</p>
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="grid size-8 place-items-center rounded-full bg-white text-[#303030] shadow-[0_0_0_1px_#e3e3e3]">
              <PIcon name="Menu" size={18} />
            </span>
            <span className="ml-auto text-[12px] text-[#616161]">Last refreshed: 9:56 AM</span>
          </div>
        </div>
      </Specimen>
      <Specimen title="Page header">
        <div className="w-full overflow-hidden rounded-xl border border-[#e3e3e3] bg-white">
          <p className="px-6 pt-3 text-[11px] font-medium uppercase tracking-wide text-[#8a8a8a]">Look-alike</p>
          <TopBar title="Orders" actions={[{ label: "Create order", tone: "primary" }]} />
        </div>
      </Specimen>
      <Specimen title="Card">
        <div className="w-full max-w-sm">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#8a8a8a]">Look-alike</p>
          <Card>
            <div className="flex flex-col gap-2">
              <CardTitle dotted aside={<span className="text-[12px] text-[#616161]">Today</span>}>
                Total sales
              </CardTitle>
              <p className="text-[18px] font-semibold text-[#171817]">$2,078.51</p>
              <p className="text-[12px] text-[#616161]">14 orders · 2.7% conversion</p>
            </div>
          </Card>
        </div>
      </Specimen>
    </Group>
  );
}

function Library({ tag, title, children }: { tag: string; title: string; children: ReactNode }) {
  const defined = typeof window !== "undefined" && Boolean(customElements.get(tag));
  return (
    <Specimen title={title}>
      {defined ? (
        children
      ) : (
        <p className="text-[13px] text-[#616161]">
          {tag} is in the Polaris type package, and this page’s CDN build does not define it.
        </p>
      )}
    </Specimen>
  );
}
