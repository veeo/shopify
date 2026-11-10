"use client";

import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { speechEnvelope, type OrbState } from "@/voiceorbs/lib/orb-state";

/**
 * Grok eye placement, capsule shape, and liveliness are adapted from Bloub
 * (MIT) © 2026 Jérémy Perret — https://github.com/jeremy-prt/bloub
 * Slackbot is the supplied mark: four corner colors on a cream circle, with eyes.
 */

const RENDER = 144;
const CENTER = RENDER / 2;

type LevelRef = RefObject<number> | undefined;

function slotStyle(size: number): CSSProperties {
  return { "--s": `${size}px`, "--render": `${RENDER}px`, "--fit": size / RENDER } as CSSProperties;
}

function useMascotLoop(host: RefObject<HTMLElement | null>, draw: (time: number) => void) {
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = false;
    const step = (now: number) => {
      drawRef.current(now / 1000);
      if (!reduced && running) raf = requestAnimationFrame(step);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const sync = () => {
      const visible = !document.hidden && intersecting;
      if (visible) start();
      else stop();
    };
    let intersecting = true;
    const observer = new IntersectionObserver(
      (entries) => {
        intersecting = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { threshold: 0.01 },
    );
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    start();
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [host]);
}

const TAU = Math.PI * 2;
const clamp = (value: number, lo = 0, hi = 1) => (value < lo ? lo : value > hi ? hi : value);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - (1 - t) ** 3;

function loopNoise(t: number, period: number, seed = 0) {
  const p = (t / period) * TAU;
  return 0.55 * Math.sin(p + seed) + 0.3 * Math.sin(2 * p + seed * 1.7 + 1.1) + 0.15 * Math.sin(3 * p + seed * 2.3 + 2.4);
}

function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number) => Math.round(value * 100) / 100;

type Gaze = { yaw: number; pitch: number; roll: number };
type EyeCfg = { w: number; h: number; tilt: number; open: number };
type Expression = { gaze: Gaze; split: number; eyes: [EyeCfg, EyeCfg] };

const EYE_SPLIT = 15.46;
const EYE_W = 0.186;
const EYE_H = 0.412;
/** A little larger than the Bloub rest size, still the same capsule shape. */
const EYE_SCALE = 1.22;
const REST_GAZE: Gaze = { yaw: 28.49, pitch: 28.62, roll: -13 };

const eye = (w: number, h: number, tilt = 0, open = 1): EyeCfg => ({ w, h, tilt, open });
const pair = (w: number, h: number, tilt = 0, open = 1): [EyeCfg, EyeCfg] => [eye(w, h, tilt, open), eye(w, h, -tilt, open)];

const GROK_EXPRESSIONS: Record<string, Expression> = {
  neutre: { gaze: REST_GAZE, split: EYE_SPLIT, eyes: pair(EYE_W, EYE_H) },
  attentif: { gaze: { yaw: 4, pitch: 5, roll: -4 }, split: 16, eyes: pair(0.21, 0.44) },
  curieux: {
    gaze: { yaw: 16, pitch: -9, roll: -15 },
    split: 16.5,
    eyes: [eye(0.24, 0.46, -8), eye(0.2, 0.38, -8)],
  },
  timide: { gaze: { yaw: -19, pitch: -14, roll: -7 }, split: 14, eyes: pair(0.17, 0.3) },
  excite: { gaze: { yaw: 6, pitch: -14, roll: 0 }, split: 19.5, eyes: pair(0.4, 0.56, -10) },
};

const GROK_CYCLE = [
  ["neutre", 5.4],
  ["attentif", 2.1],
  ["neutre", 4.6],
  ["curieux", 2.3],
  ["neutre", 5.1],
  ["timide", 1.9],
] as const;

function blendExpression(a: Expression, b: Expression, t: number): Expression {
  const mixEye = (left: EyeCfg, right: EyeCfg): EyeCfg => ({
    w: lerp(left.w, right.w, t),
    h: lerp(left.h, right.h, t),
    tilt: lerp(left.tilt, right.tilt, t),
    open: lerp(left.open, right.open, t),
  });
  return {
    gaze: {
      yaw: lerp(a.gaze.yaw, b.gaze.yaw, t),
      pitch: lerp(a.gaze.pitch, b.gaze.pitch, t),
      roll: lerp(a.gaze.roll, b.gaze.roll, t),
    },
    split: lerp(a.split, b.split, t),
    eyes: [mixEye(a.eyes[0], b.eyes[0]), mixEye(a.eyes[1], b.eyes[1])],
  };
}

function grokExpression(t: number) {
  const total = GROK_CYCLE.reduce((sum, [, hold]) => sum + hold, 0);
  let at = t % total;
  let index = 0;
  while (at > GROK_CYCLE[index][1]) {
    at -= GROK_CYCLE[index][1];
    index += 1;
  }
  const current = GROK_EXPRESSIONS[GROK_CYCLE[index][0]];
  const next = GROK_EXPRESSIONS[GROK_CYCLE[(index + 1) % GROK_CYCLE.length][0]];
  const morph = 0.42;
  const start = GROK_CYCLE[index][1] - morph;
  const amount = at > start ? ease((at - start) / morph) : 0;
  return blendExpression(current, next, amount);
}

const BLINK_RNG = createRng(0x5eed);
const BLINKS: number[] = (() => {
  const out: number[] = [];
  let t = 1.4;
  while (t < 900) {
    out.push(t);
    t += 1.9 + BLINK_RNG() * 2.7;
    if (BLINK_RNG() < 0.18) {
      out.push(t);
      t += 0.24;
    }
  }
  return out;
})();

