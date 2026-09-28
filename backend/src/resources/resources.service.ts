import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async listar() {
    const recursos = await this.prisma.recurso.findMany({
      include: { asignatura: true },
      orderBy: { createdAt: 'desc' },
    });
    return recursos.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      tipo: r.tipo.toLowerCase(),
      unidad: r.unidad,
      asignatura: r.asignatura.nombre,
    }));
  }
}
