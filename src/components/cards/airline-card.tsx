import type { AirlineCardDto } from "../../lib/api-types";
import { formatShortDate } from "../../lib/format";
import { CardShell } from "./card-shell";

export function AirlineCard({
  card,
  owned,
  firstCollectedAtUtc,
  onClick,
}: {
  card: AirlineCardDto;
  owned: boolean;
  firstCollectedAtUtc: string | null;
  onClick?: () => void;
}) {
  return (
    <CardShell
      kind="AIRLINE"
      code={card.iataCode}
      title={card.name}
      subtitle={card.country}
      rarity={card.rarity}
      locked={!owned}
      mediaLabel="livery photo"
      accentHex={card.liveryColorHex}
      footer={firstCollectedAtUtc ? `Collected ${formatShortDate(firstCollectedAtUtc)}` : card.funFact}
      onClick={onClick}
    />
  );
}
