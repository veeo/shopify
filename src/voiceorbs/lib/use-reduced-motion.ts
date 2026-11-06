// VoiceOrbs (MIT) © 2026 Alexis Munoz — https://github.com/amunozdev/voiceorbs
'use client';

import { useSyncExternalStore } from 'react';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;

export const subscribeReducedMotion = (onChange: () => void): (() => void) => {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

export const useReducedMotion = (): boolean =>
  useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
