import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WorkflowModule, AuthModule],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
