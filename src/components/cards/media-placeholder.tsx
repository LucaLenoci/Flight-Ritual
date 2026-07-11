/**
 * No real photography/logos were supplied with the design system. Every
 * photo/logo slot renders as a tinted diagonal-stripe placeholder with a
 * monospace label naming what belongs there — swap for real photography /
 * airline livery shots before ship.
 */
export function MediaPlaceholder({
  label,
  accentHex,
  className = "",
}: {
  label: string;
  accentHex?: string;
  className?: string;
}) {
  // Must be a literal hex value (not a CSS var()) since it's string-concatenated
  // with a hex alpha suffix below — matches --color-sky-400 in colors.css.
  const tint = accentHex ?? "#4c96ff";
  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(45deg, ${tint}33 0px, ${tint}33 10px, ${tint}1a 10px, ${tint}1a 20px)`,
      }}
    >
      <span className="rounded-pill bg-black/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-eyebrow text-white backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
