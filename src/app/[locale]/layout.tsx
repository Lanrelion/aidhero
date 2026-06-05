import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, Syne_Mono, Geist } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, Locale } from "../../../i18n/config";
import { BottomNav } from '@/components/layout/BottomNav';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { OfflineBadge } from '@/components/layout/OfflineBadge';
import { ContentUpdateBanner } from '@/components/layout/ContentUpdateBanner';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

// DESIGN.md Â§4: Display/Headings â€” Syne 600, 700, 800
const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

// DESIGN.md Â§4: Body/Instructions â€” DM Sans 400, 500, 600
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// DESIGN.md Â§4: Step Numbers/Counts â€” Syne Mono 400, 700
const syneMono = Syne_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#C0392B",
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  
  return {
    title: {
      default: t('title'),
      template: "%s | AidHero",
    },
    description: t('description'),
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
      locale: locale === 'en' ? 'en_NG' : `${locale}_NG`,
      title: t('ogTitle'),
      description: t('ogDescription'),
      siteName: "AidHero",
    },
  };
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={cn("h-full", "antialiased", syne.variable, dmSans.variable, syneMono.variable, "font-sans", geist.variable)}
    >
      {/* DESIGN.md Â§10 ARIA landmarks */}
            <body className="min-h-[100dvh] flex flex-col bg-[--color-surface] text-[--color-text-primary] font-body pb-16">
        <NextIntlClientProvider messages={messages}>
          <ContentUpdateBanner />
          <header className="flex items-center justify-between px-4 h-16 border-b border-border shrink-0">
            <h1 className="text-h3 font-bold text-text-primary font-display">AidHero</h1>
            <div className="flex items-center gap-2">
              <OfflineBadge />
              <LanguageToggle />
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

