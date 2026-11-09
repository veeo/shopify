'use client';

import { useRef } from 'react';
import { hexToRgb, orbVars, type OrbProps } from '@/voiceorbs/lib/orb-state';
import { useOrbAnimator, type OrbFrame } from '@/voiceorbs/lib/use-orb-animator';

type Rgb = [number, number, number];
type Pointer = { x: number; y: number };

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const css = (rgb: Rgb, alpha = 1) => `rgba(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0}, ${alpha})`;

/** Extra canvas past the circle so the electric rim can leave the ball. */
const CRYSTAL_PAD = 0.34;

function unit(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function drawCrystalBall(ctx: CanvasRenderingContext2D, canvasSize: number, ball: number, frame: OrbFrame, from: Rgb, to: Rgb) {
  const c = canvasSize / 2;
  const r = ball * 0.48;
  const level = frame.reduced ? 0 : frame.level;
  const pace = frame.reduced ? 0 : 1;
  const t = frame.time * pace;
  const spark = mix(to, [255, 255, 255], 0.88);
  const dustColor = mix(from, [255, 255, 255], 0.55);
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  const glass = ctx.createRadialGradient(c - r * 0.2, c - r * 0.28, r * 0.1, c, c + r * 0.1, r);
  glass.addColorStop(0, 'rgba(255,255,255,0.05)');
  glass.addColorStop(0.55, css(mix(dustColor, [0, 0, 0], 0.92), 0.35));
  glass.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();

  const count = 240;
  for (let i = 0; i < count; i += 1) {
    const depth = Math.pow(unit(i + 1), 0.55);
    const yNorm = -0.15 + depth * 1.05;
    const half = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const spin = t * (0.12 + unit(i + 3) * 0.28) * (unit(i + 7) < 0.5 ? -1 : 1);
    const ang = unit(i + 19) * Math.PI * 2 + spin;
    const reach = half * (0.08 + unit(i + 11) * 0.9);
    const x = c + Math.cos(ang) * reach * r;
    const rise = ((t * (0.05 + unit(i + 5) * 0.12) + unit(i + 13)) % 1) * r * 0.18;
    const y = c + yNorm * r - rise * (0.25 + level);
    if (Math.hypot(x - c, y - c) > r * 0.96) continue;
    const alpha = 0.35 + unit(i + 17) * 0.65;
    ctx.fillStyle = css(i % 6 === 0 ? spark : dustColor, alpha);
    const speck = Math.max(2.2, ball * (0.012 + unit(i + 23) * 0.016));
    ctx.fillRect(x - speck / 2, y - speck / 2, speck, speck);
  }

  ctx.save();
  ctx.translate(c, c);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const crack = (ang: number, center: number, width: number) => {
    const d = Math.atan2(Math.sin(ang - center), Math.cos(ang - center));
    const x = d / width;
    return Math.exp(-x * x);
  };
  ctx.beginPath();
  const steps = 100;
  for (let i = 0; i <= steps; i += 1) {
    const ang = (i / steps) * Math.PI * 2;
    const wobble = Math.sin(ang * 5 + t * 1.1) * r * 0.008;
    const flare = crack(ang, t * 0.7, 0.16) + crack(ang, -t * 0.45 + 2.2, 0.12) * 0.7;
    const rad = r + wobble + flare * r * (0.1 + level * 0.05);
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = css(spark, 0.4);
  ctx.lineWidth = Math.max(4, r * 0.06);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.96)';
  ctx.lineWidth = Math.max(1.7, r * 0.026);
  ctx.stroke();
  ctx.restore();
}

function drawStrands(ctx: CanvasRenderingContext2D, size: number, frame: OrbFrame, from: Rgb, to: Rgb) {
  const c = size / 2;
  const r = c * 0.99;
  const level = frame.reduced ? 0.04 : frame.level;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#141722';
  ctx.fillRect(0, 0, size, size);
  const count = 4;
  for (let i = 0; i < count; i += 1) {
    const color = mix(from, to, i / (count - 1));
    const amp = r * (0.1 + level * 0.46);
    const phase = frame.time * (0.8 + i * 0.17) * (frame.reduced ? 0.15 : 1);
    ctx.beginPath();
    for (let x = c - r; x <= c + r; x += 2) {
      const u = (x - c) / r;
      const envelope = Math.cos(u * Math.PI * 0.5);
      const y = c + Math.sin(u * 3.2 + phase + i) * amp * envelope + (i - 1.5) * r * 0.14;
      if (x === c - r) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = css(color, 0.5 + level * 0.45);
    ctx.lineWidth = Math.max(1.5, size * (0.03 + level * 0.012));
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  const frost = ctx.createRadialGradient(c - r * 0.2, c - r * 0.28, r * 0.05, c, c, r);
  frost.addColorStop(0, 'rgba(255,255,255,0.38)');
  frost.addColorStop(0.45, 'rgba(255,255,255,0.05)');
  frost.addColorStop(1, 'rgba(255,255,255,0.16)');
  ctx.fillStyle = frost;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

function drawIridescence(ctx: CanvasRenderingContext2D, size: number, frame: OrbFrame, from: Rgb, to: Rgb) {
  const c = size / 2;
  const r = c * 0.99;
  const level = frame.reduced ? 0 : frame.level;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();
  const turn = frame.time * (0.7 + level * 0.8);
  for (let i = 0; i < 3; i += 1) {
    const g = ctx.createConicGradient(turn + i * 0.8, c, c);
    g.addColorStop(0, css(from, 0.85));
    g.addColorStop(0.35, css(mix(from, to, 0.5), 0.8));
    g.addColorStop(0.7, css(to, 0.9));
    g.addColorStop(1, css(from, 0.85));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const shade = ctx.createRadialGradient(c - r * 0.3, c - r * 0.35, r * 0.05, c, c, r);
  shade.addColorStop(0, 'rgba(255,255,255,0.55)');
  shade.addColorStop(0.35, 'rgba(255,255,255,0.05)');
  shade.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

function CanvasOrb({
  draw,
  state = 'idle',
  size = 144,
  speed = 1,
  colorFrom = '#7c3aed',
  colorTo = '#22d3ee',
  levelRef,
  label,
  className,
  ref,
}: OrbProps & {
  draw: (ctx: CanvasRenderingContext2D, size: number, frame: OrbFrame, from: Rgb, to: Rgb, pointer: Pointer) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const from = hexToRgb(colorFrom);
  const to = hexToRgb(colorTo);

  useOrbAnimator(hostRef, {
    state,
    levelRef,
    speed,
    onFrame: (frame) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const shell = hostRef.current?.closest('.orb-host') as HTMLElement | null;
      pointer.current = {
        x: Number(shell?.dataset.px || 0),
        y: Number(shell?.dataset.py || 0),
      };
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const px = Math.max(64, Math.round(size * dpr));
      if (canvas.width !== px) {
        canvas.width = px;
        canvas.height = px;
      }
      ctx.setTransform(px / size, 0, 0, px / size, 0, 0);
      draw(ctx, size, frame, from, to, pointer.current);
    },
  });

  return (
    <div
      ref={(node) => {
        hostRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{ ...orbVars({ size, speed, colorFrom, colorTo }), width: size, height: size, position: 'relative' }}
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        pointer.current = {
          x: (event.clientX - box.left) / box.width - 0.5,
          y: (event.clientY - box.top) / box.height - 0.5,
        };
      }}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0 };
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

export function CrystalOrb({
  state = 'idle',
  size = 144,
  speed = 1,
  colorFrom = '#ffffff',
  colorTo = '#d4d4d8',
  levelRef,
  label = 'Crystalized ball',
  className,
  ref,
}: OrbProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const from = hexToRgb(colorFrom);
  const to = hexToRgb(colorTo);
  const canvasSize = size * (1 + CRYSTAL_PAD * 2);

  useOrbAnimator(hostRef, {
    state,
    levelRef,
    speed,
    onFrame: (frame) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const px = Math.max(64, Math.round(canvasSize * dpr));
      if (canvas.width !== px) {
        canvas.width = px;
        canvas.height = px;
      }
      ctx.setTransform(px / canvasSize, 0, 0, px / canvasSize, 0, 0);
      drawCrystalBall(ctx, canvasSize, size, frame, from, to);
    },
  });

  return (
    <div
      ref={(node) => {
        hostRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{ ...orbVars({ size, speed, colorFrom, colorTo }), width: size, height: size, position: 'relative', overflow: 'visible' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          width: canvasSize,
          height: canvasSize,
          left: -size * CRYSTAL_PAD,
          top: -size * CRYSTAL_PAD,
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
export const StrandsOrb = (props: OrbProps) => <CanvasOrb {...props} label={props.label ?? 'Strands orb'} draw={drawStrands} />;
export const IridescenceOrb = (props: OrbProps) => <CanvasOrb {...props} label={props.label ?? 'Iridescence orb'} draw={drawIridescence} />;
