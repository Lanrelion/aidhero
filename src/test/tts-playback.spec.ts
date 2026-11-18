import { test, expect, type Page } from '@playwright/test';
import { openRescueSteps } from './helpers/open-rescue-steps';
import { getStepNarration } from '../lib/tts/stepNarration';

test('available Hausa stays selected around an English fallback', () => {
  const step = {
    id: 1,
    instruction: 'This is an audio test.',
    instruction_translations: {
      en: 'This is an audio test.', ha: '[NEEDS_REVIEW] Wannan gwajin sauti ne.',
      ig: '', yo: '', pcm: '',
    },
    audio_path: '',
  };
  const pending = {
    ...step,
    id: 2,
    instruction_translations: { ...step.instruction_translations, ha: '[NEEDS_REVIEW] This is an audio test.' },
  };

  expect([step, pending, step].map(value => getStepNarration(value, 'ha'))).toEqual([
    { locale: 'ha', text: 'Wannan gwajin sauti ne.' },
    { locale: 'en', text: 'This is an audio test.' },
    { locale: 'ha', text: 'Wannan gwajin sauti ne.' },
  ]);
});

test('every selected language keeps an explicit translation, even when it shares English wording', () => {
  const step = {
    id: 1,
    instruction: 'Stop.',
    instruction_translations: { en: 'Stop.', ha: 'Tsaya.', ig: 'Kwụsị.', yo: 'Dúró.', pcm: 'Stop.' },
    audio_path: '',
  };
  const languages = ['en', 'ha', 'ig', 'yo', 'pcm'] as const;
  for (const locale of languages) {
    expect(getStepNarration(step, locale)).toEqual({ locale, text: step.instruction_translations[locale] });
  }
});

async function openSteps(page: Page, voiceLanguage?: string) {
  await page.addInitScript(language => {
    if (language) Object.defineProperty(SpeechSynthesisUtterance.prototype, 'voice', { value: null, writable: true });
    let active: SpeechSynthesisUtterance | undefined;
    let calls = 0;
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => language ? [{ lang: language, localService: true, name: 'QA local voice' }] : [],
        speak(utterance: SpeechSynthesisUtterance) {
          active = utterance;
          document.documentElement.dataset.spokenCount = String(++calls);
          document.documentElement.dataset.spokenLanguage = utterance.lang;
          utterance.dispatchEvent(new Event('start'));
        },
        cancel() { active = undefined; },
      },
    });
    window.addEventListener('test-playback-finished', () => {
      active?.dispatchEvent(new Event('end'));
      active = undefined;
    });
    window.addEventListener('test-playback-failed', () => active?.dispatchEvent(new Event('error')));
  }, voiceLanguage);
  await openRescueSteps(page);
}

test('single-step playback stays on the step and Read All continues offline', async ({ page, context }) => {
  await openSteps(page);
  const play = page.getByRole('button', { name: 'Play in English', exact: true });
  const readAll = page.getByRole('button', { name: 'Read all steps in English', exact: true });
  const html = page.locator('html');

  await expect(play).toBeVisible();
  await context.setOffline(true);
  await expect(play.evaluate(button => {
    (button as HTMLButtonElement).click();
    return document.documentElement.dataset.spokenCount;
  })).resolves.toBe('1');
  await expect(html).toHaveAttribute('data-spoken-language', 'en-US');
  await page.evaluate(() => window.dispatchEvent(new Event('test-playback-finished')));
  await expect(play).toBeVisible();
  await expect(page.getByText(/Step 1 of/)).toBeVisible();

  await readAll.click();
  await expect(html).toHaveAttribute('data-spoken-count', '2');
  await page.evaluate(() => window.dispatchEvent(new Event('test-playback-finished')));
  await expect(page.getByText(/Step 2 of/)).toBeVisible();
  await expect(html).toHaveAttribute('data-spoken-count', '3');
  await page.getByRole('button', { name: 'Stop reading all' }).click();
  await expect(readAll).toBeVisible();
  await expect(page.getByText(/Step 2 of/)).toBeVisible();
});

test('Read All reports a speech failure and keeps the current instruction visible', async ({ page }) => {
  await openSteps(page);
  const readAll = page.getByRole('button', { name: 'Read all steps in English', exact: true });
  await expect(readAll.evaluate(button => {
    (button as HTMLButtonElement).click();
    return document.documentElement.dataset.spokenCount;
  })).resolves.toBe('1');
  await page.evaluate(() => window.dispatchEvent(new Event('test-playback-failed')));
  await expect(page.getByText("Audio couldn't play. Read the instructions on screen.")).toBeVisible();
  await expect(readAll).toBeVisible();
  await expect(page.getByText(/Step 1 of/)).toBeVisible();
});

test('switching to Hausa reads the same rescue step in Hausa using a local voice offline', async ({ page, context }) => {
  await openSteps(page, 'ha-NG');
  await page.goto('/en/incidents/asthma-attack/steps?variant=with-inhaler');
  await expect(page.locator('main h3').first()).toBeVisible();
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Change Language' }).click();
  await page.getByText('Hausa', { exact: true }).first().click();
  await expect(page).toHaveURL(/\/ha\/incidents\/asthma-attack\/steps\?variant=with-inhaler$/);

  await expect(page.locator('main h3').first()).toHaveAttribute('lang', 'ha');
  await expect(page.getByRole('button', { name: 'Karanta duk matakan da Hausa' })).toBeVisible();
  const play = page.getByRole('button', { name: 'Saurara da Hausa' });
  await expect(play).toBeVisible();
  await context.setOffline(true);
  await expect(play.evaluate(button => {
    (button as HTMLButtonElement).click();
    return document.documentElement.dataset.spokenLanguage;
  })).resolves.toBe('ha-NG');
  await page.evaluate(() => window.dispatchEvent(new Event('test-playback-finished')));
  await expect(play).toBeVisible();
});

test('Igbo instructions stay in Igbo when the device has no matching voice', async ({ page }) => {
  await openSteps(page);
  await page.goto('/ig/incidents/choking-adult/steps');
  await expect(page.locator('main h3').first()).toHaveAttribute('lang', 'ig');
  await page.getByRole('button', { name: /Igbo$/ }).last().click();
  await expect(page.getByText('Ụda akpọghị. Gụọ ntuziaka dị na ihuenyo.')).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-spoken-language', /.+/);
  await page.getByRole('button', { name: 'Kpọọ na English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-spoken-language', 'en-US');
  await expect(page.locator('main h3').first()).toHaveAttribute('lang', 'ig');
});
