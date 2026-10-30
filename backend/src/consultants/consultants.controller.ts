import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ConsultantsService } from './consultants.service';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { ListConsultantsDto } from './dto/list-consultants.dto';
import { UpdateConsultantStatusDto } from './dto/update-consultant-status.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('consultants')
export class ConsultantsController {
  constructor(private readonly consultants: ConsultantsService) {}

  @Post()
  @Roles('ADMIN', 'ADVISORY')
  create(
    @Req() req: { user: { sub: number } },
    @Body() dto: CreateConsultantDto,
  ) {
    return this.consultants.create(req.user.sub, dto);
  }

  @Get()
  @Roles('ADMIN', 'ADVISORY')
  list(@Query() dto: ListConsultantsDto) {
    return this.consultants.list(dto);
  }

  @Get('me')
  @Roles('CONSULTOR')
  me(@Req() req: { user: { sub: number } }) {
    return this.consultants.me(req.user.sub);
  }

  @Get(':id')
  @Roles('ADMIN', 'ADVISORY')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.consultants.detail(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ADVISORY')
  update(
    @Req() req: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConsultantDto,
  ) {
    return this.consultants.update(req.user.sub, id, dto);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'ADVISORY')
  updateStatus(
    @Req() req: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConsultantStatusDto,
  ) {
    return this.consultants.updateStatus(req.user.sub, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'ADVISORY')
  deactivate(
    @Req() req: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.consultants.deactivate(req.user.sub, id);
  }
}