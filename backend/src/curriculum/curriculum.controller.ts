import { Controller, Get, Query } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';

@Controller('curriculum')
export class CurriculumController {
  constructor(private curriculumService: CurriculumService) {}

  @Get('objetivos')
  buscarObjetivos(@Query('q') q?: string) {
    return this.curriculumService.buscarObjetivos(q);
  }

  @Get('asignaturas')
  listarAsignaturas() {
    return this.curriculumService.listarAsignaturas();
  }
}
