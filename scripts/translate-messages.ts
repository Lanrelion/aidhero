import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local if present
dotenv.config({ path: '.env.local' });

const API_KEY = 
  process.env.GOOGLE_TRANSLATE_API_KEY ||
  process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY ||
  process.env.GOOGLE_CLOUD_TTS_API_KEY ||
  process.env.GOOGLE_CLOUD_API_KEY;

const LOCALES = ['ha', 'ig', 'yo', 'pcm'] as const;
type TargetLocale = typeof LOCALES[number];

// Comprehensive curated translation dictionary for West African emergency & medical UI terms
// to ensure 100% natural, culturally accurate translations as gold standard / fallback
const CURATED_TRANSLATIONS: Record<TargetLocale, Record<string, string>> = {
  ha: {
    // Nav & General
    "Home": "Gida",
    "Search": "Nema",
    "Emergency": "Gaggawa",
    "Settings": "Saituna",
    "AidHero": "AidHero",
    "First Aid Guide": "Jagoran Agajin Gaggawa",
    "Search for symptoms or injuries...": "Nemi alamomi ko raunuka...",
    "Categories": "Rukuni",
    "Call Emergency": "Kira Gaggawa",
    "Call": "Kira",
    "Yes": "Eh",
    "No": "A'a",
    "None": "Babu",
    "General": "Gabaɗaya",
    "Accessibility": "Sauƙin Amfani",
    "About AidHero": "Game da AidHero",
    "Version": "Sigar",
    "Offline-First": "Aiki Ba Tare da Intanet Ba",
    "Medical Disclaimer: This application provides general first-aid guidance based on standard protocols, but it is not a substitute for professional medical advice, diagnosis, or treatment. Always call emergency services immediately in critical situations.": "Gargaɗi na Likita: Wannan manhaja tana ba da jagorancin agajin gaggawa ne kawai bisa ƙa'ida, ba ta maye gurbin shawarar likita ba. Koyaushe kira lambobin gaggawa nan take.",

    // Rescue
    "Start Guided Rescue": "Fara Agajin Gaggawa Mai Jagora",
    "Quick Steps": "Matakai Masu Sauri",
    "Step {step} of {total}": "Mataki na {step} cikin {total}",
    "STEP {number}": "MATAKI NA {number}",
    "Next": "Na Gaba",
    "Next Step": "Mataki na Gaba",
    "Back": "Baya",
    "Repeat": "Maimaita",
    "Done — Call Emergency": "An Gama — Kira Gaggawa",
    "Play in": "Saurara da",
    "Stop": "Tsaya",
    "Read all steps in": "Karanta duk matakan da",
    "Voice Mode": "Yanayin Murya",
    "Skip to steps": "Tsallake zuwa matakai",
    "Exit Voice Mode": "Fita daga Yanayin Murya",
    "Exit": "Fita",
    "Pause": "Dakata",
    "Resume": "Ci gaba",
    "Say \"next\", \"back\", or \"repeat\"": "Ce \"next\", \"back\", ko \"repeat\"",
    "Voice commands unavailable": "Umarnin murya baya aiki a yanzu",
    "CRITICAL": "MAI HATSARIN GASKE",
    "MODERATE": "MAI SAUƘI",
    "URGENT": "MAI GAGGAWA",
    "Signs to recognise": "Alamomin da za a gane",
    "What NOT to do": "Abin da KADA a yi",
    "When to go to hospital": "Lokacin tafiya asibiti",
    "Step 1": "Mataki na 1",

    // Search
    "Search...": "Nema...",
    "No results found for \"{query}\".": "Ba a sami sakamako ba don \"{query}\".",
    "Recent Searches": "Binciken Kwanan Nan",
    "Try: heart attack, choking, bleeding": "Gwada: ciwon zuciya, shaƙewa, zubar jini",
    "All Categories": "Duk Rukunoni",
    "Clear": "Share",

    // Incidents
    "Paediatric": "Na Yara",
    "Trauma": "Rauni / Hatsari",
    "Environmental": "Na Muhalli",
    "Respiratory": "Hanyar Numfashi",
    "Burns": "Kone-kone",
    "Allergic": "Rashin Lafiya ta Rashin Dace (Allergy)",
    "Obstetric": "Na Masu Juna Biyu",
    "Cardiac": "Na Zuciya",
    "Poisoning": "Guba",
    "Neurological": "Na Ƙwaƙwalwa / Jijiyoyi",
    "Gastrointestinal": "Na Ciki / Hanji",
    "Other": "Sauran",

    // Emergency
    "State Numbers": "Lambobin Jihohi",
    "National Emergency Numbers": "Lambobin Gaggawa na Ƙasa",
    "Showing numbers for": "Ana nuna lambobi don",
    "Showing national numbers": "Ana nuna lambobin ƙasa",
    "Services": "Ayyuka",
    "National Services": "Ayyukan Ƙasa",
    "Change state": "Canza Jiha",
    "Select State": "Zaɓi Jiha",
    "Search states...": "Nemi jiha...",
    "No states found matching \"{search}\"": "Babu jihar da ta dace da \"{search}\"",

    // Settings & Offline
    "Language": "Harshe",
    "Text Size": "Girmar Rubutu",
    "Contrast": "Bambancin Launi",
    "Offline Mode": "Yanayin Ba Tare da Intanet Ba",
    "Content downloaded": "An sauke bayanan manhaja",
    "Audio downloaded for": "An sauke sautin murya don",
    "Changing language will restart your rescue flow. Continue?": "Canza harshe zai sake farawa da aikin ceto. Ci gaba?",
    "Download for Offline Use": "Sauke don Amfani Ba Tare da Intanet Ba",
    "App content": "Bayanan Manhaja",
    "Already downloaded on first visit": "An riga an sauke a ziyarar farko",
    "English audio": "Sautin Turanci",
    "Downloaded automatically": "An sauke ta atomatik",
    "Download": "Sauke",
    "Downloading... {progress}%": "Ana saukewa... {progress}%",
    "Downloaded": "An Sauke",
    "Storage used: {used}MB of estimated {total}MB total": "Wurin da aka yi amfani da shi: {used}MB cikin kimanin {total}MB",
    "Last updated": "Sabuntawar ƙarshe",
    "Check for updates": "Duba sabuntawa",
    "High Contrast": "Launi Mai Haske",
    "Maximum legibility mode": "Yanayi mafi bayyane don karantawa",
    "Auto-play Voice": "Kunnawa ta atomatik",
    "Read steps aloud automatically": "Karanta matakai da murya ta atomatik",
    "Offline Voice Mode Fallback": "Zaɓin Yanayin Murya Ba Tare da Intanet Ba",
    "Choose how long to wait before automatically advancing to the next step when voice commands are unavailable offline.": "Zaɓi lokacin da za a jira kafin wucewa zuwa mataki na gaba lokacin da umarnin murya baya aiki.",
    "Manual (Tap to advance)": "Da hannu (Danna don ci gaba)",
    "{count} seconds": "Daƙiƙa {count}",

    // Accessibility
    "Accessibility Strings": "Rubutun Sauƙin Amfani",
    "Call Emergency Numbers": "Kira Lambobin Gaggawa",
    "Change Language": "Canza Harshe",
    "Bottom Navigation": "Kewayawa na Ƙasa",
    "Skip to main content": "Tsallake zuwa ainihin abun ciki",

    // Offline / Status
    "Ready for offline use": "A shirye yake don aiki ba tare da intanet ba",
    "Limited offline functionality": "Iyakantaccen aiki ba tare da intanet ba",
    "Content updated": "An sabunta abun ciki",
    "Offline Mode Active": "Yanayin Aiki Ba Tare da Intanet Ba Kunnanne",
    "Downloading Content...": "Ana sauke abun ciki...",

    // Errors
    "Page not found": "Ba a sami shafin ba",
    "Audio unavailable in offline mode": "Babu sautin murya a yanayin ba tare da intanet ba",
    "This feature requires an internet connection": "Wannan aikin yana buƙatar haɗin intanet",

    // Onboarding
    "You can save a life.": "Kuna iya ceton rai.",
    "AidHero shows you how.": "AidHero zai nuna muku yadda ake yi.",
    "Works offline,": "Yana aiki ba tare da intanet ba,",
    "in your language.": "a cikin harshenku.",
    "Choose your language": "Zaɓi harshenku",
    "+ download content": "+ sauke bayanan manhaja",
    "Download for offline use": "Sauke don amfani ba tare da intanet ba",
    "I'll do this later": "Zan yi wannan daga baya",
    "Skip": "Tsallake",

    // Metadata
    "AidHero - Emergency First Aid Nigeria": "AidHero - Agajin Gaggawa Na Najeriya",
    "Offline-first emergency first aid guide for Nigeria. Instant, guided first aid instructions in English, Hausa, Igbo, Yoruba, and Pidgin. Works without internet.": "Jagoran agajin gaggawa na Najeriya ba tare da intanet ba. Umarnin agaji nan take a Turanci, Hausa, Igbo, Yarbanci da Pidgin.",
    "You can save a life. AidHero shows you how. Offline first aid guide for Nigeria.": "Kuna iya ceton rai. AidHero zai nuna muku yadda ake yi. Jagoran agaji ba tare da intanet ba a Najeriya."
  },

  ig: {
    // Nav & General
    "Home": "Ụlọ",
    "Search": "Chọọ",
    "Emergency": "Ihe Mberede",
    "Settings": "Ntọala",
    "AidHero": "AidHero",
    "First Aid Guide": "Ntuziaka Enyemaka Mbụ",
    "Search for symptoms or injuries...": "Chọọ mgbaàmà ma ọ bụ mmerụ ahụ...",
    "Categories": "Otu Dị Iche Iche",
    "Call Emergency": "Kpọọ Ndị Mberede",
    "Call": "Kpọọ",
    "Yes": "Ee",
    "No": "Mba",
    "None": "Ọ dịghị",
    "General": "N'ozuzu",
    "Accessibility": "Nnweta",
    "About AidHero": "Gbasara AidHero",
    "Version": "Ụdị",
    "Offline-First": "Na-arụ Ọrụ Na-enweghị Ịntanetị",
    "Medical Disclaimer: This application provides general first-aid guidance based on standard protocols, but it is not a substitute for professional medical advice, diagnosis, or treatment. Always call emergency services immediately in critical situations.": "Ịdọ Aka Ná Ntị Ahụike: Ngwa a na-enye ntuziaka enyemaka mbụ izugbe, ọ bụghị nnọchi maka ndụmọdụ dọkịta. Kpọọ ndị ọrụ mberede ozugbo n'ọnọdụ dị egwu.",

    // Rescue
    "Start Guided Rescue": "Malite Nnapụta Nduzi",
    "Quick Steps": "Nzọụkwụ Ngwa Ngwa",
    "Step {step} of {total}": "Nzọụkwụ {step} nke {total}",
    "STEP {number}": "NZỌỤKWỤ {number}",
    "Next": "Osote",
    "Next Step": "Nzọụkwụ Ọzọ",
    "Back": "Azu",
    "Repeat": "Meghachi",
    "Done — Call Emergency": "Emela — Kpọọ Ndị Mberede",
    "Play in": "Kpọọ na",
    "Stop": "Kwụsị",
    "Read all steps in": "Gụọ usoro niile na",
    "Voice Mode": "Ụdị Olu",
    "Skip to steps": "Gaa na nzọụkwụ",
    "Exit Voice Mode": "Pụọ n'Ụdị Olu",
    "Exit": "Pụọ",
    "Pause": "Kwụsịtụ",
    "Resume": "Gaa n'ihu",
    "Say \"next\", \"back\", or \"repeat\"": "Kwu \"next\", \"back\", ma ọ bụ \"repeat\"",
    "Voice commands unavailable": "Iwu olu adịghị ugbu a",
    "CRITICAL": "DỊ OKWU OKWU",
    "MODERATE": "DỊ NDEKỌ",
    "URGENT": "DỊ NGWA",
    "Signs to recognise": "Ihe ịrịba ama ị ga-amata",
    "What NOT to do": "Ihe ị NA-EKWESỊGHỊ ime",
    "When to go to hospital": "Mgbe ị ga-aga ụlọ ọgwụ",
    "Step 1": "Nzọụkwụ 1",

    // Search
    "Search...": "Chọọ...",
    "No results found for \"{query}\".": "Ọ nweghị ihe achọtara maka \"{query}\".",
    "Recent Searches": "Ọchụchọ Na-adịbeghị Anya",
    "Try: heart attack, choking, bleeding": "Nwalee: nkụchi obi, iku ume ike, ọbara ọgbụgba",
    "All Categories": "Ụdị Niile",
    "Clear": "Kpochapụ",

    // Incidents
    "Paediatric": "Maka Ụmụaka",
    "Trauma": "Mmerụ Ahụ",
    "Environmental": "Nke Gburugburu Ebe Obibi",
    "Respiratory": "Nke Ikuku Ume",
    "Burns": "Ọkụ Ọkụ",
    "Allergic": "Ọrịa Nfụkasị Ahụ (Allergy)",
    "Obstetric": "Maka Ụmụ Nwanyị Dị Ime",
    "Cardiac": "Nke Obi",
    "Poisoning": "Nsị",
    "Neurological": "Nke Ụbụrụ na Akwara",
    "Gastrointestinal": "Nke Afọ",
    "Other": "Ndị Ọzọ",

    // Emergency
    "State Numbers": "Nọmba Steeti",
    "National Emergency Numbers": "Nọmba Mberede Mba",
    "Showing numbers for": "Na-egosi nọmba maka",
    "Showing national numbers": "Na-egosi nọmba mba",
    "Services": "Ọrụ",
    "National Services": "Ọrụ Mba",
    "Change state": "Gbanwee Steeti",
    "Select State": "Họrọ Steeti",
    "Search states...": "Chọọ steeti...",
    "No states found matching \"{search}\"": "Ọ nweghị steeti kwekọrọ na \"{search}\"",

    // Settings & Offline
    "Language": "Asụsụ",
    "Text Size": "Ogo Ederede",
    "Contrast": "Ọdịiche Agba",
    "Offline Mode": "Ọnọdụ Na-enweghị Ịntanetị",
    "Content downloaded": "Ebudatara ọdịnaya ngwa",
    "Audio downloaded for": "Ebudatara ụda olu maka",
    "Changing language will restart your rescue flow. Continue?": "Ịgbanwe asụsụ ga-eme ka ị malitegharịa nnapụta. Gaa n'ihu?",
    "Download for Offline Use": "Budata maka Ojiji Na-enweghị Ịntanetị",
    "App content": "Ọdịnaya Ngwa",
    "Already downloaded on first visit": "Ebudatara na nleta mbụ",
    "English audio": "Ụda Bekee",
    "Downloaded automatically": "Ebudatara na-akpaghị aka",
    "Download": "Budata",
    "Downloading... {progress}%": "Na-ebudata... {progress}%",
    "Downloaded": "Ebudatara",
    "Storage used: {used}MB of estimated {total}MB total": "Ohere ejiri rụọ ọrụ: {used}MB n'ime ihe dịka {total}MB",
    "Last updated": "Mmelite ikpeazụ",
    "Check for updates": "Lelee mmelite",
    "High Contrast": "Ọdịiche Agba Dị Elu",
    "Maximum legibility mode": "Ọnọdụ kacha mma maka ịgụ ihe",
    "Auto-play Voice": "Kpọọ Olu Na-akpaghị Aka",
    "Read steps aloud automatically": "Gụọ usoro n'olu dara ụda na-akpaghị aka",
    "Offline Voice Mode Fallback": "Nkwado Ụdị Olu Na-enweghị Ịntanetị",
    "Choose how long to wait before automatically advancing to the next step when voice commands are unavailable offline.": "Họrọ oge ị ga-eche tupu ị gaa n'ihu na nzọụkwụ ọzọ mgbe iwu olu adịghị.",
    "Manual (Tap to advance)": "Site n'aka (Kpatụ iji gaa n'ihu)",
    "{count} seconds": "Sekọnd {count}",

    // Accessibility
    "Accessibility Strings": "Okwu Nnweta",
    "Call Emergency Numbers": "Kpọọ Nọmba Mberede",
    "Change Language": "Gbanwee Asụsụ",
    "Bottom Navigation": "Nchọgharị Ala",
    "Skip to main content": "Gaa na isi ọdịnaya",

    // Offline / Status
    "Ready for offline use": "Dị njikere maka ojiji na-enweghị ịntanetị",
    "Limited offline functionality": "Ọrụ nwere oke na-enweghị ịntanetị",
    "Content updated": "Emelitere ọdịnaya",
    "Offline Mode Active": "Ọnọdụ Na-enweghị Ịntanetị Na-arụ Ọrụ",
    "Downloading Content...": "Na-ebudata ọdịnaya...",

    // Errors
    "Page not found": "Ahụghị ibe ahụ",
    "Audio unavailable in offline mode": "Ụda adịghị n'ọnọdụ na-enweghị ịntanetị",
    "This feature requires an internet connection": "Njirimara a chọrọ njikọ ịntanetị",

    // Onboarding
    "You can save a life.": "Ị nwere ike ịzọpụta ndụ.",
    "AidHero shows you how.": "AidHero na-egosi gị otu esi eme ya.",
    "Works offline,": "Na-arụ ọrụ na-enweghị ịntanetị,",
    "in your language.": "n'asụsụ gị.",
    "Choose your language": "Họrọ asụsụ gị",
    "+ download content": "+ budata ọdịnaya",
    "Download for offline use": "Budata maka ojiji na-enweghị ịntanetị",
    "I'll do this later": "M ga-eme nke a ma emechaa",
    "Skip": "Wụpụ",

    // Metadata
    "AidHero - Emergency First Aid Nigeria": "AidHero - Enyemaka Mbụ Mberede Na Naịjirịa",
    "Offline-first emergency first aid guide for Nigeria. Instant, guided first aid instructions in English, Hausa, Igbo, Yoruba, and Pidgin. Works without internet.": "Ntuziaka enyemaka mbụ na-enweghị ịntanetị maka Naịjirịa. Ntuziaka enyemaka mbụ ozugbo n'asụsụ Bekee, Hausa, Igbo, Yoruba, na Pidgin.",
    "You can save a life. AidHero shows you how. Offline first aid guide for Nigeria.": "Ị nwere ike ịzọpụta ndụ. AidHero na-egosi gị otu esi eme ya. Ntuziaka enyemaka mbụ na-enweghị ịntanetị na Naịjirịa."
  },

  yo: {
    // Nav & General
    "Home": "Ilé",
    "Search": "Wá",
    "Emergency": "Pàjáwìrì",
    "Settings": "Ètò",
    "AidHero": "AidHero",
    "First Aid Guide": "Itọsọna Iranlọwọ Akọkọ",
    "Search for symptoms or injuries...": "Wá àwọn àmì àìsàn tàbí egbò...",
    "Categories": "Àwọn Ẹ̀ka",
    "Call Emergency": "Pe Pàjáwìrì",
    "Call": "Pe",
    "Yes": "Bẹ́ẹ̀ni",
    "No": "Bẹ́ẹ̀kọ́",
    "None": "Kò sí",
    "General": "Gbogbogbò",
    "Accessibility": "Ìrọ̀rùn Ìlò",
    "About AidHero": "Nípa AidHero",
    "Version": "Àtẹ̀jáde",
    "Offline-First": "Ń ṣiṣẹ́ láìsí Íńtánẹ́ẹ̀tì",
    "Medical Disclaimer: This application provides general first-aid guidance based on standard protocols, but it is not a substitute for professional medical advice, diagnosis, or treatment. Always call emergency services immediately in critical situations.": "Ìkìlọ̀ Ìṣègùn: Ètò ìṣiṣẹ́ yìí ń pèsè ìtọ́sọ́nà ìrànlọ́wọ́ àkọ́kọ́ lásán, kìí ṣe dípò ìmọ̀ràn dókítà. Máa pe àwọn iṣẹ́ pàjáwìrì lẹ́sẹ̀kẹsẹ̀ ní àwọn ipò tó le koko.",

    // Rescue
    "Start Guided Rescue": "Bẹ̀rẹ̀ Ìgbàlà Pẹ̀lú Ìtọ́sọ́nà",
    "Quick Steps": "Àwọn Ìgbésẹ̀ Kíákíá",
    "Step {step} of {total}": "Ìgbésẹ̀ {step} nínú {total}",
    "STEP {number}": "ÌGBÉSẸ̀ {number}",
    "Next": "Tókàn",
    "Next Step": "Ìgbésẹ̀ Tókàn",
    "Back": "Padà",
    "Repeat": "Tún ṣe",
    "Done — Call Emergency": "Ti parí — Pe Pàjáwìrì",
    "Play in": "Gbọ́ ní",
    "Stop": "Dúró",
    "Read all steps in": "Ka gbogbo ìgbésẹ̀ ní",
    "Voice Mode": "Ètò Ohùn",
    "Skip to steps": "Fò lọ sí àwọn ìgbésẹ̀",
    "Exit Voice Mode": "Jáde kúrò ní Ètò Ohùn",
    "Exit": "Jáde",
    "Pause": "Dánu dúró",
    "Resume": "Tẹ̀síwájú",
    "Say \"next\", \"back\", or \"repeat\"": "Sọ \"next\", \"back\", tàbí \"repeat\"",
    "Voice commands unavailable": "Àwọn àṣẹ ohùn kò sí níbẹ̀ báyìí",
    "CRITICAL": "PÀTÀKÌ GAN-AN",
    "MODERATE": "DÁWỌ̀RỌ̀",
    "URGENT": "KÍÁKÍÁ",
    "Signs to recognise": "Àwọn àmì láti mọ̀",
    "What NOT to do": "Ohun tí KÒ GBỌ́DỌ̀ ṣe",
    "When to go to hospital": "Ìgbà láti lọ sí ilé ìwòsàn",
    "Step 1": "Ìgbésẹ̀ 1",

    // Search
    "Search...": "Wá...",
    "No results found for \"{query}\".": "Kò sí àbájáde tí a rí fún \"{query}\".",
    "Recent Searches": "Àwọn Ìwádìí Àìpẹ́",
    "Try: heart attack, choking, bleeding": "Gbìyànjú: àrùn ọkàn, gbé nǹkan mì, ẹ̀jẹ̀ ríru",
    "All Categories": "Gbogbo Àwọn Ẹ̀ka",
    "Clear": "Pa rẹ́",

    // Incidents
    "Paediatric": "Fún Ọmọdé",
    "Trauma": "Ìpalára / Egbò",
    "Environmental": "Nípa Àyíká",
    "Respiratory": "Ètò Ìmí",
    "Burns": "Iná Jíjó",
    "Allergic": "Àìfararọ (Allergy)",
    "Obstetric": "Fún Aboyún",
    "Cardiac": "Nípa Ọkàn",
    "Poisoning": "Oró / Márawò",
    "Neurological": "Nípa Ọpọlọ àti Iṣan",
    "Gastrointestinal": "Nípa Inú",
    "Other": "Àwọn Ìyókù",

    // Emergency
    "State Numbers": "Àwọn Nọ́mbà Ìpínlẹ̀",
    "National Emergency Numbers": "Àwọn Nọ́mbà Pàjáwìrì Orílẹ̀-Èdè",
    "Showing numbers for": "Ń fi àwọn nọ́mbà hàn fún",
    "Showing national numbers": "Ń fi àwọn nọ́mbà orílẹ̀-èdè hàn",
    "Services": "Àwọn Iṣẹ́",
    "National Services": "Àwọn Iṣẹ́ Orílẹ̀-Èdè",
    "Change state": "Yí Ìpínlẹ̀ Padà",
    "Select State": "Yan Ìpínlẹ̀",
    "Search states...": "Wá ìpínlẹ̀...",
    "No states found matching \"{search}\"": "Kò sí ìpínlẹ̀ tó bá \"{search}\" mu",

    // Settings & Offline
    "Language": "Èdè",
    "Text Size": "Ìwọ̀n Ọ̀rọ̀",
    "Contrast": "Ìyàtọ̀ Àwọ̀",
    "Offline Mode": "Ètò Láìsí Íńtánẹ́ẹ̀tì",
    "Content downloaded": "A ti gba àkóónú sílẹ̀",
    "Audio downloaded for": "A ti gba ohùn sílẹ̀ fún",
    "Changing language will restart your rescue flow. Continue?": "Yíyí èdè padà yóò tún ètò ìgbàlà bẹ̀rẹ̀. Ṣé kí a tẹ̀síwájú?",
    "Download for Offline Use": "Gba sílẹ̀ fún Ìlò Láìsí Íńtánẹ́ẹ̀tì",
    "App content": "Àkóónú Ètò",
    "Already downloaded on first visit": "A ti gbà á sílẹ̀ ní ìbẹ̀wò àkọ́kọ́",
    "English audio": "Ohùn Gẹ̀ẹ́sì",
    "Downloaded automatically": "Gbígbà sílẹ̀ fúnra rẹ̀",
    "Download": "Gba sílẹ̀",
    "Downloading... {progress}%": "Ń gba sílẹ̀... {progress}%",
    "Downloaded": "Ti gbà sílẹ̀",
    "Storage used: {used}MB of estimated {total}MB total": "Ààyè tí a lò: {used}MB nínú nǹkan bí {total}MB lápapọ̀",
    "Last updated": "Àtúnṣe ìkẹyìn",
    "Check for updates": "Ṣàyẹ̀wò àwọn àtúnṣe",
    "High Contrast": "Àwọ̀ Tó Hàn Gbangba",
    "Maximum legibility mode": "Ètò kíkà tó rọrùn jùlọ",
    "Auto-play Voice": "Kíkà Ohùn Lẹ́sẹ̀kẹsẹ̀",
    "Read steps aloud automatically": "Ka àwọn ìgbésẹ̀ jáde ní ohùn fúnra rẹ̀",
    "Offline Voice Mode Fallback": "Ètò Àfikún Ohùn Láìsí Íńtánẹ́ẹ̀tì",
    "Choose how long to wait before automatically advancing to the next step when voice commands are unavailable offline.": "Yan iye àkókò láti dúró kí o tó tẹ̀síwájú sí ìgbésẹ̀ tókàn nígbà tí àṣẹ ohùn kò bá ṣiṣẹ́.",
    "Manual (Tap to advance)": "Pẹ̀lú ọwọ́ (Fọwọ́ kàn án láti tẹ̀síwájú)",
    "{count} seconds": "Àáyá {count}",

    // Accessibility
    "Accessibility Strings": "Àwọn Ọ̀rọ̀ Ìrọ̀rùn Ìlò",
    "Call Emergency Numbers": "Pe Àwọn Nọ́mbà Pàjáwìrì",
    "Change Language": "Yí Èdè Padà",
    "Bottom Navigation": "Ìtọ́sọ́nà Ìsàlẹ̀",
    "Skip to main content": "Fò lọ sí orí àkóónú gangan",

    // Offline / Status
    "Ready for offline use": "Ó ti ṣetán fún ìlò láìsí íńtánẹ́ẹ̀tì",
    "Limited offline functionality": "Iṣẹ́ díẹ̀ ló wà láìsí íńtánẹ́ẹ̀tì",
    "Content updated": "Àkóónú ti di títúnṣe",
    "Offline Mode Active": "Ètò Láìsí Íńtánẹ́ẹ̀tì Ń Ṣiṣẹ́",
    "Downloading Content...": "Ń gba àkóónú sílẹ̀...",

    // Errors
    "Page not found": "A kò rí ojú ewé náà",
    "Audio unavailable in offline mode": "Ohùn kò sí ní ètò láìsí íńtánẹ́ẹ̀tì",
    "This feature requires an internet connection": "Ètò yìí nílò ìsopọ̀ íńtánẹ́ẹ̀tì",

    // Onboarding
    "You can save a life.": "O lè gba ẹ̀mí là.",
    "AidHero shows you how.": "AidHero yóò fi bí a ṣe ń ṣe é hàn ọ́.",
    "Works offline,": "Ń ṣiṣẹ́ láìsí íńtánẹ́ẹ̀tì,",
    "in your language.": "ní èdè rẹ.",
    "Choose your language": "Yan èdè rẹ",
    "+ download content": "+ gba àkóónú sílẹ̀",
    "Download for offline use": "Gba sílẹ̀ fún ìlò láìsí íńtánẹ́ẹ̀tì",
    "I'll do this later": "N ó ṣe èyí nígbà mìíràn",
    "Skip": "Fò kọjá",

    // Metadata
    "AidHero - Emergency First Aid Nigeria": "AidHero - Ìrànwọ́ Pàjáwìrì Ní Nàìjíríà",
    "Offline-first emergency first aid guide for Nigeria. Instant, guided first aid instructions in English, Hausa, Igbo, Yoruba, and Pidgin. Works without internet.": "Itọsọna iranlọwọ akọkọ laisi intanẹẹti fun orilẹ-ede Naijiria. Awọn itọnisọna ni ede Gẹẹsi, Hausa, Igbo, Yoruba ati Pidgin.",
    "You can save a life. AidHero shows you how. Offline first aid guide for Nigeria.": "O lè gba ẹ̀mí là. AidHero yóò fi bí a ṣe ń ṣe é hàn ọ́. Itọsọna iranlọwọ akọkọ laisi intanẹẹti ni Naijiria."
  },

  pcm: {
    // Nav & General
    "Home": "Home",
    "Search": "Find",
    "Emergency": "Emergency",
    "Settings": "Settings",
    "AidHero": "AidHero",
    "First Aid Guide": "First Aid Guide",
    "Search for symptoms or injuries...": "Find symptoms or wound...",
    "Categories": "Categories",
    "Call Emergency": "Call Emergency",
    "Call": "Call",
    "Yes": "Yes",
    "No": "No",
    "None": "Nothing",
    "General": "General",
    "Accessibility": "Easy to Use",
    "About AidHero": "About AidHero",
    "Version": "Version",
    "Offline-First": "E Dey Work Without Internet",
    "Medical Disclaimer: This application provides general first-aid guidance based on standard protocols, but it is not a substitute for professional medical advice, diagnosis, or treatment. Always call emergency services immediately in critical situations.": "Medical Warning: Dis app dey give normal first aid guidance, e no be doctor advice. Always call emergency people sharp sharp for serious matter.",

    // Rescue
    "Start Guided Rescue": "Start Step-by-Step Rescue",
    "Quick Steps": "Sharp Steps",
    "Step {step} of {total}": "Step {step} out of {total}",
    "STEP {number}": "STEP {number}",
    "Next": "Next",
    "Next Step": "Next Step",
    "Back": "Back",
    "Repeat": "Talk am again",
    "Done — Call Emergency": "I Don Finish — Call Emergency",
    "Play in": "Play for",
    "Stop": "Stop",
    "Read all steps in": "Read all steps for",
    "Voice Mode": "Voice Mode",
    "Skip to steps": "Jump go steps",
    "Exit Voice Mode": "Comot Voice Mode",
    "Exit": "Comot",
    "Pause": "Pause",
    "Resume": "Continue",
    "Say \"next\", \"back\", or \"repeat\"": "Talk \"next\", \"back\", or \"repeat\"",
    "Voice commands unavailable": "Voice command no dey work now",
    "CRITICAL": "DEY SERIOUS WELL WELL",
    "MODERATE": "DEY NORMAL",
    "URGENT": "DEY URGENT",
    "Signs to recognise": "Signs to look for",
    "What NOT to do": "Wetin you NO MUST do",
    "When to go to hospital": "When to carry person go hospital",
    "Step 1": "Step 1",

    // Search
    "Search...": "Find...",
    "No results found for \"{query}\".": "Nothing dey for wetin you find: \"{query}\".",
    "Recent Searches": "Things you find recently",
    "Try: heart attack, choking, bleeding": "Try: heart attack, choking, bleeding",
    "All Categories": "All Categories",
    "Clear": "Clear am",

    // Incidents
    "Paediatric": "Children Matter",
    "Trauma": "Wound & Injury",
    "Environmental": "Environment Issue",
    "Respiratory": "Breathing Problem",
    "Burns": "Fire Burn",
    "Allergic": "Allergy Issue",
    "Obstetric": "Belle / Pregnancy Matter",
    "Cardiac": "Heart Problem",
    "Poisoning": "Poison Matter",
    "Neurological": "Brain & Nerve Problem",
    "Gastrointestinal": "Belle Pain & Stomach",
    "Other": "Other Matters",

    // Emergency
    "State Numbers": "State Phone Numbers",
    "National Emergency Numbers": "National Emergency Numbers",
    "Showing numbers for": "De show numbers for",
    "Showing national numbers": "De show national numbers",
    "Services": "Services",
    "National Services": "National Services",
    "Change state": "Change State",
    "Select State": "Pick State",
    "Search states...": "Find state...",
    "No states found matching \"{search}\"": "No state match wetin you type \"{search}\"",

    // Settings & Offline
    "Language": "Language",
    "Text Size": "How Text Big Reach",
    "Contrast": "Color Brightness",
    "Offline Mode": "No-Internet Mode",
    "Content downloaded": "App matter don download",
    "Audio downloaded for": "Voice don download for",
    "Changing language will restart your rescue flow. Continue?": "If you change language e go restart your rescue flow. You wan continue?",
    "Download for Offline Use": "Download for Use Without Internet",
    "App content": "App content",
    "Already downloaded on first visit": "E don download already on first visit",
    "English audio": "English voice",
    "Downloaded automatically": "E download by itself",
    "Download": "Download",
    "Downloading... {progress}%": "E de download... {progress}%",
    "Downloaded": "Don Download",
    "Storage used: {used}MB of estimated {total}MB total": "Space wey e use: {used}MB out of {total}MB total",
    "Last updated": "Last time wey we update am",
    "Check for updates": "Check if update dey",
    "High Contrast": "High Contrast Screen",
    "Maximum legibility mode": "Make words clear well well",
    "Auto-play Voice": "Play Voice Automatic",
    "Read steps aloud automatically": "Read steps loud loud by itself",
    "Offline Voice Mode Fallback": "Voice Mode When Internet No Dey",
    "Choose how long to wait before automatically advancing to the next step when voice commands are unavailable offline.": "Pick how many seconds to wait before e go go next step when voice command no dey work.",
    "Manual (Tap to advance)": "Manual (Tap with hand to go next)",
    "{count} seconds": "{count} seconds",

    // Accessibility
    "Accessibility Strings": "Accessibility Words",
    "Call Emergency Numbers": "Call Emergency Numbers",
    "Change Language": "Change Language",
    "Bottom Navigation": "Bottom Navigation",
    "Skip to main content": "Jump go main content",

    // Offline / Status
    "Ready for offline use": "E don ready for use without internet",
    "Limited offline functionality": "Some things no go work without internet",
    "Content updated": "Content don update",
    "Offline Mode Active": "No-Internet Mode Dey Active",
    "Downloading Content...": "De download content...",

    // Errors
    "Page not found": "We no see this page",
    "Audio unavailable in offline mode": "Voice no dey when internet no dey",
    "This feature requires an internet connection": "You need internet for this one",

    // Onboarding
    "You can save a life.": "You fit save person life.",
    "AidHero shows you how.": "AidHero go show you how.",
    "Works offline,": "E dey work without internet,",
    "in your language.": "for your own language.",
    "Choose your language": "Pick your language",
    "+ download content": "+ download content",
    "Download for offline use": "Download for use without internet",
    "I'll do this later": "I go do am later",
    "Skip": "Skip",

    // Metadata
    "AidHero - Emergency First Aid Nigeria": "AidHero - Emergency First Aid Nigeria",
    "Offline-first emergency first aid guide for Nigeria. Instant, guided first aid instructions in English, Hausa, Igbo, Yoruba, and Pidgin. Works without internet.": "First aid guide wey dey work without internet for Nigeria. Sharp instructions in English, Hausa, Igbo, Yoruba and Pidgin.",
    "You can save a life. AidHero shows you how. Offline first aid guide for Nigeria.": "You fit save person life. AidHero go show you how. Offline first aid guide for Nigeria."
  }
};

