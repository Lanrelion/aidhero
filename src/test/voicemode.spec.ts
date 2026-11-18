import { test, expect } from '@playwright/test';
import { openRescueSteps } from './helpers/open-rescue-steps';

test.use({ hasTouch: true });

test('Voice Mode Back goes back one step and Exit stops offline playback on a short screen', async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 480 });
  // Keep an utterance active until cancelled, regardless of installed system voices.
  await page.addInitScript(() => {
    let active: SpeechSynthesisUtterance | null = null;
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [],
        get speaking() { return active !== null; },
        pending: false,
        speak(utterance: SpeechSynthesisUtterance) {
          active = utterance;
          utterance.dispatchEvent(new Event('start'));
        },
        cancel() {
          const utterance = active;
          active = null;
          utterance?.dispatchEvent(new Event('end'));
        },
      },
    });
  });

  await openRescueSteps(page, 'anaphylaxis');
  await page.getByRole('button', { name: 'Voice Mode', exact: true }).tap();

  const dialog = page.getByRole('dialog');
  const next = dialog.getByRole('button', { name: 'Next Step', exact: true });
  await expect(dialog.getByText(/Step 1 of/i)).toBeVisible();
  await context.setOffline(true);
  const advanceToStep = async (step: number) => {
    await next.click();
    await expect(dialog.getByText(new RegExp(`Step ${step} of`, 'i'))).toBeVisible();
    await expect.poll(() => page.evaluate(() => speechSynthesis.speaking)).toBe(true);
  };

  await advanceToStep(2);
  await advanceToStep(3);
  const back = dialog.getByRole('button', { name: 'Back', exact: true });
  await expect(back).toHaveCount(2);
  await back.first().click();
  await expect(dialog.getByText(/Step 2 of/i)).toBeVisible();
  await expect.poll(() => page.evaluate(() => speechSynthesis.speaking)).toBe(true);
  await back.last().click();
  await expect(dialog.getByText(/Step 1 of/i)).toBeVisible();

  await advanceToStep(2);
  await dialog.getByRole('button', { name: 'Exit', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => speechSynthesis.speaking)).toBe(false);
});

test('Voice Mode handles spoken Next, Repeat and Back after playback', async ({ page }) => {
  await page.addInitScript(() => {
    let utterance: SpeechSynthesisUtterance | null = null;
    let utteranceCount = 0;
    let listenerCount = 0;
    let listener: TestRecognition | null = null;

    class TestRecognition {
      static async available() { return 'available'; }
      private used = false;
      processLocally = false;
      onstart?: () => void;
      onend?: () => void;
      onspeechend?: () => void;
      result?: unknown;
      onerror?: (event: { error: string }) => void;
      onresult?: (event: { resultIndex: number; results: unknown[] }) => void;

      start() {
        if (this.used || utterance) throw new Error('Recognizer reused or started during speech');
        this.used = true;
        listener = this;
        document.documentElement.dataset.voiceListeners = String(++listenerCount);
        document.documentElement.dataset.localRecognition = String(this.processLocally);
        this.onstart?.();
      }

      abort() {
        if (listener === this) listener = null;
        this.onend?.();
      }

      stop() {
        if (this.result) this.onresult?.({ resultIndex: 0, results: [this.result] });
      }
    }

    Object.defineProperty(window, 'SpeechRecognition', { value: undefined });
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: TestRecognition });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [],
        get speaking() { return utterance !== null; },
        pending: false,
        speak(next: SpeechSynthesisUtterance) {
          utterance = next;
          document.documentElement.dataset.voiceUtterances = String(++utteranceCount);
          next.dispatchEvent(new Event('start'));
        },
        cancel() {
          const current = utterance;
          utterance = null;
          current?.dispatchEvent(new Event('end'));
        },
      },
    });

    window.addEventListener('test-speech-end', () => {
      const current = utterance;
      utterance = null;
      current?.dispatchEvent(new Event('end'));
    });
    window.addEventListener('test-voice-command', event => {
      if (!listener) throw new Error('Microphone is not listening');
      const result = Object.assign(
        [{ transcript: 'unrecognized' }, { transcript: (event as CustomEvent<string>).detail }],
        { isFinal: true },
      );
      listener.result = result;
      listener.onspeechend?.();
    });
    window.addEventListener('test-listening-end', () => listener?.abort());
    window.addEventListener('test-listening-network-error', () => {
      listener?.onerror?.({ error: 'network' });
      listener?.abort();
    });
  });

  await openRescueSteps(page);
  const voiceButton = page.getByRole('button', { name: 'Voice Mode', exact: true });
  await expect(voiceButton).toBeVisible();
  const firstUtterance = await voiceButton.evaluate(button => {
    (button as HTMLButtonElement).click();
    return document.documentElement.dataset.voiceUtterances;
  });
  expect(firstUtterance).toBe('1');

  const dialog = page.getByRole('dialog', { name: 'Voice Mode' });
  const hint = dialog.getByRole('status');
  const speakCommand = async (command: string, playbackCount: number) => {
    await expect(page.locator('html')).toHaveAttribute('data-voice-utterances', String(playbackCount));
    await expect(hint).toHaveText('Wait for the step to finish before speaking.');
    await page.evaluate(() => window.dispatchEvent(new Event('test-speech-end')));
    await expect(hint).toHaveText('Say: next, back, repeat');
    if (playbackCount === 1) {
      await page.evaluate(() => window.dispatchEvent(new Event('test-listening-end')));
      await expect(page.locator('html')).toHaveAttribute('data-voice-listeners', '2');
      await expect(page.locator('html')).toHaveAttribute('data-local-recognition', 'true');
      await page.evaluate(() => window.dispatchEvent(new Event('test-listening-network-error')));
      await expect(page.locator('html')).toHaveAttribute('data-voice-listeners', '3');
      await expect(page.locator('html')).toHaveAttribute('data-local-recognition', 'false');
      await expect(hint).toHaveText('Say: next, back, repeat');
    }
    await page.evaluate(word => {
      window.dispatchEvent(new CustomEvent('test-voice-command', { detail: word }));
    }, command);
  };

  await speakCommand('Next.', 1);
  await expect(dialog.getByText(/Step 2 of/i)).toBeVisible();
  await speakCommand('Repeat.', 2);
  await expect(dialog.getByText(/Step 2 of/i)).toBeVisible();
  await speakCommand('Back.', 3);
  await expect(dialog.getByText(/Step 1 of/i)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-voice-utterances', '4');
});

test('Voice Mode does not race steps and respects user countdown / Next button', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);

  await openRescueSteps(page);

  // Open Voice Mode via FAB
  const voiceModeFab = page.locator('button[aria-label*="Voice Mode"], button[aria-label*="voiceMode"]').first();
  await expect(voiceModeFab).toBeVisible();
  await voiceModeFab.tap();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  // Step 1 should be visible
  await expect(dialog.getByText(/Step 1 of/i)).toBeVisible();

  // Wait 4 seconds — previously the bug caused it to advance at 2.6s (600ms + 2000ms)
  await page.waitForTimeout(4000);

  // Verify Step 1 is STILL visible and has NOT advanced automatically in 4s!
  await expect(dialog.getByText(/Step 1 of/i)).toBeVisible();

  // Tap Next Step button manually
  const nextBtn = dialog.locator('button:has-text("Next Step")');
  await expect(nextBtn).toBeVisible();
  await nextBtn.click();

  // Wait for step transition
  await page.waitForTimeout(1000);

  // Verify now on Step 2
  await expect(dialog.getByText(/Step 2 of/i)).toBeVisible();
});
