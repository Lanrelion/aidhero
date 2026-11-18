This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Spitch narration pilot

Run `npm run generate:audio:spitch -- --dry-run` to list the five non-medical sample clips. Set `SPITCH_API_KEY` in the ignored `.env.local` file or in the build environment and run `npm run generate:audio:spitch` to generate them. Use `--lang en` to generate just one language.

Generate the clips before starting the server or running a production build. Open `/audio/_spitch-pilot/en/sample.mp3` on the test device, replacing `en` with `ha`, `ig`, `yo`, or `pcm` as needed. For offline testing, use a production build and allow its service worker to install before disconnecting.

Run `npm run generate:audio:spitch -- --all --dry-run` to check recording coverage for the full rescue catalog without calling Spitch. Remove `--dry-run` to generate missing audio, or use `--scenario <slug>` to limit the run to one incident. The generator reuses existing clips, saves progress after each clip, and records the exact text associated with each versioned MP3. Include the generated MP3s and `src/lib/tts/recordedNarration.json` in the same release. Playback uses those files locally and does not call Spitch.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
