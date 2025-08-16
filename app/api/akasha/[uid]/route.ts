export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "server-only";
import type { NextRequest } from "next/server";
import { createAkasha } from "@/lib/akasha-client";

/**
 * GET /api/akasha/:uid?refresh=1
 * - fetches calculations for a UID using the JS wrapper
 * - optional ?refresh=1 just bypasses our in-memory cache (akasha itself is remote)
 */

type CalcRow = {
    character?: string;
    characterId?: number | string;
    weapon?: string | null;
    result?: number | null;
    topPercent?: number | null;
    rank?: number | null;
    outOf?: number | null;
    url?: string | null;
};

// super-light in-memory cache so we don't hammer akasha.cv while deving
const mem = new Map<string, { at: number; data: any }>();
const TTL = 1000 * 60 * 5; // 5 minutes

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
    const uid = params?.uid?.trim();
    if (!uid) {
        return new Response(JSON.stringify({ error: "Missing uid" }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    const wantsRefresh = req.nextUrl.searchParams.get("refresh") === "1";

    try {
        if (!wantsRefresh) {
            const cached = mem.get(uid);
            if (cached && Date.now() - cached.at < TTL) {
                return new Response(JSON.stringify(cached.data), {
                    status: 200,
                    headers: { "content-type": "application/json", "cache-control": "no-store" },
                });
            }
        }

        const akasha = await createAkasha();

        // per package readme: getCalculationsForUser('uuid|uid')
        // it returns { data: [...] } where each entry is a character with .calculations.fit etc.
        const resp: any = await akasha.getCalculationsForUser(uid);

        // normalize into the shape your page already expects
        const rows: CalcRow[] = [];
        const list = Array.isArray(resp?.data) ? resp.data : [];
        for (const ch of list) {
            const name: string | undefined = ch?.name ?? ch?.characterName ?? ch?.character?.name;
            const id: number | string | undefined = ch?.id ?? ch?.characterId ?? ch?.character?.id;

            // the wrapper shows examples with `calculations.fit`
            const calc = ch?.calculations?.fit || ch?.calculations?.dps || ch?.calculations?.best || ch?.calculations;

            if (!calc) continue;

            const rank = Number(calc?.ranking ?? calc?.rank ?? NaN);
            const outOf = Number(calc?.outOf ?? calc?.total ?? NaN);
            const result = Number(calc?.result ?? calc?.score ?? NaN);

            rows.push({
                character: name,
                characterId: id,
                weapon: calc?.weapon?.name ?? null,
                result: Number.isFinite(result) ? Math.round(result) : null,
                topPercent:
                    Number.isFinite(rank) && Number.isFinite(outOf) && outOf > 0
                        ? Math.round((rank / outOf) * 100)
                        : null,
                rank: Number.isFinite(rank) ? rank : null,
                outOf: Number.isFinite(outOf) ? outOf : null,
                url: calc?.id ? `https://akasha.cv/leaderboards/${calc.id}` : null,
            });
        }

        const payload = { uid, calculations: rows };

        // put into the short cache
        mem.set(uid, { at: Date.now(), data: payload });

        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
    } catch (e: any) {
        return new Response(
            JSON.stringify({
                error: "Upstream error",
                detail: String(e?.message || e),
            }),
            { status: 502, headers: { "content-type": "application/json" } }
        );
    }
}
