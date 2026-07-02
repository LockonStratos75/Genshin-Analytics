export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { getLeaderboardCategories } from "@/lib/akasha";

/** GET /api/akasha/categories?characterId=10000089 — leaderboard calcs for a character. */
export async function GET(req: NextRequest) {
  const characterId = Number(req.nextUrl.searchParams.get("characterId"));
  if (!characterId) return Response.json({ error: "Missing characterId" }, { status: 400 });

  try {
    const categories = await getLeaderboardCategories(characterId);
    return Response.json({ characterId, categories });
  } catch (e: any) {
    return Response.json(
      { error: "Akasha error", detail: String(e?.message || e) },
      { status: 502 }
    );
  }
}
