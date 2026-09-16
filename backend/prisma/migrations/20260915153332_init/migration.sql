-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('CREADO', 'EN_REVISION', 'CLASIFICADO', 'EN_POSTULACION', 'ASIGNADO', 'PROPUESTA_EN_DISENO', 'PROPUESTA_LISTA_QA', 'PROPUESTA_ENVIADA', 'EN_DECISION_CLIENTE', 'AJUSTES_PROPUESTA', 'PROPUESTA_ACEPTADA', 'PENDIENTE_CONTRATACION', 'AUTORIZADO_EJECUCION', 'EN_EJECUCION', 'LISTO_PARA_CIERRE', 'CERRADO', 'CERRADO_SIN_CONTRATACION');

-- CreateEnum
CREATE TYPE "ConsultantStatus" AS ENUM ('REGISTRADO', 'EN_VALIDACION', 'HABILITADO', 'CONDICIONADO', 'SUSPENDIDO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "ConsultantModality" AS ENUM ('INDEPENDIENTE', 'SPONSOR', 'PROPIO');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('POSTULADO', 'EN_EVALUACION', 'ASIGNADO', 'NO_ASIGNADO', 'RETIRADA');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('BORRADOR', 'EN_DISENO', 'EN_REVISION_QA', 'EN_AJUSTES', 'APROBADA_ENVIAR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADO', 'NO_APLICA');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('NO_INICIADA', 'EN_CURSO', 'COMPLETADA', 'BLOQUEADA', 'REPROGRAMADA');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDIENTE', 'EN_CURSO', 'CUMPLIDO', 'VENCIDO', 'REPROGRAMADO');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDIENTE', 'EN_DESARROLLO', 'CARGADO', 'EN_REVISION', 'APROBADO');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ABIERTA', 'EN_ATENCION', 'ESCALADA', 'CERRADA');

-- CreateEnum
CREATE TYPE "IncidentImpact" AS ENUM ('BAJO', 'MEDIO', 'ALTO', 'CRITICO');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('ACEPTAR', 'SOLICITAR_AJUSTES', 'NO_CONTINUAR');

-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('SATISFACCION_CLIENTE', 'DESEMPENO_CONSULTOR');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "DocumentStage" AS ENUM ('INTAKE', 'EVALUACION', 'POSTULACION', 'PROPUESTA', 'CONTRATACION', 'EJECUCION', 'CIERRE');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "roleId" INTEGER NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "emailDomain" TEXT,
    "taxId" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyContact" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "fullName" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LovCategory" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "LovCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LovValue" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LovValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" SERIAL NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "contactId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "areaId" INTEGER,
    "urgencyId" INTEGER NOT NULL,
    "impactId" INTEGER NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'CREADO',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedConsultantId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseClassification" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "areaId" INTEGER NOT NULL,
    "interventionTypeId" INTEGER NOT NULL,
    "complexityId" INTEGER NOT NULL,
    "impactId" INTEGER NOT NULL,
    "eligibilityNotes" TEXT,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "classifiedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseStateHistory" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "fromStatus" "CaseStatus",
    "toStatus" "CaseStatus" NOT NULL,
    "actorId" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseStateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultant" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "specialtyId" INTEGER,
    "levelCode" TEXT,
    "modality" "ConsultantModality" NOT NULL DEFAULT 'INDEPENDIENTE',
    "sponsorName" TEXT,
    "status" "ConsultantStatus" NOT NULL DEFAULT 'REGISTRADO',
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "bio" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "consultantId" INTEGER NOT NULL,
    "interestStatement" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "relevance" TEXT NOT NULL,
    "relevantExperience" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'POSTULADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "consultantId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ProposalStatus" NOT NULL DEFAULT 'EN_DISENO',
    "executiveSummary" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "exclusions" TEXT,
    "activities" JSONB,
    "deliverables" JSONB,
    "schedule" JSONB,
    "valuation" TEXT,
    "conditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalReview" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "reviewerId" INTEGER NOT NULL,
    "checklist" JSONB NOT NULL,
    "observations" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "adjustmentRequest" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "consultantId" INTEGER NOT NULL,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'PENDIENTE',
    "operativeFramework" JSONB,
    "evidenceNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractChecklistItem" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "ChecklistStatus" NOT NULL DEFAULT 'PENDIENTE',
    "completedAt" TIMESTAMP(3),
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "responsibleId" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" "ActivityStatus" NOT NULL DEFAULT 'NO_INICIADA',
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDIENTE',
    "criticality" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "impact" "IncidentImpact" NOT NULL DEFAULT 'MEDIO',
    "suggestedAction" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'ABIERTA',
    "reportedById" INTEGER NOT NULL,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "milestoneId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDIENTE',
    "documentId" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDecision" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "type" "DecisionType" NOT NULL,
    "notes" TEXT,
    "decidedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "type" "EvaluationType" NOT NULL,
    "score" INTEGER NOT NULL,
    "comments" TEXT,
    "evaluatorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "stage" "DocumentStage" NOT NULL DEFAULT 'INTAKE',
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "caseId" INTEGER,
    "prevState" TEXT,
    "newState" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaRule" (
    "id" SERIAL NOT NULL,
    "fromStatus" "CaseStatus" NOT NULL,
    "hours" INTEGER NOT NULL,
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SlaRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "caseId" INTEGER,
    "templateCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_taxId_key" ON "Company"("taxId");

