'use client';

/**
 * Voice-orb adapter of React Bits Orb
 * https://reactbits.dev/backgrounds/orb
 * https://github.com/DavidHDev/react-bits (MIT + Commons Clause)
 */

import { useEffect, useRef, useState } from 'react';
import type { OrbProps, OrbState } from '@/voiceorbs/lib/orb-state';
import { ERROR_COLOR_FROM, ERROR_COLOR_TO, hexToRgb, orbVars } from '@/voiceorbs/lib/orb-state';
import { useReducedMotion } from '@/voiceorbs/lib/use-reduced-motion';
import { useWebGLSupport } from '@/voiceorbs/lib/use-webgl-support';
import { observeActivity, useOnScreen } from '@/voiceorbs/lib/use-in-view';
import { SphereFallback } from '@/voiceorbs/orbs/orb-boundary';

const FOCAL = 3.2;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uRotation;
uniform vec2 uReach;
uniform float uNear;
uniform float uAwake;
uniform vec3 uBackground;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uScale;
uniform float uWobble;
uniform float uGlow;
uniform float uBleed;
uniform float uHighlight;
uniform float uSwirl;
uniform float uOrbit;
uniform vec2 uEcho;
uniform float uReveal;
uniform float uOpacity;
uniform float uTrail;
uniform vec2 uTilt;
out vec4 outColor;

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
  p3 += dot(p3, p3.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
}

float snoise3(vec3 p) {
  const float K1 = 0.333333333;
  const float K2 = 0.166666667;
  vec3 i = floor(p + (p.x + p.y + p.z) * K1);
  vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
  vec3 e = step(vec3(0.0), d0 - d0.yzx);
  vec3 i1 = e * (1.0 - e.zxy);
  vec3 i2 = 1.0 - e.zxy * (1.0 - e);
  vec3 d1 = d0 - (i1 - K2);
  vec3 d2 = d0 - (i2 - K1);
  vec3 d3 = d0 - 0.5;
  vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
  vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
  return dot(vec4(31.316), n);
}

float light1(float intensity, float attenuation, float dist) {
  return intensity / (1.0 + dist * attenuation);
}

float light2(float intensity, float attenuation, float dist) {
  return intensity / (1.0 + dist * dist * attenuation);
}

