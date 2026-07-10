"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import type { RunwayMomentDto } from "../../lib/api-types";

const AUTO_DISMISS_MS = 6000;

export function RunwayMomentOverlay({
  moment,
  onDismiss,
}: {
  moment: RunwayMomentDto | null;
  onDismiss: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!moment) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moment, onDismiss]);

  return (
    <AnimatePresence>
      {moment && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="mx-6 max-w-sm rounded-3xl border border-runway-500/30 bg-ink-900 px-8 py-10 text-center shadow-runway-glow"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <span aria-hidden="true" className="text-4xl text-runway-400">
              {moment.phase === "TAKEOFF" ? "✈" : "◆"}
            </span>
            <h2 className="mt-4 font-display text-3xl italic text-mist-100">{moment.headline}</h2>
            <p className="mt-2 text-sm text-mist-300">{moment.subtext}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-6 rounded-full border border-ink-600 px-4 py-1.5 text-xs text-mist-300 transition-colors hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-altitude-400"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
