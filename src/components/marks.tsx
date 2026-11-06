"use client";

import { type CSSProperties, type ReactNode, type RefObject } from "react";
import { useOrbAudio } from "@/components/orb-audio";
import { canonicalOrb, isVoiceOrb, type OrbId, type VoiceOrbId } from "@/lib/prototype";
import { GrokBot, MuseBall, SlackOrb } from "@/components/team-marks";
import { AuraField } from "@/voiceorbs/orbs/aura-field";
import { MercuryOrb } from "@/voiceorbs/orbs/mercury-orb";
import { NebulaOrb } from "@/voiceorbs/orbs/nebula-orb";
import { PlasmaOrb } from "@/voiceorbs/orbs/plasma-orb";
import { TwistSphere } from "@/voiceorbs/orbs/twist-sphere";
import type { OrbState } from "@/voiceorbs/lib/orb-state";

export function ShopifyMark({ className = "h-6 w-[22px]", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const bag = tone === "dark" ? "#101010" : "white";
  const shade = tone === "dark" ? "#5E8E3E" : "#C3C3C3";
  return (
    <svg className={className} viewBox="0 0 22 25" aria-hidden="true">
      <path
        fill={bag}
        d="M15.006 2.914s-.281.08-.743.221c-.08-.261-.201-.562-.362-.884C13.379 1.247 12.595.705 11.671.705c-.06 0-.12 0-.201.02-.02-.04-.06-.06-.08-.1-.402-.442-.924-.643-1.547-.623C8.638.042 7.433.905 6.468 2.452 5.785 3.537 5.263 4.903 5.123 5.968 3.736 6.39 2.772 6.691 2.752 6.711 2.049 6.932 2.029 6.952 1.949 7.615 1.828 8.118 0 22.281 0 22.281L15.187 24.913V2.874c-.08.02-.141.02-.181.04Zm-3.515 1.085c-.804.241-1.688.522-2.551.783.241-.944.723-1.888 1.286-2.511.221-.221.522-.482.863-.643.342.723.422 1.708.402 2.371ZM9.863.805c.281 0 .522.06.723.181-.321.16-.643.422-.944.723-.763.824-1.346 2.11-1.587 3.335-.723.221-1.446.442-2.109.643.422-1.909 2.049-4.822 3.917-4.882ZM7.513 11.854c.08 1.286 3.475 1.567 3.676 4.601.141 2.39-1.265 4.018-3.294 4.138-2.451.161-3.797-1.286-3.797-1.286l.522-2.21s1.346 1.025 2.431.944c.703-.04.964-.623.944-1.025-.1-1.687-2.873-1.587-3.053-4.359-.161-2.31 1.366-4.661 4.741-4.882 1.306-.08 1.969.241 1.969.241l-.763 2.893s-.864-.402-1.888-.321c-1.487.1-1.507 1.044-1.487 1.265Zm4.781-8.096c0-.603-.08-1.467-.362-2.19.924.181 1.366 1.205 1.567 1.828-.362.1-.763.221-1.205.362Z"
      />
      <path
        fill={shade}
        d="M15.691 24.831 22 23.264s-2.712-18.342-2.732-18.462c-.02-.121-.12-.201-.221-.201-.1 0-1.868-.04-1.868-.04s-1.085-1.045-1.487-1.447v21.717Z"
      />
    </svg>
  );
}

export function Orb({
  id,
  size = 32,
  agentId,
  colorFrom,
  colorTo,
}: {
  id: OrbId;
  size?: number;
  agentId?: string;
  colorFrom?: string;
  colorTo?: string;
}) {
  const resolved = canonicalOrb(id);
  const audio = useOrbAudio(agentId);
  if (isVoiceOrb(resolved)) {
    return <VoiceOrb id={resolved} size={size} state={audio.state} levelRef={audio.levelRef} colorFrom={colorFrom} colorTo={colorTo} />;
  }
  switch (resolved) {
    case "grok":
      return <GrokBot size={size} state={audio.state} />;
    case "muse":
      return <MuseBall size={size} state={audio.state} />;
    case "slack":
      return <SlackOrb size={size} state={audio.state} />;
    default:
      return <VoiceOrb id="plasma" size={size} state={audio.state} levelRef={audio.levelRef} colorFrom={colorFrom} colorTo={colorTo} />;
  }
}

/** VoiceOrbs are authored around a 144px sphere. Draw them there, then scale into the avatar slot. */
const ORB_RENDER = 144;

function VoiceOrb({
  id,
  size,
  state,
  levelRef,
  colorFrom,
  colorTo,
}: {
  id: VoiceOrbId;
  size: number;
  state?: OrbState;
  levelRef?: RefObject<number>;
  colorFrom?: string;
  colorTo?: string;
}) {
  const style = { "--s": `${size}px`, "--render": `${ORB_RENDER}px`, "--fit": size / ORB_RENDER } as CSSProperties;
  const props = {
    size: ORB_RENDER,
    state,
    levelRef,
    label: "",
    className: "voice-orb",
    ...(colorFrom && colorTo ? { colorFrom, colorTo } : {}),
  };
  let node: ReactNode;
  switch (id) {
    case "nebula":
      node = <NebulaOrb {...props} />;
      break;
    case "mercury":
      node = <MercuryOrb {...props} />;
      break;
    case "twist":
      node = <TwistSphere {...props} />;
      break;
    case "aura":
      node = <AuraField {...props} />;
      break;
    default:
      node = <PlasmaOrb {...props} />;
  }
  return (
    <span className="orb voice-slot" style={style} aria-hidden>
      <span className="voice-orb-fit">{node}</span>
    </span>
  );
}

export function IconButton({
  label,
  children,
  onClick,
  active,
  controls,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  controls?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={controls ? undefined : active}
      aria-controls={controls}
      aria-expanded={controls ? Boolean(active) : undefined}
      onClick={onClick}
      className="press btn-dark grid size-8 place-items-center rounded-full"
    >
      {children}
    </button>
  );
}

export function ChipButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "secondary" | "primary";
  onClick: () => void;
}) {
  return (
    <s-button variant={tone === "primary" ? "primary" : "secondary"} onClick={onClick}>
      {label}
    </s-button>
  );
}
