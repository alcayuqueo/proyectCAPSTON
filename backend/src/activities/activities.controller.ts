import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { CreateActividadDto, UpdateActividadDto } from './dto/actividad.dto';

/**
 * Actividades de clase. El listado es público (catálogo) y, con sesión, incluye las
 * actividades propias del docente. Crear, editar y eliminar exige sesión.
 */
@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  listar(@Req() req: any) {
    return this.activitiesService.listar(req.user?.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(@Req() req: any, @Body() dto: CreateActividadDto) {
    return this.activitiesService.crear(req.user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  actualizar(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateActividadDto) {
    return this.activitiesService.actualizar(req.user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  eliminar(@Req() req: any, @Param('id') id: string) {
    return this.activitiesService.eliminar(req.user.userId, id);
  }
}
