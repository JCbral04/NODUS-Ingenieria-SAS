import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { OnboardingDto } from './dto/onboarding.dto';

@ApiTags('cases')
@Controller('cases')
export class CasesController {
  constructor(private cases: CasesService) {}

  @ApiOperation({ summary: 'Onboarding T1: empresa + contacto + caso en una transacción (RF-001…014)' })
  @Post()
  create(@Body() dto: OnboardingDto) {
    return this.cases.createWithOnboarding(dto);
  }
}
