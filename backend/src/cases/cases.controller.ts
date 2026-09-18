import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { CreateClassificationDto } from './dto/classification.dto';
import { WorkflowService } from '../workflow/workflow.service';
import { TransitionDto } from '../workflow/dto/transition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
  @Get()
  list(@Req() req: { user: { sub: number; role: string } }) {
    return this.cases.listForUser(req.user.sub, req.user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.cases.detail(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADVISORY', 'ADMIN')
  @ApiOperation({ summary: 'Clasificación T2 con LOV (solo Advisory) → CLASIFICADO si es elegible (RF-015–025)' })
  @Post(':id/classification')
  classify(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateClassificationDto,
    @Req() req: { user: { sub: number } },
  ) {
    return this.cases.classify(id, req.user.sub, dto);
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
