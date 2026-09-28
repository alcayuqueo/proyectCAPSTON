import { Controller, Get } from '@nestjs/common';
import { ResourcesService } from './resources.service';

@Controller('resources')
export class ResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  @Get()
  listar() {
    return this.resourcesService.listar();
  }
}