function blinkLid(t: number, blinks: number[] = BLINKS, duration = 0.18, close = 0.45) {
  for (let i = 0; i < blinks.length; i += 1) {
    const start = blinks[i];
    if (t < start) break;
    const k = (t - start) / duration;
    if (k >= 0 && k <= 1) return k < close ? 1 - k / close : (k - close) / (1 - close);
  }
  return 1;
}

const SLACK_BLINKS: number[] = (() => {
  const random = createRng(0x51ac);
  const out: number[] = [];
  let t = 1.8;
  while (t < 900) {
    out.push(t);
    t += 2.4 + random() * 3.2;
    if (random() < 0.24) {
      out.push(t);
      t += 0.26;
    }
  }
  return out;
})();

function blinkScale(lid: number) {
  return 0.06 + 0.94 * clamp(lid);
}

type Vec3 = [number, number, number];

function spin(u: Vec3, v: Vec3, angle: number): [Vec3, Vec3] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    [u[0] * c + v[0] * s, u[1] * c + v[1] * s, u[2] * c + v[2] * s],
    [v[0] * c - u[0] * s, v[1] * c - u[1] * s, v[2] * c - u[2] * s],
  ];
}

function eyePoses(gaze: Gaze, scale: number, split: number) {
  const deg = (value: number) => (value * Math.PI) / 180;
  let forward: Vec3 = [0, 0, 1];
  let right: Vec3 = [1, 0, 0];
  let down: Vec3 = [0, 1, 0];
  [forward, right] = spin(forward, right, deg(gaze.yaw));
  [down, forward] = spin(down, forward, deg(gaze.pitch));
  [right, down] = spin(right, down, deg(gaze.roll));
  return [-1, 1].map((side) => {
    const [eyeForward, eyeRight] = spin(forward, right, deg(split * side));
    return {
      x: eyeForward[0] * scale,
      y: eyeForward[1] * scale,
      a: eyeRight[0],
      b: eyeRight[1],
      c: down[0],
      d: down[1],
      depth: eyeForward[2],
    };
  });
}

function capsulePath(w: number, h: number) {
  const hw = Math.max(w, 0.01) / 2;
  const hh = Math.max(h, 0.01) / 2;
  const r = Math.min(hw, hh);
  return (
    `M${round(-hw)} ${round(-hh + r)}` +
    `A${round(r)} ${round(r)} 0 0 1 ${round(-hw + r)} ${round(-hh)}` +
    `L${round(hw - r)} ${round(-hh)}` +
    `A${round(r)} ${round(r)} 0 0 1 ${round(hw)} ${round(-hh + r)}` +
    `L${round(hw)} ${round(hh - r)}` +
    `A${round(r)} ${round(r)} 0 0 1 ${round(hw - r)} ${round(hh)}` +
    `L${round(-hw + r)} ${round(hh)}` +
    `A${round(r)} ${round(r)} 0 0 1 ${round(-hw)} ${round(hh - r)}Z`
  );
}

const GROK_R = 71.5;

function mascotDrive(state: OrbState | undefined, level: number, time: number) {
  if (state === "listening" || state === "speaking") return level >= 0 ? clamp(level) : speechEnvelope(time);
  if (state === "thinking" || state === "connecting") return 0.2 + 0.12 * Math.sin(time * 2.4);
  return 0;
}

function grokFrame(t: number, state: OrbState | undefined, level: number, reduced: boolean) {
  const live = reduced ? 0 : mascotDrive(state, level, t);
  const voiced = live > 0.02 && (state === "listening" || state === "speaking" || state === "thinking");
  let expression = grokExpression(reduced ? 0 : t);
  if (!reduced && (state === "thinking" || state === "connecting")) expression = blendExpression(expression, GROK_EXPRESSIONS.attentif, 0.45);
  if (voiced) {
    const target = state === "speaking" ? GROK_EXPRESSIONS.excite : GROK_EXPRESSIONS.attentif;
    expression = blendExpression(expression, target, state === "speaking" ? 0.35 + live * 0.45 : 0.72);
  }
  const wander = voiced ? 0.35 : 1;
  const life = {
    dYaw: (loopNoise(t, 11.3, 0.4) * 5.5 + loopNoise(t, 3.7, 2.1) * 1.6) * (reduced ? 0 : wander),
    dPitch: (loopNoise(t, 9.1, 1.3) * 4.2 + loopNoise(t, 4.3, 0.7) * 1.3) * (reduced ? 0 : wander),
    dRoll: loopNoise(t, 13.7, 3.2) * 2.2 * (reduced ? 0 : wander),
    lid: reduced ? 1 : blinkLid(t),
    driftX: reduced ? 0 : loopNoise(t, 7.9, 1.9) * 0.006,
    driftY: reduced ? 0 : loopNoise(t, 5.3, 0.3) * 0.007,
    breath: reduced ? 1 : 1 + Math.sin((t / 3.4) * TAU) * 0.005,
  };
  const gaze = {
    yaw: expression.gaze.yaw + life.dYaw,
    pitch: expression.gaze.pitch + life.dPitch + (voiced ? live * 7 : 0),
    roll: expression.gaze.roll + life.dRoll,
  };
  const poses = eyePoses(gaze, GROK_R, expression.split);
  const eyes = poses.map((pose, index) => {
    const cfg = expression.eyes[index];
    const phi = ((cfg.tilt ?? 0) * Math.PI) / 180;
    const cp = Math.cos(phi);
    const sp = Math.sin(phi);
    const ax = pose.a * cp + pose.c * sp;
    const ay = pose.b * cp + pose.d * sp;
    const cx = -pose.a * sp + pose.c * cp;
    const cy = -pose.b * sp + pose.d * cp;
    const k = blinkScale(Math.min(life.lid, cfg.open));
    return {
      d: capsulePath(cfg.w * GROK_R * EYE_SCALE, cfg.h * GROK_R * EYE_SCALE),
      transform: `matrix(${round(ax)} ${round(ay * k)} ${round(cx)} ${round(cy * k)} ${round(CENTER + pose.x)} ${round(CENTER + pose.y)})`,
      opacity: clamp(pose.depth / 0.12),
    };
  });
  const rig = `translate(${round(life.driftX * GROK_R)} ${round(life.driftY * GROK_R)})`;
  return { eyes, rig };
}

