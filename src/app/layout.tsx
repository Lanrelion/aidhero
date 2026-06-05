import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, Syne_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// DESIGN.md §4: Display/Headings — Syne 600, 700, 800
const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

// DESIGN.md §4: Body/Instructions — DM Sans 400, 500, 600
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// DESIGN.md §4: Step Numbers/Counts — Syne Mono 400, 700
const syneMono = Syne_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Next.js 16: viewport/themeColor moved to separate export
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#C0392B",
};

export const metadata: Metadata = {
  title: {
    default: "AidHero — Emergency First Aid Nigeria",
    template: "%s | AidHero",
  },
  description:
    "Offline-first emergency first aid guide for Nigeria. Instant, guided first aid instructions in English, Hausa, Igbo, Yoruba, and Pidgin. Works without internet.",
  keywords: [
    "first aid",
    "emergency",
    "Nigeria",
    "offline",
    "heart attack",
    "choking",
    "CPR",
    "first responder",
  ],
  authors: [{ name: "AidHero" }],
  manifest: "/manifest.json",
  // PWA / mobile app meta
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AidHero",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    title: "AidHero — Emergency First Aid Nigeria",
    description:
      "You can save a life. AidHero shows you how. Offline first aid guide for Nigeria.",
    siteName: "AidHero",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", syne.variable, dmSans.variable, syneMono.variable, "font-sans", geist.variable)}
    >
      {/* DESIGN.md §10 ARIA landmarks */}
      <body className="min-h-full flex flex-col bg-[--color-surface] text-[--color-text-primary] font-body">
        {children}
      </body>
    </html>
  );
}
