// Central tuning + content. Everything gameplay-related that you may want to tweak lives here.

export const LANES = [-3, 0, 3];
export const TILE = 36;                 // road tile length (m)
export const VIEW_AHEAD = 250;          // how far ahead scenery is streamed
export const DISTRICT_LENGTH = 1500;    // metres per district
export const TRAFFIC_SPEED = 9;         // m/s of ordinary traffic

export const SPEED = { start: 19, max: 48, accel: 0.2 };

export const DISTRICTS = [
  {
    id: 'androon', name: 'Andar Shehr', urdu: 'اندرون شہر', tag: 'Walled Peshawar · Qissa Khwani',
    ground: 0x8a6b4a, walk: 0xb39a78,
    walls: [0x8b6b4f, 0xa07a55, 0x7a5a40, 0xb89368, 0x9a8466, 0xc9ad85, 0xd8c3a0],
    wood: [0x3b2416, 0x5a3a1e, 0x2e5a4a, 0x7a2a1f, 0x1f3a5a],
  },
  {
    id: 'anarkali', name: 'Saddar · Cantt', urdu: 'صدر · چھاؤنی', tag: 'Colonial Peshawar',
    ground: 0x6f8a4a, walk: 0xc9c2b4,
    walls: [0xb5563a, 0xa84a32, 0xc4683f, 0xe8dcc4, 0xd9b48a],
    wood: [0xd62828, 0x1565c0, 0x0b6e3a, 0xf2b705, 0x6a1b9a],
  },
  {
    id: 'minar', name: 'Bagh · Park', urdu: 'باغ', tag: 'Peshawar — phoolon ka shehar',
    ground: 0x4f9a3c, walk: 0xd8d2c4,
    walls: [0xf5f5f0],
    wood: [0x0b6e3a, 0xffffff],
  },
  {
    id: 'canal', name: 'Warsak · Daryab', urdu: 'ورسک روڈ', tag: 'River & canal roads',
    ground: 0x6a8f3a, walk: 0xb8b0a0,
    walls: [0xf2eadb, 0xe3d4b8, 0xd9cdb5, 0xc9b79a],
    wood: [0x0b6e3a, 0x7a1f1f, 0x1565c0],
  },
  {
    id: 'gulberg', name: 'Hayatabad by Night', urdu: 'حیات آباد', tag: 'New Peshawar',
    ground: 0x4a4e56, walk: 0x9a9ca4,
    walls: [0x5b6a7d, 0x37465a, 0x7b8796, 0x2c3440, 0x8fa3b8, 0x48506a],
    wood: [0x222831],
    neon: [0xff2e88, 0x00e5ff, 0xffd60a, 0x9d4dff, 0x2bff88, 0xff7a1a],
  },
];
// Real Peshawar places. Each 1.5 km stretch of the endless route is one place, drawn in the look of its `style`.
// The route deals places like a shuffled deck: nothing repeats until every place has been visited,
// and two neighbouring stretches never share a look.
export const PLACES = [
  // Andar Shehr — the walled city
  { id: 'qissa', style: 'androon', name: 'Qissa Khwani Bazaar', urdu: 'قصہ خوانی بازار', tag: 'Kehwa te dastaan' },
  { id: 'yadgar', style: 'androon', name: 'Chowk Yadgar', urdu: 'چوک یادگار', tag: 'Dil-e-Peshawar' },
  { id: 'namak', style: 'androon', name: 'Namak Mandi', urdu: 'نمک منڈی', tag: 'Karahi di jannat' },
  { id: 'ghanta', style: 'androon', name: 'Ghanta Ghar', urdu: 'گھنٹہ گھر', tag: 'Victoria Clock Tower', landmark: 'ghanta' },
  { id: 'dabgari', style: 'androon', name: 'Dabgari Bazaar', urdu: 'دبگری بازار', tag: 'Peetal te tamba' },
  { id: 'andar', style: 'androon', name: 'Andar Shehr', urdu: 'اندرون شہر', tag: 'Purana Peshawar' },
  { id: 'hashtnagri', style: 'androon', name: 'Hashtnagri', urdu: 'ہشت نگری', tag: 'Atth darwaze' },
  { id: 'kabuli', style: 'androon', name: 'Kabuli Gate', urdu: 'کابلی گیٹ', tag: 'Purana darwaza' },
  { id: 'mahabat', style: 'androon', name: 'Mahabat Khan Masjid', urdu: 'مسجد مہابت خان', tag: 'Mughal masjid', landmark: 'mahabat' },
  { id: 'balahisar', style: 'androon', name: 'Bala Hisar Fort', urdu: 'بالا حصار قلعہ', tag: 'Peshawar da qila', landmark: 'fort' },
  { id: 'gorkhatri', style: 'androon', name: 'Gor Khatri', urdu: 'گورکھتری', tag: 'Purani sarai' },
  { id: 'sethi', style: 'androon', name: 'Sethi Mohalla', urdu: 'سیٹھی محلہ', tag: 'Haveliyan te jharokay' },
  // Saddar & the colonial centre
  { id: 'saddar', style: 'anarkali', name: 'Saddar Bazaar', urdu: 'صدر بازار', tag: 'Cantt ki raunaq' },
  { id: 'museum', style: 'anarkali', name: 'Peshawar Museum', urdu: 'پشاور میوزیم', tag: 'Gandhara da khazana' },
  { id: 'islamia', style: 'anarkali', name: 'Islamia College', urdu: 'اسلامیہ کالج', tag: 'Khyber Road', landmark: 'islamia' },
  { id: 'khyberbazaar', style: 'anarkali', name: 'Khyber Bazaar', urdu: 'خیبر بازار', tag: 'Rush hi rush' },
  { id: 'fort', style: 'anarkali', name: 'Fort Road', urdu: 'فورٹ روڈ', tag: 'Qile de saath' },
  { id: 'cantt', style: 'anarkali', name: 'Peshawar Cantt', urdu: 'پشاور چھاؤنی', tag: 'Church Road' },
  { id: 'edwardes', style: 'anarkali', name: 'Edwardes College', urdu: 'ایڈورڈز کالج', tag: 'Sahibzada Abdul Qayyum Road' },
  { id: 'saddarroad', style: 'anarkali', name: 'Sadar Road', urdu: 'صدر روڈ', tag: 'Cantt' },
  // Parks & gardens
  { id: 'shahibagh', style: 'minar', name: 'Shahi Bagh', urdu: 'شاہی باغ', tag: 'Mughal garden' },
  { id: 'wazir', style: 'minar', name: 'Wazir Bagh', urdu: 'وزیر باغ', tag: 'Baghon da shehar' },
  { id: 'jinnah', style: 'minar', name: 'Jinnah Park', urdu: 'جناح پارک', tag: 'Subah di sair' },
  { id: 'tatara', style: 'minar', name: 'Tatara Park', urdu: 'ٹاٹارا پارک', tag: 'Picnic point' },
  { id: 'arbab', style: 'minar', name: 'Arbab Niaz Stadium', urdu: 'ارباب نیاز اسٹیڈیم', tag: 'Cricket da junoon' },
  // River & canal roads
  { id: 'warsak', style: 'canal', name: 'Warsak Road', urdu: 'ورسک روڈ', tag: 'Daryab kinare' },
  { id: 'bara', style: 'canal', name: 'Bara Road', urdu: 'باڑہ روڈ', tag: 'Nehar kinare' },
  { id: 'charsadda', style: 'canal', name: 'Charsadda Road', urdu: 'چارسدہ روڈ', tag: 'Gannay de khait' },
  { id: 'ring', style: 'canal', name: 'Ring Road', urdu: 'رنگ روڈ', tag: 'Shehar da gherra' },
  { id: 'kabulriver', style: 'canal', name: 'Kabul River Bank', urdu: 'دریائے کابل', tag: 'Daryaye Kabul' },
  { id: 'jamrud', style: 'canal', name: 'Jamrud · Bab-e-Khyber', urdu: 'جمرود · باب خیبر', tag: 'Khyber Pass da darwaza', landmark: 'bab' },
  // New Peshawar
  { id: 'hayatabad', style: 'gulberg', name: 'Hayatabad Phase 3', urdu: 'حیات آباد فیز ۳', tag: 'Hayatabad by Night' },
  { id: 'unitown', style: 'gulberg', name: 'University Town', urdu: 'یونیورسٹی ٹاؤن', tag: 'Ilm di nagri' },
  { id: 'karkhano', style: 'gulberg', name: 'Karkhano Market', urdu: 'کارخانو مارکیٹ', tag: 'Har cheez milti ae' },
  { id: 'board', style: 'gulberg', name: 'Board Bazaar', urdu: 'بورڈ بازار', tag: 'Peshawar Board' },
  { id: 'gulbahar', style: 'gulberg', name: 'Gulbahar', urdu: 'گلبہار', tag: 'Bahar di raunaq' },
  { id: 'motorway', style: 'gulberg', name: 'Motorway M-1 Interchange', urdu: 'موٹروے', tag: 'Islamabad ki taraf' },
];
export const styleIndex = id => DISTRICTS.findIndex(d => d.id === id);

