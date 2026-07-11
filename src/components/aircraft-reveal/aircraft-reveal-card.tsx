"use client";

import { AirplaneTilt, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import type { AircraftAssignmentDto } from "../../lib/api-types";

const CONFIDENCE_COPY: Record<AircraftAssignmentDto["confidence"], string> = {
  HIGH: "Confirmed by live data",
  MEDIUM: "Likely, pending confirmation",
  LOW: "Typical aircraft for this flight",
};

export function AircraftRevealCard({ assignment }: { assignment: AircraftAssignmentDto | null }) {
  if (!assignment) {
    return (
      <EmptyState
        icon={<AirplaneTilt aria-hidden="true" />}
        title="Aircraft not yet known"
        description="Airlines usually confirm the exact aircraft a couple of hours before departure. Check back closer to boarding."
      />
    );
  }

  return (
    <Card className="overflow-hidden p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-eyebrow text-sky-500">Aircraft Reveal</p>
            <h2 className="mt-1 font-display text-2xl italic text-text-primary">{assignment.type.model}</h2>
            <p className="text-sm text-text-secondary">{assignment.type.manufacturer}</p>
          </div>
          <span
            className={`shrink-0 rounded-pill px-2.5 py-1 text-xs font-medium ${
              assignment.confidence === "HIGH"
                ? "bg-success/15 text-success"
                : "bg-paper-100 text-text-secondary dark:bg-surface-raised"
            }`}
          >
            {CONFIDENCE_COPY[assignment.confidence]}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-secondary">Registration</dt>
            <dd className="font-mono text-sm text-text-primary">{assignment.registration}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Age</dt>
            <dd className="font-mono text-sm text-text-primary">
              {assignment.ageYears !== null ? `${assignment.ageYears} years` : "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Operator</dt>
            <dd className="font-mono text-sm text-text-primary">{assignment.operatorIataCode ?? "—"}</dd>
          </div>
        </dl>

        {assignment.type.facts.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-border pt-4">
            {assignment.type.facts.map((fact) => (
              <li key={fact} className="flex gap-2 text-sm text-text-secondary">
                <Sparkle className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
                {fact}
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </Card>
  );
}
