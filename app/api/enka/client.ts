// app/api/enka/client.ts
import "server-only";
import { EnkaClient } from "enka-network-api";

// Reuse a single client in dev/hot-reload too
const g = globalThis as unknown as { __enka?: Promise<EnkaClient> };

let warmed = false;

export async function getEnka(): Promise<EnkaClient> {
    if (!g.__enka) {
        g.__enka = (async () => {
            const enka = new EnkaClient({
                // keep cache inside project; override with ENKA_CACHE_DIR if you want
                cacheDirectory: process.env.ENKA_CACHE_DIR || "./.enka-cache",
                defaultLanguage: "en", // <— important for names
                showFetchCacheLog: true,
            });

            // ensure dir exists
            enka.cachedAssetsManager.cacheDirectorySetup();

            // One-time warm-up so first request doesn't unzip lazily
            if (!warmed) {
                try {
                    await enka.cachedAssetsManager.fetchAllContents();
                } catch {
                    // cache already present or network issue; continue with whatever is there
                }
                enka.cachedAssetsManager.refreshAllData();
                warmed = true;
            }

            // Optional: background updater
            enka.cachedAssetsManager.activateAutoCacheUpdater({
                instant: false,
                timeout: 60 * 60 * 1000, // 1 hour
                onUpdateEnd: async () => enka.cachedAssetsManager.refreshAllData(),
            });

            return enka;
        })();
    }

    return g.__enka;
}
