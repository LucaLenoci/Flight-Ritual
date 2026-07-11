export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatDistanceKm(km: number): string {
  return `${Math.round(km).toLocaleString("en-US")} km`;
}

export function formatShortDate(isoUtc: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(isoUtc),
  );
}
