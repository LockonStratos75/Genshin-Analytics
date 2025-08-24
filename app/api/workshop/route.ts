// app/api/workshop/route.ts
import { NextResponse } from "next/server";
import { listGuides } from "@/lib/workshop-db";

export const revalidate = 0;

export async function GET() {
    const list = await listGuides();
    return NextResponse.json(list, { status: 200 });
}
