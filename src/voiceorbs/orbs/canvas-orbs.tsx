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

function sphereShade(ctx: CanvasRenderingContext2D, size: number, from: Rgb, to: Rgb, light = 0.55) {
  const c = size / 2;
  const r = c * 0.99;
  const body = ctx.createRadialGradient(c - r * 0.32, c - r * 0.38, r * 0.08, c, c, r);
  body.addColorStop(0, css(mix(from, [255, 255, 255], light)));
  body.addColorStop(0.42, css(mix(from, to, 0.45)));
  body.addColorStop(1, css(mix(to, [8, 10, 18], 0.55)));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();
  const rim = ctx.createRadialGradient(c, c, r * 0.72, c, c, r);
  rim.addColorStop(0, 'rgba(255,255,255,0)');
  rim.addColorStop(1, css(mix(to, [255, 255, 255], 0.35), 0.55));
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(c - r * 0.28, c - r * 0.34, r * 0.18, r * 0.1, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrystal(ctx: CanvasRenderingContext2D, size: number, frame: OrbFrame, from: Rgb, to: Rgb, pointer: Pointer) {
  const c = size / 2;
  const r = c * 0.99;
  const level = frame.reduced ? 0 : frame.level;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();
  sphereShade(ctx, size, mix(from, [20, 24, 40], 0.55), mix(to, [180, 220, 255], 0.25), 0.35);
  const dust = 10;
  for (let i = 0; i < dust; i += 1) {
    const speed = 0.7 + level * 1.1 + (i % 3) * 0.08;
    const ang = frame.time * speed + i * 0.9;
    const orbit = r * (0.25 + (i % 5) * 0.12) * (1 + level * 0.15);
    const x = c + Math.cos(ang) * orbit + pointer.x * r * 0.18;
    const y = c + Math.sin(ang * 0.8) * orbit * 0.72 + pointer.y * r * 0.18;
    ctx.fillStyle = css(i % 2 ? to : from, 0.35 + level * 0.5);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.8, size * 0.012), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  const cracks = 2 + Math.round(level * 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < cracks; i += 1) {
    const base = frame.time * (0.8 + level * 0.6) + i * 1.7;
    ctx.beginPath();
    const steps = 5;
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const ang = base + t * 1.1 + Math.sin(base * 3 + s) * 0.25;
      const rad = r * (0.72 + t * 0.26);
      const x = c + Math.cos(ang) * rad;
      const y = c + Math.sin(ang) * rad;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = css(mix(to, [255, 255, 255], 0.45), 0.25 + level * 0.7);
    ctx.lineWidth = Math.max(1, size * (0.012 + level * 0.012));
    ctx.stroke();
  }
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

export const CrystalOrb = (props: OrbProps) => <CanvasOrb {...props} label={props.label ?? 'Crystal orb'} draw={drawCrystal} />;
export const StrandsOrb = (props: OrbProps) => <CanvasOrb {...props} label={props.label ?? 'Strands orb'} draw={drawStrands} />;
export const IridescenceOrb = (props: OrbProps) => <CanvasOrb {...props} label={props.label ?? 'Iridescence orb'} draw={drawIridescence} />;
