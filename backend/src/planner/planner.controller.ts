import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlannerService } from './planner.service';
import { CreatePlanDto } from './dto/create-plan.dto';

@Controller('planner')
@UseGuards(JwtAuthGuard)
export class PlannerController {
  constructor(private plannerService: PlannerService) {}

  @Get()
  listar(@Req() req: any) {
    return this.plannerService.listarPorDocente(req.user.userId);
  }

  @Post()
  crear(@Req() req: any, @Body() dto: CreatePlanDto) {
    return this.plannerService.crear(req.user.userId, dto);
  }
}
