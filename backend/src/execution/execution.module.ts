import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';

@Module({
  imports: [AuthModule],
  controllers: [ExecutionController],
  providers: [ExecutionService],
})
export class ExecutionModule {}