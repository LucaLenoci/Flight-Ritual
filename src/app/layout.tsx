import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import { AppHeader } from "../components/ui/app-header";
import "./globals.css";

// Self-hosted at build time (no runtime CDN calls). Three-tier system:
// Fraunces carries the emotional/editorial moments (Aircraft Reveal, Runway
// Moment headlines), Inter is the workhorse UI sans, IBM Plex Mono renders
// flight data — times, registrations, coordinates — with an instrument-panel
// precision that a plain sans doesn't convey.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Flight Ritual",
  description: "A premium companion for people who love to fly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-full bg-ink-950 font-body text-mist-100 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-altitude-500 focus:px-4 focus:py-2 focus:text-ink-950"
        >
          Skip to content
        </a>
        <AppHeader />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
