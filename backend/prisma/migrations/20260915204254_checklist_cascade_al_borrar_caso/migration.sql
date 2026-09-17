-- DropForeignKey
ALTER TABLE "ContractChecklistItem" DROP CONSTRAINT "ContractChecklistItem_caseId_fkey";

-- AddForeignKey
ALTER TABLE "ContractChecklistItem" ADD CONSTRAINT "ContractChecklistItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
