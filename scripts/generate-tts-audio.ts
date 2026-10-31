/**
 * TTS Audio Generation Script (STEP 28)
 * 
 * Pre-generates MP3 files via Google Cloud TTS REST API.
 * Audio lives at: public/audio/{scenario-slug}/{lang}/step-{n}.mp3
 * 
 * IMPORTANT (Rule 7): This script runs ONLY in CI/CD or local dev.
 * The GOOGLE_CLOUD_TTS_API_KEY must NEVER be shipped to the browser.
 * 
 * Usage:
 *   # Quality gate — single scenario only
 *   GOOGLE_CLOUD_TTS_API_KEY=xxx npx tsx scripts/generate-tts-audio.ts --scenario heart-attack --only
 * 
 *   # Single language for a scenario
 *   GOOGLE_CLOUD_TTS_API_KEY=xxx npx tsx scripts/generate-tts-audio.ts --scenario heart-attack --lang ha
 *
 *   # Full generation — all 20 scenarios × 5 languages
 *   GOOGLE_CLOUD_TTS_API_KEY=xxx npx tsx scripts/generate-tts-audio.ts
 * 
 *   # Force regeneration (overwrite existing files)
 *   GOOGLE_CLOUD_TTS_API_KEY=xxx npx tsx scripts/generate-tts-audio.ts --force
 */

import fs from 'fs';
import path from 'path';

// ──── CLI Argument Parsing ────

const args = process.argv.slice(2);

function getFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function getFlagValue(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

const API_KEY = process.env.GOOGLE_CLOUD_TTS_API_KEY;
const SCENARIO_FILTER = getFlagValue('scenario');
const LANG_FILTER = getFlagValue('lang');
const ONLY_MODE = getFlag('only');     // If set, only generate for --scenario (skip rest)
const FORCE = getFlag('force');        // Overwrite existing files

if (!API_KEY) {
  console.error('❌ GOOGLE_CLOUD_TTS_API_KEY is not set.');
  console.error('   Set it as an environment variable:');
  console.error('   GOOGLE_CLOUD_TTS_API_KEY=your_key npx tsx scripts/generate-tts-audio.ts');
  process.exit(1);
}

if (ONLY_MODE && !SCENARIO_FILTER) {
  console.error('❌ --only requires --scenario <slug>');
  process.exit(1);
}

// ──── Voice Configuration ────
// Google Cloud TTS available voices (verified 2026-09-09)
// Nigerian-specific voices (en-NG, ha-NG, ig-NG, yo-NG) DO NOT EXIST in Google TTS.
// Strategy:
//   - en:  en-GB-Wavenet-A (natural female British voice — best quality for English)
//   - pcm: en-GB-Wavenet-B (male British voice — gives Pidgin a distinct character)
//   - ha/ig/yo: en-GB-Standard-A (placeholder — text is still English [NEEDS_REVIEW])
//              These MUST be replaced by human voice recordings when translations arrive.

interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'FEMALE' | 'MALE' | 'NEUTRAL';
  isPlaceholder: boolean; // true = voice doesn't match the language, needs human recording
}

const VOICES: Record<string, VoiceConfig> = {
  en:  { languageCode: 'en-GB', name: 'en-GB-Wavenet-A',  ssmlGender: 'FEMALE', isPlaceholder: false },
  ha:  { languageCode: 'en-GB', name: 'en-GB-Standard-A', ssmlGender: 'FEMALE', isPlaceholder: true },
  ig:  { languageCode: 'en-GB', name: 'en-GB-Standard-A', ssmlGender: 'FEMALE', isPlaceholder: true },
  yo:  { languageCode: 'en-GB', name: 'en-GB-Standard-A', ssmlGender: 'FEMALE', isPlaceholder: true },
  pcm: { languageCode: 'en-GB', name: 'en-GB-Wavenet-B',  ssmlGender: 'MALE',   isPlaceholder: false },
};

const SUPPORTED_LANGS = Object.keys(VOICES);

const SCENARIOS_DIR = path.join(process.cwd(), 'data', 'scenarios');
const AUDIO_OUT_DIR = path.join(process.cwd(), 'public', 'audio');

// ──── Stats Tracking ────