vec4 draw(vec2 uv) {
  float rawLen = length(uv);
  vec2 dir = rawLen > 0.0001 ? uv / rawLen : vec2(1.0, 0.0);
  float reachAmount = length(uReach);
  vec2 reachDir = reachAmount > 0.00001 ? uReach / reachAmount : vec2(1.0, 0.0);
  float facing = exp((dot(dir, reachDir) - 1.0) * 3.2);
  float len = max(rawLen - reachAmount * facing * smoothstep(0.25, 0.65, rawLen), 0.0);
  uv = dir * len;
  float ang = atan(dir.y, dir.x);
  float invLen = len > 0.0 ? 1.0 / len : 0.0;
  float near = facing * uNear;
  float bgLuminance = dot(uBackground, vec3(0.299, 0.587, 0.114));

  float n0 = snoise3(vec3(uv * 0.65, uTime * 0.5)) * 0.5 + 0.5;
  float r0 = mix(0.8 - 0.04 * uWobble, 0.8 + 0.04 * uWobble, n0);
  float d0 = distance(uv, (r0 * invLen) * uv);
  float v0 = light1(1.0, 10.0 / uGlow, d0);
  // Wider outer falloff so the ring reads thick at small avatar sizes.
  v0 *= smoothstep(r0 * 1.12, r0 * 0.92, len);
  float reach = max(uBleed, 0.04);
  // Hollow less of the core — speaking-thick band even when idle.
  float innerFade = smoothstep(r0 * (1.0 - 0.32 * reach), r0 * (1.0 - 0.02 * reach), len);
  v0 *= mix(innerFade, 1.0, bgLuminance * 0.7 * min(uBleed, 1.0));
  float body = smoothstep(0.8 - 0.32 * reach, 0.8, len);
  // Idle keeps the swirl near 50/50 so one hue doesn't pull the ring off-level.
  float clRaw = cos(ang + uSwirl) * 0.5 + 0.5;
  float cl = mix(0.5, clRaw, clamp(uAwake * 2.4 + 0.28, 0.0, 1.0));

  vec2 pos = vec2(cos(uOrbit), sin(uOrbit)) * r0;
  float d = distance(uv, pos);
  vec2 head = vec2(cos(uOrbit), sin(uOrbit));
  float lag = atan(head.x * dir.y - head.y * dir.x, dot(dir, head));
  float trail = uTrail > 0.0 ? smoothstep(0.0, 0.35, lag) * exp(-max(lag, 0.0) * 2.6 / uTrail) : 0.0;
  float v1 = (light2(1.5, 5.0, d) + trail * 0.6) * uHighlight;
  v1 *= light1(1.0, 50.0, d0);
  float band = v0 * smoothstep(1.0, mix(0.6, 1.0, n0 * 0.5), len) * body;
  float heat = pow(clamp(band / 0.82, 0.0, 1.0), 3.0);
  float bloom = light2(1.0, 160.0 / uGlow, max(len - r0, 0.0)) * smoothstep(0.4, 0.0, len - r0) * step(r0, len);

  float v2 = smoothstep(1.0, mix(0.6, 1.0, n0 * 0.5), len);
  float v3 = body;

  vec3 colBase = mix(uColor1, uColor2, cl);
  float fadeAmount = mix(1.0, 0.1, bgLuminance);

  float echoD = abs(len - r0 - uEcho.x);
  float echo = light1(1.0, 60.0, echoD) * smoothstep(0.12, 0.0, echoD) * uEcho.y;

  vec3 darkCol = mix(uColor3, colBase, v0);
  darkCol = (darkCol + v1) * v2 * v3 * (1.0 + uAwake + near * 0.35) + mix(colBase, vec3(1.0), 0.25) * heat * (0.28 + near * 0.3);
  darkCol = clamp(darkCol + colBase * (bloom * 0.1 + echo), 0.0, 1.0);

  vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
  lightCol = mix(uBackground, lightCol, clamp(v0 + echo, 0.0, 1.0));
  lightCol = mix(lightCol, colBase, clamp(v0, 0.0, 1.0) * clamp(near * 0.4 + uAwake, 0.0, 0.6));
  lightCol = clamp(mix(lightCol, vec3(1.0), clamp(v1 * 0.35, 0.0, 0.6)), 0.0, 1.0);

  vec3 finalCol = mix(darkCol, lightCol, bgLuminance);
  float alpha = max(max(finalCol.r, finalCol.g), finalCol.b);
  return vec4(finalCol / (alpha + 1e-5), alpha);
}

