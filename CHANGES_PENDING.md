# AidHero pending changes — 2026-10-31

Snapshot against HEAD 3c03872 on branch step-19-voice-mode. These changes predate the server troubleshooting in this chat.

## Summary

- Unified home discovery with inline search, category filters and incident grid; removes separate search/category screens.
- Adds 15 scenario files and 15 decision-tree files, expanding scenario loading to 20 incidents.
- Updates incident details, rescue questions, step cards, voice recognition and speech playback.
- Adds emergency contacts/state selection, onboarding, settings and accessibility controls.
- Expands English, Hausa, Igbo, Yoruba and Pidgin UI messages and translation status tracking.
- Adds offline download/update handling, service worker routes, content manifests and offline fallback.
- Adds audio/content generation tools, Playwright tests, accessibility/audio reports, CI and hosting configuration.
- Includes local prototypes, backup text, generated worker files and test output present in the requested all-changes snapshot.

## Verification and outstanding work

- PASS: npm run type-check.
- PASS: onboarding HTTP 200 for all five locales; English onboarding reload without runtime console errors.
- FAIL: npm run lint uses next lint, unsupported in Next.js 16.
- git diff --check reports existing trailing whitespace.
- Full production/offline/accessibility QA has not been rerun for this snapshot. Existing audit documents are historical claims.
- Added medical content includes NEEDS_REVIEW translations; medical reviewer sign-off is not established in this chat. Do not treat this branch as approved for production.
- Decision-tree loader currently imports the original five trees; the fifteen added tree files are not registered there.
- Runtime server was started with next dev --webpack; package scripts remain unchanged.

## Complete file inventory

Codes: M = modified, D = deleted, ?? = added/untracked at inventory time.

### Configuration, documentation and other files

- ` M` `CLAUDE.md`
- ` M` `next.config.ts`
- ` M` `package-lock.json`
- ` M` `package.json`
- `??` `ACCESSIBILITY_AUDIT.md`
- `??` `AGENTS.md`
- `??` `AUDIO_QUALITY.md`
- `??` `choking.html`
- `??` `lighthouse-report.json`
- `??` `lighthouserc.json`
- `??` `old_voicemode.txt`
- `??` `playwright.config.ts`
- `??` `test-results/.last-run.json`
- `??` `update-i18n-offline.js`
- `??` `vercel.json`
- `??` `worker/index.ts`

### Translations

- ` M` `i18n/messages/en.json`
- ` M` `i18n/messages/ha.json`
- ` M` `i18n/messages/ig.json`
- ` M` `i18n/messages/pcm.json`
- ` M` `i18n/messages/yo.json`
- `??` `i18n/translation-status.json`

### Public assets and generated offline files

- ` M` `public/manifest.json`
- `??` `public/data/content-manifest.json`
- `??` `public/fallback-ce627215c0e4a9af.js`
- `??` `public/sw.js`
- `??` `public/swe-worker-5c72df51bb1f6ee0.js`
- `??` `public/workbox-f1770938.js`
- `??` `public/worker-9e5d77ad75a44d76.js`

### Application source

