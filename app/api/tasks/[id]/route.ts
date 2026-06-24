import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: { assigneeId?: string | null; dueDate?: Date } = {};
  if ("assigneeId" in body) {
    data.assigneeId = (body.assigneeId ?? null) as string | null;
  }
  if ("dueDate" in body) {
    data.dueDate = new Date(body.dueDate);
  }
  const task = await prisma.task.update({
    where: { id },
    data,
    include: { assignee: true },
  });
  return NextResponse.json(task);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
