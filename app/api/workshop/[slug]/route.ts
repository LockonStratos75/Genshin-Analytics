// path: app/api/workshop/[slug]/route.ts
import { NextResponse } from "next/server";
import { getGuide } from "@/lib/workshop-db";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
    const doc = await getGuide(params.slug);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc, { status: 200 });
}
