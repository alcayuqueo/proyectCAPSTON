import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { leerMaterial } from '../common/material';

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

    return objetivos.map((o) => {
      const material = leerMaterial(o.material);
      return {
        id: o.id,
        codigo: o.codigo,
        descripcion: o.descripcion,
        eje: o.eje,
        asignaturaId: o.asignaturaId,
        asignatura: o.asignatura.nombre,
        nivel: o.asignatura.nivel,
        /** Tema corto del OA (solo si tiene material listo). */
        tema: material?.tema ?? null,
        /** true si el OA tiene diapositivas, videos y actividad listos para usar. */
        tieneMaterial: material !== null,
      };
    });
  }

  /**
   * Material listo para usar de un OA: diapositivas de contenido y los videos y actividades
   * del catálogo sugeridos para él. Si el OA no tiene material, las listas vienen vacías.
   */
  async obtenerMaterial(id: string) {
    const objetivo = await this.prisma.objetivo.findUnique({
      where: { id },
      include: {
        asignatura: true,
        recursos: { where: { autorId: null }, orderBy: { createdAt: 'asc' } },
        actividades: { where: { autorId: null }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!objetivo) throw new NotFoundException('El objetivo de aprendizaje no existe.');
    const material = leerMaterial(objetivo.material);
    return {
      objetivo: {
        id: objetivo.id,
        codigo: objetivo.codigo,
        descripcion: objetivo.descripcion,
        eje: objetivo.eje,
        asignatura: objetivo.asignatura.nombre,
        nivel: objetivo.asignatura.nivel,
      },
      tema: material?.tema ?? null,
      diapositivas: material?.diapositivas ?? [],
      recursos: objetivo.recursos.map((r) => ({
        id: r.id,
        titulo: r.titulo,
        tipo: r.tipo.toLowerCase(),
        url: r.url,
        unidad: r.unidad,
      })),
      actividades: objetivo.actividades.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        descripcion: a.descripcion,
        duracionMinutos: a.duracionMinutos,
      })),
    };
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
