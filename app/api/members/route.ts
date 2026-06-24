import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COLORS = ["#6366f1", "#ec4899", "#22c55e", "#f59e0b", "#06b6d4", "#a855f7"];

export async function GET() {
  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
  }
  const count = await prisma.member.count();
  const member = await prisma.member.create({
    data: { name, color: COLORS[count % COLORS.length] },
  });
  return NextResponse.json(member);
}
