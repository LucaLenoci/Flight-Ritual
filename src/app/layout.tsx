import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppHeader } from "../components/ui/app-header";
import { NO_FLASH_THEME_SCRIPT } from "../components/ui/theme-toggle";
import "./globals.css";

// Aloft type system: Instrument Serif carries emotional "moment" copy,
// Plus Jakarta Sans carries UI/body text, JetBrains Mono carries anything
// literally coded/measured (IATA/ICAO codes, tail numbers, timestamps).
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--next-font-display",
  weight: ["400"],
  style: ["normal", "italic"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--next-font-body",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--next-font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Aloft",
  description: "Log your flights, build your collection — a personal flight-life companion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`h-full ${instrumentSerif.variable} ${plusJakartaSans.variable} ${jetBrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="min-h-full bg-bg font-body text-text-primary">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-sky-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <AppHeader />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
