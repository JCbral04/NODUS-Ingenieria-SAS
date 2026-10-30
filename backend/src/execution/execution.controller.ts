import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateActivityDto,
  UpdateActivityDto,
} from './dto/activity.dto';
import {
  CreateDeliverableDto,
  UpdateDeliverableDto,
} from './dto/deliverable.dto';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
} from './dto/incident.dto';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from './dto/milestone.dto';
import { ExecutionService } from './execution.service';

type RequestWithUser = {
  user: {
    sub: number;
    role: string;
  };
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ADVISORY', 'CONSULTOR')
@Controller('cases/:caseId')
export class ExecutionController {
  constructor(private readonly execution: ExecutionService) {}

  @Get('execution')
  overview(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
  ) {
    return this.execution.overview(this.actor(req), caseId);
  }

  @Get('activities')
  listActivities(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
  ) {
    return this.execution.listActivities(this.actor(req), caseId);
  }

  @Post('activities')
  @Roles('CONSULTOR')
  createActivity(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: CreateActivityDto,
  ) {
    return this.execution.createActivity(this.actor(req), caseId, dto);
  }

  @Patch('activities/:activityId')
  @Roles('CONSULTOR')
  updateActivity(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.execution.updateActivity(
      this.actor(req),
      caseId,
      activityId,
      dto,
    );
  }

  @Delete('activities/:activityId')
  @Roles('CONSULTOR')
  removeActivity(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.execution.removeActivity(
      this.actor(req),
      caseId,
      activityId,
    );
  }

  @Get('milestones')
  listMilestones(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
  ) {
    return this.execution.listMilestones(this.actor(req), caseId);
  }

  @Post('milestones')
  @Roles('CONSULTOR')
  createMilestone(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.execution.createMilestone(this.actor(req), caseId, dto);
  }

  @Patch('milestones/:milestoneId')
  @Roles('CONSULTOR')
  updateMilestone(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.execution.updateMilestone(
      this.actor(req),
      caseId,
      milestoneId,
      dto,
    );
  }

  @Delete('milestones/:milestoneId')
  @Roles('CONSULTOR')
  removeMilestone(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
  ) {
    return this.execution.removeMilestone(
      this.actor(req),
      caseId,
      milestoneId,
    );
  }

  @Get('deliverables')
  listDeliverables(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
  ) {
    return this.execution.listDeliverables(this.actor(req), caseId);
  }

  @Post('deliverables')
  @Roles('CONSULTOR')
  createDeliverable(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: CreateDeliverableDto,
  ) {
    return this.execution.createDeliverable(
      this.actor(req),
      caseId,
      dto,
    );
  }

  @Patch('deliverables/:deliverableId')
  @Roles('CONSULTOR')
  updateDeliverable(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Param('deliverableId', ParseIntPipe) deliverableId: number,
    @Body() dto: UpdateDeliverableDto,
  ) {
    return this.execution.updateDeliverable(
      this.actor(req),
      caseId,
      deliverableId,
      dto,
    );
  }

  @Delete('deliverables/:deliverableId')
  @Roles('CONSULTOR')
  removeDeliverable(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Param('deliverableId', ParseIntPipe) deliverableId: number,
  ) {
    return this.execution.removeDeliverable(
      this.actor(req),
      caseId,
      deliverableId,
    );
  }

  @Get('incidents')
  listIncidents(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
  ) {
    return this.execution.listIncidents(this.actor(req), caseId);
  }

  @Post('incidents')
  @Roles('CONSULTOR')
  createIncident(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: CreateIncidentDto,
  ) {
    return this.execution.createIncident(this.actor(req), caseId, dto);
  }

  @Patch('incidents/:incidentId')
  @Roles('CONSULTOR')
  updateIncident(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Param('incidentId', ParseIntPipe) incidentId: number,
    @Body() dto: UpdateIncidentDto,
  ) {
    return this.execution.updateIncident(
      this.actor(req),
      caseId,
      incidentId,
      dto,
    );
  }

  @Delete('incidents/:incidentId')
  @Roles('CONSULTOR')
  removeIncident(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Param('incidentId', ParseIntPipe) incidentId: number,
  ) {
    return this.execution.removeIncident(
      this.actor(req),
      caseId,
      incidentId,
    );
  }

  private actor(req: RequestWithUser) {
    return {
      userId: req.user.sub,
      role: req.user.role,
    };
  }
}