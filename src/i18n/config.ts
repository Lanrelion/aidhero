import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ha", "ig", "yo", "pcm"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Language stored in IndexedDB, not URL — no locale prefix in URL
  // We use a custom locale detection strategy (see middleware.ts)
  localePrefix: "never",
});