export function GrokBot({ size, state, levelRef }: { size: number; state?: OrbState; levelRef?: LevelRef }) {
  const id = useId().replace(/:/g, "");
  const host = useRef<HTMLSpanElement>(null);
  const rig = useRef<SVGGElement>(null);
  const eyes = useRef<Array<SVGPathElement | null>>([]);
  const first = grokFrame(0, undefined, -1, true);

  useMascotLoop(host, (time) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = grokFrame(time, state, levelRef?.current ?? -1, reduced);
    if (rig.current) rig.current.setAttribute("transform", frame.rig);
    frame.eyes.forEach((eyeFrame, index) => {
      const node = eyes.current[index];
      if (!node) return;
      node.setAttribute("d", eyeFrame.d);
      node.setAttribute("transform", eyeFrame.transform);
      node.setAttribute("opacity", eyeFrame.opacity.toFixed(3));
    });
  });

  return (
    <span ref={host} className="orb voice-slot" data-state={state ?? "idle"} style={slotStyle(size)} aria-hidden>
      <span className="voice-orb-fit">
        <svg viewBox={`0 0 ${RENDER} ${RENDER}`} width={RENDER} height={RENDER}>
          <defs>
            <radialGradient id={`${id}-body`} cx="34%" cy="28%" r="78%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="48%" stopColor="#f3f3f5" />
              <stop offset="100%" stopColor="#c8c8ce" />
            </radialGradient>
          </defs>
          <g ref={rig} transform={first.rig}>
            <circle cx={CENTER} cy={CENTER} r={GROK_R} fill={`url(#${id}-body)`} />
            {first.eyes.map((eyeFrame, index) => (
              <path
                key={index}
                ref={(node) => {
                  eyes.current[index] = node;
                }}
                d={eyeFrame.d}
                transform={eyeFrame.transform}
                fill="#1a1a1e"
                opacity={eyeFrame.opacity}
              />
            ))}
          </g>
        </svg>
      </span>
    </span>
  );
}

function slackEyeTransform(cx: number, lid: number, widen = 1) {
  const squash = (0.14 + 0.86 * lid).toFixed(3);
  return `translate(${cx} 14) scale(${widen.toFixed(3)} ${squash}) translate(${-cx} -14)`;
}

export function SlackOrb({ size, state, levelRef }: { size: number; state?: OrbState; levelRef?: LevelRef }) {
  const id = useId().replace(/:/g, "");
  const host = useRef<HTMLSpanElement>(null);
  const leftEye = useRef<SVGGElement>(null);
  const rightEye = useRef<SVGGElement>(null);

  useMascotLoop(host, (time) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const drive = reduced ? 0 : mascotDrive(state, levelRef?.current ?? -1, time);
    const lid = reduced ? 1 : blinkLid(time, SLACK_BLINKS, 0.16, 0.36);
    const widen = 1 + drive * 0.08;
    leftEye.current?.setAttribute("transform", slackEyeTransform(8, lid, widen));
    rightEye.current?.setAttribute("transform", slackEyeTransform(20, lid, widen));
  });

  return (
    <span ref={host} className="orb" data-state={state ?? "idle"} style={slotStyle(size)} aria-hidden>
      <svg viewBox="0 0 28 28" width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <filter id={`${id}-shade`} x="0" y="0" width="28" height="28" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0" />
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
          </filter>
          <clipPath id={`${id}-clip`}>
            <rect width="28" height="28" rx="14" />
          </clipPath>
        </defs>
        <g filter={`url(#${id}-shade)`}>
          <g clipPath={`url(#${id}-clip)`}>
            <g>
              <rect width="28" height="28" rx="14" fill="#FAFAF8" />
              <circle cy="28" r="13" fill="#E2076A" />
              <circle cx="28" cy="28" r="13" fill="#FCC005" />
              <circle r="13" fill="#02B3FF" />
              <circle cx="28" r="13" fill="#43B65A" />
              <g ref={leftEye}>
                <path d="M11.5 14C11.5 15.933 9.933 17.5 8 17.5C6.067 17.5 4.5 15.933 4.5 14C4.5 12.067 6.067 10.5 8 10.5C9.933 10.5 11.5 12.067 11.5 14Z" fill="black" stroke="white" />
                <circle cx="9" cy="13" r="1" fill="white" />
              </g>
              <g ref={rightEye}>
                <path d="M23.5 14C23.5 15.933 21.933 17.5 20 17.5C18.067 17.5 16.5 15.933 16.5 14C16.5 12.067 18.067 10.5 20 10.5C21.933 10.5 23.5 12.067 23.5 14Z" fill="black" stroke="white" />
                <circle cx="21" cy="13" r="1" fill="white" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}


function MarkFrame({ size, children }: { size: number; children: ReactNode }) {
  return (
    <span className="orb" style={slotStyle(size)} aria-hidden>
      <svg viewBox="0 0 28 28" width="100%" height="100%" style={{ display: "block" }}>
        {children}
      </svg>
    </span>
  );
}

