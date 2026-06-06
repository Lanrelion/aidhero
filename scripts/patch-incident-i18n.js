const fs = require('fs');

const additions = {
  en:  { gastrointestinal: 'Gastrointestinal',     other: 'Other' },
  ha:  { gastrointestinal: '[HA] Gastrointestinal', other: '[HA] Other' },
  ig:  { gastrointestinal: '[IG] Gastrointestinal', other: '[IG] Other' },
  yo:  { gastrointestinal: '[YO] Gastrointestinal', other: '[YO] Other' },
  pcm: { gastrointestinal: '[PCM] Gastrointestinal',other: '[PCM] Other' },
};

for (const [locale, keys] of Object.entries(additions)) {
  const file = `i18n/messages/${locale}.json`;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  Object.assign(data.incidents, keys);
  fs.writeFileSync(file, JSON.stringify(data, null, 4), 'utf8');
  console.log(`Patched ${file}`);
}
