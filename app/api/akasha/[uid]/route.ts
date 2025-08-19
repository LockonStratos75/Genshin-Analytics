// app/api/akasha/[uid]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "server-only";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

// % helper
const pct = (n?: number, d?: number) =>
    typeof n === "number" && typeof d === "number" && d > 0 ? (n / d) * 100 : undefined;

// Singleton client
let _akasha: any;
async function getClient() {
    if (_akasha) return _akasha;

    // Try the package you found first; fall back to the alt name used in some READMEs
    let mod: any;
    try {
        mod = await import("akasha-system.js");
    } catch {
        try {
            mod = await import("akasha-system.js");
        } catch (e) {
            throw new Error(
                "Cannot find akasha-system.js (or akasha.js). Install it with `npm i akasha-system.js`."
            );
        }
    }
    _akasha = new mod.default();
    return _akasha;
}

/**
 * GET /api/akasha/:uid
 * Returns cached Akasha calculations (10 min TTL) and tags the cache so POST can bust it.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: { uid: string } }
) {
    const uid = params?.uid;
    if (!uid) {
        return new Response(JSON.stringify({ error: "Missing uid" }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    try {
        const ak = await getClient();

        // Use Next’s route caching (revalidate + tag). The “fetch” below is a no-op fetch that
        // just gives us a cached response envelope; the real API call happens inside.
        const payload = await fetch("data:,", {
            next: { revalidate: 600, tags: [`akasha:${uid}`] },
        }).then(async () => {
            const res = await ak.getCalculationsForUser(uid);
            const list = Array.isArray(res?.data) ? res.data : [];

            const calculations = list.map((ch: any) => {
                const fit = ch?.calculations?.fit ?? {};
                const topPercent = pct(fit?.ranking, fit?.outOf);
                const calcId = fit?.id ?? fit?.calculationId;

                return {
                    character: ch?.name ?? "",
                    characterId: ch?.id,
                    calcId,
                    weapon: fit?.weapon?.name,
                    result: fit?.result,
                    topPercent,
                    rank: fit?.ranking,
                    outOf: fit?.outOf,
                    url: calcId ? `https://akasha.cv/leaderboards/${calcId}` : undefined,
                };
            });

            return { uid, calculations };
        });

        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (e: any) {
        return new Response(
            JSON.stringify({
                error: "Akasha error",
                detail: String(e?.message || e),
            }),
            { status: 502, headers: { "content-type": "application/json" } }
        );
    }
}

/**
 * POST /api/akasha/:uid
 * Busts the cached GET immediately (used by the “Refresh Akasha” button).
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: { uid: string } }
) {
    const uid = params?.uid;
    if (!uid) {
        return new Response(JSON.stringify({ error: "Missing uid" }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    revalidateTag(`akasha:${uid}`);
    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
    });
}
