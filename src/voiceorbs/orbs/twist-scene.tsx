// Twisted Colorful Sphere (MIT) © Alexandre Di Guida — https://github.com/Alex-DG/twisted-colorful-sphere
// Vertex deformation and cosine palette from that demo, following Codrops WebGL Blobs.
'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import type { RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { type OrbState } from '@/voiceorbs/lib/orb-state';
import type { OrbFrame } from '@/voiceorbs/lib/use-orb-animator';
import { observeActivity } from '@/voiceorbs/lib/use-in-view';
import { useReducedMotion } from '@/voiceorbs/lib/use-reduced-motion';

const NOISE = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

  float pnoise(vec3 P, vec3 rep) {
    vec3 Pi0 = mod(floor(P), rep);
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
  }
`;

const VERTEX = `
  varying float vDistort;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uNoiseDensity;
  uniform float uNoiseStrength;
  uniform float uFrequency;
  uniform float uAmplitude;
  ${NOISE}
  mat3 rotation3dY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
  }
  void main() {
    float t = uTime * uSpeed;
    float distortion = pnoise((normal + t) * uNoiseDensity, vec3(10.0)) * uNoiseStrength;
    vec3 pos = position + (normal * distortion);
    float angle = sin(uv.y * uFrequency + t) * uAmplitude;
    pos = rotation3dY(angle) * pos;
    vDistort = distortion;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT = `
  varying float vDistort;
  uniform float uIntensity;
  uniform vec3 uFrom;
  uniform vec3 uTo;
  uniform float uCustom;
  vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(9.28318 * (c * t + d));
  }
  void main() {
    float distort = vDistort * uIntensity;
    vec3 rainbow = cosPalette(distort, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
    float band = clamp(distort * 0.35 + 0.5, 0.0, 1.0);
    float luma = dot(rainbow, vec3(0.299, 0.587, 0.114));
    vec3 tinted = mix(uFrom, uTo, band) * (0.65 + 0.7 * luma);
    gl_FragColor = vec4(mix(rainbow, tinted, uCustom), 1.0);
  }
`;

const STATE_RATE: Record<OrbState, number> = {
  idle: 1,
  connecting: 1.15,
  listening: 1.35,
  thinking: 1.2,
  speaking: 1.6,
  error: 1.75,
  disabled: 0,
};

function TwistMesh({
  frameRef,
  colorFrom,
  colorTo,
  custom,
}: {
  frameRef: RefObject<OrbFrame>;
  colorFrom: string;
  colorTo: string;
  custom: boolean;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(0);
  const invalidate = useThree((three) => three.invalidate);
  const tintRef = useRef({ from: new THREE.Color(colorFrom), to: new THREE.Color(colorTo), custom: custom ? 1 : 0 });
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0.2 },
      uNoiseDensity: { value: 1.5 },
      uNoiseStrength: { value: 0.2 },
      uFrequency: { value: 3 },
      uAmplitude: { value: 6 },
      uIntensity: { value: 7 },
      uFrom: { value: new THREE.Color('#22d3ee') },
      uTo: { value: new THREE.Color('#f472b6') },
      uCustom: { value: 0 },
    }),
    [],
  );

  useEffect(() => {
    const tint = tintRef.current;
    tint.from.set(colorFrom);
    tint.to.set(colorTo);
    tint.custom = custom ? 1 : 0;
    invalidate();
  }, [colorFrom, colorTo, custom, invalidate]);

  useFrame((_, delta) => {
    const material = matRef.current;
    if (!material) return;
    const frame = frameRef.current;
    const kick = frame.live ? frame.level : 0;
    const rate = frame.reduced ? 0 : STATE_RATE[frame.state];
    const tint = tintRef.current;
    elapsed.current += Math.min(delta, 0.1);
    material.uniforms.uTime.value = elapsed.current;
    material.uniforms.uSpeed.value = 0.2 * rate * (1 + 0.85 * kick);
    material.uniforms.uNoiseStrength.value = 0.2 + 0.32 * kick;
    material.uniforms.uAmplitude.value = 6 + 2.4 * kick;
    material.uniforms.uFrom.value.copy(tint.from);
    material.uniforms.uTo.value.copy(tint.to);
    material.uniforms.uCustom.value = tint.custom;
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}

export function TwistScene({
  frameRef,
  colorFrom,
  colorTo,
  custom,
}: {
  frameRef: RefObject<OrbFrame>;
  colorFrom: string;
  colorTo: string;
  custom: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return observeActivity(canvas, setActive);
  }, []);

  return (
    <Canvas
      ref={canvasRef}
      frameloop={reduced || !active ? 'demand' : 'always'}
      camera={{ position: [0, 0, 3], fov: 75 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      resize={{ offsetSize: true }}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NoToneMapping;
        gl.outputColorSpace = THREE.LinearSRGBColorSpace;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <TwistMesh frameRef={frameRef} colorFrom={colorFrom} colorTo={colorTo} custom={custom} />
    </Canvas>
  );
}
