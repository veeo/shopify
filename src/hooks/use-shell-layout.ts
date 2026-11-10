"use client";

import { useEffect, useState } from "react";
import {
  readCoarsePointer,
  readSpanning,
  resolveShellLayout,
  type ShellLayout,
} from "@/lib/shell-layout";

const SSR_FALLBACK: ShellLayout = resolveShellLayout({ width: 1440 });

/** Live shell layout from viewport width, foldable spanning, and pointer coarseness. */
export function useShellLayout(): ShellLayout {
  const [layout, setLayout] = useState<ShellLayout>(SSR_FALLBACK);

  useEffect(() => {
    const measure = () => {
      setLayout(
        resolveShellLayout({
          width: document.documentElement.clientWidth,
          spanning: readSpanning(),
          coarsePointer: readCoarsePointer(),
        }),
      );
    };
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);

    const medias = [
      "(horizontal-viewport-segments: 2)",
      "(vertical-viewport-segments: 2)",
      "(pointer: coarse)",
    ]
      .map((query) => {
        try {
          return window.matchMedia(query);
        } catch {
          return null;
        }
      })
      .filter((media): media is MediaQueryList => Boolean(media));

    medias.forEach((media) => media.addEventListener("change", measure));
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      medias.forEach((media) => media.removeEventListener("change", measure));
    };
  }, []);

  return layout;
}
