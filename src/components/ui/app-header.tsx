import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg tracking-tight text-mist-100">
          <span aria-hidden="true" className="text-altitude-400">
            ✈
          </span>
          Flight Ritual
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-sm text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-altitude-400"
          >
            Journeys
          </Link>
          <Link
            href="/legacy"
            className="rounded-full px-3 py-1.5 text-sm text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-altitude-400"
          >
            My Flight Legacy
          </Link>
        </nav>
      </div>
    </header>
  );
}
