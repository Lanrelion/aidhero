# AidHero — DESIGN.md
> Version 1.0 | Phase 2 Design Document

---

## 1. Design Philosophy

### "Calm Authority"

AidHero is designed for the worst moments of a person's life — when hands shake, eyes scan fast, and decisions must be instant. Every pixel must earn its place.

> **The single thing a user must feel:** *"I know exactly what to do next."*

The visual language borrows from:
- **Emergency services communication** — zero noise, zero decoration, pure clarity
- **Navigation apps (Google Maps)** — one instruction at a time, never overwhelm
- **Crisis apps (Citizen)** — urgency that focuses rather than panics
- **Ada Health decision trees** — guided, not dumped on
- **Apple Accessibility** — inclusive by default, never as an afterthought

**What AidHero must never feel like:** Alarming. Clinical. Overwhelming. Amateur.

---

## 2. Aesthetic Direction

| Dimension | Direction |
|---|---|
| **Tone** | Bold minimalism with calm urgency |
| **Emotion** | Competent, trustworthy, immediate |
| **Reference** | Google Maps Navigation + Citizen App + One Medical |
| **One thing users remember** | "It made me feel like I could handle it" |
| **What to avoid** | Hospital sterility, app-store red alert panic, encyclopaedia walls of text |

---

## 3. Color System

```css
:root {
  /* Core Palette */
  --color-emergency: #C0392B;       /* Pompeii red — authority, not alarm-bell */
  --color-authority: #1A1A2E;       /* Deep navy-black — confidence, knowledge */
  --color-action: #27AE60;          /* Forest green — "do this", completion */
  --color-warning: #E67E22;         /* Amber — caution, secondary alert */

  /* Surfaces */
  --color-surface: #FFFEF7;         /* Warm white — not clinical */
  --color-card: #F5F5EF;            /* Elevated card surface */
  --color-card-active: #FFF0EE;     /* Active/selected card */
  --color-border: #E8E8E2;          /* Subtle dividers */

  /* Text */
  --color-text-primary: #1A1A2E;
  --color-text-secondary: #6B6B7B;
  --color-text-inverse: #FFFEF7;
  --color-text-emergency: #C0392B;

  /* Semantic */
  --color-critical: #C0392B;        /* Life-threatening */
  --color-urgent: #E67E22;          /* Needs attention soon */
  --color-stable: #27AE60;          /* Under control */
  --color-info: #2980B9;            /* Informational */
}
```

### High Contrast Mode (WCAG AAA / prefers-contrast: high)

```css
@media (prefers-contrast: high) {
  --color-surface: #000000;
  --color-text-primary: #FFFFFF;
  --color-emergency: #FF4444;
  --color-action: #00FF88;
  --color-warning: #FFAA00;
  --color-border: #FFFFFF;
}
```

### Color Usage Rules
- `--color-emergency` is reserved for: emergency call buttons, critical warnings, step numbers in rescue flow
- Never use red for decorative purposes
- Minimum contrast ratio: 4.5:1 (AA) for all text, 7:1 (AAA) for emergency instructions

---

## 4. Typography

### Font Stack

| Role | Font | Weights | Import |
|---|---|---|---|
| **Display / Headings** | Syne | 600, 700, 800 | Google Fonts |
| **Body / Instructions** | DM Sans | 400, 500, 600 | Google Fonts |
| **Step Numbers / Counts** | Syne Mono | 400, 700 | Google Fonts |

```css
:root {
  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'Syne Mono', monospace;
}
```

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--text-hero` | 40px | 1.1 | 800 | Emergency callouts (CALL 199) |
| `--text-h1` | 32px | 1.2 | 700 | Incident name, screen title |
| `--text-h2` | 24px | 1.3 | 600 | Section headers |
| `--text-h3` | 20px | 1.4 | 600 | Step titles |
| `--text-body-lg` | 18px | 1.6 | 400 | Emergency instructions (minimum) |
| `--text-body` | 16px | 1.6 | 400 | Standard body copy |
| `--text-sm` | 14px | 1.5 | 500 | Labels, UI metadata |
| `--text-xs` | 12px | 1.4 | 400 | Captions only — never emergency context |

> **Rule:** Minimum 18px in any emergency instruction context. Never use < 14px anywhere.

---

## 5. Spacing System (8px base grid)

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 80px;
  --space-10: 96px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  --shadow-card: 0 2px 8px rgba(26, 26, 46, 0.08);
  --shadow-emergency: 0 4px 24px rgba(192, 57, 43, 0.20);
  --shadow-float: 0 8px 32px rgba(26, 26, 46, 0.12);
}
```

---

## 6. Touch Target Specifications

