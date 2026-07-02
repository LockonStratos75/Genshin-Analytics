import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const BASE = "https://akasha.cv/api";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// akasha.cv sits behind Cloudflare and rejects Node's TLS fingerprint (fetch/https both 403).
// curl passes the check, so we shell out to it. curl ships with Windows 10+/macOS/most Linux.
async function curlJson(url: string): Promise<any> {
  try {
    const { stdout } = await execFileAsync(
      "curl",
      ["-s", "--max-time", "20", "-A", UA, "-H", "Accept: application/json", url],
      { maxBuffer: 16 * 1024 * 1024 }
    );
    return JSON.parse(stdout);
  } catch (e: any) {
    throw new Error(`Akasha request failed: ${e?.message || e}`);
  }
}

type CacheEntry = { at: number; data: any };
const cache = new Map<string, CacheEntry>();

async function cached(url: string, ttlMs: number) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data;
  const data = await curlJson(url);
  cache.set(url, { at: Date.now(), data });
  return data;
}

/** Leaderboard categories (calculations) for one character. */
export async function getLeaderboardCategories(characterId: number) {
  const json = await cached(
    `${BASE}/v2/leaderboards/categories?characterId=${characterId}`,
    30 * 60 * 1000
  );
  return json?.data ?? [];
}

/** Top rows of a specific calculation leaderboard. */
export async function getLeaderboard(
  calculationId: string,
  variant?: string,
  page = 1,
  size = 20
) {
  const params = new URLSearchParams({
    sort: "calculation.result",
    order: "-1",
    size: String(size),
    page: String(page),
    calculationId,
  });
  if (variant) params.set("variant", variant);
  const json = await cached(`${BASE}/leaderboards?${params}`, 10 * 60 * 1000);
  return json?.data ?? [];
}

/** All ranked calculations for a player UID. */
export async function getCalculationsForUser(uid: string) {
  const json = await cached(`${BASE}/getCalculationsForUser/${encodeURIComponent(uid)}`, 10 * 60 * 1000);
  return json?.data ?? [];
}

export function clearAkashaCache() {
  cache.clear();
}