- ` D` `src/app/[locale]/categories/[category]/category-client-view.tsx`
- ` D` `src/app/[locale]/categories/[category]/page.tsx`
- ` M` `src/app/[locale]/incidents/[slug]/page.tsx`
- ` M` `src/app/[locale]/incidents/[slug]/rescue/page.tsx`
- ` M` `src/app/[locale]/incidents/[slug]/steps/page.tsx`
- ` M` `src/app/[locale]/incidents/page.tsx`
- ` M` `src/app/[locale]/layout.tsx`
- ` M` `src/app/[locale]/page.tsx`
- ` D` `src/app/[locale]/search/page.tsx`
- ` M` `src/app/globals.css`
- ` M` `src/components/emergency/EmergencyCallButton.tsx`
- ` M` `src/components/emergency/TrustSignal.tsx`
- ` M` `src/components/layout/BottomNav.tsx`
- ` M` `src/components/layout/LanguageSheet.tsx`
- ` M` `src/components/layout/OfflineBadge.tsx`
- ` M` `src/components/onboarding/OnboardingSlide.tsx`
- ` M` `src/components/rescue/DecisionQuestion.tsx`
- ` M` `src/components/rescue/ProgressIndicator.tsx`
- ` M` `src/components/rescue/StepCard.tsx`
- ` M` `src/components/rescue/VoiceMode.tsx`
- ` M` `src/components/search/SearchBar.tsx`
- ` M` `src/components/tts/ReadAllButton.tsx`
- ` M` `src/components/tts/TTSButton.tsx`
- ` M` `src/lib/data/emergencyNumbers.ts`
- ` M` `src/lib/data/scenarios.ts`
- ` M` `src/lib/location/emergencyNumbers.ts`
- ` M` `src/lib/tts/TTSManager.ts`
- ` M` `src/middleware.ts`
- ` M` `src/store/useLanguageStore.ts`
- ` M` `src/store/useOfflineStore.ts`
- `??` `src/app/[locale]/emergency/call/page.tsx`
- `??` `src/app/[locale]/emergency/page.tsx`
- `??` `src/app/[locale]/onboarding/page.tsx`
- `??` `src/app/[locale]/settings/SettingsView.tsx`
- `??` `src/app/[locale]/settings/offline/OfflineSettingsView.tsx`
- `??` `src/app/[locale]/settings/offline/page.tsx`
- `??` `src/app/[locale]/settings/page.tsx`
- `??` `src/app/offline/layout.tsx`
- `??` `src/app/offline/page.tsx`
- `??` `src/components/emergency/EmergencyContactCard.tsx`
- `??` `src/components/emergency/StateSelector.tsx`
- `??` `src/components/layout/ClientInitializer.tsx`
- `??` `src/components/onboarding/ClientOnboardingGate.tsx`
- `??` `src/components/settings/VoiceAvailabilityBadge.tsx`
- `??` `src/hooks/useAccessibilitySettings.ts`
- `??` `src/hooks/useOfflineDownload.ts`
- `??` `src/hooks/useVoiceSearch.ts`
- `??` `src/i18n/config.ts`
- `??` `src/lib/offline/contentVersion.ts`
- `??` `src/lib/offline/serviceWorker.ts`
- `??` `src/test/accessibility.spec.ts`
- `??` `src/test/discovery.spec.ts`
- `??` `src/test/voicemode.spec.ts`

### CI

- `??` `.github/workflows/ci.yml`

### Scenario and decision-tree content

- `??` `data/content-manifest.json`
- `??` `data/decision-trees/anaphylaxis-flow.json`
- `??` `data/decision-trees/angina-flow.json`
- `??` `data/decision-trees/asthma-attack-flow.json`
- `??` `data/decision-trees/broken-bone-flow.json`
- `??` `data/decision-trees/cardiac-arrest-flow.json`
- `??` `data/decision-trees/choking-child-flow.json`
- `??` `data/decision-trees/drowning-flow.json`
- `??` `data/decision-trees/fainting-flow.json`
- `??` `data/decision-trees/food-poisoning-flow.json`
- `??` `data/decision-trees/generator-fumes-flow.json`
- `??` `data/decision-trees/head-injury-flow.json`
- `??` `data/decision-trees/heatstroke-flow.json`
- `??` `data/decision-trees/minor-burn-flow.json`
- `??` `data/decision-trees/severe-burn-flow.json`
- `??` `data/decision-trees/snake-bite-flow.json`
- `??` `data/scenarios/anaphylaxis.json`
- `??` `data/scenarios/angina.json`
- `??` `data/scenarios/asthma-attack.json`
- `??` `data/scenarios/broken-bone.json`
- `??` `data/scenarios/cardiac-arrest.json`
- `??` `data/scenarios/choking-child.json`
- `??` `data/scenarios/drowning.json`
- `??` `data/scenarios/fainting.json`
- `??` `data/scenarios/food-poisoning.json`
- `??` `data/scenarios/generator-fumes.json`
- `??` `data/scenarios/head-injury.json`
- `??` `data/scenarios/heatstroke.json`
- `??` `data/scenarios/minor-burn.json`
- `??` `data/scenarios/severe-burn.json`
- `??` `data/scenarios/snake-bite.json`

### Scripts

- `??` `scripts/check-css.js`
- `??` `scripts/generate-manifest.ts`
- `??` `scripts/generate-scenarios.ts`
- `??` `scripts/generate-tts-audio.ts`
- `??` `scripts/patch-emergency-i18n.js`
- `??` `scripts/translate-messages.ts`
