// Central tuning + content. Everything gameplay-related that you may want to tweak lives here.

export const LANES = [-3, 0, 3];
export const TILE = 36;                 // road tile length (m)
export const VIEW_AHEAD = 250;          // how far ahead scenery is streamed
export const DISTRICT_LENGTH = 1500;    // metres per district
export const TRAFFIC_SPEED = 9;         // m/s of ordinary traffic

export const SPEED = { start: 19, max: 48, accel: 0.2 };

export const DISTRICTS = [
  {
    id: 'androon', name: 'Androon Shehr', urdu: 'اندرون شہر', tag: 'Walled City · Badshahi Masjid',
    ground: 0x8f6a48, walk: 0xb89a78,
    walls: [0xa0522d, 0xb5653f, 0x8b4a2b, 0xc98f5a, 0xd8b48a, 0x9c5a3c, 0xe3cfa8],
    wood: [0x3b2416, 0x2e6b8a, 0x6b4a2b, 0x7a1f1f, 0x2f4f3f],
  },
  {
    id: 'anarkali', name: 'Anarkali · Mall Road', urdu: 'انارکلی · مال روڈ', tag: 'Colonial Lahore',
    ground: 0x6f8a4a, walk: 0xc9c2b4,
    walls: [0xb5563a, 0xa84a32, 0xc4683f, 0xe8dcc4, 0xd9b48a],
    wood: [0xd62828, 0x1565c0, 0x0b6e3a, 0xf2b705, 0x6a1b9a],
  },
  {
    id: 'minar', name: 'Minar-e-Pakistan', urdu: 'مینارِ پاکستان', tag: 'Greater Iqbal Park',
    ground: 0x4f9a3c, walk: 0xd8d2c4,
    walls: [0xf5f5f0],
    wood: [0x0b6e3a, 0xffffff],
  },
  {
    id: 'canal', name: 'Canal Road', urdu: 'نہر کنارے', tag: 'Lahore ki Nehar',
    ground: 0x5a8f3a, walk: 0xb8b0a0,
    walls: [0xf2eadb, 0xe3d4b8, 0xd9cdb5, 0xc9b79a],
    wood: [0x0b6e3a, 0x7a1f1f, 0x1565c0],
  },
  {
    id: 'gulberg', name: 'MM Alam Road', urdu: 'گلبرگ', tag: 'Gulberg by Night',
    ground: 0x4a4e56, walk: 0x9a9ca4,
    walls: [0x5b6a7d, 0x37465a, 0x7b8796, 0x2c3440, 0x8fa3b8, 0x48506a],
    wood: [0x222831],
    neon: [0xff2e88, 0x00e5ff, 0xffd60a, 0x9d4dff, 0x2bff88, 0xff7a1a],
  },
];
// Real Lahore places. Each 1.5 km stretch of the endless route is one place, drawn in the look of its `style`.
// The route deals places like a shuffled deck: nothing repeats until every place has been visited,
// and two neighbouring stretches never share a look.
export const PLACES = [
  // Walled City
  { id: 'delhi', style: 'androon', name: 'Delhi Gate', urdu: 'دہلی دروازہ', tag: 'Walled City', landmark: 'badshahi' },
  { id: 'lohari', style: 'androon', name: 'Lohari Gate', urdu: 'لوہاری دروازہ', tag: 'Walled City' },
  { id: 'bhati', style: 'androon', name: 'Bhati Gate', urdu: 'بھاٹی دروازہ', tag: 'Walled City' },
  { id: 'taxali', style: 'androon', name: 'Taxali Gate', urdu: 'ٹکسالی دروازہ', tag: 'Samosay & Badshahi Masjid', landmark: 'badshahi' },
  { id: 'kashmiri', style: 'androon', name: 'Kashmiri Gate', urdu: 'کشمیری دروازہ', tag: 'Walled City' },
  { id: 'mochi', style: 'androon', name: 'Mochi Gate', urdu: 'موچی دروازہ', tag: 'Walled City' },
  { id: 'gawalmandi', style: 'androon', name: 'Gawalmandi', urdu: 'گوالمنڈی', tag: 'Food Street' },
  { id: 'qila', style: 'androon', name: 'Shahi Qila Road', urdu: 'شاہی قلعہ روڈ', tag: 'Badshahi Masjid', landmark: 'badshahi' },
  { id: 'rangmahal', style: 'androon', name: 'Rang Mahal', urdu: 'رنگ محل', tag: 'Bazaar hi bazaar' },
  // Colonial centre
  { id: 'anarkali', style: 'anarkali', name: 'Anarkali Bazaar', urdu: 'انارکلی بازار', tag: 'Colonial Lahore' },
  { id: 'mall', style: 'anarkali', name: 'Mall Road', urdu: 'مال روڈ', tag: 'Shahrah-e-Quaid-e-Azam' },
  { id: 'lakshmi', style: 'anarkali', name: 'Lakshmi Chowk', urdu: 'لکشمی چوک', tag: 'Karahi di jannat' },
  { id: 'neela', style: 'anarkali', name: 'Neela Gumbad', urdu: 'نیلا گنبد', tag: 'Cycle market' },
  { id: 'regal', style: 'anarkali', name: 'Regal Chowk', urdu: 'ریگل چوک', tag: 'Mall Road' },
  { id: 'charing', style: 'anarkali', name: 'Charing Cross', urdu: 'چیئرنگ کراس', tag: 'Mall Road' },
  { id: 'jail', style: 'anarkali', name: 'Jail Road', urdu: 'جیل روڈ', tag: 'Shadman' },
  { id: 'bilalganj', style: 'anarkali', name: 'Bilal Ganj', urdu: 'بلال گنج', tag: 'Spare parts da bazaar' },
  // Parks
  { id: 'minar', style: 'minar', name: 'Minar-e-Pakistan', urdu: 'مینارِ پاکستان', tag: 'Greater Iqbal Park', landmark: 'minar' },
  { id: 'jinnah', style: 'minar', name: 'Bagh-e-Jinnah', urdu: 'باغِ جناح', tag: 'Lawrence Garden' },
  { id: 'racecourse', style: 'minar', name: 'Race Course Park', urdu: 'ریس کورس پارک', tag: 'Jilani Park' },
  { id: 'jallo', style: 'minar', name: 'Jallo Park', urdu: 'جلو پارک', tag: 'Picnic point' },
  { id: 'shalimar', style: 'minar', name: 'Shalimar Bagh', urdu: 'شالامار باغ', tag: 'Mughal Garden' },
  { id: 'modeltown', style: 'minar', name: 'Model Town Park', urdu: 'ماڈل ٹاؤن پارک', tag: 'Subah di sair' },
  // Along the canal
  { id: 'canal', style: 'canal', name: 'Canal Road', urdu: 'نہر کنارے', tag: 'Lahore ki Nehar' },
  { id: 'mughalpura', style: 'canal', name: 'Mughalpura', urdu: 'مغلپورہ', tag: 'Nehar kinare' },
  { id: 'dharampura', style: 'canal', name: 'Dharampura', urdu: 'دھرم پورہ', tag: 'Nehar kinare' },
  { id: 'thokar', style: 'canal', name: 'Thokar Niaz Baig', urdu: 'ٹھوکر نیاز بیگ', tag: 'Shehar da kinara' },
  { id: 'harbanspura', style: 'canal', name: 'Harbanspura', urdu: 'ہربنس پورہ', tag: 'Nehar kinare' },
  { id: 'shahdara', style: 'canal', name: 'Shahdara', urdu: 'شاہدرہ', tag: 'Ravi de paar' },
  // New Lahore
  { id: 'mmalam', style: 'gulberg', name: 'MM Alam Road', urdu: 'ایم ایم عالم روڈ', tag: 'Gulberg by Night' },
  { id: 'liberty', style: 'gulberg', name: 'Liberty Market', urdu: 'لبرٹی مارکیٹ', tag: 'Gulberg' },
  { id: 'boulevard', style: 'gulberg', name: 'Main Boulevard', urdu: 'مین بلیوارڈ', tag: 'Gulberg' },
  { id: 'kalma', style: 'gulberg', name: 'Kalma Chowk', urdu: 'کلمہ چوک', tag: 'Ferozepur Road' },
  { id: 'hafeez', style: 'gulberg', name: 'Hafeez Centre', urdu: 'حفیظ سینٹر', tag: 'Mobile te laptop' },
  { id: 'johar', style: 'gulberg', name: 'Johar Town', urdu: 'جوہر ٹاؤن', tag: 'Expo te Emporium' },
  { id: 'dha', style: 'gulberg', name: 'DHA Y-Block', urdu: 'ڈی ایچ اے', tag: 'Cafe culture' },
  { id: 'fortress', style: 'gulberg', name: 'Fortress Stadium', urdu: 'فورٹریس اسٹیڈیم', tag: 'Cantt' },
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

export const LETTERS = ['L', 'A', 'H', 'O', 'R', 'E'];
export const CITY = 'LAHORE';
export const BOOSTS = [
  { id: 'headstart', name: 'Headstart', icon: '⏩', desc: 'Rocket through the first 600 m, invincible', cost: 400, key: 'B' },
  { id: 'shieldStart', name: 'Shield Start', icon: '🛡️', desc: 'Begin the run with a 20 s shield', cost: 250, key: 'V' },
];
export const RIVAL = { name: 'Billa Wheelie', every: [900, 1500], reward: 200 };
export const WHEELIE = { max: 3.2, cooldown: 1.2, pointsPerSec: 260 };
export const KITE = { every: [140, 260], coins: 25, points: 300 };
// "Ammi da phone" errands: grab the item before the distance runs out.
export const ERRANDS = [
  { id: 'dahi', name: 'Dahi', icon: '🥣', ask: 'Puttar, wapsi te dahi lai aana — raita banana ae!' },
  { id: 'naan', name: 'Naan', icon: '🫓', ask: 'Tandoor ton chaar naan pharh lai — garam garam!' },
  { id: 'doodh', name: 'Doodh', icon: '🥛', ask: 'Doodh mukk gaya ae, chaa kiwen banaavaan? Lai aa!' },
  { id: 'anday', name: 'Anday', icon: '🥚', ask: 'Darjan anday lai aa — dhyan naal, tutne nahi chahide!' },
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

// Bike paint jobs. body = tank/side covers, trim = tank stripe, kameez = rider's suit.
export const SKINS = [
  { id: 'classic', name: 'Laal Classic', cost: 0, body: 0xc4121a, trim: 0xf5f5f5, kameez: 0xf1ede2 },
  { id: 'kaala', name: 'Kaala Sher', cost: 750, body: 0x121212, trim: 0xd4af37, kameez: 0x1e2a44 },
  { id: 'neela', name: 'Ravi Neela', cost: 1500, body: 0x1a3c8f, trim: 0xffffff, kameez: 0xe8e2d0 },
  { id: 'sabz', name: 'Lahori Sabz', cost: 2500, body: 0x0b6e3a, trim: 0xffffff, kameez: 0xf5f5f0 },
  { id: 'chandi', name: 'Chandi Silver', cost: 4000, body: 0xb9bdc2, trim: 0xc4121a, kameez: 0x3a3a3a },
  { id: 'shahi', name: 'Shahi Maroon', cost: 6000, body: 0x6b0f1a, trim: 0xd4af37, kameez: 0xf2e6c9, glow: 0xffc93c },
  { id: 'raat', name: 'Raat da Raja', cost: 8000, body: 0x1b1430, trim: 0xff2e88, kameez: 0x0d0d14, glow: 0x00e5ff },
  { id: 'sona', name: 'Sona Special', cost: 12000, body: 0xc9971c, trim: 0x5a0f0f, kameez: 0x5a0f0f, glow: 0xffc93c },
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
  lassi: { label: 'Makhan Lassi', color: 0xfff3d6, icon: 4 },
};

// All dialogue in Lahori Punjabi-Urdu (Roman). Original lines.
export const LINES = {
  request: [
    'Oye bhaji, {d}m aage chhad do — {t} second ne, chak de phatte!',
    'Paa jee, {t} second ne siraf! {d} meter door ae — chalo fer!',
    'Bau ji, {d}m te {t} second — pakki gal?',
    'Jaldi kar yaar, karahi thandi ho rahi ae! {d}m, {t} second!',
    'Kakka, {d} meter te utaar dena — {t} second, warna siyapa pe jaye ga!',
    'Veer, {t} second vich {d}m — tip pakki, wakhra swag!',
  ],
  chatter: [
    'Jinne Lahore nahi vekhya, o jammya ee nahi — sachi gal ae!',
    'Lahore Lahore ae, bhai jaan!',
    'Oye hoye! Bike te tu Sultan Rahi lagda ae!',
    'Siri paye khaye ne kadi subah subah? Zindagi badal jandi ae!',
    'Kiddan? Thand rakh, Lahore vich sab chalda ae!',
    'Garmi bari ae yaar, nehar vich chhaal maarni ae!',
    'Basant aa rahi ae — bo kaata di awaaz kanna vich gunj rahi ae!',
    'Lassi peeni ae? Makhan wali, pede wali!',
    'Gawalmandi di nihari te Anarkali de samose — wah ji wah!',
    'Smog ne ta akhaan laal kar ditiyan yaar!',
    'Tera 125 ta jahaz ae, jahaz!',
    'Mall Road te shaam nu chakkar lavaan ge!',
    'Bhaji, side mirror theek kar lo, khambe nu chumme ga!',
    'Lahori dil de vadde, pyaar de vi vadde!',
    'Ik cup chaa ho jaye? Doodh patti, kadak!',
    'Dug dug dug... 125 di awaaz sun ke dil khush ho janda ae!',
    'Oye silencer ta theek kara la, saara mohalla jaag janda ae!',
    'Taxali Gate de samose khaye? Nahi? Fer ki khaya Lahore vich!',
  ],
  success: [
    'Wah bhaji, kamaal kar ditta! Lo kiraya, te tip vi rakh lo!',
    'Shabaash puttar! Time ton pehlan! Tu ta Lahore da shehzada ae!',
    'Vaddi gal ae yaar! Rab rakha!',
    'Chak de phatte! Agli vaari vi tenu hi bulavaan ga!',
  ],
  fail: [
    'Hun ta mein paidal hi chala janda aan...',
    'Siyapa pe gaya! Late ho gaye, ammi ne chittar maarne ne!',
    'Oye kakka, tu ta bas gallan da shair ae!',
  ],
  hit: ['Oye dhyan naal!', 'Meri lassi dull gayi!', 'Akhaan khol ke chala bhaji!', 'Hai oye! Bach gaye!', 'Kee kar rehaa ae yaar, siyapa pavaye ga!'],
  hornDog: ['Kutta bhaj gaya! Sorry yaar 🐕', 'Bhau bhau! Oh gaya gali vich 🐕'],
  hornCat: ['Billi nu horn da koi farak nahi 😼', 'Billi: "Tu vaja horn, mein ta aaram naal jaavaan gi" 😼'],
  catCross: ['Oye! Billi rasta kaat gayi — hun ki hoyega! 🐈‍⬛', 'Billi ne rasta kaatya... Ammi kehndi si ruk ja!', 'Kaali billi! Shuggan maarna paye ga 😅'],
  rivalStart: [
    'Billa Wheelie: "Oye 125 waale! Race lavaani ae? Pehlan mainu cross kar ke vikha!"',
    'Billa: "Lahore diyan sarkan meriyan ne, puttar!"',
  ],
  rivalWin: ['Billa: "Oye hoye, tu ta ustaad nikleya!"', 'Billa: "Chal theek ae, is vaari tera din si..."'],
  rivalLose: ['Billa: "Bye bye kakka! Fer koshish kari!"', 'Billa nikal gaya — siyapa pe gaya!'],
  ammiHappy: ['Ammi: "Jeenda reh puttar! Allah lambi umar deve!" 🤲', 'Ammi: "Mera sohna puttar! Rotti tayar ae."'],
  ammiAngry: ['Ammi: "Ghar aa zara, chappal tayar ae!" 🩴', 'Ammi: "Ik kam keha si, oh vi nahi hoya!"'],
  gameOver: [
    'Oye hoye, siyapa pe gaya! Chal fer ton.',
    'Koi gal nahi bhaji, Lahori haar nahi mann de!',
    'Bike da kachoomar nikal gaya... mistri bulao!',
    'Ik cup chaa pee, te wapas aa!',
    'Jinne Lahore nahi vekhya, o jammya ee nahi — te tu ta hun shuru hoya ae!',
  ],
};

// Short shouty HUD popups in Lahori style
export const SHOUTS = {
  near: ['OYE HOYE!', 'BAAL BAAL BACHE!', 'WAKHRA SWAG!', 'CHAK DE PHATTE!', 'KAMAAL AE!'],
  horn: ['SIDE TE HO JA! ✋', 'RASTA DE BHAJI!', 'OYE PICHHE VEKH!'],
  ouch: ['HAI OYE!', 'SIYAPA!', 'OYE!'],
  trick: ['BACKFLIP!', 'LAHORE LAHORE AE!', 'HAWA VICH!'],
  smash: ['DHAMAKA!', 'BHAJI KAMAAL!', 'TOD DITTA!'],
  wheelie: ['IK PAHIYA!', 'WHEELIE KING!', 'OYE HOYE WHEELIE!'],
  tilt: ['DO PAHIYE TE!', 'RICKSHAW STUNT!', 'OYE HOYE BALANCE!', 'CHINGCHI KING!'],
  kite: ['BO KAATA! 🪁', 'PATANG LOOT LI!', 'BASANT! 🪁'],
};

export const TIPS = [
  'Horn vaja bhaji — agle waali gaddi side te ho jandi ae!',
  'Q dabba ke WHEELIE maar — jinni lambi, utne zyada points!',
  'Hawa vich Jump dobara daba: BACKFLIP! Lahore Lahore ae!',
  'Basant di patangan hawa vich ne — jump kar ke loot lo, BO KAATA!',
  'Near-miss naal combo vadhda ae — x6 te FEVER on ho janda ae!',
  'Nitro full hove ta Shift / N daba — sab kuch tod de!',
  'Kinare waali lane vich sawari chukk, time te pohncha — tip pakki!',
  'L-A-H-O-R-E de letters jama kar, jackpot tera!',
  'Billa Wheelie race lagaye ta nitro bacha ke rakh!',
  'Delhi Gate ton DHA tak — 37 jagah, koi jagah do vaari nahi! Poora Lahore ghoom!',
  'Makhan Lassi pee — coins khud kheench ke aande ne, te thori hifazat vi!',
];

// Wall posters & chalking (original designs): [headline, sub, bg, fg]
export const POSTERS = [
  ['LAHORE LAHORE AE', 'Zinda dilan da shehar', '#7a1f1f', '#f6e7c1'],
  ['JINNE LAHORE NAHI VEKHYA', 'O jammya ee nahi', '#d4a23a', '#3a0d0d'],
  ['SIRI PAYE', 'Subah 6 vaje ton', '#ff7a1a', '#1b1024'],
  ['PEHLWAN KARAHI', 'Desi ghee • Lakshmi Chowk', '#0b6e3a', '#ffffff'],
  ['MAKHAN LASSI', 'Pede wali • Thandi thar', '#f6f1e3', '#7a1f1f'],
  ['BASANT MELA', 'Bo Kaata! • Chhat te milo', '#e91e63', '#fff6dc'],
  ['CHAK DE PHATTE', 'Punjab da jazba', '#1565c0', '#ffffff'],
  ['USTAD 125', 'Mistri Bao Ji • Bilal Ganj', '#1b1024', '#ffd60a'],
  ['OYE HOYE!', 'Raat di chaa party', '#6a1b9a', '#ffd60a'],
  ['GAWALMANDI NIHARI', 'Nalli wali', '#f2b705', '#7a1f1f'],
  ['TUITION CENTRE', 'Physics • Sir Naveed', '#ffffff', '#1565c0'],
  ['CRICKET MATCH', 'Sunday • Iqbal Park', '#2e7d32', '#ffffff'],
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
