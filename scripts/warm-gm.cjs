/* Hard reset genshin-manager caches (project, package, and OS-global) and re-deploy */
const fs = require("fs/promises");
const path = require("path");
const os = require("os");

let GM;
try { GM = require("genshin-manager"); }
catch { GM = require("genshin-manager/dist/index.cjs"); }

// ---- where we'll keep our app-local cache
const APP_CACHE = process.env.GM_CACHE_DIR || path.resolve(".cache/genshin");

// ---- try to locate package cache(s) under node_modules
const gmResolved = require.resolve("genshin-manager");
const distDir = path.dirname(gmResolved);
const PKG_CACHE_1 = path.resolve(distDir, "..", "cache");             // node_modules/genshin-manager/cache
const PKG_CACHE_2 = path.resolve(distDir, "..", "..", "..", "cache"); // some builds

// ---- common *global* cache locations per OS
const home = os.homedir();
const GLOBAL_CANDIDATES = [
    // Windows
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "genshin-manager", "cache"),
    process.env.APPDATA && path.join(process.env.APPDATA, "genshin-manager", "cache"),
    // macOS
    path.join(home, "Library", "Caches", "genshin-manager"),
    // Linux
    path.join(home, ".cache", "genshin-manager"),
].filter(Boolean);

async function cleanDir(p) {
    try {
        await fs.rm(p, { recursive: true, force: true });
        await fs.mkdir(p, { recursive: true });
        console.log("Cleaned:", p);
    } catch (e) {
        console.warn("Skip:", p, e?.message);
    }
}

(async () => {
    console.log("App cache:", APP_CACHE);
    console.log("Pkg cache (1):", PKG_CACHE_1);
    console.log("Pkg cache (2):", PKG_CACHE_2);
    console.log("Global candidates:", GLOBAL_CANDIDATES);

    // 1) Clean EVERYTHING that might contain stale version markers
    for (const p of [APP_CACHE, PKG_CACHE_1, PKG_CACHE_2, ...GLOBAL_CANDIDATES]) {
        await cleanDir(p);
    }

    // 2) Fresh client with our app cache
    const client = new GM.Client({
        defaultLanguage: "EN",
    });

    try {
        // Try both update paths; some versions expose a “force” argument
        if (typeof client.updateCache === "function") {
            try {
                // v1.4+ sometimes supports a force flag
                await client.updateCache(true);
            } catch (_) {
                await client.updateCache();
            }
        }
        // Deploy will still download if the cache is actually empty
        await client.deploy();

        console.log("genshin-manager cache warmed ✅");
    } catch (err) {
        console.error("Warm-up failed ❌");
        console.error(err);
        process.exit(1);
    }
})();
