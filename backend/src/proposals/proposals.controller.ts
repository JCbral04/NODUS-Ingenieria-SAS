import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ReviewProposalDto } from './dto/review-proposal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('proposals')
@Controller()
export class ProposalsController {
  constructor(private proposals: ProposalsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CONSULTOR')
  @ApiOperation({ summary: 'Propuesta TP4C estructurada versionada (único consultor responsable, RF-037–042)' })
  @Post('cases/:id/proposals')
  create(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateProposalDto, @Req() req: { user: { sub: number } }) {
    return this.proposals.create(req.user.sub, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('cases/:id/proposals')
  list(@Param('id', ParseIntPipe) id: number) {
    return this.proposals.list(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADVISORY', 'ADMIN')
  @ApiOperation({ summary: 'Revisión metodológica QA TP4H (RF-043–046): aprobada → PROPUESTA_LISTA_QA' })
  @Post('proposals/:id/review')
  review(@Param('id', ParseIntPipe) id: number, @Body() dto: ReviewProposalDto, @Req() req: { user: { sub: number } }) {
    return this.proposals.review(req.user.sub, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADVISORY', 'ADMIN')
  @ApiOperation({ summary: 'Envío formal al cliente (RF-055/056): requiere QA aprobado' })
  @Post('proposals/:id/send')
  send(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { sub: number } }) {
    return this.proposals.send(req.user.sub, id);
  }
}
