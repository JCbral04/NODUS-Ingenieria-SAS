import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { CasesModule } from './cases/cases.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ConsultantsModule } from './consultants/consultants.module';
import { ApplicationsModule } from './applications/applications.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ContractsModule } from './contracts/contracts.module';
import { ExecutionModule } from './execution/execution.module';
import { DocumentsModule } from './documents/documents.module';
import { SlaModule } from './sla/sla.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, CompaniesModule, CasesModule, WorkflowModule, ConsultantsModule, ApplicationsModule, ProposalsModule, ContractsModule, ExecutionModule, DocumentsModule, SlaModule, AuditModule, NotificationsModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