// The endless route: a lazily-dealt, never-repeating sequence of places.
export const route = {
  seq: [], deck: [], start: 0,
  reset(startPlace = 0) { this.start = startPlace; this.seq = [startPlace]; this.deck = []; },
  next() {
    const last = PLACES[this.seq[this.seq.length - 1]];
    if (!this.deck.length) {
      const used = new Set(this.seq.slice(-15));
      this.deck = PLACES.map((_, i) => i).filter(i => !used.has(i)).sort(() => Math.random() - 0.5);
    }
    // prefer a place with a different look from the one before
    let k = this.deck.findIndex(i => PLACES[i].style !== last.style);
    if (k < 0) k = 0;
    return this.deck.splice(k, 1)[0];
  },
  placeAt(s) {
    const seg = Math.floor(Math.max(0, s) / DISTRICT_LENGTH);
    while (this.seq.length <= seg) this.seq.push(this.next());
    return this.seq[seg];
  },
};
route.reset(0);
export const placeIndexAt = s => route.placeAt(s);
export const placeAt = s => PLACES[route.placeAt(s)];
export const districtIndexAt = s => styleIndex(placeAt(s).style);

export const CITY = 'PESHAWAR';
export const LETTERS = CITY.split('');
export const BOOSTS = [
  { id: 'headstart', name: 'Headstart', icon: '⏩', desc: 'Rocket through the first 600 m, invincible', cost: 400, key: 'B' },
  { id: 'shieldStart', name: 'Shield Start', icon: '🛡️', desc: 'Begin the run with a 20 s shield', cost: 250, key: 'V' },
];
export const RIVAL = { name: 'Gul Khan Wheelie', every: [900, 1500], reward: 200 };
export const WHEELIE = { max: 3.2, cooldown: 1.2, pointsPerSec: 260 };
export const KITE = { every: [140, 260], coins: 25, points: 300 };
// "Ammi da phone" errands: grab the item before the distance runs out.
export const ERRANDS = [
  { id: 'dahi', name: 'Dahi', icon: '🥣', ask: 'Zwana, wapsi pe dahi le aana — raita banana ae, lala!' },
  { id: 'naan', name: 'Peshawari Naan', icon: '🫓', ask: 'Tandoor se char naan pakar lo — garam garam, pa khair!' },
  { id: 'doodh', name: 'Doodh', icon: '🥛', ask: 'Doodh khatam ho gaya, kehwa kaisay banaun? Jaldi le aa!' },
  { id: 'anday', name: 'Anday', icon: '🥚', ask: 'Darjan anday le aa — ehtiyat se, tootne nahi chahiyen!' },
];

