import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { CreateClassificationDto } from './dto/classification.dto';
import { ApplyDto } from './dto/apply.dto';
import { AssignDto } from './dto/assign.dto';
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADVISORY', 'ADMIN')
  @ApiOperation({ summary: 'Publicar caso CLASIFICADO en la bolsa interna (RF-026)' })
  @Post(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { sub: number } }) {
    return this.cases.publish(id, req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CONSULTOR')
  @ApiOperation({ summary: 'Bolsa interna: casos elegibles según especialidad y disponibilidad (RF-027/028)' })
  @Get('pool')
  pool(@Req() req: { user: { sub: number } }) {
    return this.cases.pool(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CONSULTOR')
  @ApiOperation({ summary: 'Postulación estructurada T3C (RF-029/030)' })
  @Post(':id/apply')
  apply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApplyDto,
    @Req() req: { user: { sub: number } },
  ) {
    return this.cases.apply(req.user.sub, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADVISORY', 'ADMIN')
  @ApiOperation({ summary: 'Postulaciones del caso con datos del consultor (RF-031)' })
  @Get(':id/applications')
  applications(@Param('id', ParseIntPipe) id: number) {
    return this.cases.applications(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADVISORY', 'ADMIN')
  @ApiOperation({ summary: 'Asignación del único responsable principal (RF-032/033/034)' })
  @Post(':id/assign')
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignDto,
    @Req() req: { user: { sub: number } },
  ) {
    return this.cases.assign(id, req.user.sub, dto.applicationId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Estado SLA del caso: OK / POR_VENCER / VENCIDO (RT-006–009)' })
  @Get(':id/sla')
  sla(@Param('id', ParseIntPipe) id: number) {
    return this.cases.slaStatus(id);
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
