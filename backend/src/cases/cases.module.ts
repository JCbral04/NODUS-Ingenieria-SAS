import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

@Module({
  imports: [WorkflowModule, AuthModule, NotificationsModule],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}