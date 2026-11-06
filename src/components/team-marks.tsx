"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import type { OrbState } from "@/voiceorbs/lib/orb-state";

/** Grok Bot: the black blob and white eyes, blinking and breathing at avatar size. */
export function GrokBot({ size, state }: { size: number; state?: OrbState }) {
  const id = useId().replace(/:/g, "");
  return (
    <span className="orb team-orb" data-state={state ?? "idle"} style={{ "--s": `${size}px` } as CSSProperties} aria-hidden>
      <svg className="team-bob" viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <radialGradient id={`${id}-body`} cx="36%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="42%" stopColor="#161616" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
        </defs>
        <path
          fill={`url(#${id}-body)`}
          d="M50 7C68 5 86 16 93 34C101 54 95 76 79 89C63 102 38 99 22 86C6 73 2 50 13 31C23 14 34 9 50 7Z"
        />
        <ellipse className="team-eye" cx="40" cy="46" rx="8.2" ry="10.4" fill="#fff" />
        <ellipse className="team-eye team-eye-late" cx="63.5" cy="42.5" rx="7.2" ry="9.2" fill="#fff" />
      </svg>
    </span>
  );
}

const SLACK = { blue: "#36C5F0", green: "#2EB67D", yellow: "#ECB22E", red: "#E01E5A" };

/** Slack orb: the four logo colors on a sphere, with a face that blinks. */
export function SlackOrb({ size, state }: { size: number; state?: OrbState }) {
  const id = useId().replace(/:/g, "");
  return (
    <span className="orb team-orb" data-state={state ?? "idle"} style={{ "--s": `${size}px` } as CSSProperties} aria-hidden>
      <svg className="team-bob" viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <clipPath id={`${id}-clip`}>
            <circle cx="50" cy="50" r="49" />
          </clipPath>
          <radialGradient id={`${id}-light`} cx="32%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="38%" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.38" />
          </radialGradient>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <rect x="0" y="0" width="50" height="50" fill={SLACK.blue} />
          <rect x="50" y="0" width="50" height="50" fill={SLACK.green} />
          <rect x="0" y="50" width="50" height="50" fill={SLACK.red} />
          <rect x="50" y="50" width="50" height="50" fill={SLACK.yellow} />
          <circle cx="50" cy="50" r="49" fill={`url(#${id}-light)`} />
          <path d="M34 40c2.2-3 6.2-3.2 8.2-.4" fill="none" stroke="#1d1c1d" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M58 40c2.2-3 6.2-3.2 8.2-.4" fill="none" stroke="#1d1c1d" strokeWidth="2.4" strokeLinecap="round" />
          <g className="team-eye">
            <ellipse cx="38" cy="49" rx="6.4" ry="7.2" fill="#1d1c1d" />
            <ellipse cx="36.2" cy="46.6" rx="2.1" ry="2.3" fill="#fff" />
          </g>
          <g className="team-eye team-eye-late">
            <ellipse cx="62" cy="49" rx="6.4" ry="7.2" fill="#1d1c1d" />
            <ellipse cx="60.2" cy="46.6" rx="2.1" ry="2.3" fill="#fff" />
          </g>
          <path d="M40 64c3.4 5 16.6 5 20 0" fill="none" stroke="#1d1c1d" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M46 66.5c2.6 1.6 5.6 1.6 8.2 0" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        </g>
      </svg>
    </span>
  );
}

/** Muse: a fuzzy brown ball with the small face. */
export function MuseBall({ size, state }: { size: number; state?: OrbState }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.scale(dpr, dpr);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const center = size / 2;
    let frame = 0;
    const started = performance.now();

    const draw = (now: number) => {
      const t = reduce ? 0 : (now - started) / 1000;
      const talking = state === "speaking" || state === "listening";
      ctx.clearRect(0, 0, size, size);
      const breath = reduce ? 1 : 1 + Math.sin(t * (talking ? 5 : 2.2)) * (talking ? 0.035 : 0.018);
      const radius = size * 0.43 * breath;
      const hairs = Math.max(28, Math.round(size * 1.6));
      ctx.lineCap = "round";
      for (let index = 0; index < hairs; index += 1) {
        const angle = (index / hairs) * Math.PI * 2;
        const sway = reduce ? 0 : Math.sin(t * 1.6 + index * 0.7) * 0.08;
        const inner = radius * 0.86;
        const outer = radius * (1.16 + (reduce ? 0 : 0.05 * Math.sin(t * 2.4 + index)));
        ctx.strokeStyle = index % 2 === 0 ? "#c48a5c" : "#7a4a30";
        ctx.globalAlpha = 0.72;
        ctx.lineWidth = Math.max(1, size * 0.045);
        ctx.beginPath();
        ctx.moveTo(center + Math.cos(angle + sway) * inner, center + Math.sin(angle + sway) * inner);
        ctx.lineTo(center + Math.cos(angle + sway) * outer, center + Math.sin(angle + sway) * outer);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const light = ctx.createRadialGradient(center - radius * 0.32, center - radius * 0.36, radius * 0.08, center, center + radius * 0.05, radius);
      light.addColorStop(0, "#f0c49a");
      light.addColorStop(0.42, "#c48455");
      light.addColorStop(1, "#6b3d28");
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = light;
      ctx.fill();

      const blink = reduce ? 1 : blinkOpen(t);
      const eyeY = center + size * 0.02;
      const eyeGap = size * 0.13;
      blush(ctx, center - eyeGap * 1.35, eyeY + size * 0.06, size * 0.07);
      blush(ctx, center + eyeGap * 1.35, eyeY + size * 0.06, size * 0.07);
      eye(ctx, center - eyeGap, eyeY, size * 0.045, size * 0.055 * blink);
      eye(ctx, center + eyeGap, eyeY, size * 0.045, size * 0.055 * blink);
      ctx.strokeStyle = "#5c3424";
      ctx.lineWidth = Math.max(1, size * 0.035);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(center, center + size * 0.08, size * 0.07, 0.25, Math.PI - 0.25);
      ctx.stroke();
      if (!reduce) frame = requestAnimationFrame(draw);
    };
    draw(started);
    return () => cancelAnimationFrame(frame);
  }, [size, state]);

  return (
    <span className="orb team-orb" data-state={state ?? "idle"} style={{ "--s": `${size}px` } as CSSProperties} aria-hidden>
      <canvas ref={ref} style={{ width: size, height: size, display: "block" }} />
    </span>
  );
}

function blush(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const wash = ctx.createRadialGradient(x, y, 0, x, y, radius);
  wash.addColorStop(0, "rgba(232, 140, 130, 0.85)");
  wash.addColorStop(1, "rgba(232, 140, 130, 0)");
  ctx.fillStyle = wash;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.fillStyle = "#3b2418";
  ctx.beginPath();
  if (ry < 0.8) {
    ctx.moveTo(x - rx, y);
    ctx.lineTo(x + rx, y);
    ctx.lineWidth = Math.max(1, rx * 0.35);
    ctx.strokeStyle = "#3b2418";
    ctx.stroke();
    return;
  }
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** 1 open, near 0 closed. A blink every few seconds. */
function blinkOpen(t: number) {
  const cycle = 3.6;
  const phase = t % cycle;
  if (phase < 3.15 || phase > 3.48) return 1;
  const local = (phase - 3.15) / 0.33;
  const close = local < 0.42 ? local / 0.42 : 1 - (local - 0.42) / 0.58;
  return 1 - close * 0.92;
}