function markShade(id: string, alpha: string) {
  return (
    <filter id={id} x="0" y="0" width="28" height="28" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
      <feFlood floodOpacity="0" result="BackgroundImageFix" />
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
      <feOffset />
      <feGaussianBlur stdDeviation="2" />
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
      <feColorMatrix type="matrix" values={`0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 ${alpha} 0`} />
      <feBlend mode="normal" in2="shape" />
    </filter>
  );
}

export function OnlineStoreMark({ size }: { size: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <MarkFrame size={size}>
      <defs>
        {markShade(`${id}-shade`, "0.4")}
        <clipPath id={`${id}-clip`}>
          <rect width="16" height="16" fill="white" transform="translate(6 6)" />
        </clipPath>
      </defs>
      <g filter={`url(#${id}-shade)`}>
        <rect width="28" height="28" rx="14" fill="#00C900" />
        <g clipPath={`url(#${id}-clip)`}>
          <path
            d="M20.6674 14C20.6674 17.6822 17.6824 20.6672 14.0002 20.6672M20.6674 14C20.6674 10.3178 17.6824 7.33276 14.0002 7.33276M20.6674 14H16.6671M14.0002 20.6672C10.318 20.6672 7.33301 17.6822 7.33301 14M14.0002 20.6672C12.2882 18.8696 11.3333 16.4823 11.3333 14M14.0002 20.6672C15.7122 18.8696 16.6671 16.4823 16.6671 14M14.0002 7.33276C12.2882 9.13034 11.3333 11.5176 11.3333 14M14.0002 7.33276C15.7122 9.13034 16.6671 11.5176 16.6671 14M14.0002 7.33276C10.318 7.33276 7.33301 10.3178 7.33301 14M16.6671 14H11.3333M11.3333 14H7.33301"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            stroke="black"
          />
        </g>
      </g>
    </MarkFrame>
  );
}

export function ShopAppMark({ size }: { size: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <MarkFrame size={size}>
      <defs>{markShade(`${id}-shade`, "0.2")}</defs>
      <g filter={`url(#${id}-shade)`}>
        <rect width="28" height="28" rx="14" fill="#5433EB" />
        <path
          d="M12.7826 7.87476C11.3917 7.87476 10.0889 8.30132 9.15351 8.91663C9.08984 8.9583 9.06782 9.04411 9.10696 9.11029L10.2359 11.0396C10.2775 11.1082 10.3656 11.1327 10.4342 11.0911C11.1444 10.6621 11.9574 10.439 12.7875 10.4439C15.0232 10.4439 16.6664 12.0226 16.6664 14.1088C16.6664 15.8861 15.3514 17.2025 13.6837 17.2025C12.3247 17.2025 11.3819 16.4107 11.3819 15.2929C11.3819 14.653 11.6537 14.1284 12.3614 13.7582C12.4349 13.719 12.4618 13.6283 12.4178 13.5572L11.3525 11.753C11.3183 11.6941 11.2448 11.6672 11.1786 11.6917C9.751 12.2212 8.74951 13.4959 8.74951 15.2071C8.74951 17.7958 10.8088 19.7276 13.6813 19.7276C17.0361 19.7276 19.4481 17.4012 19.4481 14.0647C19.4481 10.488 16.6419 7.87476 12.7826 7.87476Z"
          fill="white"
        />
      </g>
    </MarkFrame>
  );
}

export function ClaudeMark({ size }: { size: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <MarkFrame size={size}>
      <defs>{markShade(`${id}-shade`, "0.25")}</defs>
      <g filter={`url(#${id}-shade)`}>
        <rect width="28" height="28" rx="14" fill="#D97757" />
        <path d="M14 8.2v11.6M8.2 14h11.6M9.9 9.9l8.2 8.2M18.1 9.9l-8.2 8.2" stroke="#FAF6F1" strokeWidth="1.7" strokeLinecap="round" />
      </g>
    </MarkFrame>
  );
}

export function GeminiMark({ size }: { size: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <MarkFrame size={size}>
      <defs>
        {markShade(`${id}-shade`, "0.2")}
        <linearGradient id={`${id}-spark`} x1="8" y1="6" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4B90FF" />
          <stop offset="0.55" stopColor="#A254FF" />
          <stop offset="1" stopColor="#FF4E6A" />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-shade)`}>
        <rect width="28" height="28" rx="14" fill="white" />
        <path d="M14 6.4c.35 2.7.85 4.05 2.15 5.15 1.3 1.1 3.15 1.55 5.45 1.85-2.3.3-4.15.75-5.45 1.85-1.3 1.1-1.8 2.45-2.15 5.15-.35-2.7-.85-4.05-2.15-5.15-1.3-1.1-3.15-1.55-5.45-1.85 2.3-.3 4.15-.75 5.45-1.85 1.3-1.1 1.8-2.45 2.15-5.15Z" fill={`url(#${id}-spark)`} />
      </g>
    </MarkFrame>
  );
}

export function PosMark({ size }: { size: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <MarkFrame size={size}>
      <defs>{markShade(`${id}-shade`, "0.2")}</defs>
      <g filter={`url(#${id}-shade)`}>
        <rect width="28" height="28" rx="14" fill="white" />
        <path fill="#141413" transform="translate(6 6)" d={posGlyph} />
      </g>
    </MarkFrame>
  );
}

