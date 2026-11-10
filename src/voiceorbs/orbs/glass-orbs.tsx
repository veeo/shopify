'use client';

import { useEffect, useRef, useState } from 'react';
import type { OrbProps, OrbState } from '@/voiceorbs/lib/orb-state';
import { ERROR_COLOR_FROM, ERROR_COLOR_TO, hexToRgb, orbVars } from '@/voiceorbs/lib/orb-state';
import { useReducedMotion } from '@/voiceorbs/lib/use-reduced-motion';
import { useWebGLSupport } from '@/voiceorbs/lib/use-webgl-support';
import { observeActivity, useOnScreen } from '@/voiceorbs/lib/use-in-view';
import { SphereFallback } from '@/voiceorbs/orbs/orb-boundary';

type Kind = 'marble' | 'fluid';

const RATE: Record<OrbState, number> = {
  idle: 1,
  hover: 1,
  selected: 1,
  connecting: 1.15,
  listening: 1.45,
  thinking: 1.2,
  speaking: 1.7,
  error: 1.3,
  disabled: 0,
};

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/** Milky glass marble with a soft blue-to-purple ribbon. No dark veins. */
const MARBLE = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uLevel;
uniform vec3 uFrom;
uniform vec3 uTo;

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
  float r = length(uv);
  float edge = 1.0 - smoothstep(0.975, 1.0, r);
  if (edge <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float z = sqrt(max(0.0, 1.0 - r * r));
  float t = uTime * (0.55 + uLevel * 0.35);
  vec3 p = vec3(uv * 0.92, z);

  // Soft S-curve ribbon drifting inside the milk.
  float ribbon = p.x * 1.35 + sin(p.y * 2.4 + t * 0.65) * 0.55 + cos(p.z * 1.8 - t * 0.4) * 0.28;
  ribbon += 0.22 * sin(p.y * 3.2 - p.x * 1.1 + t * 0.5);
  float band = exp(-pow(ribbon * 1.25, 2.0) * 1.35);
  float soft = exp(-pow(ribbon * 0.7 + 0.12, 2.0) * 0.7);

  vec3 milk = vec3(0.96, 0.97, 0.995);
  vec3 blue = mix(uFrom, vec3(0.18, 0.38, 0.95), 0.35);
  vec3 violet = mix(uTo, vec3(0.62, 0.28, 0.95), 0.4);
  float hue = smoothstep(-0.4, 0.55, ribbon + 0.2 * sin(t * 0.3 + p.y * 2.0));
  vec3 swirl = mix(blue, violet, hue);
  swirl = mix(swirl, vec3(0.78, 0.55, 1.0), soft * 0.28);

  vec3 col = mix(milk, swirl, clamp(band * 0.92 + soft * 0.35, 0.0, 1.0));
  col = mix(col, milk, 0.18 * (1.0 - z));

  float fres = pow(1.0 - z, 2.1);
  vec2 shine = uv - vec2(-0.28, 0.34);
  float spec = pow(clamp(1.0 - length(shine / vec2(0.34, 0.22)), 0.0, 1.0), 3.6);
  float rim = pow(clamp(1.0 - length((uv - vec2(0.38, -0.3)) / 0.55), 0.0, 1.0), 12.0);

  col *= 0.78 + 0.32 * z;
  col = mix(col, vec3(1.0), fres * 0.42);
  col += vec3(1.0) * spec * (0.72 + uLevel * 0.18);
  col += mix(swirl, vec3(1.0), 0.5) * rim * 0.35;
  col *= edge;
  gl_FragColor = vec4(col * edge, edge);
}
`;

/** Soft glowing bubbles in a clear glass shell. No black, plenty of drift. */
const BALLS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uLevel;
uniform vec3 uFrom;
uniform vec3 uTo;

vec3 ballHue(float i) {
  float k = mod(i, 6.0);
  vec3 violet = mix(vec3(0.58, 0.32, 0.98), uFrom, 0.35);
  vec3 purple = mix(vec3(0.72, 0.28, 0.95), uTo, 0.25);
  vec3 magenta = mix(vec3(0.95, 0.35, 0.72), uTo, 0.4);
  vec3 rose = vec3(0.98, 0.48, 0.7);
  vec3 lilac = vec3(0.78, 0.52, 1.0);
  if (k < 1.0) return violet;
  if (k < 2.0) return purple;
  if (k < 3.0) return magenta;
  if (k < 4.0) return rose;
  if (k < 5.0) return lilac;
  return mix(violet, rose, 0.45);
}

vec3 ballHome(float i) {
  if (i < 1.0) return vec3(0.0, 0.02, 0.08);
  if (i < 2.0) return vec3(0.18, -0.22, 0.04);
  if (i < 3.0) return vec3(-0.24, 0.08, 0.06);
  if (i < 4.0) return vec3(0.26, 0.16, -0.02);
  if (i < 5.0) return vec3(-0.08, 0.26, 0.02);
  return vec3(0.08, -0.08, -0.06);
}

float ballRad(float i) {
  if (i < 1.0) return 0.32;
  if (i < 2.0) return 0.24;
  if (i < 3.0) return 0.2;
  if (i < 4.0) return 0.18;
  if (i < 5.0) return 0.15;
  return 0.16;
}

vec4 field(vec3 p, float t) {
  vec4 acc = vec4(0.0);
  float drift = 0.12 + uLevel * 0.1;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float sp = 0.55 + fi * 0.08;
    vec3 c = ballHome(fi) + vec3(
      sin(t * sp + fi * 1.7) * drift,
      cos(t * sp * 0.82 + fi * 2.2) * drift * 0.9,
      sin(t * sp * 0.55 + fi * 1.1) * drift * 0.45
    );
    float rad = ballRad(fi) * (1.0 + 0.04 * sin(t * 0.7 + fi));
    vec3 rel = p - c;
    float dist = length(rel);
    float d = dist - rad;
    float cover = smoothstep(0.11, -0.03, d);
    float core = smoothstep(0.05, -0.05, d);
    float glow = exp(-max(d, 0.0) * 5.8) * 0.75;
    vec3 bn = normalize(rel + vec3(0.0001));
    float shade = clamp(dot(bn, normalize(vec3(-0.2, 0.75, 0.55))), 0.0, 1.0);
    vec3 hue = ballHue(fi);
    vec3 body = hue * (0.92 + 0.3 * shade);
    body += vec3(1.0) * pow(shade, 9.0) * 0.32;
    body = mix(body, vec3(1.0), core * 0.22);
    float room = 1.0 - acc.a;
    float amount = clamp(cover + glow * 0.8, 0.0, 1.0) * room;
    acc.rgb += body * amount;
    acc.a += amount;
  }
  return acc;
}

vec3 over(vec3 base, vec4 layer) {
  return base * (1.0 - layer.a) + layer.rgb;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
  float r2 = dot(uv, uv);
  if (r2 > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float t = uTime;
  vec3 ro = vec3(0.0, 0.0, 2.4);
  vec3 rd = normalize(vec3(uv * 0.86, -1.7));
  float b = dot(ro, rd);
  float disc = b * b - (dot(ro, ro) - 1.0);
  if (disc < 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float tHit = -b - sqrt(disc);
  vec3 hit = ro + rd * tHit;
  vec3 n = normalize(hit);
  vec3 inside = refract(rd, n, 0.66);
  if (dot(inside, inside) < 0.001) inside = reflect(rd, n);
  vec3 bent = hit * 0.58;
  vec4 front = field(bent + inside * 0.14, t);
  vec4 mid = field(bent + inside * 0.52 + n * 0.05, t);
  vec4 back = field(bent + inside * 0.95 - n * 0.04, t);
  vec3 balls = over(over(back.rgb, mid), front);
  float cover = clamp(front.a + mid.a * (1.0 - front.a) + back.a * (1.0 - front.a) * (1.0 - mid.a), 0.0, 1.0);

  // Warm pink core behind the bubbles.
  float coreGlow = exp(-length(bent.xy) * 2.4) * (0.55 + 0.25 * sin(t * 0.8));
  vec3 core = mix(vec3(1.0, 0.55, 0.72), mix(uFrom, uTo, 0.5), 0.35);
  vec3 glass = mix(vec3(0.99, 0.97, 1.0), mix(uFrom, uTo, 0.35), 0.08);
  vec3 col = glass * (1.0 - cover) + balls;
  col += core * coreGlow * (1.0 - cover * 0.55);

  float fres = pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 2.0);
  col = mix(col, vec3(1.0), fres * 0.55);
  float spec = pow(clamp(dot(n, normalize(vec3(-0.3, 0.65, 0.7))), 0.0, 1.0), 20.0);
  float cap = pow(clamp(dot(n, normalize(vec3(-0.05, 0.92, 0.28))), 0.0, 1.0), 1.6);
  col += vec3(1.0) * spec * 0.65;
  col = mix(col, vec3(1.0), cap * 0.38);
  float edge = 1.0 - smoothstep(0.985, 1.0, sqrt(r2));
  // Bright rim like the reference.
  col = mix(col, vec3(1.0), smoothstep(0.82, 0.98, sqrt(r2)) * 0.35);
  col *= edge;
  gl_FragColor = vec4(col * edge, edge);
}
`;

