"use client";

import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { useEffect } from "react";
import type { CardRarityDto } from "../../lib/api-types";
import { RarityBadge } from "../ui/rarity-badge";

const AUTO_DISMISS_MS = 5000;

export interface UnlockToastData {
  kind: "AIRPORT" | "AIRCRAFT" | "AIRLINE";
  title: string;
  rarity: CardRarityDto;
}

export function UnlockToast({ toast, onDismiss }: { toast: UnlockToastData | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-rise-fade fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4 py-3 shadow-ui"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-gradient-golden-hour text-on-gradient">
        <Sparkle weight="fill" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-text-secondary">
          New {toast.kind.toLowerCase()} unlocked
        </p>
        <p className="truncate font-display text-lg italic text-text-primary">{toast.title}</p>
      </div>
      <RarityBadge rarity={toast.rarity} />
    </div>
  );
}