export const UPGRADES = [
  { id: 'nitro', name: 'Nitro Tank', icon: '⚡', desc: 'Nitro burst lasts longer', max: 5, base: 250 },
  { id: 'magnet', name: 'Chumbak', icon: '🧲', desc: 'Magnet lasts longer', max: 5, base: 200 },
  { id: 'shield', name: 'Kawach Shield', icon: '🛡️', desc: 'Shield lasts longer', max: 5, base: 200 },
  { id: 'double', name: 'Double Daulat', icon: '✖2', desc: 'Double-coins lasts longer', max: 5, base: 200 },
  { id: 'coinValue', name: 'Sone da Meter', icon: '💰', desc: '+1 rupee for every coin', max: 4, base: 600 },
  { id: 'armor', name: 'Crash Guard', icon: '❤️', desc: 'Start every run with an extra heart', max: 2, base: 2000 },
];
export const upgradeCost = (u, lvl) => Math.round((u.base * Math.pow(1.9, lvl)) / 10) * 10;

// Ride paint jobs. body = paint, trim = stripe/chrome-gold, kameez = driver's suit, canopy = roof.
export const SKINS = [
  { id: 'classic', name: 'Sabz Chingchi', cost: 0, body: 0x0b7a3e, trim: 0xf2c14e, kameez: 0xf1ede2, canopy: 0x1a1a1a },
  { id: 'kaala', name: 'Kaala Khan', cost: 750, body: 0x121212, trim: 0xd4af37, kameez: 0x1e2a44, canopy: 0x2a1a0a },
  { id: 'neela', name: 'Kabul Neela', cost: 1500, body: 0x1a3c8f, trim: 0xffffff, kameez: 0xe8e2d0, canopy: 0xf2c14e },
  { id: 'laal', name: 'Pukhtun Laal', cost: 2500, body: 0xc4121a, trim: 0xf5f5f5, kameez: 0xf5f5f0, canopy: 0x151515 },
  { id: 'chandi', name: 'Chandi Silver', cost: 4000, body: 0xb9bdc2, trim: 0xc4121a, kameez: 0x3a3a3a, canopy: 0x1a3c8f },
  { id: 'shahi', name: 'Shahi Maroon', cost: 6000, body: 0x6b0f1a, trim: 0xd4af37, kameez: 0xf2e6c9, glow: 0xffc93c, canopy: 0x1a1a1a },
  { id: 'raat', name: 'Raat da Badshah', cost: 8000, body: 0x1b1430, trim: 0xff2e88, kameez: 0x0d0d14, glow: 0x00e5ff, canopy: 0x0d0d14 },
  { id: 'sona', name: 'Sona Special', cost: 12000, body: 0xc9971c, trim: 0x5a0f0f, kameez: 0x5a0f0f, glow: 0xffc93c, canopy: 0x3a0d0d },
];

