'use client';

import { Component, type ReactNode } from 'react';

/** Keeps one orb from taking down the admin when a WebGL context cannot be created. */
export class OrbBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function SphereFallback({ from, to }: { from: string; to: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: `radial-gradient(circle at 32% 28%, #fff 0%, ${from} 28%, ${to} 72%, #111 100%)`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28)',
      }}
    />
  );
}
