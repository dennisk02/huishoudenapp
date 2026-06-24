/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `assigneeId` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assigneeId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "assigneeId";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "assigneeId";

-- CreateTable
CREATE TABLE "_TaskAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_EventAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TaskAssignees_AB_unique" ON "_TaskAssignees"("A", "B");

-- CreateIndex
CREATE INDEX "_TaskAssignees_B_index" ON "_TaskAssignees"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EventAssignees_AB_unique" ON "_EventAssignees"("A", "B");

-- CreateIndex
CREATE INDEX "_EventAssignees_B_index" ON "_EventAssignees"("B");

-- AddForeignKey
ALTER TABLE "_TaskAssignees" ADD CONSTRAINT "_TaskAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskAssignees" ADD CONSTRAINT "_TaskAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventAssignees" ADD CONSTRAINT "_EventAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventAssignees" ADD CONSTRAINT "_EventAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
