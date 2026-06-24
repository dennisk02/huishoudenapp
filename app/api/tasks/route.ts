import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, type Frequency } from "@/lib/recurrence";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      assignees: true,
      completions: {
        orderBy: { completedAt: "desc" },
        take: 5,
        include: { member: true },
      },
    },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = (body.name ?? "").trim();
  const frequency: Frequency = body.frequency ?? "WEEKLY";
  const assigneeIds = (body.assigneeIds ?? []) as string[];
  if (!name) {
    return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
  }
  const validFrequencies: Frequency[] = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"];
  if (!validFrequencies.includes(frequency)) {
    return NextResponse.json({ error: "Ongeldige frequentie" }, { status: 400 });
  }
  const task = await prisma.task.create({
    data: {
      name,
      frequency,
      dueDate: startOfDay(new Date()),
      assignees: { connect: assigneeIds.map((id) => ({ id })) },
    },
    include: { assignees: true },
  });
  return NextResponse.json(task);
}
