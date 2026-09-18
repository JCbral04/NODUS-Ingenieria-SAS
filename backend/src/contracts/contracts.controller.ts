import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

class CompleteItemDto {
  @IsOptional()
  @IsString()
  evidence?: string;
}

@ApiTags('contracts')
@Controller('cases/:id/contract')
export class ContractsController {
  constructor(private contracts: ContractsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('items')
  items(@Param('id', ParseIntPipe) id: number) {
    return this.contracts.items(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADVISORY', 'ADMIN')
  @Patch('items/:itemId')
  complete(@Param('itemId', ParseIntPipe) itemId: number, @Body() dto: CompleteItemDto) {
    return this.contracts.completeItem(itemId, dto.evidence);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADVISORY', 'ADMIN')
  @ApiOperation({ summary: 'Autoriza ejecución SOLO con checklist completo (RF-070)' })
  @Post('authorize')
  authorize(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { sub: number } }) {
    return this.contracts.authorize(id, req.user.sub);
  }
}