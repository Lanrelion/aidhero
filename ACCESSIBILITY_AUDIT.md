# Accessibility Audit Report

This report documents the automated and manual accessibility checks performed across AidHero prior to the CI/CD deployment phase.

## Automated Checks (Axe-core via Playwright)
**Status**: Passing ✅ (0 Violations)
**Framework**: `@axe-core/playwright`
**Routes Tested**:
- `/en` (Home)
- `/en/search`
- `/en/incidents`
- `/en/incidents/heart-attack`
- `/en/incidents/heart-attack/rescue`
- `/en/incidents/heart-attack/steps`
- `/en/emergency`
- `/en/settings`
- `/en/onboarding`

### Resolved Violations
1. **Color Contrast (`color-contrast`)**: The `warning` color (`#e67e22`) and `action` color (`#27ae60`) failed WCAG AA 4.5:1 ratio against light backgrounds (`#fffef7`).
   - **Fix**: Darkened `--color-action` to `#167a38` and `--color-warning` to `#994d00` in `globals.css`.
2. **Missing Landmarks (`landmark-one-main`)**:
   - **Fix**: Re-validated `src/app/[locale]/layout.tsx` to ensure `children` are wrapped in `<main id="main-content">`.
3. **Nested `<main>` tags**: Multiple page components erroneously contained nested `<main>` tags.
   - **Fix**: Replaced nested `<main>` elements with `<div>` elements across all screens (e.g., `incidents/page.tsx`, `settings/page.tsx`).
4. **Hardcoded Strings**: Several components contained hardcoded English text inaccessible to i18n switching.
   - **Fix**: Implemented `useTranslations` in `StateSelector`, `SettingsView`, `OnboardingPage`, `SearchBar`, and `TrustSignal`.
5. **Missing ARIA Labels & Roles**:
   - **Fix**: Added `aria-label` to form inputs, `aria-current` to active language buttons, and `aria-hidden` to decorative icons (`Phone`, `AlertTriangle`, `Check`).
   - **Fix**: Added `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` to `ProgressIndicator`.

---

## Manual Checks

### 1. Keyboard-Only Navigation
**Test**: Complete a full rescue flow (Heart Attack) without using a mouse or touch interface.
**Result**: Passing ✅
- **Skip Link**: The "Skip to main content" link appears when `Tab` is first pressed, bypassing the header.
- **Focus Order**: Follows a strict logical DOM sequence: Search -> Popular Categories -> Emergency CTA.
- **Visual Focus**: The custom focus ring (`outline: 3px solid var(--color-emergency)`) highlights active elements distinctly.
- **Modals**: Focus is correctly trapped within the LanguageSheet.

### 2. Screen Reader (VoiceOver iOS & TalkBack Android)
**Test**: Navigate the entire rescue flow hands-free, relying strictly on ARIA announcements.
**Result**: Passing ✅
- **Emergency Button**: Fully announced using `aria-label={t('accessibility.emergencyCallStrip')}`.
- **Step Counter**: Uses `aria-live="polite"` inside `<ProgressIndicator />` to announce step changes (e.g., "Step 2 of 5") dynamically.
- **Offline Mode**: Network status changes trigger the `role="status"` banner, explicitly reading out "Ready for offline use" or "Limited functionality."
- **Image Alternative Text**: Step cards contain precise `alt` text detailing medical diagrams. Icon-only buttons (like TTS Play) utilize `aria-label`.

---
*Audit completed on: June 2026. All launch-critical accessibility gates have been satisfied.*
