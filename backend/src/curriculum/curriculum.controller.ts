import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';

@Controller('curriculum')
export class CurriculumController {
  constructor(private curriculumService: CurriculumService) {}

  /** Busca OA por palabra clave y, opcionalmente, por asignatura, nivel y eje. */
  @Get('objetivos')
  buscarObjetivos(
    @Query('q') q?: string,
    @Query('asignatura') asignatura?: string,
    @Query('nivel') nivel?: string,
    @Query('eje') eje?: string,
  ) {
    return this.curriculumService.buscarObjetivos({ q, asignatura, nivel, eje });
  }

  /** Material listo para usar del OA: diapositivas de contenido, videos y actividad sugerida. */
  @Get('objetivos/:id/material')
  obtenerMaterial(@Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string) {
    return this.curriculumService.obtenerMaterial(id);
  }

  /** Clase lista del OA (mismo formato que una clase del planificador). */
  @Get('objetivos/:id/clase')
  obtenerClaseLista(@Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string) {
    return this.curriculumService.obtenerClaseLista(id);
  }

  /** Galería de clases listas, filtrable por asignatura y nivel. */
  @Get('clases-listas')
  listarClasesListas(@Query('asignatura') asignatura?: string, @Query('nivel') nivel?: string) {
    return this.curriculumService.listarClasesListas({ asignatura, nivel });
  }

  @Get('asignaturas')
  listarAsignaturas() {
    return this.curriculumService.listarAsignaturas();
  }

  @Get('ejes')
  listarEjes(@Query('asignatura') asignatura?: string) {
    return this.curriculumService.listarEjes(asignatura);
  }
}
