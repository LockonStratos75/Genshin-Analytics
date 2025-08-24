// app/api/workshop/image/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

type CacheHit = { url: string; exp: number };
const mem = new Map<string, CacheHit>();
const TTL_MS = 1000 * 60 * 60 * 12; // 12h

function rankUrls(urls: string[]) {
    const prefer = [
        "static.wikia", "fandom.com", "hoyowiki", "honeyhunterworld",
        "game8.co", "keqingmains", "ambr.top", "wiki"
    ];
    return urls
        .filter(Boolean)
        .map((u) => {
            let score = 0;
            if (/\.(png|webp|jpg|jpeg)$/i.test(u)) score += 2;
            if (/icon|avatar|side|gacha|portrait|thumb/i.test(u)) score += 2;
            if (/\.svg/i.test(u)) score -= 2;
            if (prefer.some((d) => u.includes(d))) score += 4;
            return [u, score] as [string, number];
        })
        .sort((a, b) => b[1] - a[1])
        .map(([u]) => u);
}

async function fromFastScraper(q: string): Promise<string[]> {
    try {
        // fastscraper is CJS; dynamic import returns it at .default
        // @ts-ignore
        const mod: any = (await import("fastscraper")).default;
        if (!mod?.googleimage) return [];
        const res = await mod.googleimage(q);
        const arr: any[] = Array.isArray(res) ? res : (res?.result || res?.images || []);
        return arr
            .map((x) => (typeof x === "string" ? x : x?.url || x?.image || x?.src))
            .filter(Boolean);
    } catch {
        return [];
    }
}

async function fromDuckDuckGo(q: string): Promise<string[]> {
    try {
        // 1) get vqd token
        const page = await fetch(
            `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`,
            { headers: { "User-Agent": "Mozilla/5.0" } }
        );
        const html = await page.text();
        const m =
            html.match(/vqd='([\d-]+)'/) ||
            html.match(/vqd=\\'([\d-]+)\\'/) ||
            html.match(/"vqd":"([\d-]+)"/);
        const vqd = m?.[1];
        if (!vqd) return [];

        // 2) image json
        const api = await fetch(
            `https://duckduckgo.com/i.js?l=en-us&o=json&q=${encodeURIComponent(q)}&vqd=${vqd}&p=1&s=0`,
            {
                headers: {
                    Referer: "https://duckduckgo.com/",
                    "User-Agent": "Mozilla/5.0",
                    Accept: "application/json",
                },
            }
        );
        const j = await api.json();
        const results: any[] = j?.results || [];
        return results
            .map((r) => r.image || r.thumbnail || r.url)
            .filter(Boolean);
    } catch {
        return [];
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) return new NextResponse("Missing q", { status: 400 });

    const hit = mem.get(q);
    const now = Date.now();
    if (hit && hit.exp > now) {
        return NextResponse.redirect(hit.url, 302);
    }

    // Try multiple phrasings for better hit-rate.
    const variations = [
        q,
        `${q} icon`,
        `${q} icon transparent png`,
        `${q} genshin icon`,
        `${q} genshin impact icon wiki`,
    ];

    for (const qq of variations) {
        const all: string[] = [];
        all.push(...(await fromFastScraper(qq)));
        if (!all.length) all.push(...(await fromDuckDuckGo(qq)));

        const unique = Array.from(new Set(all));
        const best = rankUrls(unique)[0];

        if (best) {
            mem.set(q, { url: best, exp: now + TTL_MS });
            return NextResponse.redirect(best, 302);
        }
    }

    return new NextResponse("No image found", { status: 404 });
}
