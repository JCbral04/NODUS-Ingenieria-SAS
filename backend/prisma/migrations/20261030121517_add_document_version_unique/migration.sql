/*
  Warnings:

  - A unique constraint covering the columns `[caseId,stage,name,version]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Document_caseId_stage_name_version_key" ON "Document"("caseId", "stage", "name", "version");
