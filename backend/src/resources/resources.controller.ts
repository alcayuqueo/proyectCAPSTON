import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ResourcesService } from './resources.service';
import { CreateRecursoDto, UpdateRecursoDto } from './dto/recurso.dto';

/**
 * Recursos educativos. El listado es público (catálogo) y, con sesión, incluye los
 * recursos propios del docente. Crear, editar y eliminar exige sesión.
 */
@Controller('resources')
export class ResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  listar(@Req() req: any) {
    return this.resourcesService.listar(req.user?.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(@Req() req: any, @Body() dto: CreateRecursoDto) {
    return this.resourcesService.crear(req.user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  actualizar(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRecursoDto) {
    return this.resourcesService.actualizar(req.user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  eliminar(@Req() req: any, @Param('id') id: string) {
    return this.resourcesService.eliminar(req.user.userId, id);
  }
}
