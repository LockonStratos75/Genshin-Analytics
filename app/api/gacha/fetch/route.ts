import { NextRequest, NextResponse } from "next/server";
import { limiter } from "@/app/api/_utils";
import type { Wish } from "@/lib/types";

export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Accepts either the getGachaLog API URL or the wish-history page URL from the
 * game's web cache (gs.hoyoverse.com/.../index.html?...authkey=...#/log) and
 * always talks to the proper gacha API for the account's region.
 */
export async function POST(req: NextRequest) {
  if (!limiter(req.ip ?? "anon")) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return NextResponse.json({ error: "That does not look like a URL" }, { status: 400 });
  }

  // Keep the query verbatim: round-tripping through URLSearchParams can
  // corrupt authkeys, and the URL itself knows the right API host. The game
  // moved to public-operation-hk4e-*; the old hk4e-api-os endpoint times out.
  const rawQuery = u.search.replace(/^\?/, "");
  if (!/(?:^|&)authkey=/.test(rawQuery)) {
    return NextResponse.json(
      { error: "No authkey found in that URL. Copy the full wish history URL." },
      { status: 400 }
    );
  }
  const kept = rawQuery
    .split("&")
    .filter((p) => !/^(gacha_type|size|end_id|page|lang)=/.test(p))
    .join("&");

  const gameBiz = /(?:^|&)game_biz=([^&#]+)/.exec(rawQuery)?.[1] || "hk4e_global";
  const api = /getGachaLog/i.test(u.pathname)
    ? `${u.origin}${u.pathname}`
    : gameBiz === "hk4e_cn"
      ? "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog"
      : "https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getGachaLog";

  async function fetchPage(gacha_type: string, end_id = "0"): Promise<any> {
    const qs = `${kept}&lang=en&gacha_type=${gacha_type}&size=20&end_id=${end_id}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`${api}?${qs}`);
      const json = await res.json().catch(() => ({}));
      if (json?.retcode === -110) {
        // "visit too frequently": back off once and retry
        await sleep(2000);
        continue;
      }
      if (json?.retcode !== 0) {
        const msg = json?.message || `retcode ${json?.retcode}`;
        throw new Error(msg === "authkey timeout" ? "AUTHKEY_EXPIRED" : msg);
      }
      return json.data ?? { list: [] };
    }
    throw new Error("Gacha API keeps throttling; try again in a minute.");
  }

  // 100 novice, 200 standard, 301+400 character (shared pity), 302 weapon, 500 chronicled
  const banners: Array<[string, Wish["banner"] | "chronicled"]> = [
    ["100", "standard"],
    ["200", "standard"],
    ["301", "character"],
    ["400", "character"],
    ["302", "weapon"],
    ["500", "chronicled" as any],
  ];

  const wishes: Wish[] = [];
  try {
    for (const [gt, banner] of banners) {
      let end = "0";
      for (let i = 0; i < 60; i++) {
        // up to 1200 pulls per banner
        const page = await fetchPage(gt, end);
        const list = page.list || [];
        for (const x of list) {
          wishes.push({
            id: String(x.id),
            time: new Date(x.time).toISOString(),
            name: x.name,
            rank_type: String(x.rank_type) as any,
            item_type:
              x.item_type === "角色"
                ? "Character"
                : x.item_type === "武器"
                  ? "Weapon"
                  : x.item_type || "Weapon",
            banner: banner as any,
          });
        }
        if (list.length < 20) break;
        end = list[list.length - 1].id;
        await sleep(350);
      }
    }
  } catch (e: any) {
    if (String(e?.message) === "AUTHKEY_EXPIRED") {
      return NextResponse.json(
        {
          error:
            "This authkey has expired (they last 24 hours). Open Wish > History in game again and grab a fresh URL.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Gacha API error: ${e?.message || e}` },
      { status: 502 }
    );
  }

  return NextResponse.json(wishes);
}
