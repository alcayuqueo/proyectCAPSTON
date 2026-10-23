import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async listar() {
    const actividades = await this.prisma.actividad.findMany({
      include: { asignatura: true },
      orderBy: { createdAt: 'desc' },
    });
    return actividades.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      descripcion: a.descripcion,
      duracionMinutos: a.duracionMinutos,
      asignaturaId: a.asignaturaId,
      asignatura: a.asignatura.nombre,
      nivel: a.asignatura.nivel,
    }));
  }
}
