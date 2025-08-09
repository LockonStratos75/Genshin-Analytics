// app/api/enka/client.ts
import "server-only";
import { EnkaClient } from "enka-network-api";

type G = typeof globalThis & {
    __enkaClientPromise?: Promise<EnkaClient>;
    __enkaWarmPromise?: Promise<void>;
};

const g = globalThis as G;

/** pick a cache dir that works locally and on Vercel */
const CACHE_DIR =
    process.env.ENKA_CACHE_DIR ||
    (process.env.VERCEL ? "/tmp/enka-cache" : "./.enka-cache");

/** create the client once per process */
async function createClient(): Promise<EnkaClient> {
    const enka = new EnkaClient({
        cacheDirectory: CACHE_DIR,
        defaultLanguage: "en",
        showFetchCacheLog: true,
        // Vercel egress can be slow on cold starts
        requestTimeout: 15000,
        userAgent: "Mozilla/5.0",
    });

    enka.cachedAssetsManager.cacheDirectorySetup();

    // Background updater (safe no-op on lambdas that get torn down)
    enka.cachedAssetsManager.activateAutoCacheUpdater({
        instant: false,
        timeout: 60 * 60 * 1000,
        onUpdateEnd: async () => enka.cachedAssetsManager.refreshAllData(),
    });

    return enka;
}

/** ensure the full game data cache exists (idempotent) */
async function warmCache(enka: EnkaClient): Promise<void> {
    if (!g.__enkaWarmPromise) {
        g.__enkaWarmPromise = (async () => {
            try {
                // Downloads on first run; quick no-op if already present
                await enka.cachedAssetsManager.fetchAllContents();
            } catch {
                // ignore: cache may already be there
            } finally {
                enka.cachedAssetsManager.refreshAllData();
            }
        })();
    }
    await g.__enkaWarmPromise;
}

/** Public API used by your routes */
export async function getEnka(): Promise<EnkaClient> {
    if (!g.__enkaClientPromise) g.__enkaClientPromise = createClient();
    const enka = await g.__enkaClientPromise;
    await warmCache(enka); // important on Vercel: /tmp is empty on cold start
    return enka;
}
