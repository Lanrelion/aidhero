const fs = require('fs');

const langs = ['en', 'ha', 'ig', 'yo', 'pcm'];

langs.forEach(lang => {
  const path = `./i18n/messages/${lang}.json`;
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  if (!data.emergency) {
    data.emergency = {};
  }
  
  if (!data.emergency.changeState) {
    data.emergency.changeState = 'Change state';
    data.emergency.selectState = 'Select State';
    data.emergency.searchStates = 'Search states...';
    data.emergency.noStatesFound = 'No states found matching "{search}"';
    
    // Convert back to string and write
    fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
    console.log(`Updated ${lang}`);
  }
});
