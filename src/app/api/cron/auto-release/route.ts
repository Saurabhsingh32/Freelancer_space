import { NextResponse } from "next/server";
import { applyAutoRelease } from "@/lib/milestones";

export async function GET() {
  const count = await applyAutoRelease();
  return NextResponse.json({ released: count });
}

export async function POST() {
  const count = await applyAutoRelease();
  return NextResponse.json({ released: count });
}