const toUnit = (hex: string): [number, number, number] => {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
};

function GlassOrb({
  kind,
  state = 'idle',
  size = 144,
  speed = 1,
  colorFrom = '#1d4ed8',
  colorTo = '#a855f7',
  levelRef,
  label = 'Glass orb',
  className,
  ref,
}: OrbProps & { kind: Kind }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const webgl = useWebGLSupport();
  const screen = useOnScreen();
  const onScreen = screen.on;
  const [painted, setPainted] = useState(false);
  const [lost, setLost] = useState(false);
  const liveRef = useRef({ state, speed, colorFrom, colorTo, reduced, kind, levelRef });

  useEffect(() => {
    liveRef.current = { state, speed, colorFrom, colorTo, reduced, kind, levelRef };
  }, [state, speed, colorFrom, colorTo, reduced, kind, levelRef]);

  useEffect(() => {
    if (webgl !== true || !onScreen) return;
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: 'low-power',
    });
    if (!gl) {
      setLost(true);
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vert = compile(gl.VERTEX_SHADER, VERT);
    const frag = compile(gl.FRAGMENT_SHADER, liveRef.current.kind === 'marble' ? MARBLE : BALLS);
    const program = gl.createProgram();
    if (!vert || !frag || !program) {
      setLost(true);
      return;
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      setLost(true);
      return;
    }
    gl.useProgram(program);
    gl.clearColor(0, 0, 0, 0);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'uRes');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uLevel = gl.getUniformLocation(program, 'uLevel');
    const uFrom = gl.getUniformLocation(program, 'uFrom');
    const uTo = gl.getUniformLocation(program, 'uTo');

    let px = 0;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const next = Math.max(1, Math.round(size * dpr));
      if (next === px) return;
      px = next;
      canvas.width = next;
      canvas.height = next;
      gl.viewport(0, 0, next, next);
      gl.uniform2f(uRes, next, next);
    };
    fit();

    let time = Math.random() * 12;
    let last = performance.now();
    let active = true;
    let shown = false;
    let frame = 0;
    const draw = (now: number) => {
      const live = liveRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const raw = live.levelRef?.current;
      const hasLive = typeof raw === 'number' && raw >= 0;
      const voiced = live.state === 'listening' || live.state === 'speaking';
      const level = live.reduced ? 0 : hasLive ? raw : voiced ? 0.35 : 0;
      // Bubbles keep a lively idle drift. Marble keeps a slower ribbon.
      const pace = live.kind === 'fluid' ? 0.95 * (1 + level * 0.75) : 0.85 + level * 0.7;
      const rate = live.reduced || !active ? 0 : RATE[live.state] * Math.max(live.speed, 0) * pace;
      time += dt * rate;
      const error = live.state === 'error' ? 1 : 0;
      const from = toUnit(error ? ERROR_COLOR_FROM : live.colorFrom);
      const to = toUnit(error ? ERROR_COLOR_TO : live.colorTo);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uLevel, level);
      gl.uniform3f(uFrom, from[0], from[1], from[2]);
      gl.uniform3f(uTo, to[0], to[1], to[2]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      if (active || !shown) draw(now);
      if (!shown) {
        shown = true;
        setPainted(true);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const onLost = (event: Event) => {
      event.preventDefault();
      setLost(true);
      setPainted(false);
    };
    canvas.addEventListener('webglcontextlost', onLost);
    const stopWatch = observeActivity(host, (next) => {
      active = next;
    });

    return () => {
      cancelAnimationFrame(frame);
      stopWatch();
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      setPainted(false);
    };
  }, [webgl, onScreen, size, kind]);

  const setHost = (node: HTMLDivElement | null) => {
    hostRef.current = node;
    screen.ref(node);
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div
      ref={setHost}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
        position: 'relative',
        background: 'transparent',
      }}
    >
      {webgl === false || lost ? (
        <SphereFallback from={colorFrom} to={colorTo} />
      ) : onScreen ? (
        <canvas
          ref={canvasRef}
          style={{
            width: size,
            height: size,
            display: 'block',
            background: 'transparent',
            opacity: painted ? 1 : 0,
          }}
        />
      ) : null}
    </div>
  );
}

export function MarbleOrb(props: OrbProps) {
  return (
    <GlassOrb
      {...props}
      kind="marble"
      label={props.label ?? 'Marble'}
      colorFrom={props.colorFrom ?? '#1d4ed8'}
      colorTo={props.colorTo ?? '#a855f7'}
    />
  );
}

export function BallOrb(props: OrbProps) {
  return (
    <GlassOrb
      {...props}
      kind="fluid"
      label={props.label ?? 'Bubbles'}
      colorFrom={props.colorFrom ?? '#7c5cff'}
      colorTo={props.colorTo ?? '#fb7185'}
    />
  );
}
