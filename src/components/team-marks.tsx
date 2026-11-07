"use client";

import { useEffect, useId, useRef, type CSSProperties, type RefObject } from "react";
import type { OrbState } from "@/voiceorbs/lib/orb-state";

/**
 * Grok eye placement, capsule shape, and liveliness are adapted from Bloub
 * (MIT) © 2026 Jérémy Perret — https://github.com/jeremy-prt/bloub
 * Slack is an original sphere. Its corner colors come from the
 * Silverside Slackbot still — https://www.silverside.ai/projects/slackbot
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

function blinkLid(t: number) {
  const duration = 0.18;
  for (let i = 0; i < BLINKS.length; i += 1) {
    const start = BLINKS[i];
    if (t < start) break;
    const k = (t - start) / duration;
    if (k >= 0 && k <= 1) return k < 0.45 ? 1 - k / 0.45 : (k - 0.45) / 0.55;
  }
  return 1;
}

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

function grokFrame(t: number, state: OrbState | undefined, level: number, reduced: boolean) {
  const live = level >= 0 ? clamp(level) : 0;
  const voiced = level >= 0 && (state === "listening" || state === "speaking");
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
  const breath = life.breath * (1 + (voiced ? live * 0.012 : 0));
  const rig = `translate(${round(CENTER + life.driftX * GROK_R)} ${round(CENTER + life.driftY * GROK_R)}) scale(${round(breath)}) translate(${-CENTER} ${-CENTER})`;
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

const SLACK_R = 67;
const SLACK_COLORS = {
  blue: "#4E86C0",
  green: "#5A9468",
  red: "#C43048",
  gold: "#C9921C",
};

export function SlackOrb({ size, state, levelRef }: { size: number; state?: OrbState; levelRef?: LevelRef }) {
  const id = useId().replace(/:/g, "");
  const host = useRef<HTMLSpanElement>(null);
  const motion = useRef<SVGGElement>(null);

  useMascotLoop(host, (time) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const level = levelRef?.current ?? -1;
    const live = level >= 0 ? clamp(level) : 0;
    const voiced = level >= 0 && (state === "listening" || state === "speaking");
    const driftX = reduced ? 0 : loopNoise(time, 9.2, 0.4) * 0.8;
    const driftY = reduced ? 0 : loopNoise(time, 7.4, 1.2) * 0.7;
    const scale = 1 + (voiced ? live * 0.02 : 0) + (reduced ? 0 : Math.sin(time / 3.6) * 0.004);
    motion.current?.setAttribute(
      "transform",
      `translate(${round(CENTER + driftX)} ${round(CENTER + driftY)}) scale(${round(scale)}) translate(${-CENTER} ${-CENTER})`,
    );
  });

  return (
    <span ref={host} className="orb voice-slot" data-state={state ?? "idle"} style={slotStyle(size)} aria-hidden>
      <span className="voice-orb-fit">
        <svg viewBox={`0 0 ${RENDER} ${RENDER}`} width={RENDER} height={RENDER}>
          <defs>
            <clipPath id={`${id}-clip`}>
              <circle cx={CENTER} cy={CENTER} r={SLACK_R} />
            </clipPath>
            <radialGradient id={`${id}-blue`} cx="22%" cy="22%" r="70%">
              <stop offset="0%" stopColor={SLACK_COLORS.blue} />
              <stop offset="46%" stopColor={SLACK_COLORS.blue} />
              <stop offset="100%" stopColor={SLACK_COLORS.blue} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-green`} cx="78%" cy="22%" r="70%">
              <stop offset="0%" stopColor={SLACK_COLORS.green} />
              <stop offset="46%" stopColor={SLACK_COLORS.green} />
              <stop offset="100%" stopColor={SLACK_COLORS.green} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-red`} cx="22%" cy="80%" r="70%">
              <stop offset="0%" stopColor={SLACK_COLORS.red} />
              <stop offset="46%" stopColor={SLACK_COLORS.red} />
              <stop offset="100%" stopColor={SLACK_COLORS.red} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-gold`} cx="80%" cy="78%" r="70%">
              <stop offset="0%" stopColor={SLACK_COLORS.gold} />
              <stop offset="46%" stopColor={SLACK_COLORS.gold} />
              <stop offset="100%" stopColor={SLACK_COLORS.gold} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-shade`} cx="34%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#1c1018" stopOpacity="0.28" />
            </radialGradient>
          </defs>
          <g ref={motion}>
            <g clipPath={`url(#${id}-clip)`}>
              <circle cx={CENTER} cy={CENTER} r={SLACK_R} fill={SLACK_COLORS.blue} />
              <circle cx={CENTER} cy={CENTER} r={SLACK_R} fill={`url(#${id}-green)`} />
              <circle cx={CENTER} cy={CENTER} r={SLACK_R} fill={`url(#${id}-red)`} />
              <circle cx={CENTER} cy={CENTER} r={SLACK_R} fill={`url(#${id}-gold)`} />
              <circle cx={CENTER} cy={CENTER} r={SLACK_R} fill={`url(#${id}-shade)`} />
            </g>
          </g>
        </svg>
      </span>
    </span>
  );
}


export function MuseBall({ size, state, levelRef }: { size: number; state?: OrbState; levelRef?: LevelRef }) {
  const host = useRef<HTMLSpanElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useMascotLoop(host, (time) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const level = levelRef?.current ?? -1;
    const live = level >= 0 ? clamp(level) : 0;
    const voiced = level >= 0 && (state === "listening" || state === "speaking");
    const scale = reduced ? 1 : 1 + Math.sin(time * 1.2) * 0.012 + (voiced ? live * 0.04 : 0);
    if (image.current) image.current.style.transform = `scale(${scale.toFixed(3)})`;
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
