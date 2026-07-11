"use client";

import { AirplaneTakeoff, FlagCheckered } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import type { RunwayMomentDto } from "../../lib/api-types";

const AUTO_DISMISS_MS = 6000;

/**
 * Runway Moment is one of the two screens the golden-hour gradient "owns"
 * per the palette philosophy (the other being the Golden Hour panel) — a
 * full-screen celebratory background, not the quiet neutral surface
 * ordinary cards sit on. Uses --ease-spring (a genuine "moment" screen),
 * not the short standard transitions ordinary UI gets.
 */
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-golden-hour px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="mx-6 max-w-sm rounded-3xl border border-white/25 bg-surface-raised px-8 py-10 text-center shadow-card"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.72 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.64, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {moment.phase === "TAKEOFF" ? (
              <AirplaneTakeoff weight="fill" size={40} className="mx-auto text-amber-500" aria-hidden="true" />
            ) : (
              <FlagCheckered weight="fill" size={40} className="mx-auto text-amber-500" aria-hidden="true" />
            )}
            <h2 className="mt-4 font-display text-3xl italic text-text-primary">{moment.headline}</h2>
            <p className="mt-2 text-sm text-text-secondary">{moment.subtext}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-6 rounded-pill border border-border px-4 py-1.5 text-xs text-text-secondary transition-all duration-ui ease-standard hover:brightness-[1.06] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
