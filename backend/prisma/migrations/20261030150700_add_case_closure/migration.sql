/*
  Warnings:

  - A unique constraint covering the columns `[caseId,type,evaluatorId]` on the table `Evaluation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ClosureStage" AS ENUM ('CIERRE_TECNICO', 'REVISADO', 'ENTREGADO', 'ACEPTADO', 'CERRADO');

-- CreateTable
CREATE TABLE "CaseClosure" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "stage" "ClosureStage" NOT NULL DEFAULT 'CIERRE_TECNICO',
    "technicalNotes" TEXT,
    "reviewChecklist" JSONB,
    "deliveryAct" TEXT,
    "acceptanceNotes" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseClosure_caseId_key" ON "CaseClosure"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_caseId_type_evaluatorId_key" ON "Evaluation"("caseId", "type", "evaluatorId");

-- AddForeignKey
ALTER TABLE "CaseClosure" ADD CONSTRAINT "CaseClosure_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseClosure" ADD CONSTRAINT "CaseClosure_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