| Context | Minimum | Recommended |
|---|---|---|
| Standard UI element | 44×44px | 48×48px |
| Navigation tab | Full-width | 56px height |
| Step button / option | Full-width | 72px height |
| Emergency call button | Full-width | 88px height |
| Voice / mic button | 72×72px | 80×80px |
| TTS play button | 56×56px | 64×64px |
| Incident card | Full-width | 80px height min |

> **Panic-state rule:** Any action that could be needed while hands are occupied with a victim must be 64px minimum touch target, reachable with one thumb, in the bottom 50% of the screen.

---

## 7. Component Library

### C01 — Emergency Call Button
```
[  📞  CALL 199 — Lagos State Emergency  ]
Full width · 88px height · Emergency red bg · 20px bold white text
2px border radius · Shadow: --shadow-emergency
Active state: scale(0.98) + brightness(0.9)
```

### C02 — Incident Card
```
[ Icon 48px ] [ Incident Name ]  [ Severity badge ]
             [ Category label ]
Full width · 80px height min · Card bg · --radius-lg
Active: emergency red left border (4px) + card-active bg
```

### C03 — Step Card (Active Rescue)
```
[ STEP 3 ]  (Syne Mono, 48px, emergency red)
[ Tilt your head back and lift the chin ]
  (DM Sans, 20px, bold, authority color)
[ Detail text... ]  (DM Sans, 16px)
[ ▶ Play  ] [ ⟨ Back ] [ Next ⟩ ]
Progress bar: thin 2px emergency red, bottom of card
```

### C04 — Decision Question Screen
```
Full-screen question layout:
  [ Question text ]  (Syne, 28px, centered, top 40%)
  [ Option A — Yes ]  (full-width, 72px, authority bg, white text)
  [ Option B — No  ]  (full-width, 72px, card bg, authority text)
  [ Option C — Not sure ]  (full-width, 64px, subtle)
Max 3 options. Single question only. No additional content.
```

### C05 — Search Bar
```
[ 🔍  Search any emergency... ] [ 🎤 ]
Full width · 56px height · Card bg · --radius-lg
18px placeholder · Voice input button right (48px target)
Results appear below after 1 character
```

### C06 — Search Result Item
```
[ Icon ] [ Incident Name ] [ Category tag ]
         [ Matched synonym hint ]
56px height · Full width · Tap highlight
```

### C07 — Language Selector (Bottom Sheet + Header Toggle)
```
Header: Language flag button — always visible top-right
  [ 🇳🇬 EN ] → taps to open bottom sheet

Bottom sheet, 50% screen height:
  [ 🇳🇬 English    ✓ ]   ← active indicator
  [ 🇳🇬 Hausa        ]
  [ 🇳🇬 Igbo         ]
  [ 🇳🇬 Yorùbá       ]
  [ 🇳🇬 Pidgin       ]
Each row: 64px height, 18px text, DM Sans
Selecting a language: closes sheet, immediately translates entire UI,
  triggers progressive audio cache for new language in background
```

### C07b — Content Update Banner
```
Appears on Home screen only (never during active rescue)
Auto-dismisses after 4 seconds
Position: top of screen, below header

[ ✓ First aid guidance updated — You're up to date ]
Height: 48px · Action green bg · White text · 14px DM Sans
Never animated during reduced-motion preference
```

### C08 — Offline Status Badge
```
Online:   invisible (no badge)
Cached:   [ ✓ Offline Ready ] — green pill, top-right, 12px
No cache: [ ⚠ Download for offline access ] — amber banner, dismissible
```

### C09 — Voice Mode Screen
```
Full-screen dark overlay
Large waveform visualizer (center)
[ 🎤 ] 80px circle, emergency red, center-bottom
"Say the emergency or tap to search"
Currently speaking: highlighted text line
```

### C10 — Progress Indicator
```
[ Step 2 of 5 ] — top of screen, always visible in rescue flow
Thin progress bar: emergency red fill on card bg
Back arrow left · "More info" link right
```

---

## 8. Screen Architecture

### Navigation Structure
```
Bottom Navigation Bar (always visible, 4 tabs):
[ 🏠 Home ] [ 🔍 Search ] [ 🚨 Emergency ] [ ⚙ Settings ]

Emergency tab = direct to Emergency Contacts screen
```

### Full Screen Map (14 screens)

