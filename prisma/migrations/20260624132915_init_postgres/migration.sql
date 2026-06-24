-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL DEFAULT 'WEEKLY',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Completion" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Completion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_name_key" ON "Member"("name");

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
