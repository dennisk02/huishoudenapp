import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: {
    title?: string;
    description?: string | null;
    date?: Date;
    assignees?: { set: { id: string }[] };
  } = {};
  if ("title" in body) data.title = (body.title ?? "").trim();
  if ("description" in body) data.description = (body.description ?? "").trim() || null;
  if ("date" in body) data.date = new Date(body.date);
  if ("assigneeIds" in body) {
    const assigneeIds = (body.assigneeIds ?? []) as string[];
    data.assignees = { set: assigneeIds.map((aid) => ({ id: aid })) };
  }
  const event = await prisma.event.update({
    where: { id },
    data,
    include: { createdBy: true, assignees: true },
  });
  return NextResponse.json(event);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
