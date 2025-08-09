import { NextRequest, NextResponse } from "next/server";
import { parseWishJSON } from "@/lib/wishParser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wishes = parseWishJSON(body.json);
    return NextResponse.json(wishes);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "parse failed" }, { status: 400 });
  }
}