interface GenerationStats {
  generated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const stats: GenerationStats = {
  generated: 0,
  skipped: 0,
  failed: 0,
  errors: [],
};

// ──── Core TTS API Call ────

async function synthesizeSpeech(
  text: string,
  lang: string,
  outputPath: string
): Promise<boolean> {
  if (!FORCE && fs.existsSync(outputPath)) {
    stats.skipped++;
    return false; // Already exists, skip
  }

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const voice = VOICES[lang];
  if (!voice) {
    console.error(`  ❌ No voice config for language: ${lang}`);
    stats.failed++;
    return false;
  }

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

  const payload = {
    input: { text },
    voice: {
      languageCode: voice.languageCode,
      name: voice.name,
      ssmlGender: voice.ssmlGender,
    },
    audioConfig: {
      audioEncoding: 'MP3' as const,
      speakingRate: 0.9,          // Slightly slower for emergency instructions
      sampleRateHertz: 24000,     // Voice-optimized: smaller files (~32-64kbps MP3)
      pitch: 0.0,
      volumeGainDb: 0.0,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errMsg = `API ${response.status}: ${lang} → ${path.basename(outputPath)} — ${errorText.substring(0, 200)}`;
      console.error(`  ❌ ${errMsg}`);
      stats.errors.push(errMsg);
      stats.failed++;
      return false;
    }

    const data = await response.json() as { audioContent?: string };
    if (!data.audioContent) {
      const errMsg = `No audioContent returned for ${lang}/${path.basename(outputPath)}`;
      console.error(`  ❌ ${errMsg}`);
      stats.errors.push(errMsg);
      stats.failed++;
      return false;
    }

    // Write binary MP3 file
    const buffer = Buffer.from(data.audioContent, 'base64');
    fs.writeFileSync(outputPath, buffer);

    const sizeKb = (buffer.length / 1024).toFixed(1);
    const relPath = outputPath.split('public')[1]?.replace(/\\/g, '/') || outputPath;
    console.log(`  ✅ ${relPath} (${sizeKb} KB)`);
    stats.generated++;
    return true;
  } catch (error: any) {
    const errMsg = `Network error: ${lang}/${path.basename(outputPath)} — ${error?.message || error}`;
    console.error(`  ❌ ${errMsg}`);
    stats.errors.push(errMsg);
    stats.failed++;
    return false;
  }
}

// ──── Scenario Processing ────

interface ScenarioStep {
  id: number;
  instruction: string;
  instruction_translations: Record<string, string>;
  detail?: string;
  detail_translations?: Record<string, string>;
}

interface ScenarioData {
  id: string;
  slug: string;
  title: string;
  steps: ScenarioStep[];
}

async function processScenario(filePath: string): Promise<void> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data: ScenarioData = JSON.parse(raw);

  const languages = LANG_FILTER
    ? [LANG_FILTER].filter((l) => SUPPORTED_LANGS.includes(l))
    : SUPPORTED_LANGS;

  if (languages.length === 0) {
    console.warn(`  ⚠️  No valid languages to generate for`);
    return;
  }

  console.log(`\n📋 ${data.title} (${data.slug}) — ${data.steps.length} steps × ${languages.length} languages`);

  for (const step of data.steps) {
    for (const lang of languages) {
      const instruction =
        step.instruction_translations?.[lang] || step.instruction;
      const detail =
        step.detail_translations?.[lang] || step.detail || '';

      // Clean [NEEDS_REVIEW] prefix — still generate the audio, 
      // but the text will be English read by the target language voice.
      const cleanInstruction = instruction.replace(/^\[NEEDS_REVIEW\]\s*/i, '');
      const cleanDetail = detail.replace(/^\[NEEDS_REVIEW\]\s*/i, '');

      const textToRead = cleanDetail
        ? `${cleanInstruction}. ${cleanDetail}`.trim()
        : cleanInstruction.trim();

      if (!textToRead) continue;

      const outPath = path.join(AUDIO_OUT_DIR, data.slug, lang, `step-${step.id}.mp3`);
      await synthesizeSpeech(textToRead, lang, outPath);

      // Small delay to avoid API rate limiting
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

// ──── Main Entry ────

async function main() {
  console.log('🎙️  AidHero TTS Audio Generator');
  console.log('================================');
  console.log(`API Key:    ${API_KEY!.substring(0, 8)}...${API_KEY!.substring(API_KEY!.length - 4)}`);
  console.log(`Scenario:   ${SCENARIO_FILTER || 'ALL'}`);
  console.log(`Language:   ${LANG_FILTER || 'ALL (en, ha, ig, yo, pcm)'}`);
  console.log(`Force:      ${FORCE}`);
  console.log(`Output Dir: ${AUDIO_OUT_DIR}`);
  console.log('');

  if (!fs.existsSync(SCENARIOS_DIR)) {
    console.error(`❌ Scenarios directory not found: ${SCENARIOS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SCENARIOS_DIR).filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    console.error('❌ No scenario JSON files found');
    process.exit(1);
  }

  // Filter scenarios
  const scenarioFiles = SCENARIO_FILTER
    ? files.filter((f) => {
        const slug = f.replace('.json', '');
        return slug === SCENARIO_FILTER;
      })
    : files;

  if (scenarioFiles.length === 0) {
    console.error(`❌ Scenario not found: ${SCENARIO_FILTER}`);
    console.error(`   Available: ${files.map((f) => f.replace('.json', '')).join(', ')}`);
    process.exit(1);
  }

  console.log(`📁 Processing ${scenarioFiles.length} scenario(s)...\n`);

  for (const file of scenarioFiles) {
    await processScenario(path.join(SCENARIOS_DIR, file));
  }

  // ──── Summary ────
  console.log('\n================================');
  console.log('📊 Generation Summary');
  console.log('================================');
  console.log(`  ✅ Generated: ${stats.generated}`);
  console.log(`  ⏭️  Skipped:   ${stats.skipped} (already exist)`);
  console.log(`  ❌ Failed:    ${stats.failed}`);
  console.log(`  📁 Total:     ${stats.generated + stats.skipped + stats.failed}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    for (const err of stats.errors) {
      console.log(`   • ${err}`);
    }
  }

  if (stats.failed > 0) {
    console.log('\n⚠️  Some files failed to generate. Re-run with the same command to retry.');
    process.exit(1);
  }

  console.log('\n🎉 Done!');
}

main().catch((err) => {
  console.error('Fatal error during generation:', err);
  process.exit(1);
});
