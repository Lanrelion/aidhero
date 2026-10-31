# AGENTS.md — AidHero (Antigravity)
> This file is read by Codex and all AI coding agents before starting any task.
> Do not skip this file. It defines the rules of this project.

---

## What We Are Building

**AidHero** is an offline-first Progressive Web App (PWA) that provides instant, guided first aid instructions for medical emergencies in Nigeria and West Africa.

- **No backend. No auth. No user accounts. No PII collected.**
- Everything runs client-side. All data is static JSON.
- The app must work with zero internet connection after first visit.
- Lives depend on this working correctly under panic conditions.

Read the full spec before building anything:
- `DESIGN.md` — Visual language, components, screen architecture
- `PRD.md` — User stories, tech stack, schemas, acceptance criteria

---

## Stack at a Glance

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript |
| Styling | Tailwind CSS + CSS custom properties (see DESIGN.md) |
| Components | shadcn/ui (accessible base) |
| PWA / Offline | @ducanh2912/next-pwa + Workbox |
| Search | Fuse.js (client-side, offline-capable) |
| State | Zustand |
| TTS | Web Speech API (English) + Google Cloud TTS (Nigerian languages) |
| Offline storage | Cache API + IndexedDB (idb) |
| Analytics | Plausible (privacy-first) |
| Hosting | Vercel |

---

## Non-Negotiable Rules

These rules apply to every task, every step, every PR. No exceptions.

### 1. Offline First
Every feature must work without internet after the first visit.
Test offline before marking any task complete.
Never make a feature that silently fails offline — degrade gracefully with a clear status message.

### 2. Accessibility Always
Minimum WCAG 2.1 AA on all screens.
AAA required on: emergency call button, step-by-step instructions, decision tree screens.
Every interactive element needs a descriptive `aria-label`.
Touch targets: 44px minimum, 64px on all emergency-critical actions.
Run `/qa` after every frontend step to verify.

### 3. Performance
First Contentful Paint < 1.5s on 3G.
Initial JS bundle < 150kb gzipped.
Never add a heavy dependency without checking bundle impact first.

### 4. No User Data
Do not add cookies, localStorage user tracking, analytics that capture PII, or any form of user identification.
The only things stored locally: language preference, recently viewed incidents, cached content versions.

### 5. Medical Content Integrity
Never modify scenario content (steps, warnings, do-nots) without bumping `content_version` and getting medical reviewer sign-off in the PR.
Every scenario file must have `trust_signals` fully populated — PRs without this are blocked.
When in doubt, do not change medical copy. File an issue instead.

### 6. Service Worker = Careful Zone
Any change to service worker logic, caching strategy, or Workbox configuration
requires running `/careful` before touching the file and `/qa` after.
A broken service worker silently destroys offline functionality for all users.

### 7. TTS = Static Files Only
Google Cloud TTS is NEVER called at runtime in the browser.
All audio is pre-generated in CI/CD via `scripts/generate-tts-audio.ts`.
Audio lives at `/public/audio/{scenario}/{lang}/step-{n}.mp3`.
The `GOOGLE_CLOUD_TTS_API_KEY` secret exists only in GitHub Actions — never in the browser or `.env.local`.

### 8. Content Versioning Always Active
Every scenario JSON must have a `content_version` integer.
Service worker checks `content-manifest.json` on every online visit.
`ContentUpdateBanner` handles user notification — never show it during an active rescue flow.

### 9. Full i18n — No Hardcoded Strings
Every user-visible string lives in `i18n/messages/{lang}.json`.
Never hardcode English text in JSX — always use `t('key')` from next-intl.
Language follows IndexedDB preference, not browser locale.
Decision tree max depth: 3 questions. Enforced in CI — do not bypass.

### 10. TypeScript Scope
`.agent/` and `scripts/` are excluded from `tsconfig.json`.
`tsconfig.json` must declare `"types": ["node"]` explicitly.
React types are loaded via `src/types/react.d.ts` triple-slash references.
Do not remove these exclusions — they prevent gstack's transitive @types
from polluting the IDE type resolver.
---

### 11. Tailwind Version
This project uses Tailwind CSS v4.
All custom tokens live in src/app/globals.css inside @theme inline {}.
Do not create or modify tailwind.config.ts for token definitions.
Utility classes (bg-emergency, text-authority, etc.) are auto-generated
from the @theme block — no rebuild step needed.

### 12. Windows / PowerShell JSON Safety
This project runs on Windows. PowerShell injects BOM characters into
files it creates or modifies. After any PowerShell file write operation
on .json or .ts files, verify no BOM exists:

// Preferred: always write files via Node.js scripts, not PowerShell echo/Out-File
// If PowerShell must be used: pipe through Set-Content -Encoding UTF8NoBOM
// Detection: if Next.js/Turbopack throws JSON parse errors on previously valid files → BOM

Fix: npx tsx scripts/strip-bom.ts (keep the script the agent wrote — reuse it)

