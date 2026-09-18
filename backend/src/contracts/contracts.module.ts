import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WorkflowModule, AuthModule],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}