export const HORNS = [
  { id: 'peep', name: 'Peep Peep (stock)' },
  { id: 'pressure', name: 'Pressure Horn' },
  { id: 'tune', name: 'Dhun Wala' },
  { id: 'truck', name: 'Truck Air Horn' },
];

export const POWERUPS = {
  magnet: { label: 'Magnet', base: 8, per: 2, color: 0xff4d4d, icon: 0 },
  shield: { label: 'Shield', base: 10, per: 2.5, color: 0x4fc3f7, icon: 1 },
  double: { label: '2x Coins', base: 10, per: 2.5, color: 0xffd60a, icon: 2 },
  nitro: { label: 'Nitro', color: 0x00e5ff, icon: 3 },
  lassi: { label: 'Qehwa', color: 0xfff3d6, icon: 4 },
};

// All dialogue in Peshawari Urdu with a splash of Pashto (Roman). Original lines.
export const LINES = {
  request: [
    'Lala, {d}m aagay chhor do — {t} second hain, jaldi kar!',
    'Khan sahib, {t} second hi hain! {d} meter door ae — chalo phir!',
    'Oye lala, {d}m aur {t} second — pakka?',
    'Jaldi kar yaar, chapli kabab thanday ho rahe hain! {d}m, {t} second!',
    'Zwana, {d} meter pe utaar dena — {t} second, warna dukaan band!',
    'Lala, {t} second mein {d}m — tip pakki, wakhra swag!',
  ],
  chatter: [
    'Peshawar Peshawar ae, lala! Phoolon ka shehar!',
    'Starey mashey, lala! Aaj kaisa chal raha ae?',
    'Oye hoye! Chingchi pe tu to badshah lagta ae!',
    'Qissa Khwani ka kehwa piya? Nahi? To kya piya Peshawar mein!',
    'Namak Mandi ki karahi aur Chapli Kabab — wah wah, dera kha!',
    'Pukhtun ghairat — peeche nahi hatna, lala!',
    'Tera chingchi to jahaz ae, jahaz!',
    'Ik cup kehwa ho jaye? Elaichi walay, kadak!',
    'Saddar mein shaam ko chakkar lagayen ge!',
    'Dum pukht, charsi tikka — Peshawar ka swad hi alag ae!',
    'Oye silencer theek karwa le, saara mohalla jaag jata ae!',
    'Kabuli pulao aur peshawari naan — dil khush!',
    'Dhool bohat ae yaar, par shehar apna ae!',
    'Khyber ke us paar bhi Peshawar ki baatein hoti hain!',
    'Mahabat Khan Masjid ke minaron ko salam, lala!',
    'Peshawar ka pyaar, Peshawar ka kehwa — kabhi khatam nahi hota!',
    'Hujre ki chai aur chingchi ki sawari — zindagi mast ae!',
    'Qissa Khwani ke qissay sunne hain? Pehle chingchi chala!',
  ],
  success: [
    'Wah lala, kamaal kar diya! Lo kiraya, aur tip bhi rakh lo!',
    'Shabash zwana! Waqt se pehlay! Tu to Peshawar ka sher ae!',
    'Dera kha! Allah khair kare!',
    'Zabardast! Agli dafa bhi tujhe hi bulaun ga!',
  ],
  fail: [
    'Ab to main paidal hi chala jata hun...',
    'Late ho gaye! Ammi ne chappal marni ae!',
    'Oye lala, tu to sirf baton ka shair ae!',
  ],
  hit: ['Oye ehtiyat se!', 'Mera kehwa gir gaya!', 'Aankhein khol ke chala lala!', 'Hai oye! Bach gaye!', 'Kya kar raha ae yaar, khambay se takra jaye ga!'],
  hornDog: ['Kutta bhaag gaya! Sorry yaar 🐕', 'Bhau bhau! Woh gali mein ghus gaya 🐕'],
  hornCat: ['Billi ko horn se koi farq nahi 😼', 'Billi: "Tu bajaye ja horn, main aaram se jaun gi" 😼'],
  catCross: ['Oye! Billi rasta kaat gayi — ab kya hoga! 🐈‍⬛', 'Billi ne rasta kaata... Ammi kehti thi ruk ja!', 'Kali billi! Shagoon maanna paray ga 😅'],
  rivalStart: [
    'Gul Khan: "Oye chingchi walay! Race lagani ae? Pehle mujhe cross kar ke dikha!"',
    'Gul Khan: "Peshawar ki sarkain meri hain, zwana!"',
  ],
  rivalWin: ['Gul Khan: "Oye hoye, tu to ustaad nikla!"', 'Gul Khan: "Chal theek ae, is dafa tera din tha..."'],
  rivalLose: ['Gul Khan: "Bye bye lala! Phir koshish karna!"', 'Gul Khan nikal gaya — dhool mein reh gaye!'],
  ammiHappy: ['Ammi: "Jeeta reh zwana! Allah lambi umar day!" 🤲', 'Ammi: "Mera sohna beta! Rotti tayyar ae."'],
  ammiAngry: ['Ammi: "Ghar aa zara, chappal tayyar ae!" 🩴', 'Ammi: "Ik kaam kaha tha, woh bhi nahi hua!"'],
  gameOver: [
    'Oye hoye, chingchi ulat gayi! Chal phir se.',
    'Koi baat nahi lala, Pukhtun haar nahi maante!',
    'Chingchi ka silencer nikal gaya... mistri bulao!',
    'Ik cup kehwa pee, aur wapas aa!',
    'Peshawar ghoomna ae to dobara chala — abhi to shuru hua ae!',
  ],
};