/** Shopify’s Point of Sale mark: the bag, standing out front of the store. */
const posGlyph =
  "M9.2627 0.00878906C9.83839 0.0612779 10.1014 0.503029 10.4102 0.917969L11.0566 1.79004C11.7904 2.79507 11.7319 2.56483 11.6758 3.86523C11.6372 4.76008 11.5859 5.69289 11.5381 6.59082L11.3145 11.3359L11.1768 14.1455C11.1455 14.7388 11.312 16.1604 10.3447 15.9863C9.21521 15.7833 8.06549 15.5887 6.94043 15.3594C6.49873 15.2655 6.05551 15.1771 5.61133 15.0957C5.3711 15.0495 5.13999 14.9968 4.89648 14.9658C4.58347 14.924 4.33159 14.8594 4.0293 14.7998L2.51953 14.5049C2.1869 14.4393 1.83929 14.4206 1.50781 14.3438C1.37437 14.3144 1.2451 14.2719 1.15234 14.1641C0.872513 13.8385 1.05442 13.3369 1.09961 12.9639C1.13725 12.6531 1.17791 12.3522 1.21777 12.0459L1.76562 7.8291C1.88353 6.89048 1.97698 5.94014 2.12305 5.00781C2.16195 4.75924 2.18135 4.30859 2.27344 4.08301C2.46566 3.61217 2.80686 3.18319 3.0957 2.77344C3.41066 2.3249 3.69085 1.84311 4.02441 1.40918C4.29992 1.05108 4.84782 0.968859 5.25977 0.869141L6.6748 0.530273C7.40613 0.35443 8.15792 0.105052 8.90039 0.0126953C8.9898-0.00581486 9.16773 0.000147375 9.2627 0.00878906ZM12.9727 2.54492C13.1973 2.74293 13.3243 4.43867 13.3779 4.82715L14.0645 9.81934L14.2891 11.3789C14.3039 11.4867 14.3158 11.5942 14.3291 11.7021C14.4118 12.3734 14.5323 13.034 14.5947 13.709C14.6226 14.0108 14.7393 14.3205 14.4727 14.5625C14.3476 14.6758 14.2352 14.6707 14.0791 14.665C13.9573 14.6582 13.8356 14.6497 13.7139 14.6426C13.29 14.6173 12.849 14.5162 12.4258 14.5166C12.4607 14.0525 12.4625 13.6255 12.4873 13.1699L12.6855 9.08008L12.9463 4.20605C12.9664 3.81996 12.9863 3.42872 12.9951 3.04199C12.9976 2.93046 12.9496 2.61537 12.9727 2.54492ZM8.50098 4.43164C7.56521 4.29735 6.36648 4.44073 5.5752 4.9834C4.7392 5.557 4.37035 6.30574 4.21191 7.29102C4.19798 7.56378 4.18252 7.85573 4.25488 8.12207C4.36228 8.64975 4.57931 8.98001 4.97168 9.35742C5.33274 9.70088 5.9865 10.0678 6.10449 10.5859C6.20597 11.0318 6.06691 11.4318 5.56738 11.5049C5.21671 11.5561 4.80716 11.3923 4.49609 11.2412C4.36808 11.179 4.22844 11.069 4.1123 10.9902C3.94391 10.9888 3.88073 10.9907 3.73535 11.0791C3.57782 11.3639 3.39147 11.8627 3.36133 12.1943C3.33986 12.4316 3.88124 12.7369 4.05664 12.8545C4.66221 13.2606 5.37655 13.3521 6.09082 13.3115C7.64811 13.234 8.50585 11.8484 8.40039 10.3818C8.30343 9.03496 7.39339 8.54241 6.43945 7.78906C6.25403 7.61564 6.05328 7.43716 6.03906 7.16699C5.98426 6.32387 7.06871 6.2173 7.66797 6.36621C8.11425 6.49751 8.51449 6.6395 8.65723 6.03516C8.75269 5.63073 9.08755 5.06836 9.0459 4.65234C8.8866 4.50755 8.71552 4.46245 8.50098 4.43164ZM6.68652 1.62891C6.13524 1.67556 5.72218 2.25713 5.76074 2.79004C5.76887 2.90221 5.81963 3.03964 5.9043 3.1123C5.94868 3.17566 5.99833 3.22644 6.06934 3.26074C6.66053 3.43738 7.13331 2.95189 7.23438 2.4082C7.26243 2.25693 7.23864 2.11486 7.21875 1.96484C7.14562 1.8493 7.00079 1.76059 6.90332 1.64258C6.8385 1.63558 6.75038 1.62359 6.68652 1.62891Z";

export function AgenticMark({ size }: { size: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <MarkFrame size={size}>
      <defs>{markShade(`${id}-shade`, "0.2")}</defs>
      <g filter={`url(#${id}-shade)`}>
        <rect width="28" height="28" rx="14" fill="white" />
        <path fill="#141413" fillRule="evenodd" clipRule="evenodd" transform="translate(6 6)" d={agenticGlyph} />
      </g>
    </MarkFrame>
  );
}