```
S01 HOME
├── Large search bar (top, always)
├── Emergency CTA strip (CALL 199 - tap to call)
├── Popular incidents grid (6 large cards)
├── Browse categories (horizontal scroll)
└── Recently viewed (if any)

S02 SEARCH
├── Expanded search bar (focused)
├── Instant results (after 1 char)
├── Synonym matching ("heart pain" → Heart Attack)
├── Category filter chips
└── Recent searches

S03 CATEGORY BROWSE
├── Category header + icon
├── Incident list (full-width cards)
└── Back to home

S04 INCIDENT DETAIL
├── Severity badge + incident name
├── ⚠ Immediate warning (if critical)
├── What it is (2 sentences)
├── Signs to recognize (3–5 bullets)
├── [START GUIDED RESCUE] CTA (primary)
├── [QUICK STEPS] CTA (secondary)
├── [CALL EMERGENCY] persistent button
└── What NOT to do

S05 GUIDED RESCUE FLOW (Decision Tree)
├── Single question per screen
├── 2–3 large option buttons
├── Progress indicator
├── Back always accessible
└── Skip to quick steps link

S06 STEP-BY-STEP INSTRUCTIONS
├── Step number (large, red)
├── Instruction (large, bold)
├── Detail (body text)
├── TTS play button
├── Do / Don't indicators
├── Next / Back navigation
└── Emergency call persistent

S07 VOICE MODE
├── Full-screen dark
├── Waveform visualizer
├── Large mic button
├── Current instruction highlighted
├── Auto-advance toggle
└── Exit button (top right)

S08 EMERGENCY CONTACTS
├── Auto-detected state (Lagos, Abuja, etc.)
├── State selector (change)
├── National numbers
├── State numbers
└── Each: name + number + [CALL] button

S09 CALL CONFIRMATION
├── "Calling LASEMA — 767"
├── Confirm / Cancel (2-second countdown)
└── Prevent accidental calls

S10 SETTINGS
├── Language selection
├── Text size
├── High contrast toggle
├── Offline content download
├── Auto-play TTS toggle
└── About / Medical disclaimer

S11 LANGUAGE SELECTION
└── Bottom sheet: 5-language picker

S12 OFFLINE DOWNLOAD
├── Download progress
├── Categories to download
├── Storage usage
└── Last updated

S13 ONBOARDING (3 screens, first visit)
├── O1: "AidHero helps you act fast"
├── O2: "Works offline, in your language"
└── O3: "Set your language + download content"

S14 ABOUT
└── Medical disclaimer, version, contributors, licenses
```

---

## 9. Interaction Patterns

### Emergency Flow (Google Maps Navigation Pattern)
1. One action per screen — never two decisions at once
2. Progress always visible
3. Back is always available and safe
4. Skip/exit available at every step
5. Emergency call accessible from every screen
6. Auto-advance available in voice mode

### Search Pattern (Spotlight/Raycast Pattern)
- Results after 1 character
- Fuzzy matching (Fuse.js)
- Synonym database: "chest pain" → Heart Attack, "can't breathe" → Choking/Asthma
- Pidgin support: "my heart dey pain" → Heart Attack
- Recent searches stored offline

### Decision Tree Pattern (Ada Health Pattern)
- One question, full screen
- Binary or tri-state options only
- No forms, no text input
- Each answer leads to the next question or directly to instructions
- **Maximum depth: 3 questions** before reaching steps — hard rule, no exceptions
- CI/CD validates depth — build fails if any tree exceeds 3 levels

### Voice Pattern (Google Assistant Pattern)
- Activated via mic button or "Hey AidHero" (future)
- Speak incident → begins guidance
- Auto-reads each step
- Voice commands: "Next", "Repeat", "Call emergency"
- Falls back gracefully when mic unavailable

---

## 10. Accessibility Standards

### WCAG Compliance Target: 2.1 AA minimum, AAA for core emergency flows

| Standard | Requirement | Target |
|---|---|---|
| Text contrast | 4.5:1 minimum | 7:1 for instructions |
| Touch targets | 44px minimum | 64px emergency actions |
| Font size | 16px minimum | 18px instructions |
| Focus indicator | Visible | 3px emergency red outline |
| Screen reader | ARIA labels | Full landmark regions |
| Keyboard nav | All actions reachable | Tab order logical |
| Reduced motion | Respected | `prefers-reduced-motion` |
| High contrast | Supported | `prefers-contrast: high` |

### Situational Accessibility (Panic State)
| Condition | Design Response |
|---|---|
| One-handed | All critical actions in bottom 50% of screen |
| Wet/shaking hands | 64px+ targets, no precision gestures |
| Bright sunlight | High contrast on all outdoor-context screens |
| Stress/panic | Max 3 options per screen, no complex decisions |
| Low vision | Font size control, high contrast mode |
| Screen reader | Full VoiceOver/TalkBack support |
| Deaf user | No audio-only instructions — all TTS text visible |

### ARIA Landmark Pattern
```html
<header role="banner">       <!-- App header -->
<nav role="navigation">      <!-- Bottom nav -->
<main role="main">           <!-- Screen content -->
<section aria-label="Emergency steps">
<button aria-label="Call Lagos State Emergency — 767">
<div role="alert" aria-live="assertive"> <!-- Emergency updates -->
```

---

