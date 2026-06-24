import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextDueDate, startOfDay, type Frequency } from "@/lib/recurrence";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const memberId = body.memberId as string | undefined;
  if (!memberId) {
    return NextResponse.json({ error: "memberId is verplicht" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Taak niet gevonden" }, { status: 404 });
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ error: "Gezinslid niet gevonden" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.completion.create({
      data: {
        taskId: task.id,
        memberId: member.id,
        dueDate: task.dueDate,
      },
    });
    const newDue = nextDueDate(startOfDay(task.dueDate), task.frequency as Frequency);
    return tx.task.update({
      where: { id: task.id },
      data: { dueDate: newDue },
    });
  });

  return NextResponse.json(updated);
}
