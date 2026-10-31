import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';
import createBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  // When offline navigation fails, serve the cached offline page
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Enable static export compatibility (no backend)
  // output: 'export', // Uncomment in STEP N when full static export is configured

  // Strict mode for catching issues early
  reactStrictMode: true,

  // Optimise images (will use Next.js built-in optimisation)
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // i18n handled by next-intl middleware (not Next.js built-in i18n)
  // See: src/i18n/config.ts

  // PWA configuration will be wrapped in STEP N with @ducanh2912/next-pwa
  // For now: plain Next.js config for dev startup
};

export default withBundleAnalyzer(withPWA(withNextIntl(nextConfig)));
