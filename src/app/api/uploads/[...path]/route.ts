import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { path: parts } = await context.params;
  const rel = parts.join("/");
  if (rel.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const milestoneId = parts[0];
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { deal: true },
  });
  if (!milestone) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    milestone.deal.clientId !== session.user.id &&
    milestone.deal.freelancerId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const abs = path.join(process.cwd(), "uploads", rel);
  const data = await readFile(abs);
  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${parts[parts.length - 1]}"`,
    },
  });
}
