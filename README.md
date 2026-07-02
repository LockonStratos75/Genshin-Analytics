# Genshin Analytics

Character builds, leaderboards, item databases, build guides, and wish pity tracking for Genshin Impact. Dark, fast, and local-first: your UID and wish history never leave the browser.

## Features

- **Dashboard** - account snapshot: roster, pity progress, lifetime pulls.
- **Characters** - full database of every playable character (stats at Lv90, talents, constellations, splash art) plus your own showcase roster imported from Enka.Network. Each roster character gets a detailed build page with combat stats, artifacts with substats, and an Akasha ranking badge.
- **Leaderboards** - global damage rankings from the Akasha System per character and calculation, with weapon variants. Look up any UID to see where its builds rank.
- **Weapons** - all weapons with max-level base ATK, substat values, and refinement passives. Filter by type and rarity; your equipped weapons show in a separate tab.
- **Artifacts** - every artifact set with 1/2/4-piece bonuses, plus roll-value scoring for your own pieces.
- **Build Guides** - curated guides (weapons ranked, artifact sets, main-stat and substat priorities, ER requirements, team comps, materials).
- **Wish Tracker** - paimon.moe-style pity counters with soft-pity markers, 50/50 and 75/25 win tracking, guaranteed status, 5-star history, and pull charts. Import via the in-game wish history URL or a UIGF .json / .xlsx file. Export to CSV.

## Data sources

| Source | Used for |
| --- | --- |
| [genshin-db](https://github.com/theBowja/genshin-db) | offline character / weapon / artifact databases |
| [Enka.Network](https://enka.network) | showcase roster, build stats, icons (CDN) |
| [Akasha System](https://akasha.cv) | leaderboards and build rankings |
| HoYoverse gacha log API | wish history via authkey URL |

Note: akasha.cv sits behind Cloudflare and rejects Node's TLS fingerprint, so the Akasha proxy shells out to `curl` (bundled with Windows 10+, macOS, and most Linux distros).

## Running

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

On the first Enka request the server downloads the enka-network-api game data cache (~100 MB) into `.enka-cache/`.

Not affiliated with HoYoverse.
