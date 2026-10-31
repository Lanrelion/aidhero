const fs = require('fs');
const path = require('path');

const locales = ['en', 'ha', 'ig', 'yo', 'pcm'];
const baseDir = path.join(__dirname, 'i18n', 'messages');

locales.forEach(loc => {
    const filePath = path.join(baseDir, `${loc}.json`);
    if (!fs.existsSync(filePath)) return;
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const prefix = loc === 'en' ? '' : `[${loc.toUpperCase()}] `;
    
    if (!data.settings.offlineScreen) {
        data.settings.offlineScreen = {
            title: `${prefix}Download for Offline Use`,
            appContent: `${prefix}App content`,
            appContentStatus: `${prefix}Already downloaded on first visit`,
            englishAudio: `${prefix}English audio`,
            englishAudioStatus: `${prefix}Downloaded automatically`,
            download: `${prefix}Download`,
            downloading: `${prefix}Downloading... {progress}%`,
            downloaded: `${prefix}Downloaded`,
            storageUsed: `${prefix}Storage used: {used}MB of estimated {total}MB total`,
            lastUpdated: `${prefix}Last updated`,
            checkUpdates: `${prefix}Check for updates`
        };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        console.log(`Updated ${loc}.json`);
    }
});
