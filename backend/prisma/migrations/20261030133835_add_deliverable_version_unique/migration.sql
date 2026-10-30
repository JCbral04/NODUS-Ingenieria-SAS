/*
  Warnings:

  - A unique constraint covering the columns `[milestoneId,title,version]` on the table `Deliverable` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Deliverable_milestoneId_title_version_key" ON "Deliverable"("milestoneId", "title", "version");