const agenticGlyph =
  "M3 1.25C4.41201 1.25 5.57289 2.31449 5.72949 3.68457C5.73923 3.68369 5.74901 3.68264 5.75879 3.68457L10.5742 4.64746C10.5836 4.64933 10.5913 4.65485 10.5996 4.65918C11.0701 3.81866 11.9683 3.25 13 3.25C14.5188 3.25 15.75 4.48122 15.75 6C15.75 7.51878 14.5188 8.75 13 8.75C12.5479 8.75 12.1224 8.63865 11.7461 8.44531C11.7415 8.45411 11.7377 8.46346 11.7305 8.4707L8.4707 11.7305C8.46345 11.7377 8.45412 11.7415 8.44531 11.7461C8.63865 12.1224 8.75 12.5479 8.75 13C8.75 14.5188 7.51878 15.75 6 15.75C4.48122 15.75 3.25 14.5188 3.25 13C3.25 12.0902 3.6933 11.2857 4.37402 10.7852C4.36764 10.7766 4.36087 10.7681 4.35742 10.7578L3.0293 6.77441C3.02649 6.76583 3.02679 6.75689 3.02637 6.74805C3.01758 6.74813 3.0088 6.75 3 6.75C1.48122 6.75 0.25 5.51878 0.25 4C0.25 2.48122 1.48122 1.25 3 1.25ZM6 11.75C5.30964 11.75 4.75 12.3096 4.75 13C4.75 13.6904 5.30964 14.25 6 14.25C6.69036 14.25 7.25 13.6904 7.25 13C7.25 12.3096 6.69036 11.75 6 11.75ZM5.40039 5.33789C5.20783 5.68263 4.94323 5.97996 4.62695 6.21289C4.63336 6.22149 4.64008 6.22989 4.64355 6.24023L5.97168 10.2246C5.97451 10.2332 5.9732 10.2422 5.97363 10.251C5.98241 10.2509 5.9912 10.25 6 10.25C6.45167 10.25 6.87695 10.3608 7.25293 10.5537C7.25753 10.545 7.26241 10.5364 7.26953 10.5293L10.5293 7.26855L10.5537 7.25195C10.4061 6.96416 10.3065 6.64801 10.2686 6.3125C10.2595 6.31314 10.2503 6.3153 10.2412 6.31348L5.42578 5.35059C5.41626 5.34865 5.40879 5.34236 5.40039 5.33789ZM13 4.75C12.3096 4.75 11.75 5.30964 11.75 6C11.75 6.69036 12.3096 7.25 13 7.25C13.6904 7.25 14.25 6.69036 14.25 6C14.25 5.30964 13.6904 4.75 13 4.75ZM3 2.75C2.30964 2.75 1.75 3.30964 1.75 4C1.75 4.69036 2.30964 5.25 3 5.25C3.69036 5.25 4.25 4.69036 4.25 4C4.25 3.30964 3.69036 2.75 3 2.75Z";

export function ClaudeDuetMark({ size }: { size: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <MarkFrame size={size}>
      <defs>{markShade(`${id}-shade`, "0.16")}</defs>
      <g filter={`url(#${id}-shade)`}>
        <rect width="28" height="28" rx="14" fill="white" />
        <g transform="translate(2 2)">
          <path fill="#D97757" d={claudeDuetBloom} />
          <path fill="#141413" fillRule="evenodd" clipRule="evenodd" d={claudeDuetMark} />
        </g>
      </g>
    </MarkFrame>
  );
}

const claudeDuetBloom =
  "M21.2646 11.9845C21.295 12.387 21.295 12.8018 21.2526 13.2072C21.2102 13.6097 21.1286 14.0182 21.0104 14.4087C20.8924 14.796 20.7321 15.1805 20.5475 15.5375C20.3597 15.8976 20.1358 16.2397 19.8967 16.5635C19.6577 16.8841 19.3883 17.1838 19.1129 17.4681C18.8375 17.7498 18.5441 18.0129 18.2443 18.2611C17.9478 18.5122 17.6391 18.7452 17.3245 18.9662C17.0096 19.1872 16.6918 19.3991 16.3589 19.5926C16.0291 19.7864 15.6933 19.9711 15.3421 20.1314C14.9942 20.2948 14.6341 20.4431 14.2648 20.5611C13.8986 20.6762 13.5173 20.7729 13.1328 20.8336C12.7486 20.8972 12.3553 20.9272 11.9677 20.9272C11.5803 20.9244 11.187 20.888 10.8028 20.8245C10.4215 20.7609 10.043 20.661 9.67399 20.5399C9.30757 20.422 8.95057 20.2705 8.60247 20.1073C8.2575 19.9439 7.92168 19.7561 7.5979 19.5565C7.27097 19.3567 6.95922 19.1388 6.65662 18.9058C6.35402 18.6757 6.06031 18.4306 5.78517 18.1672C5.50977 17.9041 5.24327 17.6256 4.9982 17.3321C4.75602 17.0356 4.52613 16.7238 4.32344 16.3969C4.12048 16.0702 3.93897 15.725 3.7878 15.374C3.63324 15.0199 3.50613 14.6508 3.40648 14.2784C3.30657 13.9062 3.237 13.522 3.18548 13.1407C3.1371 12.7594 3.11277 12.3721 3.10676 11.9845C3.10074 11.5971 3.11591 11.2098 3.14913 10.8224C3.17947 10.4351 3.22785 10.0478 3.29742 9.66043C3.36699 9.27597 3.45173 8.88575 3.56367 8.50443C3.6756 8.11997 3.80585 7.73551 3.96931 7.36648C4.13565 6.99719 4.32344 6.63103 4.54731 6.28894C4.76831 5.94999 5.0254 5.61731 5.30682 5.3236C5.59137 5.03015 5.90914 4.75763 6.24208 4.5246C6.5779 4.29157 6.94405 4.09202 7.31648 3.92855C7.68865 3.76509 8.082 3.64112 8.47248 3.54409C8.8627 3.45046 9.26233 3.39292 9.65568 3.35343C10.0462 3.3142 10.4395 3.30505 10.8268 3.30819C11.2113 3.31106 11.5926 3.33852 11.9677 3.37462C12.343 3.41097 12.7154 3.45935 13.0816 3.52605C13.4477 3.5896 13.8139 3.66519 14.1709 3.76222C14.531 3.85585 14.8883 3.96491 15.2332 4.09803C15.5814 4.23115 15.9263 4.37945 16.2561 4.55494C16.5891 4.72755 16.9129 4.92423 17.2186 5.14209C17.5241 5.35995 17.8206 5.599 18.0992 5.85322C18.3775 6.11057 18.6408 6.38597 18.889 6.6734C19.1372 6.96397 19.3703 7.26945 19.585 7.58722C19.8028 7.90211 20.0058 8.23505 20.1902 8.57688C20.3748 8.92185 20.5474 9.27911 20.6926 9.64526C20.838 10.0146 20.968 10.3959 21.065 10.7861C21.1587 11.1766 21.2314 11.582 21.2646 11.9845Z";

