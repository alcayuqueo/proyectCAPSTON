import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface FiltrosObjetivos {
  q?: string;
  asignatura?: string; // nombre, ej: "Matemática"
  nivel?: string; // ej: "3° básico"
  eje?: string; // ej: "Geometría"
}

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  async buscarObjetivos(filtros: FiltrosObjetivos = {}) {
    const { q, asignatura, nivel, eje } = filtros;
    const and: Prisma.ObjetivoWhereInput[] = [];

    if (asignatura) and.push({ asignatura: { is: { nombre: asignatura } } });
    if (nivel) and.push({ asignatura: { is: { nivel } } });
    if (eje) and.push({ eje });
    if (q?.trim()) {
      const texto = q.trim();
      and.push({
        OR: [
          { descripcion: { contains: texto, mode: 'insensitive' } },
          { codigo: { contains: texto, mode: 'insensitive' } },
          { eje: { contains: texto, mode: 'insensitive' } },
          { asignatura: { is: { nombre: { contains: texto, mode: 'insensitive' } } } },
          { asignatura: { is: { nivel: { contains: texto, mode: 'insensitive' } } } },
        ],
      });
    }

    const objetivos = await this.prisma.objetivo.findMany({
      where: and.length ? { AND: and } : undefined,
      include: { asignatura: true },
      orderBy: [
        { asignatura: { nombre: 'asc' } },
        { asignatura: { nivel: 'asc' } },
        { codigo: 'asc' },
      ],
    });

    return objetivos.map((o) => ({
      id: o.id,
      codigo: o.codigo,
      descripcion: o.descripcion,
      eje: o.eje,
      asignaturaId: o.asignaturaId,
      asignatura: o.asignatura.nombre,
      nivel: o.asignatura.nivel,
    }));
  }

  listarAsignaturas() {
    return this.prisma.asignatura.findMany({
      orderBy: [{ nombre: 'asc' }, { nivel: 'asc' }],
    });
  }

  /**
   * Ejes de una asignatura, en el orden en que aparecen en las Bases Curriculares
   * (el del primer OA de cada eje).
   */
  async listarEjes(asignatura?: string) {
    const objetivos = await this.prisma.objetivo.findMany({
      where: {
        eje: { not: null },
        ...(asignatura ? { asignatura: { is: { nombre: asignatura } } } : {}),
      },
      select: { eje: true, codigo: true },
      orderBy: { codigo: 'asc' },
    });
    return [...new Set(objetivos.map((o) => o.eje as string))];
  }
}
