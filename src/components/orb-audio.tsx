"use client";

import { createContext, useContext, useEffect, useEffectEvent, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import type { OrbState } from "@/voiceorbs/lib/orb-state";

type Feed = { agentId: string | null; state: OrbState };

type Store = {
  levelRef: RefObject<number>;
  get: () => Feed;
  subscribe: (listener: () => void) => () => void;
  publish: (token: object, agentId: string, state: OrbState) => void;
  clear: (token: object) => void;
};

const OrbAudioContext = createContext<Store | null>(null);

const idleFeed: Feed = { agentId: null, state: "idle" };

function createStore(): Store {
  const levelRef = { current: 0 };
  let feed = idleFeed;
  let owner: object | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    levelRef,
    get: () => feed,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    publish: (token, agentId, state) => {
      owner = token;
      if (state !== "listening" && state !== "speaking") levelRef.current = 0;
      if (feed.agentId === agentId && feed.state === state) return;
      feed = { agentId, state };
      emit();
    },
    clear: (token) => {
      if (owner !== token) return;
      owner = null;
      levelRef.current = 0;
      if (feed.agentId === null && feed.state === "idle") return;
      feed = idleFeed;
      emit();
    },
  };
}

export function OrbAudioProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createStore);
  return <OrbAudioContext.Provider value={store}>{children}</OrbAudioContext.Provider>;
}

/** Feeds the selected agent's orb from an existing recording or playback. `state` null releases it. */
export function useOrbAudioPublish(agentId: string, state: OrbState | null, readLevel: () => number) {
  const store = useContext(OrbAudioContext);
  const read = useEffectEvent(readLevel);
  useEffect(() => {
    if (!store || !state) return;
    const token = {};
    store.publish(token, agentId, state);
    let frame = 0;
    const tick = () => {
      store.levelRef.current = read();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      store.clear(token);
    };
  }, [store, agentId, state]);
}

/** Live VoiceOrbs state for one agent. Other agents, and idle, keep their own motion. */
export function useOrbAudio(agentId?: string): { state?: OrbState; levelRef?: RefObject<number> } {
  const store = useContext(OrbAudioContext);
  const feed = useSyncExternalStore(
    store ? store.subscribe : () => () => {},
    store ? store.get : () => idleFeed,
    () => idleFeed,
  );
  if (!store || !agentId || feed.agentId !== agentId || feed.state === "idle") return {};
  return { state: feed.state, levelRef: store.levelRef };
}
