import type { AirportCardDto } from "../../lib/api-types";
import { formatShortDate } from "../../lib/format";
import { CardShell } from "./card-shell";

export function AirportCard({
  card,
  owned,
  firstCollectedAtUtc,
  onClick,
}: {
  card: AirportCardDto;
  owned: boolean;
  firstCollectedAtUtc: string | null;
  onClick?: () => void;
}) {
  return (
    <CardShell
      kind="AIRPORT"
      code={card.iataCode}
      title={card.city}
      subtitle={card.country}
      rarity={card.rarity}
      locked={!owned}
      mediaLabel="skyline photo"
      footer={firstCollectedAtUtc ? `Collected ${formatShortDate(firstCollectedAtUtc)}` : card.icaoCode}
      onClick={onClick}
    />
  );
}
