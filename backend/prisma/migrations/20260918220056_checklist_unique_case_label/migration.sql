/*
  Warnings:

  - A unique constraint covering the columns `[caseId,label]` on the table `ContractChecklistItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ContractChecklistItem_caseId_label_key" ON "ContractChecklistItem"("caseId", "label");