vec2 toPlane(vec2 p, out float hit) {
  float cx = cos(uTilt.x);
  float sx = sin(uTilt.x);
  float cy = cos(uTilt.y);
  float sy = sin(uTilt.y);
  vec3 ex = vec3(cy, 0.0, -sy);
  vec3 ey = vec3(sy * sx, cx, cy * sx);
  vec3 normal = vec3(sy * cx, -sx, cy * cx);
  vec3 origin = vec3(0.0, 0.0, ${FOCAL.toFixed(1)});
  vec3 ray = vec3(p, -${FOCAL.toFixed(1)});
  float denom = dot(normal, ray);
  float t = -dot(normal, origin) / (abs(denom) > 0.00001 ? denom : -0.00001);
  hit = t > 0.0 ? 1.0 : 0.0;
  vec3 q = origin + ray * t;
  return vec2(dot(q, ex), dot(q, ey));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / min(uResolution.x, uResolution.y) * 2.0;
  uv *= uScale;
  float hit = 1.0;
  if (abs(uTilt.x) + abs(uTilt.y) > 0.0001) uv = toPlane(uv, hit);

  float s = sin(uRotation);
  float c = cos(uRotation);
  uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

  vec4 col = draw(uv);
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  float alpha = clamp(col.a * hit * uReveal * uOpacity + dither, 0.0, 1.0);
  outColor = vec4(col.rgb * alpha * alpha, alpha);
}`;

const toUnit = (hex: string): [number, number, number] => {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
};

const mixHex = (a: string, b: string, t: number) => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
};

/**
 * Thick speaking look is the base for every live state. Idle keeps that body;
 * listening / thinking / speaking only add voice reaction on top.
 */
const THICK = { awake: 0.95, glow: 1.32, wobble: 0.35, trail: 0.85, highlight: 1.15 };

/** Voice states → motion rate. Visual thickness comes from THICK; speed is what changes. */
const TUNE: Record<
  OrbState,
  { speed: number; awake: number; glow: number; wobble: number; trail: number; highlight: number }
> = {
  idle: { ...THICK, speed: 0.35 },
  hover: { ...THICK, speed: 0.42 },
  selected: { ...THICK, speed: 0.45 },
  connecting: { ...THICK, speed: 0.9 },
  listening: { ...THICK, speed: 1.05 },
  thinking: { ...THICK, speed: 0.9 },
  speaking: { ...THICK, speed: 1.4 },
  error: { speed: 1.15, awake: 0.55, glow: 1.18, wobble: 1.1, trail: 0.7, highlight: 0.95 },
  disabled: { speed: 0, awake: 0.15, glow: 0.9, wobble: 0.08, trail: 0.25, highlight: 0.2 },
};

/**
 * UV zoom: a touch smaller than the old fill (0.82) so glow isn’t clipped,
 * but still large enough that the thick band reads at nav size.
 */
const ORBIT_SCALE = 0.9;

const reactsToVoice = (state: OrbState) =>
  state === 'listening' || state === 'thinking' || state === 'speaking' || state === 'connecting';

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
};

const link = (gl: WebGL2RenderingContext): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

export function OrbitOrb({
  state = 'idle',
  size = 144,
  speed = 1,
  colorFrom = '#9c43fe',
  colorTo = '#4cc2e9',
  levelRef,
  label = 'Orbit',
  className,
  ref,
}: OrbProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const webgl = useWebGLSupport();
  const screen = useOnScreen();
  const onScreen = screen.on;
  const [painted, setPainted] = useState(false);
  const [lost, setLost] = useState(false);
  const liveRef = useRef({ state, speed, colorFrom, colorTo, reduced, levelRef });

  useEffect(() => {
    liveRef.current = { state, speed, colorFrom, colorTo, reduced, levelRef };
  }, [state, speed, colorFrom, colorTo, reduced, levelRef]);

  useEffect(() => {
    if (webgl !== true || !onScreen) return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) {
      setLost(true);
      return;
    }

    const program = link(gl);
    if (!program) {
      setLost(true);
      return;
    }
    const u = program.uniforms;

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);

    const motion = {
      time: 0,
      swirl: 0,
      // Park the highlight at top-center so idle reads level, not randomly lopsided.
      orbit: Math.PI * 0.5,
      echo: 1,
      rotation: 0,
      hover: 0,
      near: 0,
      reachX: 0,
      reachY: 0,
      pulse: 0,
      pulseSpeed: 0,
      kick: 0,
      highlight: TUNE.idle.highlight,
    };

    let px = 0;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const next = Math.max(1, Math.round(size * dpr));
      if (next === px) return;
      px = next;
      canvas.width = next;
      canvas.height = next;
      gl.viewport(0, 0, next, next);
    };
    fit();

    let last = performance.now();
    let active = true;
    let shown = false;
    let frame = 0;

    const render = () => {
      const live = liveRef.current;
      const error = live.state === 'error' ? 1 : 0;
      const from = error ? ERROR_COLOR_FROM : live.colorFrom;
      const to = error ? ERROR_COLOR_TO : live.colorTo;
      const deep = mixHex(from, '#0a0a2a', 0.55);
      const c1 = toUnit(from);
      const c2 = toUnit(to);
      const c3 = toUnit(deep);
      const tune = TUNE[live.state];
      const raw = live.levelRef?.current;
      const hasLive = typeof raw === 'number' && raw >= 0;
      const reacting = reactsToVoice(live.state);
      // Thick base always; voice states layer level on top. Idle stays at full thickness.
      const level = live.reduced ? 0 : reacting ? (hasLive ? raw : 0.35) : 0;
      const awake = tune.awake * (reacting ? 0.85 + level * 0.45 : 1);

      gl.useProgram(program.program);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, motion.time);
      gl.uniform2f(u.uReach, motion.reachX, motion.reachY);
      gl.uniform1f(u.uNear, motion.near);
      gl.uniform1f(u.uAwake, awake);
      gl.uniform1f(u.uRotation, motion.rotation);
      gl.uniform3f(u.uBackground, 0, 0, 0);
      gl.uniform3fv(u.uColor1, c1);
      gl.uniform3fv(u.uColor2, c2);
      gl.uniform3fv(u.uColor3, c3);
      // Slightly smaller than a filled orb so the thick glow stays inside the canvas.
      gl.uniform1f(u.uScale, ORBIT_SCALE / (1 + motion.pulse * 0.85));
      gl.uniform1f(u.uWobble, tune.wobble * (1 + level * 0.35));
      gl.uniform1f(u.uGlow, tune.glow);
      gl.uniform1f(u.uBleed, 1);
      gl.uniform1f(u.uHighlight, motion.highlight);
      gl.uniform2f(u.uEcho, motion.echo * 0.55, motion.echo < 1 ? (1 - motion.echo) * (1 - motion.echo) : 0);
      gl.uniform1f(u.uSwirl, motion.swirl);
      gl.uniform1f(u.uOrbit, motion.orbit);
      gl.uniform1f(u.uReveal, 1);
      gl.uniform1f(u.uOpacity, live.state === 'disabled' ? 0.45 : 1);
      gl.uniform1f(u.uTrail, tune.trail);
      // Keep the ring face-on — never tilt the plane.
      gl.uniform2f(u.uTilt, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      const live = liveRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const tune = TUNE[live.state];
      const raw = live.levelRef?.current;
      const hasLive = typeof raw === 'number' && raw >= 0;
      const reacting = reactsToVoice(live.state);
      const level = live.reduced ? 0 : reacting ? (hasLive ? raw : 0.35) : 0;
      const rate =
        live.reduced || !active ? 0 : Math.max(live.speed, 0) * tune.speed * (1 + level * 0.75);
      const step = dt * rate;
      motion.time += step;
      // Idle keeps a steady swirl; voice states push harder with level.
      motion.swirl += step * (reacting ? 1.2 + level : 0.65) * (1 + motion.kick);
      motion.orbit -= step;
      motion.orbit = Math.atan2(Math.sin(motion.orbit), Math.cos(motion.orbit));
      motion.echo = Math.min(1, motion.echo + dt / 1.2);
      motion.kick *= Math.exp(-dt * 2.5);
      motion.pulseSpeed += (-170 * motion.pulse - 11 * motion.pulseSpeed) * dt;
      motion.pulse += motion.pulseSpeed * dt;
      const highlightTarget = tune.highlight * (1 + level * 0.35);
      motion.highlight += (highlightTarget - motion.highlight) * (1 - Math.exp(-dt / 0.18));
      // Soft awake reach without cursor — keeps the thick ring breathing.
      const targetHover = live.reduced ? 0 : tune.awake * (reacting ? 0.85 + level * 0.45 : 1);
      motion.hover += (targetHover - motion.hover) * (1 - Math.exp(-dt / 0.16));
      motion.near += (targetHover * 0.35 - motion.near) * (1 - Math.exp(-dt / 0.12));
      motion.reachX *= Math.exp(-dt * 3);
      motion.reachY *= Math.exp(-dt * 3);
      if (active || !shown) render();
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
      gl.deleteProgram(program.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      setPainted(false);
    };
  }, [webgl, onScreen, size]);

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
        overflow: 'visible',
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