/**
 * Replaces ICU placeholders like {step} with temporary tokens like __VAR_0__
 */
function protectPlaceholders(text: string): { protectedText: string; tokens: string[] } {
  const tokens: string[] = [];
  const protectedText = text.replace(/\{[a-zA-Z0-9_-]+\}/g, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `__VAR_${idx}__`;
  });
  return { protectedText, tokens };
}

/**
 * Restores ICU placeholders from temporary tokens
 */
function restorePlaceholders(text: string, tokens: string[]): string {
  let restored = text;
  tokens.forEach((tok, idx) => {
    const regex = new RegExp(`__VAR_${idx}__`, 'gi');
    restored = restored.replace(regex, tok);
  });
  return restored;
}

/**
 * Calls Google Cloud Translation API (or fallback if key is not available or target is pcm)
 */
async function translateString(text: string, targetLang: TargetLocale): Promise<string> {
  // Check curated gold-standard dictionary first
  if (CURATED_TRANSLATIONS[targetLang]?.[text]) {
    return CURATED_TRANSLATIONS[targetLang][text];
  }

  const { protectedText, tokens } = protectPlaceholders(text);

  // If API Key is present and language is supported directly (ha, ig, yo)
  if (API_KEY && targetLang !== 'pcm') {
    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: protectedText,
          target: targetLang,
          source: 'en',
          format: 'text',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const translated = data?.data?.translations?.[0]?.translatedText;
        if (translated) {
          return restorePlaceholders(translated, tokens);
        }
      }
    } catch (err) {
      console.warn(`[Google API warning] Failed translating "${text}" to ${targetLang}:`, err);
    }
  }

  // Fallback: Free translation endpoint for build scripts
  if (targetLang !== 'pcm') {
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(protectedText)}`
      );
      if (res.ok) {
        const data = await res.json();
        const translated = data[0]?.map((item: any) => item[0]).join('') || '';
        if (translated) {
          return restorePlaceholders(translated, tokens);
        }
      }
    } catch {
      // Ignore network errors in offline CI
    }
  }

  // Return original text with placeholders preserved if no translation found
  return restorePlaceholders(protectedText, tokens);
}

/**
 * Recursively translates an object structure matching en.json
 */
async function translateObject(
  obj: any,
  targetLang: TargetLocale,
  currentPath: string = '',
  statusMap: Record<string, any> = {}
): Promise<any> {
  if (typeof obj === 'string') {
    const translated = await translateString(obj, targetLang);
    statusMap[currentPath] = {
      _source: "machine",
      original: obj,
      translated: translated,
      status: "needs_review",
      timestamp: new Date().toISOString()
    };
    return translated;
  }

  if (Array.isArray(obj)) {
    const result: any[] = [];
    for (let i = 0; i < obj.length; i++) {
      const itemPath = currentPath ? `${currentPath}[${i}]` : `[${i}]`;
      result.push(await translateObject(obj[i], targetLang, itemPath, statusMap));
    }
    return result;
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const childPath = currentPath ? `${currentPath}.${key}` : key;
      result[key] = await translateObject(obj[key], targetLang, childPath, statusMap);
    }
    return result;
  }

  return obj;
}

async function main() {
  console.log('🌐 AidHero i18n Message Translator');
  console.log(`Using ${API_KEY ? 'Google Cloud Translation API' : 'Curated Emergency Lexicon + Fallback Engine'}`);

  const enPath = path.join(process.cwd(), 'i18n', 'messages', 'en.json');
  if (!fs.existsSync(enPath)) {
    throw new Error(`English base file not found at: ${enPath}`);
  }

  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const overallStatus: {
    last_updated: string;
    engine: string;
    locales: Record<string, { total_strings: number; strings: Record<string, any> }>;
  } = {
    last_updated: new Date().toISOString(),
    engine: API_KEY ? 'google-cloud-translation-api' : 'curated-medical-lexicon+machine-fallback',
    locales: {}
  };

  for (const locale of LOCALES) {
    console.log(`\nTranslating for [${locale.toUpperCase()}]...`);
    const statusMap: Record<string, any> = {};
    const translatedTree = await translateObject(enContent, locale, '', statusMap);

    const outPath = path.join(process.cwd(), 'i18n', 'messages', `${locale}.json`);
    fs.writeFileSync(outPath, JSON.stringify(translatedTree, null, 2) + '\n', 'utf-8');
    console.log(`✅ Written ${Object.keys(statusMap).length} keys to ${outPath}`);

    overallStatus.locales[locale] = {
      total_strings: Object.keys(statusMap).length,
      strings: statusMap
    };
  }

  // Write translation status audit file
  const statusFilePath = path.join(process.cwd(), 'i18n', 'translation-status.json');
  fs.writeFileSync(statusFilePath, JSON.stringify(overallStatus, null, 2) + '\n', 'utf-8');
  console.log(`\n📋 Translation status audit file written to ${statusFilePath}`);
  console.log('🎉 All 4 locale message files successfully updated!');
}

main().catch((err) => {
  console.error('Translation process failed:', err);
  process.exit(1);
});
