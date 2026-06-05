# AidHero — Prompt Pack
> Phase 4 | AI Agent Build Sequence
> Version 1.0

---

## HOW TO USE THIS PACK

- Execute **one step at a time**. Never combine steps.
- Run the tagged `→ gstack` command before moving to the next step.
- Do not proceed if `/review` or `/qa` flags an issue — fix it first.
- Every **[CONTEXT REFRESH]** block must be read fully before continuing.
- All file paths are relative to the project root.
- Reference documents: `CLAUDE.md`, `DESIGN.md`, `PRD.md`

---

## STEP 01 — Project Initialisation
**Depends on:** Nothing  
**→ After this step: `/review`**

### Context
Starting from a blank repository. We are building AidHero — an offline-first PWA for emergency first aid in Nigeria. Read `CLAUDE.md` fully before writing any code.

### Task
Initialise the Next.js 14 project with the full tech stack defined in `PRD.md Section 4`.

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

Then install all dependencies:
```bash
npm install \
  zustand \
  fuse.js \
  idb \
  next-intl \
  @ducanh2912/next-pwa \
  workbox-webpack-plugin

npm install -D \
  @types/node \
  vitest \
  @vitejs/plugin-react \
  axe-core \
  @axe-core/react
```

### Expected Output
- Next.js 14 App Router project running on `localhost:3000`
- All dependencies installed with no peer dependency errors
- `tsconfig.json` with strict mode enabled
- `.eslintrc.json` with Next.js rules
- `tailwind.config.ts` (values extended in STEP 02)

### File Targets
- `package.json`
- `tsconfig.json`
- `.eslintrc.json`
- `tailwind.config.ts`
- `next.config.ts`

### Acceptance Test
```bash
npm run dev  # Starts without errors
npm run build  # Builds without errors
npm run lint  # No lint errors
```

---

## STEP 02 — Design System Tokens
**Depends on:** STEP 01  
**→ After this step: `/review`**

### Context
Project is initialised. Now implement the full design system from `DESIGN.md Sections 3–6` as Tailwind config extensions and CSS custom properties.

### Task
1. Extend `tailwind.config.ts` with all design tokens from `DESIGN.md`
2. Create `src/styles/globals.css` with all CSS custom properties
3. Set up Google Font imports (Syne + DM Sans + Syne Mono)

### Expected Output

**`tailwind.config.ts`** must include:
```typescript
theme: {
  extend: {
    colors: {
      emergency: '#C0392B',
      authority: '#1A1A2E',
      action: '#27AE60',
      warning: '#E67E22',
      surface: '#FFFEF7',
      card: '#F5F5EF',
      'card-active': '#FFF0EE',
      border: '#E8E8E2',
      'text-primary': '#1A1A2E',
      'text-secondary': '#6B6B7B',
      'text-inverse': '#FFFEF7',
    },
    fontFamily: {
      display: ['Syne', 'sans-serif'],
      body: ['DM Sans', 'sans-serif'],
      mono: ['Syne Mono', 'monospace'],
    },
    fontSize: {
      'hero': ['40px', { lineHeight: '1.1', fontWeight: '800' }],
      'h1': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
      'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
      'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
      'body-lg': ['18px', { lineHeight: '1.6' }],
      'body': ['16px', { lineHeight: '1.6' }],
      'sm': ['14px', { lineHeight: '1.5', fontWeight: '500' }],
      'xs': ['12px', { lineHeight: '1.4' }],
    },
    spacing: {
      '18': '72px',
      '22': '88px',
    },
    borderRadius: {
      'sm': '4px',
      'md': '8px',
      'lg': '16px',
      'xl': '24px',
    },
    boxShadow: {
      'card': '0 2px 8px rgba(26, 26, 46, 0.08)',
      'emergency': '0 4px 24px rgba(192, 57, 43, 0.20)',
      'float': '0 8px 32px rgba(26, 26, 46, 0.12)',
    },
  },
}
```

**`src/styles/globals.css`** — all CSS variables from `DESIGN.md Section 3`, plus high-contrast media query.

**`src/app/layout.tsx`** — load Syne, DM Sans, Syne Mono from Google Fonts using `next/font/google`.

### File Targets
- `tailwind.config.ts`
- `src/styles/globals.css`
- `src/app/layout.tsx`

### Acceptance Test
- Open `localhost:3000` and verify fonts load correctly
- Inspect a test element with `className="text-emergency"` — renders `#C0392B`
- High contrast media query activates when OS contrast is set to high

---

## STEP 03 — shadcn/ui Setup + Base Components
**Depends on:** STEP 02  
**→ After this step: `/review`**

### Context
Design tokens are in place. Now install shadcn/ui and the specific components AidHero needs, configured with our custom colour tokens.

