import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlannerService } from './planner.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

/** Planificaciones de clase. Todas las rutas exigen sesión y operan solo sobre las clases del docente. */
@Controller('planner')
@UseGuards(JwtAuthGuard)
export class PlannerController {
  constructor(private plannerService: PlannerService) {}

  @Get()
  listar(@Req() req: any) {
    return this.plannerService.listarPorDocente(req.user.userId);
  }

  @Get(':id')
  obtener(@Req() req: any, @Param('id') id: string) {
    return this.plannerService.obtener(req.user.userId, id);
  }

  @Post()
  crear(@Req() req: any, @Body() dto: CreatePlanDto) {
    return this.plannerService.crear(req.user.userId, dto);
  }

  @Patch(':id')
  actualizar(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plannerService.actualizar(req.user.userId, id, dto);
  }

  @Post(':id/duplicar')
  duplicar(@Req() req: any, @Param('id') id: string) {
    return this.plannerService.duplicar(req.user.userId, id);
  }

  @Delete(':id')
  eliminar(@Req() req: any, @Param('id') id: string) {
    return this.plannerService.eliminar(req.user.userId, id);
  }
}
