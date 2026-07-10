"use client";

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
        icon="✈"
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
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-altitude-400">Aircraft Reveal</p>
            <h2 className="mt-1 font-display text-2xl italic text-mist-100">{assignment.type.model}</h2>
            <p className="text-sm text-mist-400">{assignment.type.manufacturer}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
              assignment.confidence === "HIGH"
                ? "bg-signal-success/15 text-signal-success"
                : "bg-ink-700 text-mist-300"
            }`}
          >
            {CONFIDENCE_COPY[assignment.confidence]}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-700/60 pt-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-mist-400">Registration</dt>
            <dd className="font-mono text-sm text-mist-100">{assignment.registration}</dd>
          </div>
          <div>
            <dt className="text-xs text-mist-400">Age</dt>
            <dd className="font-mono text-sm text-mist-100">
              {assignment.ageYears !== null ? `${assignment.ageYears} years` : "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-mist-400">Operator</dt>
            <dd className="font-mono text-sm text-mist-100">{assignment.operatorIataCode ?? "—"}</dd>
          </div>
        </dl>

        {assignment.type.facts.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-ink-700/60 pt-4">
            {assignment.type.facts.map((fact) => (
              <li key={fact} className="flex gap-2 text-sm text-mist-300">
                <span aria-hidden="true" className="text-runway-400">
                  ✦
                </span>
                {fact}
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </Card>
  );
}