### 13. Voice Mode / SpeechRecognition
SpeechRecognition and speechSynthesis must be mutually exclusive.
Never open the mic while TTS is speaking — Chrome buffers TTS audio
and parses it as commands ~200ms after utterance.onend fires.
Architecture: mic opens 600ms after TTS ends (pipeline flush),
closes before next TTS starts. Use sessionRef (not boolean flags)
for loop cancellation — boolean flags have async reset race conditions.
SpeechRecognition lang must be 'en-US' not 'en-NG' (Chrome rejects en-NG silently).

## gstack Skills

gstack is installed at `.agent/skills/gstack`.
Always check the SKILL.md files inside if you need a refresher on how a command works.

### Authorised Commands

#### `/office-hours`
**When:** Before any new feature is added to scope, or when requirements feel unclear.
**What it does:** Challenges the product direction with YC-style forcing questions.
**For AidHero:** Run when discussing adding new incident categories, new languages, or new UX flows.

---

#### `/plan-eng-review`
**When:** Before implementing any of the following:
- Service worker / Workbox changes
- IndexedDB schema changes
- New data schema for scenarios or decision trees
- Any change to the TTS caching pipeline
- Search index or synonym map changes

**What it does:** Reviews technical decisions for correctness, edge cases, and scalability.
**AidHero-specific focus:** Offline-first correctness, cache invalidation strategy, audio file storage limits.

---

#### `/review`
**When:** After every completed build step before moving to the next.
**What it does:** Reviews agent output against the PRD spec and acceptance criteria.
**For AidHero:** Check that: offline works, accessibility attributes are present, touch targets are correct, design tokens match DESIGN.md.

---

#### `/careful`
**When (mandatory):** Before touching any of these files or systems:
- `sw.js` / service worker configuration
- Workbox cache strategies
- `manifest.json`
- Any IndexedDB read/write logic
- TTS audio caching pipeline
- Google Cloud TTS API integration

**What it does:** Forces a slow, deliberate review before high-risk changes.
**Why it matters here:** One incorrect cache strategy can break offline for all users silently.

---

#### `/qa`
**When:** After every frontend step that touches UI, interactions, or offline behaviour.
**What it does:** Tests the app in a real browser environment.

**AidHero-specific QA checklist (run every time):**
- [ ] Does the screen render correctly on a 375px mobile viewport?
- [ ] Are all touch targets ≥ 44px (≥ 64px on emergency actions)?
- [ ] Does it work with no internet (disable network in DevTools → Offline)?
- [ ] Does VoiceOver / TalkBack announce elements correctly?
- [ ] Is color contrast ≥ 4.5:1 (use DevTools accessibility panel)?
- [ ] Does TTS play correctly and highlight the current word?
- [ ] Do all buttons have visible focus indicators?
- [ ] Does the PWA score ≥ 95 in Lighthouse?

---

#### `/ship`
**When:** When a feature has passed `/review` and `/qa` and is ready to merge.
**What it does:** Final confirmation that a feature is production-clean.
**For AidHero:** Do not merge any PR that has not passed `/qa` — broken offline or broken accessibility is a production incident.

---

## Trigger Guide (Quick Reference)

| Situation | Command to run |
|---|---|
| New feature request arrives | `/office-hours` |
| About to change service worker | `/careful` first, `/qa` after |
| About to change DB / cache schema | `/plan-eng-review` |
| Just finished a build step | `/review` |
| Just finished any UI work | `/qa` |
| Feature is ready to merge | `/ship` |

---

## File Map

```
/
├── AGENTS.md                   ← You are here
├── DESIGN.md                   ← Visual system, components, screen specs
├── PRD.md                      ← Full product requirements
├── .agent/
│   └── skills/
│       └── gstack/             ← gstack skill scripts
├── app/                        ← Next.js App Router pages
├── components/                 ← React components
├── data/                       ← Static JSON (scenarios, decision trees, emergency numbers)
├── lib/                        ← Utilities (search, TTS, offline, location)
├── store/                      ← Zustand state stores
└── public/
    ├── manifest.json           ← PWA manifest
    └── audio/                  ← Pre-cached TTS audio files
```

---

## Prompt Pack Execution Rules

When executing the AidHero Prompt Pack (STEP 01 → STEP N):

1. Read this file before starting any step
2. Execute one step at a time — do not combine steps
3. Run the tagged gstack command at the end of each step
4. Do not proceed to the next step if the current step's `/qa` or `/review` fails
5. Every 5–7 steps, a **Context Refresh Prompt** will appear — read it fully before continuing
6. Flag any deviation from PRD.md before implementing it — do not silently change scope

---

## Medical Disclaimer (embed on all scenario pages)

> AidHero provides general first aid guidance for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always call emergency services immediately for life-threatening situations.

---

*AGENTS.md v1.0 — AidHero / Antigravity*
### Architecture Notes
- **Routing Note (Step 13/14)**: Next.js App Router forbids identical dynamic segments at the same level. The prompt specified \/[locale]/incidents/[category]\ for category browsing and \/[locale]/incidents/[slug]\ for incident details. To prevent a collision, we established \/[locale]/categories/[category]\ for the category list view. The Incident Detail screen (Step 14) and Guided Rescue (Step 15) remain safely at \/[locale]/incidents/[slug]\ and \/[locale]/incidents/[slug]/rescue\. The handoff from the category list successfully routes to \/[locale]/incidents/[slug]\.