// Short shouty HUD popups, Peshawari style
export const SHOUTS = {
  near: ['OYE HOYE!', 'BAAL BAAL BACHAY!', 'WAKHRA SWAG!', 'DERA KHA!', 'KAMAAL AE LALA!'],
  horn: ['SIDE PE HO JA! ✋', 'RASTA DO LALA!', 'OYE PEECHAY DEKH!'],
  ouch: ['HAI OYE!', 'LALA!', 'OYE!'],
  trick: ['BACKFLIP!', 'PESHAWAR PESHAWAR!', 'HAWA MEIN!'],
  smash: ['DHAMAKA!', 'LALA KAMAAL!', 'TOD DIYA!'],
  wheelie: ['EK PAHIYA!', 'WHEELIE KING!', 'OYE HOYE WHEELIE!'],
  tilt: ['DO PAHIYAY PE!', 'CHINGCHI STUNT!', 'OYE HOYE BALANCE!', 'CHINGCHI KING!'],
  kite: ['PATANG LOOT LI! 🪁', 'BO KAATA! 🪁', 'PATANG MELA! 🪁'],
};

export const TIPS = [
  'Horn bajao lala — agli gaari side pe ho jaye gi!',
  'Q dabao aur DO PAHIYA lagao — jitni lambi, utne zyada points!',
  'Hawa mein Jump dobara dabao: BACKFLIP! Peshawar Peshawar ae!',
  'Patangain hawa mein hain — jump kar ke loot lo, BO KAATA!',
  'Near-miss se combo barhta ae — x6 pe FEVER on ho jata ae!',
  'Nitro full ho to Shift / N dabao — sab kuch tod do!',
  'Kinaray wali lane mein sawari uthao, waqt pe pohncha — tip pakki!',
  'P-E-S-H-A-W-A-R ke letters jama karo — roz ka jackpot Rs 2500!',
  'Gul Khan race lagaye to nitro bacha ke rakho!',
  'Qissa Khwani se Hayatabad tak — 37 jagahain, koi do dafa nahi! Poora Peshawar ghoomo!',
  'Qehwa piyo — coins khud khinch ke aate hain, aur thori hifazat bhi!',
];

