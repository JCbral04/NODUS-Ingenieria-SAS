import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [NotificationsModule],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}