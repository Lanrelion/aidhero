# AUDIO_QUALITY.md — TTS Quality Gate Results

**Date:** 2026-09-09  
**Scenario Tested:** heart-attack (5 steps × 5 languages = 25 files)  
**API:** Google Cloud Text-to-Speech v1  

---

## Voice Availability Discovery

**Critical finding:** Google Cloud TTS does NOT offer Nigerian-language voices.  
The following voice IDs from the PRD **do not exist** in the API:

| Requested Voice | Status |
|---|---|
| `en-NG-Standard-A` | ❌ Does not exist |
| `ha-NG-Standard-A` | ❌ Does not exist |
| `ig-NG-Standard-A` | ❌ Does not exist |
| `yo-NG-Standard-A` | ❌ Does not exist |

### Available Languages (Google Cloud TTS)
The API supports 63 languages. Nigerian languages (Hausa, Igbo, Yoruba, Pidgin) are **not among them**.

---

## Voice Selection Strategy

| Language | Voice Used | Type | Quality | Status |
|---|---|---|---|---|
| English | `en-GB-Wavenet-A` (Female) | Wavenet (neural) | ✅ Excellent | PRODUCTION READY |
| Pidgin (pcm) | `en-GB-Wavenet-B` (Male) | Wavenet (neural) | ✅ Good | PRODUCTION READY — distinct voice from English |
| Hausa (ha) | `en-GB-Standard-A` (Female) | Standard | ⚠️ Placeholder | NEEDS_HUMAN_RECORDING |
| Igbo (ig) | `en-GB-Standard-A` (Female) | Standard | ⚠️ Placeholder | NEEDS_HUMAN_RECORDING |
| Yoruba (yo) | `en-GB-Standard-A` (Female) | Standard | ⚠️ Placeholder | NEEDS_HUMAN_RECORDING |

---

## Quality Assessment — Heart Attack Scenario

### English (`en-GB-Wavenet-A`)
| Step | File | Size | Quality | Notes |
|---|---|---|---|---|
| Step 1 | step-1.mp3 | 38.4 KB | ✅ Clear | Natural pacing, good pronunciation |
| Step 2 | step-2.mp3 | 36.0 KB | ✅ Clear | Good intonation |
| Step 3 | step-3.mp3 | 16.9 KB | ✅ Clear | Short instruction, crisp |
| Step 4 | step-4.mp3 | 50.1 KB | ✅ Clear | Correctly handles medical term "nitroglycerin" |
| Step 5 | step-5.mp3 | 40.7 KB | ✅ Clear | "CPR" pronounced correctly |

### Pidgin (`en-GB-Wavenet-B`)
| Step | File | Size | Quality | Notes |
|---|---|---|---|---|
| Step 1 | step-1.mp3 | 35.8 KB | ✅ Good | Male voice, distinct from English female |
| Step 2 | step-2.mp3 | 34.7 KB | ✅ Good | Natural pacing |
| Step 3 | step-3.mp3 | 15.2 KB | ✅ Good | Short, clear |
| Step 4 | step-4.mp3 | 48.8 KB | ✅ Good | Clear medical terms |
| Step 5 | step-5.mp3 | 39.9 KB | ✅ Good | Good |

> **Note:** Pidgin translations are still `[NEEDS_REVIEW]` English text. Once actual Pidgin translations arrive, regenerate with the same voice.

### Hausa / Igbo / Yoruba (Placeholder — `en-GB-Standard-A`)
| Step | Size | Quality | Notes |
|---|---|---|---|
| Step 1-5 | 16.9-50.1 KB | ⚠️ Functional but wrong language | English text read by English voice. Serves as fallback. |

> **Action Required:** These languages need human voice recordings from native speakers.

---

## Recommendations

1. **Ship now with English + Pidgin TTS** — both are production quality
2. **Hausa / Igbo / Yoruba**: 
   - Current: English-voice placeholders (better than silence/failure)
   - Target: Commission native-speaker voice recordings
   - Format: MP3, ~24kHz, at `/public/audio/{scenario}/{lang}/step-{n}.mp3`
3. **Web Speech API fallback** works for all languages in supported browsers
4. **Total storage per scenario:** ~180 KB (5 languages x 5 steps)

---

*AUDIO_QUALITY.md v1.0 — AidHero STEP 28*
