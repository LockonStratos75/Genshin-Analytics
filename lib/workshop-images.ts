// path: lib/workshop-images.ts
// server-only image lookup & caching using fastscraper (Google Images)

import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

type CacheShape = Record<string, string>;

const CACHE_FILE = path.resolve('.cache/workshop-images.json');

// In-memory cache for this process
const mem: CacheShape = (globalThis as any).__ws_img_cache ?? {};
(globalThis as any).__ws_img_cache = mem;

async function loadDiskCache(): Promise<CacheShape> {
    try {
        const raw = await fs.readFile(CACHE_FILE, 'utf8');
        return JSON.parse(raw) as CacheShape;
    } catch {
        return {};
    }
}
async function saveDiskCache(cache: CacheShape) {
    try {
        await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
        await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
    } catch {
        // non-fatal
    }
}

let diskCachePromise: Promise<CacheShape> | null = null;
async function getDiskCache() {
    if (!diskCachePromise) diskCachePromise = loadDiskCache();
    return diskCachePromise;
}

function keyFor(q: string) {
    return q.trim().toLowerCase();
}

function titleFromSlug(slugOrName: string) {
    // "raiden-shogun" -> "Raiden Shogun"
    if (!slugOrName) return '';
    const s = slugOrName.replace(/[-_]+/g, ' ');
    return s.replace(/\b\w/g, (m) => m.toUpperCase());
}

/** Build a Google image query we’ll pass to fastscraper */
export function buildQuery(type: 'character' | 'weapon' | 'artifact', slugOrName: string) {
    const base = titleFromSlug(slugOrName);
    if (type === 'artifact') {
        // ask specifically for the flower icon for better consistency
        return `${base} artifact flower icon genshin impact wiki`;
    }
    if (type === 'weapon') {
        return `${base} weapon icon genshin impact wiki`;
    }
    // character
    return `${base} icon genshin impact wiki`;
}

/** Scrape Google images (via fastscraper) and return the first usable URL */
export async function googleFirstImage(query: string): Promise<string | null> {
    const k = keyFor(query);
    if (mem[k]) return mem[k];

    const disk = await getDiskCache();
    if (disk[k]) {
        mem[k] = disk[k];
        return disk[k];
    }

    // fastscraper is CommonJS – require inline so it never ends up in the client
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const scraper = require('fastscraper');

    try {
        const results: any = await scraper.googleimage(query);
        if (Array.isArray(results) && results.length > 0) {
            // library sometimes returns string[] or array of objects – accept both
            const first =
                typeof results[0] === 'string'
                    ? (results[0] as string)
                    : (results[0]?.url || results[0]?.image || results[0]?.link || null);

            if (typeof first === 'string' && first.startsWith('http')) {
                mem[k] = first;
                const merged = { ...(await getDiskCache()), [k]: first };
                await saveDiskCache(merged);
                return first;
            }
        }
    } catch {
        // swallow – we’ll just return null below
    }
    return null;
}

/** Convenience shortcuts */
export async function characterIcon(slugOrName: string) {
    return googleFirstImage(buildQuery('character', slugOrName));
}
export async function weaponIcon(name: string) {
    return googleFirstImage(buildQuery('weapon', name));
}
export async function artifactFlowerIcon(setName: string) {
    return googleFirstImage(buildQuery('artifact', setName));
}
