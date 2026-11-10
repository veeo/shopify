import type { OrbState } from '@/voiceorbs/lib/orb-state';

/**
 * Shared presence for every sidekick orb. Shader styles read these as a
 * baseline and add their own surface reaction on top. See ORBS.md.
 */
export type OrbPresence = 'rest' | 'hover' | 'selected' | 'listening' | 'thinking' | 'speaking' | 'reduced';

export type OrbLook = {
  /** 0–1 energy of the surface motion. */
  intensity: number;
  /** Multiplier on the style's idle speed. */
  speed: number;
  /** 0–1 rim light. Kept small so it never becomes a halo. */
  glow: number;
  /** Visual scale inside the fixed slot. Does not change layout. */
  scale: number;
  /** How fast this look is approached, in 1/seconds. */
  enter: number;
};

export const ORB_LOOK: Record<OrbPresence, OrbLook> = {
  rest: { intensity: 0.16, speed: 0.35, glow: 0.1, scale: 1, enter: 5 },
  hover: { intensity: 0.16, speed: 0.35, glow: 0.1, scale: 1, enter: 5 },
  selected: { intensity: 0.16, speed: 0.35, glow: 0.1, scale: 1, enter: 5 },
  listening: { intensity: 0.7, speed: 1, glow: 0.18, scale: 1, enter: 14 },
  thinking: { intensity: 0.4, speed: 0.6, glow: 0.12, scale: 1, enter: 8 },
  speaking: { intensity: 0.78, speed: 1.1, glow: 0.2, scale: 1, enter: 14 },
  reduced: { intensity: 0.04, speed: 0, glow: 0.06, scale: 1, enter: 8 },
};

/** Glow may extend this fraction of the diameter past the circle, and no further. */
export const ORB_GLOW_MARGIN = 0.12;

/** Pinned visible diameters. The slot box never changes with state. */
export const ORB_SIZE = {
  nav: 31,
  composer: 32,
  editor: 36,
  card: 48,
  voice: 48,
  boot: 56,
  mention: 18,
  palette: 20,
  menu: 24,
} as const;

export const presenceFor = (state: OrbState | undefined, reduced: boolean): OrbPresence => {
  if (reduced) return 'reduced';
  switch (state) {
    case 'hover':
      return 'hover';
    case 'selected':
      return 'selected';
    case 'listening':
      return 'listening';
    case 'thinking':
    case 'connecting':
      return 'thinking';
    case 'speaking':
      return 'speaking';
    default:
      return 'rest';
  }
};
