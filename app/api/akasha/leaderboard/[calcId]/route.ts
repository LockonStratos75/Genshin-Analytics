export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { getLeaderboard } from "@/lib/akasha";

/** GET /api/akasha/leaderboard/:calcId?variant=…&page=1&size=20 */
export async function GET(req: NextRequest, { params }: { params: { calcId: string } }) {
  const calcId = params?.calcId;
  if (!calcId) return Response.json({ error: "Missing calcId" }, { status: 400 });

  const sp = req.nextUrl.searchParams;
  const variant = sp.get("variant") || undefined;
  const page = Math.max(1, Number(sp.get("page") || 1));
  const size = Math.min(50, Math.max(5, Number(sp.get("size") || 20)));

  try {
    const rows = await getLeaderboard(calcId, variant, page, size);
    return Response.json({ calcId, variant, page, rows });
  } catch (e: any) {
    return Response.json(
      { error: "Akasha error", detail: String(e?.message || e) },
      { status: 502 }
    );
  }
}
