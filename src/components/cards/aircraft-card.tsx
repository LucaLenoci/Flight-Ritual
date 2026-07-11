import type { AircraftCardDto } from "../../lib/api-types";
import { formatShortDate } from "../../lib/format";
import { CardShell } from "./card-shell";

export function AircraftCard({
  card,
  owned,
  firstCollectedAtUtc,
  onClick,
}: {
  card: AircraftCardDto;
  owned: boolean;
  firstCollectedAtUtc: string | null;
  onClick?: () => void;
}) {
  return (
    <CardShell
      kind="AIRCRAFT"
      code={card.icaoTypeCode}
      title={card.model}
      subtitle={`${card.manufacturer} · ${card.engineType}`}
      rarity={card.rarity}
      locked={!owned}
      mediaLabel="aircraft photo"
      footer={firstCollectedAtUtc ? `Collected ${formatShortDate(firstCollectedAtUtc)}` : card.funFact}
      onClick={onClick}
    />
  );
}
