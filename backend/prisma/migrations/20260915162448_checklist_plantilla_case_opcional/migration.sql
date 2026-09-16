-- DropForeignKey
ALTER TABLE "ContractChecklistItem" DROP CONSTRAINT "ContractChecklistItem_caseId_fkey";

-- AlterTable
ALTER TABLE "ContractChecklistItem" ALTER COLUMN "caseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ContractChecklistItem" ADD CONSTRAINT "ContractChecklistItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
