import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: { createdBy: true },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const body = await req.json();
  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim() || null;
  const date = body.date as string | undefined;
  const createdById = (body.createdById ?? null) as string | null;
  if (!title) {
    return NextResponse.json({ error: "Titel is verplicht" }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ error: "Datum is verplicht" }, { status: 400 });
  }
  const event = await prisma.event.create({
    data: { title, description, date: new Date(date), createdById },
    include: { createdBy: true },
  });
  return NextResponse.json(event);
}
