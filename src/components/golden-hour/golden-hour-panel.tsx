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
        className={`h-14 w-6 rounded-full border transition-colors ${
          highlightLeft ? "border-runway-400 bg-runway-500/20" : "border-ink-700 bg-ink-800"
        }`}
      />
      <div className="flex h-16 w-10 items-center justify-center rounded-full border border-ink-600 bg-ink-800 text-xs text-mist-400">
        ✈
      </div>
      <div
        className={`h-14 w-6 rounded-full border transition-colors ${
          highlightRight ? "border-runway-400 bg-runway-500/20" : "border-ink-700 bg-ink-800"
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
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-runway-400">Golden Hour Window</p>
      <h2 className="mt-1 font-display text-2xl text-mist-100">{SIDE_COPY[recommendation.side]}</h2>

      {isApplicable && <CabinDiagram side={recommendation.side} />}

      <p className="mt-2 text-sm text-mist-300">{recommendation.reason}</p>

      {isApplicable && (
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-ink-700/60 pt-4">
          <div>
            <dt className="text-xs text-mist-400">Best moment</dt>
            <dd className="font-mono text-sm text-mist-100">
              {recommendation.bestMomentUtc
                ? `${formatLocalTime(recommendation.bestMomentUtc, flight.destination.timeZone)} (destination time)`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-mist-400">Sun elevation</dt>
            <dd className="font-mono text-sm text-mist-100">
              {recommendation.sunElevationDeg !== null ? `${recommendation.sunElevationDeg}°` : "—"}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
