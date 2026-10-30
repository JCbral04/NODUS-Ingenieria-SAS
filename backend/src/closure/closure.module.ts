import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { ClosureController } from './closure.controller';
import { ClosureService } from './closure.service';

@Module({
  imports: [AuthModule, WorkflowModule],
  controllers: [ClosureController],
  providers: [ClosureService],
})
export class ClosureModule {}