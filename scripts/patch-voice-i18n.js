const fs = require('fs');
const locales = ['ha', 'ig', 'yo', 'pcm'];
locales.forEach(locale => {
  const tag = locale.toUpperCase();
  const file = `i18n/messages/${locale}.json`;
  let content = fs.readFileSync(file, 'utf8');
  const old = `"skipToSteps":  "[${tag}] Skip to steps",`;
  const replacement = `"skipToSteps":  "[${tag}] Skip to steps",
                   "exitVoiceMode":  "[${tag}] Exit Voice Mode",
                   "exit":  "[${tag}] Exit",
                   "pause":  "[${tag}] Pause",
                   "resume":  "[${tag}] Resume",
                   "voiceHint":  "[${tag}] Say next, back, or repeat",
                   "voiceUnavailable":  "[${tag}] Voice commands unavailable",`;
  if (!content.includes(old)) {
    console.log('Key not found in', file, '- skipping');
    return;
  }
  content = content.replace(old, replacement);
  fs.writeFileSync(file, content, { encoding: 'utf8' });
  console.log('Patched', file);
});