### Task
1. Initialise shadcn/ui
2. Install required base components
3. Create the AidHero button variants that extend shadcn

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button sheet badge progress
```

Configure `components.json` to use:
- Style: `default`
- Base colour: map to our `authority` and `emergency` tokens
- CSS variables: enabled

Create `src/components/ui/emergency-button.tsx` — a full-width variant with `min-height: 88px`, emergency red background, white text, `role="button"`, and required ARIA pattern from `DESIGN.md Component C01`.

Create `src/components/ui/incident-card.tsx` — card component per `DESIGN.md Component C02`. Props: `title`, `category`, `severity`, `icon`, `onClick`.

Create `src/components/ui/severity-badge.tsx` — badge showing "CRITICAL" / "URGENT" / "MODERATE" with correct colour per severity.

### Expected Output
- `src/components/ui/` contains shadcn base components
- `src/components/ui/emergency-button.tsx`
- `src/components/ui/incident-card.tsx`
- `src/components/ui/severity-badge.tsx`

### Acceptance Test
- Render `<EmergencyButton>Call 199</EmergencyButton>` — verify 88px height, emergency red, accessible
- Tab to it — visible focus ring (3px emergency red outline)
- Screen reader announces label correctly

---

## STEP 04 — i18n Setup (next-intl, 5 Languages)
**Depends on:** STEP 03  
**→ After this step: `/review`**

### Context
Base components exist. Before building any screen, we must wire up i18n so no screen ever contains hardcoded English text. This is a non-negotiable rule in `CLAUDE.md Rule 9`.

### Task
1. Configure `next-intl` with App Router pattern
2. Create message files for all 5 languages
3. Create the locale routing middleware
4. Create a `useTranslations` usage pattern to follow across all screens

**Create `i18n/config.ts`:**
```typescript
export const locales = ['en', 'ha', 'ig', 'yo', 'pcm'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';
```

**Create message files** at `i18n/messages/{lang}.json` for all 5 languages with these namespaces:
- `nav` — Home, Search, Emergency, Settings labels
- `home` — Title, subtitle, search placeholder, section headers
- `rescue` — Start guided, quick steps, step X of Y, next, back, repeat, call emergency
- `search` — Placeholder, no results, recent searches
- `incidents` — Category names (Cardiac, Respiratory, Trauma, Burns, Environmental, Neurological, Poisoning, Obstetric, Paediatric, Allergic)
- `emergency` — Call button labels, state names, national numbers label
- `settings` — Language, text size, contrast, offline, about
- `accessibility` — All ARIA label strings
- `offline` — Ready, limited, updated banners
- `errors` — Not found, audio unavailable, offline limitation messages
- `onboarding` — 3 slide titles and descriptions

English values must be production-ready. Hausa, Igbo, Yoruba, Pidgin values must be accurate translations — use a translation reference or mark as `[NEEDS_REVIEW]` with the English value as fallback.

**Create `src/middleware.ts`** — next-intl middleware that reads locale from IndexedDB preference (via cookie bridge since middleware can't read IDB directly).

**Note:** Language preference is stored in IndexedDB (`preferred-language` key) and a matching cookie (`aidhero-lang`) is kept in sync for middleware routing. Default: `en`.

### Expected Output
- `i18n/config.ts`
- `i18n/messages/en.json`
- `i18n/messages/ha.json`
- `i18n/messages/ig.json`
- `i18n/messages/yo.json`
- `i18n/messages/pcm.json`
- `src/middleware.ts`
- `src/app/[locale]/layout.tsx` (locale-wrapped root layout)

### Acceptance Test
- Navigate to `localhost:3000/en` — renders English
- Navigate to `localhost:3000/ha` — renders Hausa
- `t('nav.home')` returns correct string in each locale
- No hardcoded English strings in layout.tsx

---

## STEP 05 — Data Layer: Scenario Schema + 5 Seed Scenarios
**Depends on:** STEP 04  
**→ After this step: `/review`**

### Context
i18n is wired. Now create the core data layer. Start with 5 fully-specced seed scenarios that demonstrate the complete schema. The remaining 45+ will be added incrementally but need the schema validated first.

### Task
Implement the full `Scenario` and `Step` TypeScript interfaces from `PRD.md Section 7` in `src/types/scenario.ts`.

Then create 5 complete scenario JSON files in `data/scenarios/`:

1. `heart-attack.json` — content_version: 1, category: cardiac, severity: critical
2. `choking-adult.json` — content_version: 1, category: respiratory, severity: critical
3. `stroke.json` — content_version: 1, category: neurological, severity: critical
4. `severe-bleeding.json` — content_version: 1, category: trauma, severity: critical
5. `seizure.json` — content_version: 1, category: neurological, severity: urgent

Each scenario must have:
- Full `title_translations` in all 5 languages
- `aliases` including Pidgin variants (e.g. "my heart dey pain", "e dey choke am")
- `severity` set correctly
- `immediate_warning` + `immediate_warning_translations`
- `description` + `description_translations`
- `signs` (3–5 items) + `signs_translations`
- `steps` (max 7) with full `instruction_translations` per step
- `do_not` (2–3 items) + `do_not_translations`
- `hospital_threshold` + translations
- `trust_signals` block (use placeholder: `"medical_reviewer": "[PENDING — Nigerian emergency medicine doctor required]"`)
- `audio_path` pattern on every step: `/audio/{scenario-id}/{lang}/step-{n}.mp3`

Create `data/categories.json` listing all 12 categories with names + translations.

Create `src/lib/data/scenarios.ts` — loads all scenario JSONs and exports typed array + lookup map.

### Expected Output
- `src/types/scenario.ts` — full TypeScript interfaces
- `data/scenarios/heart-attack.json`
- `data/scenarios/choking-adult.json`
- `data/scenarios/stroke.json`
- `data/scenarios/severe-bleeding.json`
- `data/scenarios/seizure.json`
- `data/categories.json`
- `src/lib/data/scenarios.ts`

### Acceptance Test
```typescript
import { scenarios, getScenario } from '@/lib/data/scenarios';
console.log(scenarios.length); // 5
console.log(getScenario('heart-attack')?.title); // "Heart Attack"
console.log(getScenario('heart-attack')?.steps[0].instruction_translations.ha); // Hausa text
```

---

## ═══════════════════════════════════════
## [CONTEXT REFRESH — After STEP 05]
## ═══════════════════════════════════════

**State of the project so far:**
- Next.js 14 + TypeScript + Tailwind running
- Full design system tokens applied
- shadcn/ui + custom emergency components built
- i18n wired for 5 languages (en, ha, ig, yo, pcm)
- 5 seed scenarios with full schema

**What we are building:** AidHero — offline-first first aid PWA for Nigeria.

**Key rules in effect (from `CLAUDE.md`):**
- No hardcoded English strings — always `t('key')`
- No Google Cloud TTS at runtime — audio served from `/public/audio/`
- Decision trees max 3 questions deep
- Trust signals required on all scenario data
- `content_version` required on all scenarios
- Test offline on Tecno/Infinix devices

**Continuing with:** Decision trees, emergency numbers, Zustand stores, search engine, layout shell.

## ═══════════════════════════════════════

---

## STEP 06 — Data Layer: Decision Trees
**Depends on:** STEP 05  
**→ After this step: `/review`**

### Context
5 seed scenarios exist. Now create the decision trees that guide users through personalised rescue flows. **Hard rule: maximum 3 question nodes before reaching an instruction leaf.** CI will validate this.

### Task
Implement `DecisionTree`, `QuestionNode`, `InstructionNode` TypeScript interfaces in `src/types/decision-tree.ts`.

Create decision trees for all 5 seed scenarios in `data/decision-trees/`:

1. `heart-attack-flow.json`
   - Q1: "Is the person conscious?" → Yes → Q2 | No → cpr-protocol
   - Q2: "Are they breathing normally?" → Yes → angina-steps | No → cpr-protocol
   - (max depth: 2 questions for heart attack → reaches steps)

2. `choking-adult-flow.json`
   - Q1: "Can the person cough or speak?" → Yes → mild-choking | No → Q2
   - Q2: "Is the person pregnant or obese?" → Yes → chest-thrusts | No → abdominal-thrusts

3. `stroke-flow.json`
   - Q1: "Is the person conscious?" → Yes → conscious-stroke | No → unconscious-stroke

4. `severe-bleeding-flow.json`
   - Q1: "Is the bleeding from a limb?" → Yes → limb-bleeding | No → Q2
   - Q2: "Is the wound to the head or torso?" → Yes → torso-bleeding | No → general-bleeding

5. `seizure-flow.json`
   - Q1: "Is this their first seizure?" → Yes → first-seizure | No → Q2
   - Q2: "Has it lasted more than 5 minutes?" → Yes → prolonged-seizure | No → known-seizure

Every `QuestionNode` must have `text` + full `translations` in all 5 languages.
Every option label must have `translations` in all 5 languages.

Create `src/lib/data/decisionTrees.ts` — loads trees and exports lookup by `id`.

Create `src/lib/data/validateTreeDepth.ts` — utility that validates no tree exceeds 3 question-node depth. Export a `validateAll()` function that throws if any tree is too deep. This runs in CI.

### Expected Output
- `src/types/decision-tree.ts`
- `data/decision-trees/heart-attack-flow.json`
- `data/decision-trees/choking-adult-flow.json`
- `data/decision-trees/stroke-flow.json`
- `data/decision-trees/severe-bleeding-flow.json`
- `data/decision-trees/seizure-flow.json`
- `src/lib/data/decisionTrees.ts`
- `src/lib/data/validateTreeDepth.ts`

### Acceptance Test
```typescript
import { validateAll } from '@/lib/data/validateTreeDepth';
validateAll(); // Must not throw
// Manually add a depth-4 tree → validateAll() must throw
```

---

## STEP 07 — Data Layer: Emergency Numbers + Synonyms
**Depends on:** STEP 05  
**→ After this step: `/review`**

### Context
Scenarios and decision trees exist. Now build the emergency numbers data and the synonym map that powers search.

### Task

**Emergency Numbers (`data/emergency-numbers.json`):**
Implement per `PRD.md Section 11`. Must include:
- National numbers (199, NEMA)
- All 6 seeded states: Lagos, Abuja (FCT), Rivers, Kano, Oyo, Kaduna
- Each service entry: `name`, `name_translations` (all 5 langs), `number`, `type`

**Synonyms Map (`data/synonyms.json`):**
Create a comprehensive synonym map. For each of the 5 seed scenarios, include:
- English synonyms (medical and lay terms)
- Pidgin variants (minimum 3 per scenario)
- Yoruba transliterations
- Hausa transliterations
- Igbo transliterations

Examples to include:
```json
{
  "heart-attack": [
    "chest pain", "chest tightness", "heart pain", "cardiac arrest",
    "heart stopped", "chest pressure", "left arm pain",
    "my heart dey pain", "e pain my chest", "heart don stop",
    "ọkan mi n dun", "zuciya tana ciwo", "obi m na awa"
  ],
  "choking": [
    "can't breathe", "something in throat", "food stuck", "airway blocked",
    "no fit breathe", "something block my throat", "e dey choke",
    "ko le simi", "yana shakewa", "ihe di n'ọnọ ya"
  ]
}
```

Create `src/lib/location/emergencyNumbers.ts`:
```typescript
// Uses Geolocation API to detect user's state
// Falls back to national numbers if geolocation denied
// Returns the 3 most relevant numbers for detected state
async function getEmergencyNumbers(state?: string): Promise<EmergencyContact[]>
```

### Expected Output
- `data/emergency-numbers.json`
- `data/synonyms.json`
- `src/lib/location/emergencyNumbers.ts`
- `src/types/emergency.ts`

### Acceptance Test
```typescript
const numbers = await getEmergencyNumbers('Lagos');
// Returns LASEMA (767), LASAMBUS, Police
const national = await getEmergencyNumbers();
// Returns 199, NEMA without geolocation
```

---

## STEP 08 — Zustand Stores
**Depends on:** STEP 07  
**→ After this step: `/review`**

### Context
Data layer complete. Now build the three Zustand stores that manage application state across all screens.

### Task
Create `src/store/` with three stores:

**`useLanguageStore.ts`:**
```typescript
interface LanguageStore {
  language: Locale;
  setLanguage: (lang: Locale) => Promise<void>;
  // setLanguage: persists to IndexedDB 'preferred-language'
  //              sets cookie 'aidhero-lang' for middleware
  //              dispatches event to trigger audio cache
}
```
On store init: hydrate from IndexedDB. Default: `'en'`.

**`useOfflineStore.ts`:**
```typescript
interface OfflineStore {
  isOnline: boolean;
  isCached: boolean;  // true if service worker has cached core content
  hasUpdate: boolean; // true if content-manifest shows newer versions
  setOnline: (val: boolean) => void;
  setHasUpdate: (val: boolean) => void;
}
```
Register `navigator.onLine` listeners. On mount, check service worker cache status.

**`useRescueStore.ts`:**
```typescript
interface RescueStore {
  activeScenario: string | null;        // scenario id
  currentNodeId: string | null;         // current decision tree node
  currentStepIndex: number;
  history: string[];                    // node ids visited (for back navigation)
  isVoiceMode: boolean;
  startRescue: (scenarioId: string) => void;
  answerQuestion: (nextNodeId: string) => void;
  goBack: () => void;
  advanceStep: () => void;
  setVoiceMode: (val: boolean) => void;
  clearRescue: () => void;
}
```

Create `src/lib/offline/idb.ts` — typed IndexedDB helper using `idb` library. Keys:
- `preferred-language` (Locale)
- `content-versions` (Record<string, number>)
- `recently-viewed` (string[] — scenario ids, max 5)

### Expected Output
- `src/store/useLanguageStore.ts`
- `src/store/useOfflineStore.ts`
- `src/store/useRescueStore.ts`
- `src/lib/offline/idb.ts`

### Acceptance Test
```typescript
const { setLanguage } = useLanguageStore.getState();
await setLanguage('ha');
// IndexedDB 'preferred-language' === 'ha'
// Cookie 'aidhero-lang' === 'ha'
```

---

## STEP 09 — Search Engine (Fuse.js + Synonyms)
**Depends on:** STEP 08  
**→ After this step: `/review`**

### Context
Data and stores are ready. Before building the UI, implement the search engine. It must work fully offline, support Pidgin queries, and return results within 300ms.

### Task
Create `src/lib/search/index.ts`:

```typescript
// Builds Fuse.js index from scenarios + synonyms
// Index includes: title, aliases (with synonym expansion), signs
// Config from PRD.md Section 8

class ScenarioSearch {
  private fuse: Fuse<Scenario>;
  
  constructor(scenarios: Scenario[], synonyms: SynonymMap) {
    // Expand each scenario with its synonyms before indexing
    // This ensures "my heart dey pain" matches Heart Attack
  }
  
  search(query: string, locale: Locale): SearchResult[] {
    // Returns top 5 results
    // Filters by current locale for title display
    // Includes: scenario id, title (in locale), category, severity, matchedAlias
  }
}
```

Create `src/lib/search/synonyms.ts` — loads `data/synonyms.json` and exports:
```typescript
function expandAliases(scenario: Scenario, synonymMap: SynonymMap): string[]
```

**Test the search with these queries (must all return correct top result):**
- "heart attack" → Heart Attack
- "chest pain" → Heart Attack
- "my heart dey pain" → Heart Attack
- "can't breathe" → Choking (Adult)
- "e dey choke" → Choking (Adult)
- "face drooping" → Stroke
- "bleeding won't stop" → Severe Bleeding

Create `src/hooks/useSearch.ts`:
```typescript
function useSearch() {
  // Debounced search: 150ms
  // Returns: results, isSearching, query, setQuery, clearSearch
  // Saves query to recently-viewed on result selection
}
```

### Expected Output
- `src/lib/search/index.ts`
- `src/lib/search/synonyms.ts`
- `src/hooks/useSearch.ts`

### Acceptance Test
All 7 test queries above must return the correct top result.
```bash
npm run test -- search  # Vitest unit tests
```

---

## STEP 10 — Layout Shell (Root Layout, BottomNav, Header)
**Depends on:** STEP 09  
**→ After this step: `/qa`**

### Context
Foundation is complete. Now build the persistent layout shell that wraps all screens. This is the first visual output the user sees.

### Task
Build the app layout shell per `DESIGN.md Sections 7, 8`.

**`src/components/layout/BottomNav.tsx`:**
- 4 tabs: Home, Search, Emergency, Settings
- All labels from i18n (`t('nav.home')` etc.)
- Active tab: emergency red indicator
- Emergency tab always renders as emergency red icon
- Touch targets: full-width divided by 4, min 56px height
- ARIA: `role="navigation"`, `aria-label={t('accessibility.bottomNav')}`
- Current tab: `aria-current="page"`

**`src/components/layout/LanguageToggle.tsx`:**
- Persistent top-right header button
- Shows current language code (EN / HA / IG / YO / PCM)
- On tap: opens `LanguageSheet` (see below)
- ARIA: `aria-label={t('accessibility.changeLanguage')}`

**`src/components/layout/LanguageSheet.tsx`:**
- Bottom sheet (shadcn Sheet component)
- 5 language options, 64px rows
- Active language has checkmark
- On selection: calls `useLanguageStore.setLanguage()`
- Immediately closes sheet + reflects new language in UI

**`src/components/layout/OfflineBadge.tsx`:**
- Uses `useOfflineStore`
- Online + cached: green pill "✓ Offline Ready" — subtle, top-right
- Offline + cached: same pill, changes label to active offline state
- Not cached + online: amber banner with download prompt
- Offline + not cached: amber banner

**`src/components/layout/ContentUpdateBanner.tsx`:**
- Only renders when `useOfflineStore.hasUpdate === true`
- Never renders during active rescue (check `useRescueStore.activeScenario`)
- Auto-dismisses after 4 seconds
- Action green background, white text

**`src/app/[locale]/layout.tsx`:** Assemble root layout:
```
Header (LanguageToggle + OfflineBadge)
<main>{children}</main>
BottomNav
ContentUpdateBanner (positioned fixed, top)
```

### Expected Output
- `src/components/layout/BottomNav.tsx`
- `src/components/layout/LanguageToggle.tsx`
- `src/components/layout/LanguageSheet.tsx`
- `src/components/layout/OfflineBadge.tsx`
- `src/components/layout/ContentUpdateBanner.tsx`
- `src/app/[locale]/layout.tsx`

### Acceptance Test (run `/qa`)
- All 4 nav tabs visible and tappable (64px minimum)
- Language toggle opens bottom sheet
- Selecting Hausa immediately changes nav labels to Hausa
- Offline badge renders correctly in simulated offline mode (DevTools → Network → Offline)
- ContentUpdateBanner does not render on a new session (no update yet)
- VoiceOver/TalkBack navigates all nav items correctly

---

## ═══════════════════════════════════════
## [CONTEXT REFRESH — After STEP 10]
## ═══════════════════════════════════════

**State of the project:**
- Full design system applied
- i18n wired (5 languages, all UI strings translated)
- 5 seed scenarios + decision trees + emergency numbers
- Zustand stores (language, offline, rescue)
- Search engine (Fuse.js + Pidgin synonyms)
- Layout shell (BottomNav, LanguageToggle, OfflineBadge, ContentUpdateBanner)

**What we are building next:** Core screens in priority order.
P0 screens first: Home → Search → Incident Detail → Guided Rescue → Steps

**Rules reminder:**
- Every screen uses `t()` — no hardcoded strings
- Touch targets 64px on emergency actions
- Every screen tested offline before `/qa` passes

## ═══════════════════════════════════════

---

## STEP 11 — Home Screen (S01)
**Depends on:** STEP 10  
**→ After this step: `/qa`**

### Context
Layout shell is live. Build the Home screen — the entry point. Goal: user reaches their scenario in under 3 taps. Reference `DESIGN.md Screen S01` and `DESIGN.md Component C01, C02, C05`.

### Task
Build `src/app/[locale]/page.tsx` (Home screen).

**Layout (top to bottom):**

1. **Emergency CTA strip** (always top, full-width, 72px):
   - Emergency red background
   - `📞 {t('home.emergencyCall')}` — large bold text
   - Tapping opens Emergency Contacts screen (S08)
   - `aria-label={t('accessibility.emergencyCallStrip')}`

2. **Search Bar** (C05 from DESIGN.md):
   - Use `SearchBar` component (build inline or reference STEP 12)
   - On focus: navigates to `/[locale]/search`
   - Voice input button (right side) — activates `Voice Mode` (STEP 19)
   - Placeholder: `t('home.searchPlaceholder')`

3. **Popular Incidents grid** (2×3 cards):
   - Hardcoded 6 most common: Heart Attack, Choking, Stroke, Severe Bleeding, Seizure, Burns
   - Each: `IncidentCard` component with icon + title in current locale
   - On tap: navigate to `/[locale]/incidents/[slug]`
   - Icons: use Lucide React icons (Heart, Wind, Brain, Droplets, Zap, Flame)

4. **Recently Viewed** (horizontal scroll, appears after 1+ scenario viewed):
   - Reads from `useRescueStore` + IndexedDB `recently-viewed`
   - Hidden on first visit

**`src/components/search/SearchBar.tsx`:**
- Full-width, 56px height
- 18px placeholder text
- Voice button (right, 48px target)
- On submit/enter: navigate to search with query param
- Must work offline (navigation is client-side)

### Expected Output
- `src/app/[locale]/page.tsx`
- `src/components/search/SearchBar.tsx`

### Acceptance Test (run `/qa`)
- Emergency CTA strip renders at top in emergency red
- All 6 incident cards visible on 375px viewport without scrolling
- Tapping any card navigates to correct incident
- Recently viewed section hidden on first visit
- All text in selected language (switch to Yoruba, verify)
- Works offline (DevTools → Offline)

---

## STEP 12 — Search Screen (S02)
**Depends on:** STEP 11  
**→ After this step: `/qa`**

### Context
Home screen is live. Now build the full search experience — the fastest path to help in an emergency.

### Task
Build `src/app/[locale]/search/page.tsx`.

**Behaviour:**
- Search bar pre-focused on mount
- Uses `useSearch` hook from STEP 09
- Results appear after 1 character typed (150ms debounce)
- Shows up to 5 results
- If query is empty: shows "Recent Searches" + "All Categories" link

**`src/components/search/SearchResults.tsx`:**
Each result (C06 from DESIGN.md):
- Icon (Lucide, per category)
- Title in current locale
- Category label
- Severity badge
- "Matched via: {matchedAlias}" shown if match was a synonym (helps user understand)
- 56px touch target minimum

**`src/components/search/RecentSearches.tsx`:**
- Reads last 5 searches from IndexedDB
- Each: tappable chip (48px)
- "Clear" button

**No results state:**
```
"No results for '{query}'"
"Try: heart attack, choking, bleeding"
```
(Text from i18n, try list is localised)

**Pidgin test cases (must work):**
- "my heart dey pain" → Heart Attack
- "e dey choke am" → Choking Adult
- "e no fit talk well" → Stroke

### Expected Output
- `src/app/[locale]/search/page.tsx`
- `src/components/search/SearchResults.tsx`
- `src/components/search/RecentSearches.tsx`

### Acceptance Test (run `/qa`)
- All 7 test queries from STEP 09 return correct top result
- Results appear within 300ms of typing
- Works offline
- Empty state renders correctly
- VoiceOver announces each result with title + category

---

## STEP 13 — Category Browse Screen (S03)
**Depends on:** STEP 12  
**→ After this step: `/review`**

### Context
Search is complete. Build the category browse screen for users who prefer to navigate by category rather than search.

### Task
Build `src/app/[locale]/incidents/page.tsx`.

**Layout:**
- Grid of all 12 categories from `data/categories.json`
- Each category card: icon + name in current locale + scenario count
- Tapping opens filtered list of scenarios in that category

Build `src/app/[locale]/incidents/[category]/page.tsx`:
- Lists all scenarios in the category
- Each: full-width `IncidentCard`
- Severity badge visible

Category icons (Lucide):
- Cardiac → Heart
- Respiratory → Wind
- Trauma → Zap
- Burns → Flame
- Environmental → Sun
- Neurological → Brain
- Poisoning → AlertTriangle
- Obstetric → Baby
- Paediatric → User (small)
- Eye/ENT → Eye
- Diabetic → Droplets
- Allergic → AlertCircle

All category names from `t('incidents.{categoryKey}')`.

### Expected Output
- `src/app/[locale]/incidents/page.tsx`
- `src/app/[locale]/incidents/[category]/page.tsx`

### Acceptance Test
- All 12 categories render
- Scenario count matches data
- All labels in selected language
- Breadcrumb navigation works (Back button)

---

## STEP 14 — Incident Detail Screen (S04)
**Depends on:** STEP 13  
**→ After this step: `/qa`**

### Context
Browse is complete. The incident detail screen is the most content-heavy screen. It must convey severity, signs, and next actions clearly — and always show the emergency call button.

### Task
Build `src/app/[locale]/incidents/[slug]/page.tsx`.

**Layout (top to bottom):**

1. **Severity banner** — full-width, colour by severity:
   - CRITICAL: emergency red
   - URGENT: amber
   - MODERATE: grey
   - Text: `t('rescue.severity.{level}')` in large bold

2. **Incident title** — `text-h1`, `font-display`

3. **Immediate warning** (if present) — red callout box:
   - `⚠` icon + `immediate_warning_translations[locale]`
   - Must be the first thing a screen reader reads after title

4. **What it is** — 2-sentence description in current locale

5. **Signs to recognise** — bullet list, `text-body-lg`, icons per sign

6. **Action buttons (full-width, stacked):**
   - Primary: `[START GUIDED RESCUE]` → navigates to `/[locale]/incidents/[slug]/rescue`
   - Secondary: `[QUICK STEPS]` → navigates to `/[locale]/incidents/[slug]/steps`

7. **What NOT to do** — red-bordered card, 2–3 items

8. **When to go to hospital** — `hospital_threshold_translations[locale]`

9. **Trust signal** (bottom of content):
   ```
   Reviewed by {trust_signals.medical_reviewer}
   {trust_signals.reviewer_institution}
   Last reviewed: {trust_signals.last_medically_reviewed}
   ```
   If medical review pending: show amber badge "Pending medical review"

10. **Emergency Call Button** (persistent, sticky bottom):
    - `EmergencyButton` component
    - Full-width, 88px, emergency red
    - `{t('emergency.callButton')}` — always visible

### Expected Output
- `src/app/[locale]/incidents/[slug]/page.tsx`
- `src/components/emergency/TrustSignal.tsx`
- `src/components/emergency/ImmediateWarning.tsx`
- `src/components/emergency/SignsList.tsx`

### Acceptance Test (run `/qa`)
- Emergency call button sticky at bottom — visible without scrolling on 375px viewport
- Immediate warning is first non-title content screen readers encounter
- Trust signal renders (or pending badge if no reviewer yet)
- All text in selected language
- Works offline
- WCAG contrast check: emergency red on white ≥ 4.5:1

---

## STEP 15 — Guided Rescue Flow (S05 — Decision Tree Renderer)
**Depends on:** STEP 14  
**→ After this step: `/qa`**

### Context
Incident detail is live. Now build the decision tree renderer — the feature that differentiates AidHero from a static first aid reference. One question, full screen, max 3 deep.

### Task
Build `src/app/[locale]/incidents/[slug]/rescue/page.tsx`.

This screen is a **state machine renderer** — it reads the current node from `useRescueStore` and renders accordingly.

**On mount:**
```typescript
const { startRescue, currentNodeId } = useRescueStore();
const tree = getDecisionTree(slug + '-flow');
startRescue(slug);
// Renders root node
```

**QuestionNode rendering (C04 from DESIGN.md):**
```
[Progress: Question 1 of max 3]        ← ProgressIndicator

[Question text — Syne 28px, centered]  ← from node.translations[locale]

[Option A — Yes]                        ← full-width, 72px, authority bg
[Option B — No]                         ← full-width, 72px, card bg
[Option C — Not sure]                   ← full-width, 64px, subtle
                                           (only if option exists)

[Skip to quick steps →]                 ← link, always visible
```

On option tap:
- `answerQuestion(nextNodeId)` called
- Transition animation: slide left 200ms
- If next node is `InstructionNode`: navigate to `/[slug]/steps?variant={variant}`

**InstructionNode (terminal):**
- Briefly show "Loading your steps..." (200ms)
- Navigate to `/[slug]/steps` with variant param

**Back button:**
- `goBack()` from store
- Slide right transition
- If at root node: navigate back to incident detail

**Emergency call button:** Persistent, bottom right, 64px FAB style (not full-width in rescue to keep screen clean).

**`src/components/rescue/DecisionQuestion.tsx`:**
Props: `node: QuestionNode`, `onAnswer: (nextId: string) => void`, `locale: Locale`

**`src/components/rescue/ProgressIndicator.tsx`:**
Props: `current: number`, `max: number` (always 3)
Visual: thin red progress bar + "Question {n} of {max}" text

### Expected Output
- `src/app/[locale]/incidents/[slug]/rescue/page.tsx`
- `src/components/rescue/DecisionQuestion.tsx`
- `src/components/rescue/ProgressIndicator.tsx`

### Acceptance Test (run `/qa`)
- Heart Attack rescue flow: 2 questions → reaches steps
- Back navigation works at every question
- "Skip to quick steps" always reachable
- Max depth validator: confirm no tree in data/ goes > 3 deep
- All question text in selected language
- Options are 72px minimum touch targets

---

## ═══════════════════════════════════════
## [CONTEXT REFRESH — After STEP 15]
## ═══════════════════════════════════════

**State of the project:**
- Full layout shell running
- Home, Search, Category Browse, Incident Detail, Guided Rescue Flow all live
- Decision tree state machine working
- 5 seed scenarios fully navigable end-to-end

**What we are building next:**
- Step-by-step instructions screen
- TTS system (static audio player)
- Voice Mode
- Emergency contacts + call confirmation
- Settings + onboarding

**Critical reminder:** TTS uses `/public/audio/{scenario}/{lang}/step-{n}.mp3` files.
These files do not exist yet (generated in STEP 28). For now, use Web Speech API as fallback for ALL languages during development. The static audio files replace the Web Speech fallback in production.

## ═══════════════════════════════════════

---

## STEP 16 — Step-by-Step Instructions Screen (S06)
**Depends on:** STEP 15  
**→ After this step: `/qa`**

### Context
Decision tree sends user here with a variant param (e.g. `?variant=cpr-protocol`). This is the most critical screen — clear numbered steps, one at a time, with TTS play buttons.

### Task
Build `src/app/[locale]/incidents/[slug]/steps/page.tsx`.

**Layout:**
- Reads `slug` + `variant` query param
- Loads steps from scenario data, filtered by variant
- `useRescueStore.currentStepIndex` tracks position

**`src/components/rescue/StepCard.tsx`** (C03 from DESIGN.md):
```
[STEP 3]           ← Syne Mono, 48px, emergency red
[Instruction text] ← DM Sans, 20px, bold, authority
[Detail text]      ← DM Sans, 16px, secondary
[⚠ Don't: ...]     ← if step has do_not (red text, small)
[▶ Play]           ← TTSButton (64px touch target)
```

**Navigation:**
- `[← Back]` button (top left) + `[Next Step →]` button (full-width, 72px, bottom)
- On last step: Next button becomes `[✓ Done — Call Emergency]`
- Progress bar: thin red line, top of card, `currentStep / totalSteps`
- Step counter: "Step {n} of {total}" always visible

**Voice mode FAB:**
- Floating action button, bottom right
- Microphone icon, 64px, emergency red
- On tap: activates Voice Mode (STEP 19)

**Emergency call persistent:** Small 48px button, bottom left, phone icon + "Call"

All step text from `step.instruction_translations[locale]` and `step.detail_translations[locale]`.

### Expected Output
- `src/app/[locale]/incidents/[slug]/steps/page.tsx`
- `src/components/rescue/StepCard.tsx`

### Acceptance Test (run `/qa`)
- Step counter updates on Next/Back
- Progress bar advances correctly
- Done step shows correct CTA
- All text in selected language
- Works offline
- Touch targets: Next button ≥ 72px, TTS button ≥ 64px

---

## STEP 17 — TTS Manager (Static Audio + Web Speech Fallback)
**Depends on:** STEP 16  
**→ After this step: `/review`**

### Context
Steps screen is live. Now build the TTS system. In development (before STEP 28 generates audio files), Web Speech API is used for all languages. In production, static MP3 files at `/public/audio/` are used for Nigerian languages.

### Task
Build `src/lib/tts/TTSManager.ts` per `PRD.md Section 9`.

```typescript
type Language = 'en' | 'ha' | 'ig' | 'yo' | 'pcm';

class TTSManager {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking = false;
  
  async speak(
    scenarioId: string,
    stepId: number,
    text: string,
    lang: Language
  ): Promise<void> {
    await this.stop();
    
    if (lang === 'en') {
      return this.webSpeechSpeak(text, 'en-NG');
    }
    
    // Try static audio file first (production)
    const audioPath = `/audio/${scenarioId}/${lang}/step-${stepId}.mp3`;
    const fileExists = await this.checkAudioExists(audioPath);
    
    if (fileExists) {
      return this.playStaticAudio(audioPath);
    }
    
    // Fallback: Web Speech API (development + missing audio files)
    const voiceMap: Record<Language, string> = {
      ha: 'ha', ig: 'ig', yo: 'yo', pcm: 'en-NG', en: 'en-NG'
    };
    return this.webSpeechSpeak(text, voiceMap[lang]);
  }
  
  async stop(): Promise<void>
  get speaking(): boolean
  
  // Event emitters for word highlighting
  onWordBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
}
```

Build `src/lib/tts/audioPath.ts`:
```typescript
function getAudioPath(scenarioId: string, lang: Language, stepId: number): string
function getScenarioAudioPaths(scenarioId: string, lang: Language): string[]
```

Build `src/hooks/useTTS.ts`:
```typescript
function useTTS() {
  // Returns: speak, stop, isSpeaking, currentWordIndex
  // Reads language from useLanguageStore
}
```

### Expected Output
- `src/lib/tts/TTSManager.ts`
- `src/lib/tts/audioPath.ts`
- `src/hooks/useTTS.ts`

### Acceptance Test
```typescript
const { speak, stop, isSpeaking } = useTTS();
speak('heart-attack', 1, 'Call emergency services now', 'en');
// Plays via Web Speech API (no audio files yet in development)
speak('heart-attack', 1, '...', 'ha');
// Attempts /audio/heart-attack/ha/step-1.mp3 → not found → falls back to Web Speech
```

---

## STEP 18 — TTS Integration into Step Screen
**Depends on:** STEP 17  
**→ After this step: `/qa`**

### Context
TTS system exists but isn't wired into the steps screen yet. Wire it up and add the TTSButton component with word highlighting.

### Task

**`src/components/tts/TTSButton.tsx`:**
```
[▶ Play in {language}]   ← when not playing
[■ Stop]                  ← when playing (same button, 64px)
Wave animation when playing (3 bars, subtle)
```
Props: `scenarioId`, `stepId`, `text`, `size?: 'sm' | 'lg'`
Uses `useTTS` hook.

**`src/components/tts/WordHighlight.tsx`:**
- Wraps step instruction text
- As TTS plays, highlights current word (splits text into spans)
- Uses `onWordBoundary` callback from `useTTS`
- Falls back gracefully (no highlight) when Web Speech events unavailable

**Wire into `StepCard.tsx`:**
- Replace placeholder `[▶ Play]` with `<TTSButton>`
- Wrap instruction text with `<WordHighlight>`

**`src/components/tts/ReadAllButton.tsx`:**
- Appears at top of steps list screen
- "▶ Read all steps in {language}" — 56px height
- Auto-advances through steps via `useRescueStore.advanceStep` after each step finishes reading

**`src/components/tts/TTSProvider.tsx`:**
- Context provider that holds single `TTSManager` instance
- Prevents multiple instances playing simultaneously

### Expected Output
- `src/components/tts/TTSButton.tsx`
- `src/components/tts/WordHighlight.tsx`
- `src/components/tts/ReadAllButton.tsx`
- `src/components/tts/TTSProvider.tsx`
- Updated `src/components/rescue/StepCard.tsx`

### Acceptance Test (run `/qa`)
- Tap TTSButton → instruction reads in selected language
- Word highlighting works for English (Web Speech provides word events)
- "Read all steps" advances through all steps automatically
- Stopping works (second tap cancels)
- Switching language mid-session picks up new language on next play

---

## STEP 19 — Voice Mode Screen (S07)
**Depends on:** STEP 18  
**→ After this step: `/qa`**

### Context
TTS is integrated. Voice Mode is the hands-free overlay that auto-reads steps while the user's hands are occupied with the victim.

### Task
Build `src/components/rescue/VoiceMode.tsx` as a full-screen overlay (modal, not a separate page).

**Design (from DESIGN.md Component C09):**
```
Full-screen dark overlay (#1A1A2E, 95% opacity)
[← Exit]  top-right, white, 48px target
[Current instruction text]  centered, white, 24px bold, max 2 lines
[Progress: Step 2 of 5]  white, 16px
[Animated waveform]  5 bars, emergency red, playing animation
[⏸ Pause / ▶ Resume]  centered, 80px circle, white icon
"Say 'next', 'back', or 'repeat'"  hint text, white, 14px
```

**Behaviour:**
- Auto-reads current step on open
- Auto-advances to next step 1.5 seconds after TTS completes
- Listens for voice commands via `SpeechRecognition` API:
  - "next" / "next step" → `advanceStep()`
  - "back" / "previous" → `goBack()`
  - "repeat" / "again" → re-reads current step
  - "call emergency" → opens emergency call intent
- Voice commands fallback gracefully if `SpeechRecognition` unavailable
- Respects `prefers-reduced-motion` — no waveform animation
- Screen reader: `aria-live="assertive"` on instruction text

**`src/components/rescue/WaveformVisualizer.tsx`:**
- 5 animated bars, emergency red
- CSS animation only (no canvas, no heavy library)
- Pauses when TTS is not speaking

Activate from: FAB button on Steps screen (STEP 16).

### Expected Output
- `src/components/rescue/VoiceMode.tsx`
- `src/components/rescue/WaveformVisualizer.tsx`
- Updated `src/app/[locale]/incidents/[slug]/steps/page.tsx` (FAB activates VoiceMode)

### Acceptance Test (run `/qa`)
- Voice mode opens as overlay, does not navigate away
- Auto-reads first step immediately on open
- Auto-advances after each step
- Exit closes overlay, returns to steps screen at current position
- Waveform animation pauses when not speaking
- `prefers-reduced-motion`: waveform does not animate

---

## STEP 20 — Emergency Contacts Screen (S08)
**Depends on:** STEP 10  
**→ After this step: `/qa`**

### Context
Core rescue flow is complete. Build the Emergency Contacts screen — reachable from the Emergency tab in BottomNav and from any emergency call button.

### Task
Build `src/app/[locale]/emergency/page.tsx`.

**Layout (top to bottom):**

1. **Auto-detected state banner:**
   ```
   📍 Showing numbers for: Lagos State
   [Change state ▼]
   ```
   Uses `getEmergencyNumbers()` from STEP 07.
   If geolocation denied: "Showing national numbers" with state selector.

2. **National Numbers section:**
   - Each: `EmergencyContactCard`
   - Full-width, 80px
   - Service name in locale + number + `[CALL]` button (emergency red, 72px height min)

3. **State Numbers section:**
   - Same pattern for state-specific services

4. **State Selector** (bottom sheet):
   - Full list of 37 states + FCT
   - Searchable
   - On selection: updates displayed numbers

**`src/components/emergency/EmergencyContactCard.tsx`:**
```
[📞 icon] [Service name in locale]  [number]  [CALL button]
Full width · 80px height · card bg
CALL button: emergency red, 72px width, 56px height
aria-label: "Call {serviceName} on {number}"
```

**On CALL button tap:** Navigate to Call Confirmation screen (STEP 21) with number + service name as params. Do not call directly.

**Geolocation handling:**
- Request geolocation on mount
- If denied: silently fall back to national numbers
- Never show a permission error — just show national numbers
- State selector always available regardless

### Expected Output
- `src/app/[locale]/emergency/page.tsx`
- `src/components/emergency/EmergencyContactCard.tsx`
- `src/components/emergency/StateSelector.tsx`

### Acceptance Test (run `/qa`)
- Auto-detects location (or falls back to national)
- All numbers visible without scrolling on 375px viewport
- CALL button is 72px minimum width, 56px minimum height
- Tapping CALL goes to confirmation screen (does not call directly)
- State selector works (select Kano → shows Kano numbers)
- All labels in selected language

---

## ═══════════════════════════════════════
## [CONTEXT REFRESH — After STEP 20]
## ═══════════════════════════════════════

**State of the project:**
- All P0 screens complete: Home, Search, Incident Detail, Guided Rescue, Steps
- TTS fully wired (static audio + Web Speech fallback)
- Voice Mode overlay
- Emergency Contacts with auto-detection

**Remaining screens:** Call Confirmation, Settings, Onboarding
**Remaining infrastructure:** Content versioning, PWA/service worker, TTS generation script, CI/CD, Accessibility audit, Deployment

**Performance reminder:** Before PWA step, run Lighthouse. Initial JS bundle must be < 150kb gzipped. Fix any issues before adding service worker complexity.

## ═══════════════════════════════════════

---

## STEP 21 — Call Confirmation Screen (S09)
**Depends on:** STEP 20  
**→ After this step: `/review`**

### Context
Emergency contacts screen taps through to here. This screen prevents accidental calls while still being fast enough not to frustrate a real emergency user.

### Task
Build `src/app/[locale]/emergency/call/page.tsx`.

Receives URL params: `number`, `service`, `state`.

**Layout:**
```
[📞 Calling...]         ← large icon, emergency red

[LASEMA — Lagos State]  ← service name, h2
[767]                   ← number, hero text, bold

[CALL NOW]              ← full-width, 88px, emergency red
[Cancel]                ← full-width, 64px, ghost
```

**Auto-countdown:**
- 3-second countdown on CALL NOW button: "Call in 3... 2... 1..."
- If user doesn't tap Cancel within 3 seconds: auto-initiates call
- `window.location.href = 'tel:{number}'`
- Countdown can be cancelled at any time before 0

**Accessibility:**
- On mount: `aria-live="assertive"` announces "Calling {service} in 3 seconds. Tap Cancel to stop."
- Cancel button `aria-label`: "Cancel call to {service}"

### Expected Output
- `src/app/[locale]/emergency/call/page.tsx`

### Acceptance Test
- Countdown visible and accurate
- Cancel stops countdown + navigates back
- Auto-call fires at 0 (verify `tel:` link constructed correctly)
- Screen reader announces countdown

---

## STEP 22 — Settings Screen (S10)
**Depends on:** STEP 21  
**→ After this step: `/qa`**

### Context
Build the settings screen. This is where users can change language, adjust accessibility preferences, and manage offline content.

### Task
Build `src/app/[locale]/settings/page.tsx`.

**Sections:**

1. **Language** — Opens `LanguageSheet` (already built in STEP 10)
   - Shows current: "Language: Yoruba"

2. **Text Size** — Slider or 3 options: Normal / Large / Extra Large
   - Applies `font-size` multiplier via CSS variable `--text-scale`
   - Persisted in IndexedDB `text-scale`

3. **High Contrast** — Toggle
   - Enables high contrast mode (sets `data-contrast="high"` on `<html>`)
   - Persisted in IndexedDB `high-contrast`

4. **Offline Content** — Link to `OfflineDownloadScreen` (STEP 27)
   - Shows: "Content downloaded: Yes / No"
   - Shows: "Audio downloaded for: English, Hausa"

5. **Auto-play TTS** — Toggle
   - When on: TTS auto-plays when entering Steps screen
   - Persisted in IndexedDB `autoplay-tts`

6. **About** — Version, medical disclaimer, contributors link

Add high-contrast CSS to `globals.css`:
```css
[data-contrast="high"] {
  --color-surface: #000000;
  --color-text-primary: #FFFFFF;
  --color-emergency: #FF4444;
  --color-action: #00FF88;
}
```

Add text scale CSS:
```css
[data-text-scale="large"] { --text-scale: 1.15; }
[data-text-scale="xl"] { --text-scale: 1.3; }
```

Apply `--text-scale` multiplier to all `text-body-lg` and larger in `globals.css`.

### Expected Output
- `src/app/[locale]/settings/page.tsx`
- Updated `src/styles/globals.css` (high contrast + text scale)
- `src/hooks/useAccessibilitySettings.ts`

### Acceptance Test (run `/qa`)
- Language change works and persists
- Text size: Extra Large increases all body text visibly
- High contrast: background becomes black, text white
- Settings persist after page refresh
- All labels in selected language

---

## STEP 23 — Onboarding (S13)
**Depends on:** STEP 22  
**→ After this step: `/qa`**

### Context
First-time users need a quick orientation that sets their language and prompts offline download. 3 screens, no more.

### Task
Build `src/app/[locale]/onboarding/page.tsx`.

**3-slide structure:**

Slide 1: "You can save a life. AidHero shows you how."
- Large hero icon (heart with + symbol, SVG)
- Title: `t('onboarding.slide1.title')`
- Body: `t('onboarding.slide1.body')`

Slide 2: "Works offline, in your language."
- Icon: phone with offline symbol
- Title + body
- Demonstrates: offline badge icon, language flag icons

Slide 3: "Choose your language + download content"
- Language selector (inline, same options as LanguageSheet)
- "Download for offline use" button — triggers progressive audio cache
- Skip option: "I'll do this later"

**Navigation:**
- Dot indicators (3 dots, current = emergency red)
- Swipe left/right OR tap arrow buttons
- "Skip" link always visible (top right)
- After Slide 3 / on Skip: mark onboarding complete in IndexedDB (`onboarding-complete: true`), navigate to Home

**Gate:** Check `onboarding-complete` in IndexedDB on app load. If not set, redirect to `/onboarding` before Home. If set, proceed to Home.

**`src/components/onboarding/OnboardingSlide.tsx`:**
Props: `title`, `body`, `icon`, `children?`

### Expected Output
- `src/app/[locale]/onboarding/page.tsx`
- `src/components/onboarding/OnboardingSlide.tsx`
- Updated `src/app/[locale]/layout.tsx` (onboarding gate check)

### Acceptance Test (run `/qa`)
- First visit redirects to onboarding
- Skip works and marks complete
- Slide 3 language selection changes locale
- Offline download button triggers cache (progress visible)
- Second visit skips onboarding entirely

---

## STEP 24 — Content Versioning System
**Depends on:** STEP 08 (idb.ts)  
**→ After this step: `/careful` then `/review`**

### Context
⚠ This step touches service worker behaviour — run `/careful` before starting.

Build the content version check system from `PRD.md Section 9a`. This runs silently in the background on every online visit and refreshes stale scenario content.

### Task

**`data/content-manifest.json`:**
```json
{
  "generated_at": "2025-01-01T00:00:00Z",
  "scenarios": {
    "heart-attack": { "version": 1 },
    "choking-adult": { "version": 1 },
    "stroke": { "version": 1 },
    "severe-bleeding": { "version": 1 },
    "seizure": { "version": 1 }
  }
}
```

**`src/lib/offline/contentVersion.ts`:**
Full implementation per `PRD.md Section 9a`:
- `checkForUpdates()`: fetches manifest (`cache: 'no-store'`), compares versions, refreshes stale scenarios
- `dispatchEvent(new CustomEvent('content-updated', { detail: { count } }))` on completion

**Wire `checkForUpdates()` into the root layout:**
- Call on mount, only when `navigator.onLine === true`
- Catch errors silently (never crash the app on a version check failure)
- On `content-updated` event: set `useOfflineStore.hasUpdate = true`
- `ContentUpdateBanner` (STEP 10) handles the display — already built

**`scripts/generate-manifest.ts`:**
```typescript
// Run via: npm run generate:manifest
// Reads all scenario JSON files
// Extracts content_version from each
// Writes data/content-manifest.json
```

Add to `package.json`:
```json
"scripts": {
  "generate:manifest": "tsx scripts/generate-manifest.ts"
}
```

### Expected Output
- `data/content-manifest.json`
- `src/lib/offline/contentVersion.ts`
- `scripts/generate-manifest.ts`
- Updated `src/app/[locale]/layout.tsx` (content check on mount)

### Acceptance Test
- On first visit: version check fires, no banner shown (versions match)
- Manually bump `content_version` in `heart-attack.json` to `2`, run `npm run generate:manifest`
- On next visit: banner appears "Content updated"
- Banner auto-dismisses after 4 seconds
- Banner never appears on rescue flow screens

---

## STEP 25 — PWA Configuration
**Depends on:** STEP 24  
**→ After this step: `/careful` then `/qa`**

### Context
⚠ Service worker configuration — run `/careful` before starting.

Configure AidHero as a production-grade PWA with offline-first caching.

### Task

**`public/manifest.json`** — full manifest from `PRD.md Section 10` including shortcuts.

**`next.config.ts`** — configure `@ducanh2912/next-pwa`:
```typescript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});
```

**`src/lib/offline/serviceWorker.ts`** — service worker registration:
- Register on mount (client-side only)
- Listen for `updatefound` event → prompt user if update is critical
- Listen for `controllerchange` → reload if new SW takes control

**Workbox cache strategies** per `PRD.md Section 10 caching table`:
Create custom Workbox routes in `worker/index.ts`:
- App shell: CacheFirst, 7 days
- Scenario JSON: StaleWhileRevalidate, 24h
- `content-manifest.json`: NetworkFirst (no cache — always fresh)
- Emergency numbers: CacheFirst, 7 days
- `/audio/**/*.mp3`: CacheFirst, 30 days
- Google Fonts: CacheFirst, 1 year
- `/api/**`: NetworkOnly (no API in V1, future-proofing)

**Progressive audio caching trigger** (wire into `useLanguageStore.setLanguage`):
```typescript
async function cacheAudioForLanguage(lang: Language) {
  const sw = await navigator.serviceWorker.ready;
  sw.active?.postMessage({ type: 'CACHE_AUDIO_LANGUAGE', lang });
}
```

In service worker: handle `CACHE_AUDIO_LANGUAGE` message by pre-fetching all audio paths for that language.

### Expected Output
- `public/manifest.json`
- Updated `next.config.ts`
- `src/lib/offline/serviceWorker.ts`
- `worker/index.ts` (custom Workbox config)

### Acceptance Test (run `/qa`)
- Lighthouse PWA score ≥ 95
- DevTools → Application → Service Workers: shows registered SW
- DevTools → Network → Offline: app loads from cache
- All 5 seed scenario steps load offline
- Emergency numbers load offline
- Audio files (once cached) serve from cache offline
- Install prompt appears in Chrome (desktop + Android)

---

## ═══════════════════════════════════════
## [CONTEXT REFRESH — After STEP 25]
## ═══════════════════════════════════════

**State of the project:**
- All 14 screens complete
- Full TTS system (static audio + Web Speech fallback)
- Content versioning + banner
- PWA configured with offline-first caching
- Service worker registered

**Remaining steps:**
- Offline Download Screen (user-triggered cache)
- TTS Generation Script (CI/CD audio generation)
- Accessibility Audit
- Scenario Database Expansion (to 20 → 50+)
- Performance Optimization
- CI/CD Pipeline
- Deployment

## ═══════════════════════════════════════

---

## STEP 26 — Offline Download Screen (S12)
**Depends on:** STEP 25  
**→ After this step: `/qa`**

### Context
PWA is live. Build the explicit offline download screen so users can intentionally download content for areas with no connectivity.

### Task
Build `src/app/[locale]/settings/offline/page.tsx`.

**Layout:**
```
Download for Offline Use

[✓ App content]           Already downloaded on first visit
[✓ English audio]         Downloaded automatically
[ ] Hausa audio           [Download] button — shows progress bar
[ ] Igbo audio            [Download] button
[ ] Yoruba audio          [Download] button
[ ] Pidgin audio          [Download] button

Storage used: 24MB of estimated 87MB total

Last updated: Jan 15, 2025
[Check for updates]
```

**Download flow:**
- "Download" button triggers `cacheAudioForLanguage(lang)` message to service worker
- Shows progress: "Downloading... {n}%" (service worker posts progress messages back)
- On complete: button becomes "✓ Downloaded"
- Progress bar per language

**`src/hooks/useOfflineDownload.ts`:**
```typescript
function useOfflineDownload(lang: Language) {
  // Returns: downloadStatus, progress, startDownload, isDownloaded
}
```

**Storage estimation:**
```typescript
// Use StorageManager API if available
const estimate = await navigator.storage.estimate();
```

### Expected Output
- `src/app/[locale]/settings/offline/page.tsx`
- `src/hooks/useOfflineDownload.ts`

### Acceptance Test (run `/qa`)
- Download Hausa audio → progress bar fills → status becomes "Downloaded"
- Simulate offline after download → Hausa audio plays from cache
- Storage used estimate updates after download

---

## STEP 27 — Scenario Database Expansion (5 → 20)
**Depends on:** STEP 05  
**→ After this step: `/review`**

### Context
Only 5 seed scenarios exist. Expand to 20 — enough for a credible V1 launch. The remaining 30+ can be added post-launch via the medical contributor process.

### Task
Create 15 additional scenario JSON files in `data/scenarios/`. Use the full schema from STEP 05. Mark `trust_signals.medical_reviewer` as `"[PENDING — Nigerian emergency medicine doctor required]"` on all new scenarios.

Each scenario must have:
- Full translations in all 5 languages
- Pidgin aliases (minimum 3)
- Complete steps (max 7)
- Decision tree (create corresponding JSON in `data/decision-trees/`)

**New scenarios to create (priority order):**

Cardiac:
6. `cardiac-arrest.json`
7. `angina.json`

Respiratory:
8. `choking-child.json`
9. `asthma-attack.json`
10. `drowning.json`

Burns:
11. `minor-burn.json`
12. `severe-burn.json`

Environmental:
13. `generator-fumes.json` (CO poisoning — Nigeria-specific)
14. `heatstroke.json`

Trauma:
15. `broken-bone.json`
16. `head-injury.json`

Neurological:
17. `fainting.json`

Poisoning:
18. `snake-bite.json` (Nigeria-specific — include common Nigerian species)
19. `food-poisoning.json`

Allergic:
20. `anaphylaxis.json`

Run `npm run generate:manifest` after adding all scenarios to update `content-manifest.json`.

### Expected Output
- 15 new `data/scenarios/{slug}.json` files
- 15 new `data/decision-trees/{slug}-flow.json` files (max 3 deep)
- Updated `data/content-manifest.json`
- Updated `src/lib/data/scenarios.ts` (auto-loads all files)

### Acceptance Test
```typescript
import { scenarios } from '@/lib/data/scenarios';
console.log(scenarios.length); // 20
validateAll(); // All decision trees ≤ 3 deep
```

---

## STEP 28 — TTS Audio Generation Script
**Depends on:** STEP 05, STEP 17  
**→ After this step: `/review`**

### Context
⚠ This step requires a `GOOGLE_CLOUD_TTS_API_KEY`. In local development, set it in `.env.local` (never committed). In CI/CD, it's a GitHub Actions secret.

Build the script that generates all static audio files for all scenarios × all languages.

### Task
Build `scripts/generate-tts-audio.ts` per `PRD.md Section 9`.

```typescript
// Full implementation:
// 1. Iterates all scenarios in data/scenarios/
// 2. For each scenario: iterates all steps
// 3. For each step: iterates all 5 languages
// 4. Generates audio via Google Cloud TTS SDK
// 5. Saves to public/audio/{scenario}/{lang}/step-{n}.mp3
// 6. Skips if file already exists (incremental — don't regenerate unchanged)
// 7. Logs: "Generated: /audio/heart-attack/ha/step-1.mp3"
// 8. On completion: reports total files generated

// Voice mapping per PRD Section 9:
const VOICES = {
  en: { languageCode: 'en-NG', name: 'en-NG-Standard-A' },
  ha: { languageCode: 'ha-NG', name: 'ha-NG-Standard-A' },
  ig: { languageCode: 'ig-NG', name: 'ig-NG-Standard-A' },
  yo: { languageCode: 'yo-NG', name: 'yo-NG-Standard-A' },
  pcm: { languageCode: 'en-NG', name: 'en-NG-Standard-A' }, // Pidgin uses Nigerian English voice
};

// Speaking rate: 0.9 (slightly slower for clarity)
// Audio encoding: MP3
```

Add to `package.json`:
```json
"scripts": {
  "generate:audio": "tsx scripts/generate-tts-audio.ts",
  "generate:all": "npm run generate:audio && npm run generate:manifest"
}
```

**⚠ AUDIO QUALITY GATE:**
Before running the full generation on all 20 scenarios, run on Heart Attack (5 steps × 5 languages = 25 files). Listen to the output. Especially check Igbo and Pidgin. If quality is unacceptable for any language, document it in `AUDIO_QUALITY.md` and flag for human voice recording.

Create `AUDIO_QUALITY.md`:
```markdown
# AidHero — Audio Quality Assessment
| Language | Engine | Quality | Notes |
|---|---|---|---|
| English | en-NG-Standard-A | [TBD] | |
| Hausa | ha-NG-Standard-A | [TBD] | |
| Igbo | ig-NG-Standard-A | [TBD] | |
| Yoruba | yo-NG-Standard-A | [TBD] | |
| Pidgin | en-NG-Standard-A | [TBD] | |
```

### Expected Output
- `scripts/generate-tts-audio.ts`
- `AUDIO_QUALITY.md`
- `public/audio/` directory with generated files (after running script)
- Updated `package.json`

### Acceptance Test
```bash
GOOGLE_CLOUD_TTS_API_KEY=... npm run generate:audio
# Generates files without errors
# /public/audio/heart-attack/en/step-1.mp3 exists and plays correctly
# /public/audio/heart-attack/ha/step-1.mp3 exists
```

---

## STEP 29 — Accessibility Audit + Fixes
**Depends on:** STEP 26  
**→ After this step: `/qa`**

### Context
All screens are built. Before CI/CD, run a full accessibility audit and fix every issue. This is a launch gate — not optional.

### Task
Run `axe-core` automated checks + manual screen reader audit across all screens.

**Automated audit setup:**
```typescript
// src/test/accessibility.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';
// or vitest-axe

// Test every route:
const routes = [
  '/en',
  '/en/search',
  '/en/incidents',
  '/en/incidents/heart-attack',
  '/en/incidents/heart-attack/rescue',
  '/en/incidents/heart-attack/steps',
  '/en/emergency',
  '/en/settings',
  '/en/onboarding',
];
```

**Fix all violations before proceeding. Priority issues to check:**

1. Every `<button>` has an accessible name (no icon-only buttons without `aria-label`)
2. Every form input has a `<label>`
3. Color contrast ≥ 4.5:1 everywhere, 7:1 on emergency text
4. Focus order is logical on every screen (Tab key through entire screen)
5. Modal/sheet dialogs trap focus correctly (LanguageSheet, StateSelector)
6. `aria-live` regions on: offline badge, content update banner, step counter
7. All images have `alt` text
8. Skip-to-main-content link at top of every page
9. Emergency call button ARIA announcement is complete

**Manual checks (document results in `ACCESSIBILITY_AUDIT.md`):**
- VoiceOver on iOS Safari: navigate entire rescue flow hands-free
- TalkBack on Android Chrome: same test
- Keyboard-only: complete a full rescue without mouse/touch

### Expected Output
- `src/test/accessibility.test.tsx`
- `ACCESSIBILITY_AUDIT.md`
- All axe violations fixed in affected components

### Acceptance Test
```bash
npm run test -- accessibility
# Zero violations on all routes
```

---

## STEP 30 — Performance Optimisation
**Depends on:** STEP 29  
**→ After this step: `/qa`**

### Context
All features and accessibility are complete. Optimise for the real-world target: 3G connection on a Tecno Spark.

### Task

**Bundle analysis:**
```bash
npm install -D @next/bundle-analyzer
ANALYZE=true npm run build
```
Fix any bundle > 150kb initial JS.

**Image optimisation:**
- All category icons: SVG (inline or sprite)
- Any PNG/JPG: use `next/image` with proper `sizes`
- No icon library fonts — use Lucide React (tree-shakeable)

**Font optimisation:**
- Enable `next/font` subsetting for Syne + DM Sans
- Only load weights actually used (700, 800 for Syne; 400, 500, 600 for DM Sans)
- Add `font-display: swap`

**Audio files:**
- Verify MP3 bitrate: 64kbps sufficient for voice (reduces file size ~50%)
- Re-run generation script with `audioConfig.bitRate: 64000` if files are too large

**Lazy loading:**
- VoiceMode overlay: dynamic import (`next/dynamic`)
- LanguageSheet: dynamic import
- Decision tree renderer: dynamic import

**Lighthouse targets:**
| Metric | Target |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |
| PWA | 100 |

### Expected Output
- Lighthouse scores meeting all targets
- Bundle size < 150kb gzipped initial JS
- `next.config.ts` updated with optimisation settings

### Acceptance Test
```bash
npm run build && npx lighthouse http://localhost:3000 --view
# All scores meet targets
```

---

## ═══════════════════════════════════════
## [CONTEXT REFRESH — After STEP 30]
## ═══════════════════════════════════════

**State of the project:**
- 14 screens complete and accessible
- 20 scenarios with full translations and decision trees
- TTS audio generated for all scenarios × 5 languages
- PWA with offline-first caching
- Content versioning system live
- Accessibility audited and fixed
- Performance optimised (Lighthouse ≥ 90)

**Final steps:** CI/CD pipeline and Vercel deployment.

## ═══════════════════════════════════════

---

## STEP 31 — CI/CD Pipeline (GitHub Actions)
**Depends on:** STEP 28  
**→ After this step: `/review`**

### Context
Build the automated CI/CD pipeline per `PRD.md Section 14`.

### Task
Create `.github/workflows/ci.yml`:

```yaml
name: AidHero CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test
      - run: npm run test -- accessibility
      - name: Validate decision tree depths
        run: npx tsx src/lib/data/validateTreeDepth.ts
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: http://localhost:3000
          budgetPath: ./lighthouserc.json

  generate-audio:
    runs-on: ubuntu-latest
    needs: test
    if: |
      github.event_name == 'push' &&
      contains(toJSON(github.event.commits.*.modified), 'data/scenarios/')
    env:
      GOOGLE_CLOUD_TTS_API_KEY: ${{ secrets.GOOGLE_CLOUD_TTS_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run generate:audio
      - run: npm run generate:manifest
      - name: Commit generated audio files
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: regenerate TTS audio [skip ci]'
          file_pattern: 'public/audio/** data/content-manifest.json'

  deploy:
    runs-on: ubuntu-latest
    needs: [test, generate-audio]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

Create `lighthouserc.json`:
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:pwa": ["error", { "minScore": 1.0 }]
      }
    }
  }
}
```

Add to `package.json`:
```json
"scripts": {
  "type-check": "tsc --noEmit"
}
```

### Expected Output
- `.github/workflows/ci.yml`
- `lighthouserc.json`
- Updated `package.json`

### Acceptance Test
- Push a commit → CI passes all jobs
- Modify a scenario → `generate-audio` job triggers
- Merge to main → Vercel deployment succeeds

---

## STEP 32 — Vercel Deployment Configuration
**Depends on:** STEP 31  
**→ After this step: `/ship`**

### Context
Final step before launch. Configure Vercel for production with correct headers, security policies, and environment.

### Task
Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://plausible.io; media-src 'self'; worker-src 'self'"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/audio/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=2592000, immutable"
        }
      ]
    },
    {
      "source": "/data/content-manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

**Pre-launch checklist:**
- [ ] Domain `aidhero.ng` configured in Vercel
- [ ] SSL certificate active
- [ ] `GOOGLE_CLOUD_TTS_API_KEY` added as Vercel secret (for future use)
- [ ] `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` set to `aidhero.ng`
- [ ] All 20 scenarios reviewed by medical contributor (or pending badge shown)
- [ ] TTS audio quality reviewed for all 5 languages
- [ ] Tested on Tecno Spark (or equivalent budget Android)
- [ ] Tested on iPhone Safari (iOS 14+)
- [ ] Emergency numbers verified (call test on national numbers)
- [ ] Medical disclaimer visible on all scenario detail pages

**Run final QA:**
```bash
npm run build
npm run start  # Test production build locally
npx lighthouse http://localhost:3000 --view
```

### Expected Output
- `vercel.json`
- Production deployment live at `aidhero.ng`

### Acceptance Test (run `/ship`)
- Lighthouse PWA: 100
- Lighthouse Accessibility: ≥ 95
- Lighthouse Performance: ≥ 90
- All 20 scenarios load in offline mode
- TTS plays in at least 3 languages
- Emergency call confirmed working (tap-to-call on mobile)
- App installs to home screen on Android + prompts on iOS

---

## BUILD COMPLETE

**AidHero V1 — Shipped.**

32 steps. 14 screens. 20 medically-structured scenarios. 5 languages. Offline-first. Fully accessible. Zero backend cost.

**Post-launch priorities (V2 backlog):**
1. Expand to 50+ scenarios with medical reviewer sign-off
2. Hausa/Igbo/Yoruba audio quality review + human voice recording if needed
3. Location-based hospital finder
4. Pan-African emergency numbers (Ghana, Kenya, South Africa)
5. Push notification support (requires backend)
6. SMS/USSD fallback for feature phones

---

*PROMPT_PACK.md v1.0 — AidHero / Antigravity*  
*32 Steps | 6 Context Refreshes | Sequenced for AI agent execution*
