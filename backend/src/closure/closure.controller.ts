import {
  Body,
  Controller,
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
import { ClosureService } from './closure.service';
import { AcceptClosureDto } from './dto/accept-closure.dto';
import { EvaluateClosureDto } from './dto/evaluate-closure.dto';
import { ReviewClosureDto } from './dto/review-closure.dto';
import { TechnicalClosureDto } from './dto/technical-closure.dto';

type RequestWithUser = {
  user: {
    sub: number;
    role: string;
  };
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cases/:caseId/closure')
export class ClosureController {
  constructor(private readonly closure: ClosureService) {}

  @Get()
  @Roles('ADMIN', 'ADVISORY', 'MIPYME', 'CONSULTOR')
  detail(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
  ) {
    return this.closure.detail(this.actor(req), caseId);
  }

  @Post()
  @Roles('CONSULTOR')
  technical(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: TechnicalClosureDto,
  ) {
    return this.closure.technical(this.actor(req), caseId, dto);
  }

  @Patch('review')
  @Roles('ADMIN', 'ADVISORY')
  review(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: ReviewClosureDto,
  ) {
    return this.closure.review(this.actor(req), caseId, dto);
  }

  @Post('delivery')
  @Roles('ADMIN', 'ADVISORY')
  delivery(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
  ) {
    return this.closure.delivery(this.actor(req), caseId);
  }

  @Post('accept')
  @Roles('MIPYME')
  accept(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: AcceptClosureDto,
  ) {
    return this.closure.accept(this.actor(req), caseId, dto);
  }

  @Post('evaluations')
  @Roles('ADMIN', 'ADVISORY', 'MIPYME')
  evaluate(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: EvaluateClosureDto,
  ) {
    return this.closure.evaluate(this.actor(req), caseId, dto);
  }

  @Post('close')
  @Roles('CONSULTOR')
  close(
    @Req() req: RequestWithUser,
    @Param('caseId', ParseIntPipe) caseId: number,
  ) {
    return this.closure.close(this.actor(req), caseId);
  }

  private actor(req: RequestWithUser) {
    return {
      userId: req.user.sub,
      role: req.user.role,
    };
  }
}