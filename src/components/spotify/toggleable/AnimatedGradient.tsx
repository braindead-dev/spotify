"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";

type Props = {
  colors: string[];
  durationMs?: number;
};

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // Convert to 32bit integer
  }
  // return a positive hex string
  return Math.abs(h).toString(16);
}

export function AnimatedGradient({ colors, durationMs = 400 }: Props) {
  const keyStr = useMemo(() => colors.join("|"), [colors]);
  const id = useMemo(() => `gradient-canvas-${hash(keyStr)}`, [keyStr]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const mod = (await import("@/lib/gradient.js").catch(() => null)) as {
          Gradient?: new () => {
            initGradient: (selector: string, colors: string[]) => unknown;
          };
        } | null;
        type GradientCtor = new () => {
          initGradient: (selector: string, colors: string[]) => unknown;
        };
        const globalGradient = (
          globalThis as unknown as { Gradient?: GradientCtor }
        ).Gradient;
        const Gradient =
          (mod?.Gradient as GradientCtor | undefined) ?? globalGradient;
        if (!Gradient) return;
        if (cancelled) return;
        const g = new Gradient();
        g.initGradient(`#${id}`, colors);
      } catch {
        // no-op; optional feature
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [id, colors]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 h-full w-full">
      <AnimatePresence mode="sync">
        <motion.div
          key={id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durationMs / 1000, ease: (t: number) => t }}
          className="absolute inset-0"
        >
          <canvas id={id} className="h-full w-full" data-transition-in />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
