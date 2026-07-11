import { AirplaneTilt } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg italic text-text-primary">
          <AirplaneTilt weight="fill" className="text-sky-500" aria-hidden="true" />
          Aloft
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-pill px-3 py-1.5 text-sm text-text-secondary transition-all duration-ui ease-standard hover:bg-paper-100 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:hover:bg-surface-raised"
          >
            Tracker
          </Link>
          <Link
            href="/legacy"
            className="rounded-pill px-3 py-1.5 text-sm text-text-secondary transition-all duration-ui ease-standard hover:bg-paper-100 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:hover:bg-surface-raised"
          >
            My Flight Legacy
          </Link>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
