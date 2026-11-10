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
  vec3 p = vec3(uv * (0.82 + uLevel * 0.06), z);
  float t = uTime;
  float n = sin(p.x * 3.1 + sin(p.y * 2.3 + t * 0.72) + t * 0.42);
  n += 0.85 * sin(p.y * 4.0 - p.z * 2.5 + t * 0.58);
  n += 0.7 * sin((p.x + p.z) * 4.6 + t * 0.8);
  n += 0.45 * sin(p.z * 5.4 + p.y * 1.6 - t * 0.36);
  float v = fract(n * 0.27 + 0.12);
  vec3 gold = vec3(0.98, 0.76, 0.28);
  vec3 vein = mix(uFrom, uTo, smoothstep(0.08, 0.92, v));
  vein = mix(vein, gold, smoothstep(0.68, 0.9, fract(n * 0.37 + t * 0.05)));
  vec3 milk = vec3(0.94, 0.96, 0.99);
  vec3 glass = mix(milk, vein, 0.82);
  glass *= 0.38 + 0.74 * z;
  float fres = pow(1.0 - z, 2.05);
  vec2 shine = uv - vec2(-0.3, 0.34);
  float spec = pow(clamp(1.0 - length(shine / vec2(0.32, 0.2)), 0.0, 1.0), 4.0);
  float glint = pow(clamp(1.0 - length((uv - vec2(0.4, -0.32)) / 0.5), 0.0, 1.0), 14.0);
  float caustic = pow(0.5 + 0.5 * sin(n * 2.1 + t), 3.0);
  vec3 col = glass;
  col += vein * fres * 0.4;
  col = mix(col, vec3(1.0), fres * 0.32);
  col += vec3(1.0) * spec * (0.85 + uLevel * 0.15);
  col += mix(vein, vec3(1.0), 0.35) * glint * 0.55;
  col += vein * caustic * 0.22 * z;
  col *= edge;
  gl_FragColor = vec4(col * edge, edge);
}
`;

const FLUID = `
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
  float t = uTime;
  vec3 ink = vec3(0.03, 0.04, 0.08);
  vec3 cols[4];
  cols[0] = vec3(0.12, 0.52, 1.0);
  cols[1] = vec3(0.55, 0.2, 1.0);
  cols[2] = vec3(1.0, 0.25, 0.48);
  cols[3] = vec3(1.0, 0.5, 0.14);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float sp = 0.42 + fi * 0.27;
    vec2 c = vec2(
      cos(t * sp + fi * 1.9) * (0.32 + 0.08 * sin(t * 0.53 + fi * 1.3)),
      sin(t * sp * 0.71 + fi * 2.4) * (0.3 + 0.1 * cos(t * 0.37 + fi))
    );
    float d = length(uv - c);
    float blob = exp(-d * d * (3.4 - uLevel * 0.6));
    vec3 hue = mix(cols[i], mix(uFrom, uTo, fi / 3.0), 0.28);
    ink += hue * blob;
  }
  float fres = pow(1.0 - z, 1.8);
  vec3 col = 1.0 - exp(-ink * (0.85 + 0.35 * z));
  col = mix(col, vec3(1.0), fres * 0.08);
  vec2 shine = uv - vec2(-0.3, 0.32);
  float spec = pow(clamp(1.0 - length(shine / vec2(0.22, 0.14)), 0.0, 1.0), 5.0);
  col += vec3(1.0) * spec * 0.28;
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
  colorTo = '#fb7185',
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
    const frag = compile(gl.FRAGMENT_SHADER, liveRef.current.kind === 'marble' ? MARBLE : FLUID);
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

    let time = 0;
    let last = performance.now();
    let active = true;
    let shown = false;
    let frame = 0;
    const draw = (now: number) => {
      const live = liveRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const level = live.reduced ? 0 : (live.levelRef?.current ?? 0);
      const rate = live.reduced || !active ? 0 : RATE[live.state] * live.speed * (0.72 + level * 0.9);
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
  return <GlassOrb kind="marble" label="Marble" {...props} />;
}

export function FluidOrb(props: OrbProps) {
  return (
    <GlassOrb
      {...props}
      kind="fluid"
      label={props.label ?? 'Fluid'}
      colorFrom={props.colorFrom ?? '#38bdf8'}
      colorTo={props.colorTo ?? '#fb7185'}
    />
  );
}
