import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { config } from 'dotenv';
import type { Scenario } from '../src/types/scenario';
import type { Locale } from '../src/i18n/config';
import { getStepNarration } from '../src/lib/tts/stepNarration';
import { getLocalizedRescueSteps } from '../src/lib/data/rescueStepTranslations';
import { getRecordedNarrationPath, getRecordingKey, type RecordingIndex } from '../src/lib/tts/audioPath';

const voices: Record<Locale, { id: string; language?: string; sample: string }> = {
  en: { id: 'lina', language: 'en', sample: 'Hello. This is the AidHero audio test.' },
  ha: { id: 'amina', language: 'ha', sample: 'Sannu. Wannan gwajin sautin AidHero ne.' },
  ig: { id: 'ngozi', language: 'ig', sample: 'Ndewo. Nke a bụ nnwale ụda AidHero.' },
  yo: { id: 'sade', language: 'yo', sample: 'Ẹ n lẹ́. Èyí ni àyẹ̀wò ohùn AidHero.' },
  // Boma is a Pidgin system voice. The API's language override is optional.
  pcm: { id: 'boma', sample: 'Hello. We dey test AidHero audio.' },
};

const { values } = parseArgs({
  options: {
    scenario: { type: 'string' },
    all: { type: 'boolean' },
    lang: { type: 'string' },
    'dry-run': { type: 'boolean' },
  },
});

function isLocale(value: string): value is Locale {
  return Object.hasOwn(voices, value);
}

interface Clip {
  lang: Locale;
  text: string;
  url: string;
  key?: string;
}

const indexFile = path.join('src', 'lib', 'tts', 'recordedNarration.json');

async function planClips() {
  const languages = values.lang === undefined ? Object.keys(voices) : [values.lang];
  if (!languages.every(isLocale)) throw new Error('Use --lang en, ha, ig, yo, or pcm.');

  if (values.all && values.scenario !== undefined) throw new Error('Use --all or --scenario, not both.');
  if (values.scenario === undefined && !values.all) {
    return languages.map(lang => ({
      lang,
      text: voices[lang].sample,
      url: `/audio/_spitch-pilot/${lang}/sample.mp3`,
    }));
  }

  const scenarioDir = path.join('data', 'scenarios');
  const slugs = values.all
    ? (await readdir(scenarioDir)).filter(file => file.endsWith('.json')).sort().map(file => file.slice(0, -5))
    : [values.scenario!];
  const clips: Clip[] = [];
  for (const slug of slugs) clips.push(...await planScenario(scenarioDir, slug, languages));
  return clips;
}

async function planScenario(dir: string, slug: string, languages: Locale[]): Promise<Clip[]> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Use a valid incident slug.');
  const scenario: Scenario = JSON.parse(await readFile(path.join(dir, `${slug}.json`), 'utf8'));
  const steps = getLocalizedRescueSteps(scenario);
  return languages.flatMap(lang => steps.flatMap(step => {
    if (!Number.isInteger(step.id) || step.id < 1) throw new Error(`${slug} has an invalid step ID.`);
    const narration = getStepNarration(step, lang);
    if (narration.locale !== lang || !narration.text.trim()) {
      console.log(`Skipping ${slug} step ${step.id}: no ${lang} text.`);
      return [];
    }
    const text = narration.text;
    const fingerprint = createHash('sha256').update(JSON.stringify([text, voices[lang], 0.9])).digest('hex').slice(0, 16);
    return {
      lang,
      text,
      url: getRecordedNarrationPath(slug, lang, step.id, text) ??
        `/audio/rescue-narration-v1/${slug}/${lang}/step-${step.id}-${fingerprint}.mp3`,
      key: getRecordingKey(slug, lang, step.id),
    };
  }));
}

function isMp3(audio: Buffer) {
  return audio.length > 3 && (audio.toString('ascii', 0, 3) === 'ID3' ||
    (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0));
}

function publicFile(clip: Clip) {
  return path.join('public', clip.url.slice(1));
}

async function hasRecording(clip: Clip) {
  try {
    return isMp3(await readFile(publicFile(clip)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return false;
  }
}

async function generateClip(clip: Clip, apiKey: string): Promise<Buffer> {
  const voice = voices[clip.lang];
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch('https://api.spitch.app/v1/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: clip.text,
        voice: voice.id,
        language: voice.language,
        format: 'mp3',
        speed: 0.9,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (response.ok) {
      const audio = Buffer.from(await response.arrayBuffer());
      if (!isMp3(audio)) throw new Error(`${clip.url}: Spitch did not return MP3 audio.`);
      return audio;
    }
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`${clip.url}: Spitch returned HTTP ${response.status}.`);
    }
    const retryAfter = Number(response.headers.get('retry-after'));
    await response.body?.cancel();
    if (attempt < 4) await delay(retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** attempt);
  }
  throw new Error(`${clip.url}: Spitch rate limit or service error persisted. Rerun to resume.`);
}

async function writeAtomically(file: string, bytes: Buffer | string) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, bytes);
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function main() {
  const clips = await planClips();
  if (!clips.length) throw new Error('No step text in the requested language. Run without --scenario to generate voice samples.');
  if (!values['dry-run']) config({ path: '.env.local', quiet: true });
  const apiKey = process.env.SPITCH_API_KEY?.trim();
  const index: RecordingIndex = JSON.parse(await readFile(indexFile, 'utf8'));
  let existing = 0;
  let missing = 0;
  for (const clip of clips) {
    const available = await hasRecording(clip);
    if (available) {
      existing++;
    } else {
      missing++;
      console.log(`${values['dry-run'] ? 'Missing' : 'Generating'} ${clip.url}`);
      if (!values['dry-run']) {
        if (!apiKey) throw new Error('Set SPITCH_API_KEY in .env.local or the build environment.');
        await writeAtomically(publicFile(clip), await generateClip(clip, apiKey));
        await delay(1000);
      }
    }
    if (!values['dry-run'] && clip.key &&
        (index[clip.key]?.path !== clip.url || index[clip.key]?.text !== clip.text)) {
      index[clip.key] = { path: clip.url, text: clip.text };
      await writeAtomically(indexFile, JSON.stringify(index, null, 2) + '\n');
    }
  }
  console.log(`${clips.length} steps with matching text. ${existing} reusable clips. ${missing} ${values['dry-run'] ? 'to generate' : 'generated'}.`);
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Spitch generation failed.');
  process.exitCode = 1;
});
