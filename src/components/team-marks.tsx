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

const GROK_R = 67;

function mascotDrive(state: OrbState | undefined, level: number, time: number) {
  if (state === "listening" || state === "speaking") return level >= 0 ? clamp(level) : speechEnvelope(time);
  if (state === "thinking" || state === "connecting") return 0.2 + 0.12 * Math.sin(time * 2.4);
  if (state === "hover") return 0.22;
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
  const breath = life.breath;
  const sx = breath * (1 + (reduced ? 0 : live * 0.07));
  const sy = breath * (1 - (reduced ? 0 : live * 0.05));
  const rig = `translate(${round(CENTER + life.driftX * GROK_R)} ${round(CENTER + life.driftY * GROK_R)}) scale(${round(sx)} ${round(sy)}) translate(${-CENTER} ${-CENTER})`;
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
  const motion = useRef<SVGGElement>(null);
  const leftEye = useRef<SVGGElement>(null);
  const rightEye = useRef<SVGGElement>(null);

  useMascotLoop(host, (time) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const drive = reduced ? 0 : mascotDrive(state, levelRef?.current ?? -1, time);
    const sx = 1 + Math.sin(time / 3.6) * 0.012 + drive * 0.07;
    const sy = 1 + Math.sin(time / 3.6) * 0.012 - drive * 0.05;
    const lid = reduced ? 1 : blinkLid(time, SLACK_BLINKS, 0.16, 0.36);
    const widen = 1 + drive * 0.08;
    motion.current?.setAttribute("transform", `translate(14 14) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-14 -14)`);
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
            <g ref={motion}>
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
      <defs>{markShade(`${id}-shade`, "0.35")}</defs>
      <g filter={`url(#${id}-shade)`}>
        <rect width="28" height="28" rx="14" fill="#111111" />
        <rect x="8.5" y="8" width="11" height="8" rx="1.5" fill="white" />
        <rect x="10" y="9.5" width="8" height="3" rx="0.6" fill="#111111" />
        <rect x="11.2" y="17.2" width="5.6" height="1.7" rx="0.85" fill="white" />
      </g>
    </MarkFrame>
  );
}

export function AgenticMark({ size }: { size: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <MarkFrame size={size}>
      <defs>{markShade(`${id}-shade`, "0.3")}</defs>
      <g filter={`url(#${id}-shade)`}>
        <rect width="28" height="28" rx="14" fill="#312E81" />
        <path d="M10.2 17.6 L17.4 11.4 M10.2 17.6 L17.6 18.4" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="10.2" cy="17.6" r="1.7" fill="white" />
        <circle cx="17.4" cy="11.4" r="1.7" fill="white" />
        <circle cx="17.6" cy="18.4" r="1.7" fill="white" />
      </g>
    </MarkFrame>
  );
}

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