## 11. TTS (Text-to-Speech) Design Spec

### Language Support
| Language | Engine | Offline Strategy |
|---|---|---|
| English | Web Speech API (browser-native) | Native offline support |
| Hausa | Google Cloud TTS / Azure TTS | Pre-cache audio files |
| Igbo | Google Cloud TTS / Azure TTS | Pre-cache audio files |
| Yoruba | Google Cloud TTS | Pre-cache audio files |
| Pidgin English | Google Cloud TTS (en-NG) | Pre-cache audio files |

### TTS UI Pattern
- Each step has an individual play button
- "Read all steps" option at top of step list
- Voice mode: auto-reads each step, advances on completion
- Speed control: 0.75x, 1x, 1.25x, 1.5x
- Currently reading word highlighted in text

### Offline TTS Strategy
1. On first visit + language selection: trigger audio pre-cache for selected language
2. Audio files stored in Cache API via service worker
3. Fallback: display text prominently if audio unavailable

---

## 12. Animation Guidelines

### Principles
- Emergency context: fast, purposeful (max 200ms)
- Informational/settings: comfortable (300ms)
- Never animate in voice mode
- Always respect `prefers-reduced-motion`

### Animation Spec

| Interaction | Type | Duration | Easing |
|---|---|---|---|
| Screen transition | Slide up | 200ms | ease-out |
| Step advance | Slide left | 200ms | ease-in-out |
| Step back | Slide right | 200ms | ease-in-out |
| Card press | Scale 0.98 | 100ms | ease |
| Emergency button idle | Pulse ring | 1600ms infinite | ease-in-out |
| TTS playing | Wave bars | Continuous | ease-in-out |
| Search results | Stagger fade-in | 50ms per item | ease-out |
| Decision option select | Flash + advance | 150ms | ease |
| Bottom sheet open | Slide up | 250ms | spring |

---

## 13. Offline State Design

### Four States

| State | Indicator | User Instruction |
|---|---|---|
| Online, not cached | Subtle cloud icon | Tap to download for offline |
| Online, cached | Green pill: ✓ Offline Ready | None needed |
| Offline, cached | Green pill: ✓ Working Offline | Normal use |
| Offline, not cached | Amber banner | Limited content available |

### Offline-First Content Priority
1. **Always cached on first load:** Top 20 scenarios, emergency numbers, decision trees
2. **Cached after first view:** Any scenario once viewed
3. **Download-on-demand:** TTS audio files per language
4. **Never required:** Analytics, remote content updates

---

## 14. Medical Content Layout Standard

### Per-Scenario Structure (Mayo Clinic / NHS Pattern)

```
┌─────────────────────────────────┐
│ [CRITICAL] Severity badge       │
│ Heart Attack                    │  ← Syne 32px bold
│                                 │
│ ⚠ Call emergency services now  │  ← Immediate warning
│──────────────────────────────── │
│ What it is                      │  ← Section (2 sentences max)
│                                 │
│ Signs to recognize              │  ← 3–5 bullets, 18px
│ • Chest pain or pressure        │
│ • Pain spreading to arm/jaw     │
│                                 │
│ [START GUIDED RESCUE] ←         │  ← Primary CTA, full width
│ [Quick Steps]                   │  ← Secondary
│──────────────────────────────── │
│ What NOT to do                  │  ← Critical don'ts
│ • Do not give food/water        │
│                                 │
│ When to go to hospital          │  ← Always go — immediate
│──────────────────────────────── │
│ [📞 CALL EMERGENCY]             │  ← Persistent, full-width
└─────────────────────────────────┘
```

---

## 15. Brand Voice Guide

| Context | Tone | Example |
|---|---|---|
| Emergency instructions | Direct, commanding, calm | "Press firmly. Do not let go." |
| Decision questions | Clear, non-judgemental | "Is the person breathing?" |
| Onboarding | Warm, empowering | "You can save a life. AidHero shows you how." |
| Settings | Simple, helpful | "Choose your language" |
| Offline/error | Reassuring | "You're offline. Everything still works." |
| Empty states | Encouraging | "Search any medical emergency" |
| Medical disclaimers | Honest, clear | "AidHero guides first aid. Always seek professional help." |

---

## 16. Design Scores (Pre-build Checklist)

Before any screen is built, it must score ≥7/10 on:

| Criterion | Weight |
|---|---|
| Can a panicking person understand it in < 3 seconds? | 25% |
| Are all touch targets ≥ 44px? | 15% |
| Does it work in high contrast mode? | 15% |
| Is the emergency call reachable in ≤ 2 taps? | 20% |
| Is it screen-reader navigable? | 15% |
| Does it work offline without degradation? | 10% |

---

*DESIGN.md v1.1 — AidHero*  
*Ready for Phase 3 PRD → Confirm before proceeding*