-- CreateIndex
CREATE INDEX "Company_emailDomain_idx" ON "Company"("emailDomain");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyContact_userId_key" ON "CompanyContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LovCategory_code_key" ON "LovCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LovValue_categoryId_code_key" ON "LovValue"("categoryId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");

-- CreateIndex
CREATE INDEX "Case_companyId_idx" ON "Case"("companyId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "CaseClassification_caseId_idx" ON "CaseClassification"("caseId");

-- CreateIndex
CREATE INDEX "CaseStateHistory_caseId_idx" ON "CaseStateHistory"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Consultant_userId_key" ON "Consultant"("userId");

-- CreateIndex
CREATE INDEX "Application_caseId_idx" ON "Application"("caseId");

-- CreateIndex
CREATE INDEX "Application_consultantId_idx" ON "Application"("consultantId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_caseId_consultantId_key" ON "Application"("caseId", "consultantId");

-- CreateIndex
CREATE INDEX "Proposal_caseId_idx" ON "Proposal"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_caseId_version_key" ON "Proposal"("caseId", "version");

-- CreateIndex
CREATE INDEX "ProposalReview_proposalId_idx" ON "ProposalReview"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_caseId_key" ON "Contract"("caseId");

-- CreateIndex
CREATE INDEX "ContractChecklistItem_caseId_idx" ON "ContractChecklistItem"("caseId");

-- CreateIndex
CREATE INDEX "Activity_caseId_idx" ON "Activity"("caseId");

-- CreateIndex
CREATE INDEX "Milestone_caseId_idx" ON "Milestone"("caseId");

-- CreateIndex
CREATE INDEX "Incident_caseId_idx" ON "Incident"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Deliverable_documentId_key" ON "Deliverable"("documentId");

-- CreateIndex
CREATE INDEX "Deliverable_caseId_idx" ON "Deliverable"("caseId");

-- CreateIndex
CREATE INDEX "CaseDecision_caseId_idx" ON "CaseDecision"("caseId");

-- CreateIndex
CREATE INDEX "Evaluation_caseId_idx" ON "Evaluation"("caseId");

-- CreateIndex
CREATE INDEX "Document_caseId_stage_idx" ON "Document"("caseId", "stage");

-- CreateIndex
CREATE INDEX "AuditLog_caseId_idx" ON "AuditLog"("caseId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_caseId_idx" ON "Notification"("caseId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyContact" ADD CONSTRAINT "CompanyContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyContact" ADD CONSTRAINT "CompanyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LovValue" ADD CONSTRAINT "LovValue_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LovCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CompanyContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "LovValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_urgencyId_fkey" FOREIGN KEY ("urgencyId") REFERENCES "LovValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_impactId_fkey" FOREIGN KEY ("impactId") REFERENCES "LovValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_assignedConsultantId_fkey" FOREIGN KEY ("assignedConsultantId") REFERENCES "Consultant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseClassification" ADD CONSTRAINT "CaseClassification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseClassification" ADD CONSTRAINT "CaseClassification_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "LovValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseClassification" ADD CONSTRAINT "CaseClassification_interventionTypeId_fkey" FOREIGN KEY ("interventionTypeId") REFERENCES "LovValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseClassification" ADD CONSTRAINT "CaseClassification_complexityId_fkey" FOREIGN KEY ("complexityId") REFERENCES "LovValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseClassification" ADD CONSTRAINT "CaseClassification_impactId_fkey" FOREIGN KEY ("impactId") REFERENCES "LovValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseClassification" ADD CONSTRAINT "CaseClassification_classifiedById_fkey" FOREIGN KEY ("classifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseStateHistory" ADD CONSTRAINT "CaseStateHistory_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseStateHistory" ADD CONSTRAINT "CaseStateHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultant" ADD CONSTRAINT "Consultant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultant" ADD CONSTRAINT "Consultant_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "LovValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalReview" ADD CONSTRAINT "ProposalReview_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalReview" ADD CONSTRAINT "ProposalReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractChecklistItem" ADD CONSTRAINT "ContractChecklistItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "LovValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDecision" ADD CONSTRAINT "CaseDecision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDecision" ADD CONSTRAINT "CaseDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
