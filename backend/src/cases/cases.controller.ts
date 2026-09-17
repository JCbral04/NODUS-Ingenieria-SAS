import { Body, Controller, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { WorkflowService } from '../workflow/workflow.service';
import { TransitionDto } from '../workflow/dto/transition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cases')
@Controller('cases')
export class CasesController {
  constructor(
    private cases: CasesService,
    private workflow: WorkflowService,
  ) {}

  @ApiOperation({ summary: 'Onboarding T1: empresa + contacto + caso en una transacción (RF-001…014)' })
  @Post()
  create(@Body() dto: OnboardingDto) {
    return this.cases.createWithOnboarding(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Transición de estado vía WorkflowService (validada + bitácora automática)' })
  @Patch(':id/status')
  transition(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransitionDto,
    @Req() req: { user: { sub: number } },
  ) {
    return this.workflow.transition(id, dto.targetStatus, req.user.sub, dto.note);
  }
}
