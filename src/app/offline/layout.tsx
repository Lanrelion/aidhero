import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, Geist } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#C0392B",
};

export const metadata: Metadata = {
  title: "Offline | AidHero",
  description: "You are offline",
};

export default function OfflineLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", syne.variable, dmSans.variable, "font-sans", geist.variable)}
    >
      <body suppressHydrationWarning className="min-h-[100dvh] flex flex-col bg-[--color-surface] text-[--color-text-primary] font-body">
        {children}
      </body>
    </html>
  );
}