// Wall posters & chalking (original designs): [headline, sub, bg, fg]
export const POSTERS = [
  ['PESHAWAR PESHAWAR AE', 'Phoolon ka shehar', '#0b6e3a', '#f6f1e3'],
  ['QISSA KHWANI KEHWA', 'Elaichi wala • Chowk Yadgar', '#d4a23a', '#3a0d0d'],
  ['CHAPLI KABAB', 'Dera kha • Namak Mandi', '#ff7a1a', '#1b1024'],
  ['CHARSI TIKKA', 'Desi ghee • Namak Mandi', '#7a1f1f', '#f6e7c1'],
  ['PESHAWARI NAAN', 'Garam garam • Tandoor', '#f6f1e3', '#7a1f1f'],
  ['PATANG MELA', 'Bo Kaata! • Chhat pe milo', '#e91e63', '#fff6dc'],
  ['PUKHTUN GHAIRAT', 'Zinda dilan da shehar', '#1565c0', '#ffffff'],
  ['USTAD CHINGCHI', 'Mistri Khan • Karkhano', '#1b1024', '#ffd60a'],
  ['OYE HOYE!', 'Raat ka kehwa party', '#6a1b9a', '#ffd60a'],
  ['KABULI PULAO', 'Badam kishmish wala', '#f2b705', '#7a1f1f'],
  ['TUITION CENTRE', 'Physics • Sir Naveed', '#ffffff', '#1565c0'],
  ['CRICKET MATCH', 'Jumma • Arbab Niaz', '#2e7d32', '#ffffff'],
];

// Animated trails that follow the bike (Garage → Trails)
export const TRAILS = [
  { id: 'none', name: 'Koi Nahi', cost: 0, colors: [] },
  { id: 'sparks', name: 'Chingariyan', cost: 500, colors: [0xffd60a, 0xff7a1a, 0xffffff] },
  { id: 'basant', name: 'Basant', cost: 1500, colors: [0xffe14d, 0xff9f1a, 0x2bff88, 0xff2e88] },
  { id: 'neon', name: 'Neon Dhuan', cost: 2500, colors: [0x00e5ff, 0xff2e88] },
  { id: 'hara', name: 'Sabz Hilal', cost: 3500, colors: [0x0b8f3a, 0xffffff] },
  { id: 'gold', name: 'Sone di Dhool', cost: 5000, colors: [0xffd60a, 0xfff3b0, 0xd4af37] },
];

// Lucky Spin segments (weight = chance)
export const SPIN = [
  { label: 'Rs 100', type: 'coins', amount: 100, color: '#d4a23a', weight: 26 },
  { label: '⏩ Headstart', type: 'item', item: 'headstart', amount: 1, color: '#0b6e3a', weight: 12 },
  { label: 'Rs 250', type: 'coins', amount: 250, color: '#7a1f1f', weight: 20 },
  { label: '🛡️ Shield', type: 'item', item: 'shieldStart', amount: 1, color: '#1565c0', weight: 14 },
  { label: 'Rs 500', type: 'coins', amount: 500, color: '#b5563a', weight: 12 },
  { label: '⏩ x2', type: 'item', item: 'headstart', amount: 2, color: '#4a148c', weight: 6 },
  { label: 'Rs 1000', type: 'coins', amount: 1000, color: '#c9971c', weight: 7 },
  { label: '💰 JACKPOT', type: 'coins', amount: 3000, color: '#3a0d0d', weight: 3 },
];
export const SPIN_COST = 300;
