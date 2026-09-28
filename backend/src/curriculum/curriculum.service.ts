import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  async buscarObjetivos(query?: string) {
    const objetivos = await this.prisma.objetivo.findMany({
      where: query
        ? {
            OR: [
              { descripcion: { contains: query, mode: 'insensitive' } },
              { codigo: { contains: query, mode: 'insensitive' } },
              {
                asignatura: {
                  is: { nombre: { contains: query, mode: 'insensitive' } },
                },
              },
              {
                asignatura: {
                  is: { nivel: { contains: query, mode: 'insensitive' } },
                },
              },
            ],
          }
        : undefined,
      include: { asignatura: true },
      orderBy: { codigo: 'asc' },
    });

    return objetivos.map((o) => ({
      id: o.id,
      codigo: o.codigo,
      descripcion: o.descripcion,
      asignatura: o.asignatura.nombre,
      nivel: o.asignatura.nivel,
    }));
  }

  listarAsignaturas() {
    return this.prisma.asignatura.findMany();
  }
}
