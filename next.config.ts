import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Enable static export compatibility (no backend)
  // output: 'export', // Uncomment in STEP N when full static export is configured

  // Strict mode for catching issues early
  reactStrictMode: true,

  // Fix workspace root detection warning (multiple lockfiles in parent dirs)
  turbopack: {
    root: __dirname,
  },

  // Optimise images (will use Next.js built-in optimisation)
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // i18n handled by next-intl middleware (not Next.js built-in i18n)
  // See: src/i18n/config.ts

  // PWA configuration will be wrapped in STEP N with @ducanh2912/next-pwa
  // For now: plain Next.js config for dev startup
};

export default withNextIntl(nextConfig);
