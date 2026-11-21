# 🏍️ Lahore Rush — 125 Edition

The upgraded sequel to Rikshaw Rush. An **endless** 3D runner on a 125 through **37 real places of Lahore**: Delhi Gate, Taxali, Gawalmandi, Anarkali, Mall Road, Lakshmi Chowk, Minar-e-Pakistan, Shalimar Bagh, Canal Road, Thokar, MM Alam Road, Liberty, DHA and more. No place repeats until you've seen them all.

*Jinne Lahore nahi vekhya, o jammya ee nahi.*

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

Optional login: put `VITE_CLERK_PUBLISHABLE_KEY=pk_...` in `.env.local` (and add your domain in Clerk). Without it the game runs in guest mode.

## Blender models

`blender/build_models.py` builds every hero model in Blender and exports glTF into `public/models/`:
the 125 (spoked wheels, finned engine, crash guard, saree guard, rider in shalwar kameez), tonga, bhains, Minar-e-Pakistan, Badshahi Masjid, plus rickshaw, truck, bus and cow traffic.

```bash
blender --background --factory-startup --python blender/build_models.py -- public/models preview
```

`preview` also renders PNGs into `blender/_preview/`. Add model names after `preview` to rebuild only those models. The garage recolours the bike's `paint`, `stripe` and `kameez` materials live.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Change lane | ← → / A D | swipe |
| Jump · backflip (jump again in the air) | ↑ W Space | swipe up |
| Wheelie | Q / X | 🏍️ |
| Brake / end wheelie / slam down | ↓ S | swipe down |
| Nitro | Shift / N / E | double-tap or ⚡ |
| Horn | H | tap or 📯 |
| Boosts · radio · pause · mute | B V · R · P · M | — |

## What's new vs Rikshaw Rush

- **125 bike** that leans into turns, plus wheelies, backflips and pillion sawari.
- **4-stroke engine sound**, all synthesised: the "dug-dug" idle (firing Hz = rpm/120), a 4-speed gearbox with clutch dips, kick-start and silencer pops. Four horns.
- **Endless, never-repeating route:** 37 places dealt like a shuffled deck, each with its own gate banner (English + Urdu). Neighbouring stretches never share a look.
- **5 looks:** Walled City havelis, colonial Mall Road, parks (with the Minar), Canal Road (water, swimmers, bungalows) and Gulberg neon. Landmarks appear in their real places.
- **Full day:** subah, dopehar, shaam and raat cycle on every run (pick the start time on the menu), plus monsoon rain and Lahore smog.
- **Road surface:** aggregate asphalt with a normal map, tyre-polished tracks, worn paint, black-and-yellow kerbs, zebra crossings and cat's eyes that glow at night. The road turns glossy in the rain.
- **Challans and police:** speed-limit signs, then a camera with a traffic warden. Over the limit: brake to stop and pay **half of this run's earnings**. With an empty pocket it goes on **udhaar**, taken from your next earnings. Don't stop and a police 125 chases you with siren and lights: escape for a bonus, or get caught and lose a heart.
- **Ammi da phone:** errands for dahi, naan, doodh or anday. Her dua if you bring it, the chappal if you don't.
- **Underpasses and flyovers:** the real Canal Bank Road underpasses, Kalma Chowk, and the Thokar, Azadi and Akbar Chowk flyovers, named on screen as you ride through.
- **Sound:** a fully synthesised 125 with real-time exhaust pulses, a 4-speed box (throttle cut, clutch, clunk, downshift blip), kick-start, wind, tyre and chain noise. City ambience instead of music.
- **Lahori life:** Basant kites to loot (BO KAATA!), police naka, chingchi, tonga, bhains, baraat, Billa Wheelie as the rival, Makhan Lassi power-up, L-A-H-O-R-E letters, and Lahori Punjabi dialogue throughout.

**Made in Pakistan 🇵🇰 — Developer: [Muhammad Talha Khan](https://muhammadtalhakhan2003.github.io/PortFolio_Talha/)**
