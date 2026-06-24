import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: { dueDate?: Date; assignees?: { set: { id: string }[] } } = {};
  if ("assigneeIds" in body) {
    const assigneeIds = (body.assigneeIds ?? []) as string[];
    data.assignees = { set: assigneeIds.map((aid) => ({ id: aid })) };
  }
  if ("dueDate" in body) {
    data.dueDate = new Date(body.dueDate);
  }
  const task = await prisma.task.update({
    where: { id },
    data,
    include: { assignees: true },
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
