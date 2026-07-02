export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { getCalculationsForUser, clearAkashaCache } from "@/lib/akasha";

const pct = (n?: number, d?: number) =>
  typeof n === "number" && typeof d === "number" && d > 0 ? (n / d) * 100 : undefined;

/** GET /api/akasha/:uid — ranked calculations for a player. */
export async function GET(_req: NextRequest, { params }: { params: { uid: string } }) {
  const uid = params?.uid;
  if (!uid) return Response.json({ error: "Missing uid" }, { status: 400 });

  try {
    const list = await getCalculationsForUser(uid);

    const calculations = (Array.isArray(list) ? list : []).map((ch: any) => {
      const fit = ch?.calculations?.fit ?? {};
      const calcId = fit?.id ?? fit?.calculationId;
      return {
        character: ch?.name ?? "",
        characterId: ch?.characterId ?? ch?.id,
        constellation: ch?.constellation,
        icon: ch?.icon,
        calcId,
        calcName: fit?.name,
        weapon: fit?.weapon?.name,
        weaponIcon: fit?.weapon?.icon,
        result: fit?.result,
        topPercent: pct(fit?.ranking, fit?.outOf),
        rank: fit?.ranking,
        outOf: fit?.outOf,
        url: calcId ? `https://akasha.cv/leaderboards/${calcId}` : undefined,
      };
    });

    return Response.json({ uid, calculations });
  } catch (e: any) {
    return Response.json(
      { error: "Akasha error", detail: String(e?.message || e) },
      { status: 502 }
    );
  }
}

/** POST /api/akasha/:uid — clears the server cache (Refresh button). */
export async function POST(_req: NextRequest, { params }: { params: { uid: string } }) {
  if (!params?.uid) return Response.json({ error: "Missing uid" }, { status: 400 });
  clearAkashaCache();
  return Response.json({ ok: true });
}