const claudeDuetMark =
  "M16.4447 16.678C16.3147 16.6662 16.1107 16.6513 15.9925 16.6424C15.8743 16.6366 15.7147 16.6071 15.635 16.5804C15.5552 16.5537 15.4783 16.5391 15.4665 16.542C15.4516 16.548 15.3868 16.5273 15.3216 16.5006C15.2565 16.474 15.097 16.4177 14.967 16.3795C14.5888 16.2613 13.8528 15.8978 13.5484 15.6789C13.3978 15.5696 13.38 15.5696 13.1318 15.6878C12.0234 16.2258 10.4777 16.2197 9.28376 15.676C9.18333 15.6287 9.09179 15.5902 9.0829 15.5902C9.03843 15.5902 8.42957 15.2861 8.2907 15.1914C8.20517 15.1351 8.12226 15.0878 8.1105 15.0878C8.08696 15.0878 7.93605 14.9638 7.70851 14.7541C7.4543 14.5205 7.46319 14.5234 7.36877 14.5885C7.32143 14.6181 7.25631 14.6594 7.22676 14.6801C7.19433 14.7007 7.13522 14.7481 7.0939 14.7865C6.85746 14.9991 5.8644 15.5902 5.74331 15.5902C5.7373 15.5902 5.67531 15.614 5.60443 15.6465C5.42999 15.7233 5.00734 15.8505 4.81537 15.8829C4.72671 15.8978 4.5405 15.9391 4.40162 15.9744C4.26248 16.0071 4.09117 16.0424 4.01742 16.0545C3.72476 16.0987 2.6195 16.0602 2.51017 16.0042C2.48637 15.9922 2.4066 15.9715 2.33285 15.9598C2.25883 15.948 2.18796 15.9273 2.17017 15.9153C2.15239 15.9035 2.09642 15.886 2.04019 15.874C1.98396 15.8651 1.86862 15.8031 1.7831 15.738C1.69731 15.6731 1.61466 15.6198 1.59976 15.6198C1.55556 15.6198 1.29846 15.3007 1.29846 15.2476C1.29846 15.2358 1.2629 15.1529 1.21843 15.0614C1.10022 14.8161 1.14468 14.4761 1.31913 14.2841C1.37222 14.225 1.67377 14.2101 1.85999 14.2574C2.13173 14.3283 2.37103 14.4052 2.38882 14.429C2.4155 14.4674 2.56326 14.5561 2.60171 14.5561C2.6195 14.5561 2.67546 14.5768 2.72568 14.6003C2.82637 14.6448 2.93857 14.6683 3.68919 14.7836C4.02919 14.8339 4.3276 14.825 4.56403 14.7541C4.64668 14.7303 4.84493 14.6743 5.00734 14.627C5.28222 14.553 5.93842 14.2634 6.07128 14.1599C6.17773 14.0743 6.42593 13.9145 6.5295 13.8615C6.58546 13.8319 6.67413 13.7757 6.72748 13.7372C6.83366 13.6546 6.82477 13.6221 6.55016 13.1582C6.48503 13.0489 6.42305 12.9068 6.40814 12.8477C6.39637 12.7886 6.35505 12.6586 6.31948 12.5611C6.26037 12.3927 6.2575 12.3513 6.27528 11.7485C6.28417 11.3996 6.29882 11.0538 6.30771 10.9801C6.37571 10.3887 6.42593 10.2648 6.8219 9.66481C7.17968 9.12107 7.44854 8.86686 7.91853 8.63042C8.48293 8.34378 9.67397 8.73086 9.8955 9.27459C9.93107 9.36038 9.97239 9.44904 9.9873 9.47572C10.0019 9.50239 10.0226 9.60283 10.0315 9.69724C10.0433 9.79479 10.0639 9.92478 10.0757 9.9899C10.129 10.2352 10.0699 10.6992 9.94885 11.0125C9.90726 11.1158 9.84528 11.2992 9.80971 11.4203C9.67973 11.8636 9.38419 12.4044 9.02379 12.8566C8.90845 13.0044 8.79311 13.1582 8.77245 13.2024C8.734 13.2733 8.666 13.353 8.42382 13.619C8.3498 13.699 8.3498 13.699 8.45337 13.8052C8.5096 13.8615 8.60114 13.9383 8.65737 13.9737C8.71334 14.0063 8.7667 14.0448 8.77559 14.0566C8.8109 14.1068 9.08577 14.2987 9.18333 14.3432C9.24243 14.3699 9.32508 14.4141 9.36666 14.4408C9.51443 14.5383 9.76551 14.6683 9.88373 14.7007C9.94885 14.7214 10.0286 14.7481 10.061 14.7627C10.1437 14.8012 10.5428 14.9314 10.6817 14.9667C11.1485 15.0878 12.2716 15.0347 12.446 14.8869C12.52 14.825 12.514 14.7865 12.4047 14.627C12.1298 14.2368 11.8638 13.7581 11.7901 13.5215C11.5181 12.6764 11.5743 11.4616 11.9258 10.6519C11.9643 10.5603 11.9967 10.4745 11.9967 10.4628C11.9967 10.451 12.1031 10.2235 12.2331 9.96035C12.5671 9.28349 12.8124 9.00861 13.4597 8.60087C13.9917 8.26401 14.4439 8.2049 15.2034 8.37333C15.5492 8.45023 16.0576 8.83129 16.4682 9.32507C16.8613 9.79479 16.9531 10.7138 16.7078 11.7778C16.6455 12.0558 16.5362 12.2684 16.2022 12.768C16.0398 13.0133 15.8771 13.2644 15.8387 13.3295C15.7974 13.3946 15.7058 13.5275 15.6318 13.625C15.5581 13.7226 15.4723 13.8379 15.4399 13.8821C15.2714 14.1068 15.029 14.4112 14.899 14.553C14.6832 14.7836 14.7245 14.9283 15.0232 15.0141C15.2508 15.076 15.5225 15.1323 15.5727 15.1234C15.5965 15.1205 15.7176 15.1323 15.8358 15.1501C16.158 15.1974 16.2909 15.2063 16.962 15.2209C17.2957 15.2298 17.5884 15.2387 17.6122 15.2387C17.6357 15.2416 17.8219 15.2238 18.0257 15.1974C18.8119 15.0909 19.1608 14.961 19.6454 14.5914C19.8316 14.4497 20.0858 14.2574 20.2158 14.1659C20.3429 14.0712 20.4729 13.9708 20.5053 13.9441C20.5349 13.9145 20.6502 13.823 20.7595 13.7432C21.3506 13.3028 21.5841 13.0842 21.7939 12.774C21.9741 12.502 22.3259 12.1413 22.4352 12.1207C22.7456 12.0527 23.1003 12.1591 23.2036 12.3482C23.2214 12.3838 23.2627 12.434 23.2951 12.4578C23.434 12.57 23.3809 13.0428 23.2036 13.291C22.9494 13.6457 21.7081 14.8809 21.4453 15.0376C21.3948 15.0703 21.3446 15.1056 21.3357 15.1174C21.321 15.1383 21.2737 15.1707 21.0433 15.3096C20.99 15.342 20.9013 15.4011 20.8482 15.4425C20.7951 15.484 20.6944 15.552 20.6235 15.5962C20.5527 15.6407 20.402 15.744 20.2867 15.8269C20.1713 15.9096 19.994 16.016 19.8878 16.0633C19.7814 16.1136 19.6543 16.1755 19.6069 16.2022C19.347 16.3469 19.1932 16.4177 19.0956 16.4326C19.0365 16.4444 18.9596 16.4622 18.9272 16.474C18.481 16.6542 17.2811 16.7517 16.4447 16.678ZM13.918 14.0477C14.1513 13.9737 14.5237 13.6486 14.7957 13.2733C14.8577 13.1906 14.9314 13.0959 14.9641 13.0635C14.9937 13.0311 15.1148 12.8566 15.2359 12.6793C15.3541 12.502 15.5256 12.2478 15.6143 12.1207C15.7738 11.8931 15.8476 11.6303 15.8152 11.4231C15.8091 11.3878 15.8091 10.9652 15.8123 10.8263C15.8269 10.4125 15.7119 10.0017 15.5078 9.74458C15.2476 9.41949 14.5592 9.21261 14.1837 9.35462C13.9888 9.4255 13.4658 9.77413 13.38 9.88947C13.2322 10.0846 13.0018 10.587 12.8509 11.0389C12.7002 11.4971 12.7002 11.4971 12.6853 12.0173C12.6707 12.4931 12.6736 12.5522 12.7355 12.7562C12.8538 13.1611 13.0342 13.5097 13.2913 13.8319C13.3031 13.8468 13.3504 13.9117 13.3978 13.9708C13.5039 14.1125 13.6371 14.1303 13.918 14.0477ZM8.02785 12.6704C8.22871 12.4607 8.53314 12.0024 8.64534 11.7485C8.69268 11.642 8.78134 11.4705 8.84045 11.3643C8.94402 11.1838 9.0149 10.9623 9.05334 10.7138C9.17443 9.94858 9.17731 9.84213 9.07688 9.68547C9.03843 9.62924 8.67489 9.54058 8.52425 9.54947C8.24048 9.57327 8.08382 9.71215 7.78253 10.2235C7.54897 10.6134 7.5134 10.7465 7.48385 11.302C7.43965 12.1178 7.45743 12.31 7.59631 12.6053C7.73519 12.904 7.80031 12.9129 8.02785 12.6704Z";

export function MuseBall({ size, state, levelRef }: { size: number; state?: OrbState; levelRef?: LevelRef }) {
  const host = useRef<HTMLSpanElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useMascotLoop(host, (time) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const drive = reduced ? 0 : mascotDrive(state, levelRef?.current ?? -1, time);
    const fill = 1.16;
    const sx = fill * (1 + (reduced ? 0 : Math.sin(time * 1.2) * 0.012 + drive * 0.06));
    const sy = fill * (1 - (reduced ? 0 : drive * 0.045));
    if (image.current) image.current.style.transform = `scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
  });

  return (
    <span ref={host} className="orb" data-state={state ?? "idle"} style={slotStyle(size)} aria-hidden>
      <img
        ref={image}
        src="/assets/muse.png"
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transformOrigin: "center" }}
      />
    </span>
  );
}
