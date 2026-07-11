import { AirplaneTilt } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/add-flight", label: "Log a Flight" },
  { href: "/flight-log", label: "Flight Log" },
  { href: "/collection", label: "Collection" },
  { href: "/stats", label: "Stats" },
  { href: "/curiosities", label: "Curiosities" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-lg italic text-text-primary">
          <AirplaneTilt weight="fill" className="text-sky-500" aria-hidden="true" />
          Aloft
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-pill px-3 py-1.5 text-sm text-text-secondary transition-all duration-ui ease-standard hover:bg-paper-100 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:hover:bg-surface-raised"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-2 shrink-0">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
