// Twisted Colorful Sphere (MIT) © Alexandre Di Guida — https://github.com/Alex-DG/twisted-colorful-sphere
'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { orbVars, type OrbProps } from '@/voiceorbs/lib/orb-state';
import { useOrbAnimator } from '@/voiceorbs/lib/use-orb-animator';
import { OrbBoundary, SphereFallback } from '@/voiceorbs/orbs/orb-boundary';

const TwistScene = dynamic(() => import('./twist-scene').then((mod) => mod.TwistScene), { ssr: false });

/** Matches voiceOrbTint.twist. This pair keeps the demo's original cosine palette. */
const DEFAULT_FROM = '#22d3ee';
const DEFAULT_TO = '#f472b6';

const same = (left: string, right: string) => left.toLowerCase() === right.toLowerCase();

export const TwistSphere = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = DEFAULT_FROM,
  colorTo = DEFAULT_TO,
  levelRef,
  label = 'Twisted colorful sphere',
  className,
  ref,
}: OrbProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const { frameRef } = useOrbAnimator(hostRef, { state, levelRef, speed });
  const custom = !(same(colorFrom, DEFAULT_FROM) && same(colorTo, DEFAULT_TO));
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
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      <OrbBoundary fallback={<SphereFallback from={colorFrom} to={colorTo} />}>
        <TwistScene frameRef={frameRef} colorFrom={colorFrom} colorTo={colorTo} custom={custom} engaged={state !== 'idle' && state !== 'disabled'} />
      </OrbBoundary>
    </div>
  );
};
