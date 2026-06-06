const fs = require('fs');

const additions = {
  en:  { step1: 'Step 1' },
  ha:  { step1: '[HA] Step 1' },
  ig:  { step1: '[IG] Step 1' },
  yo:  { step1: '[YO] Step 1' },
  pcm: { step1: '[PCM] Step 1' },
};

for (const [locale, keys] of Object.entries(additions)) {
  const file = `i18n/messages/${locale}.json`;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  Object.assign(data.rescue, keys);
  fs.writeFileSync(file, JSON.stringify(data, null, 4), 'utf8');
  console.log(`Patched ${file}`);
}
