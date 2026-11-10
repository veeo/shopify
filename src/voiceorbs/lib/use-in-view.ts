// VoiceOrbs (MIT) © 2026 Alexis Munoz — https://github.com/amunozdev/voiceorbs
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export const observeActivity = (
  el: Element,
  onChange: (active: boolean) => void,
): (() => void) => {
  let inView = true;
  let pageVisible = document.visibilityState === 'visible';
  // Start unknown so the first observation reports the real visibility. Callers that
  // begin hidden, such as a WebGL orb, would otherwise never hear that they are on screen.
  let active = false;

  const sync = () => {
    const next = inView && pageVisible;
    if (next === active) return;
    active = next;
    onChange(next);
  };

  const observer =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          inView = entries[entries.length - 1]?.isIntersecting ?? true;
          sync();
        });
  observer?.observe(el);

  const onVisibility = () => {
    pageVisible = document.visibilityState === 'visible';
    sync();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    observer?.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  };
};

export const useInView = (
  ref: RefObject<Element | null>,
  onChange?: (active: boolean) => void,
): RefObject<boolean> => {
  const activeRef = useRef(true);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const unobserve = observeActivity(el, (active) => {
      activeRef.current = active;
      onChangeRef.current?.(active);
    });
    return () => {
      unobserve();
      activeRef.current = true;
    };
  }, [ref]);

  return activeRef;
};

/** False until the element is actually on screen, so an offscreen orb never opens a WebGL context. */
export const useOnScreen = (): { ref: (node: Element | null) => void; on: boolean } => {
  const [on, setOn] = useState(false);
  const cleanup = useRef<(() => void) | null>(null);
  const ref = useCallback((node: Element | null) => {
    cleanup.current?.();
    cleanup.current = node ? observeActivity(node, setOn) : null;
  }, []);

  useEffect(() => () => cleanup.current?.(), []);

  return { ref, on };
};
