import { NextRequest } from "next/server";
const AKASHA_BRIDGE = process.env.AKASHA_BRIDGE_URL || "http://localhost:8000";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { calcId: string } }) {
    const r = await fetch(`${AKASHA_BRIDGE}/v1/leaderboard/${encodeURIComponent(params.calcId)}?page_size=10&max_pages=1`, {
        next: { revalidate: 60 * 10 },
    });
    const data = await r.json();
    return Response.json(data, { status: r.status });
}
