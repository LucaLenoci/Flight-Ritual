import { AirplaneTilt, Sun } from "@phosphor-icons/react/dist/ssr";
import { Card } from "../ui/card";
import { formatLocalTime } from "../../lib/format";
import type { FlightDto, WindowRecommendationDto } from "../../lib/api-types";

const SIDE_COPY: Record<WindowRecommendationDto["side"], string> = {
  LEFT: "Left side",
  RIGHT: "Right side",
  EITHER: "Either side",
  NOT_APPLICABLE: "No golden-hour window",
};

function CabinDiagram({ side }: { side: WindowRecommendationDto["side"] }) {
  const highlightLeft = side === "LEFT" || side === "EITHER";
  const highlightRight = side === "RIGHT" || side === "EITHER";

  return (
    <div aria-hidden="true" className="flex items-center justify-center gap-2 py-2">
      <div
        className={`h-14 w-6 rounded-pill border transition-colors duration-ui ease-standard ${
          highlightLeft ? "border-amber-500 bg-amber-500/20" : "border-border bg-paper-100 dark:bg-surface-raised"
        }`}
      />
      <div className="flex h-16 w-10 items-center justify-center rounded-pill border border-border bg-paper-100 text-sm text-text-secondary dark:bg-surface-raised">
        <AirplaneTilt weight="fill" aria-hidden="true" />
      </div>
      <div
        className={`h-14 w-6 rounded-pill border transition-colors duration-ui ease-standard ${
          highlightRight ? "border-amber-500 bg-amber-500/20" : "border-border bg-paper-100 dark:bg-surface-raised"
        }`}
      />
    </div>
  );
}

export function GoldenHourPanel({
  recommendation,
  flight,
}: {
  recommendation: WindowRecommendationDto;
  flight: FlightDto;
}) {
  const isApplicable = recommendation.side !== "NOT_APPLICABLE";

  return (
    <Card className="p-6">
      <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-eyebrow text-amber-500">
        <Sun weight="fill" aria-hidden="true" />
        Golden Hour Window
      </p>
      <h2 className="mt-1 font-display text-2xl italic text-text-primary">{SIDE_COPY[recommendation.side]}</h2>

      {isApplicable && <CabinDiagram side={recommendation.side} />}

      <p className="mt-2 text-sm text-text-secondary">{recommendation.reason}</p>

      {isApplicable && (
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <dt className="text-xs text-text-secondary">Best moment</dt>
            <dd className="font-mono text-sm text-text-primary">
              {recommendation.bestMomentUtc
                ? `${formatLocalTime(recommendation.bestMomentUtc, flight.destination.timeZone)} (destination time)`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Sun elevation</dt>
            <dd className="font-mono text-sm text-text-primary">
              {recommendation.sunElevationDeg !== null ? `${recommendation.sunElevationDeg}°` : "—"}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
