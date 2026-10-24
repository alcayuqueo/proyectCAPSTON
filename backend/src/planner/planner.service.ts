import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { visiblesPara } from '../common/catalogo';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

// Relaciones que se cargan junto con cada planificación.
const INCLUDE_PLAN = {
  objetivo: { include: { asignatura: true } },
  recursos: { include: { recurso: true }, orderBy: { orden: 'asc' } },
  actividades: { include: { actividad: true }, orderBy: { orden: 'asc' } },
} satisfies Prisma.PlanInclude;

type PlanCompleto = Prisma.PlanGetPayload<{ include: typeof INCLUDE_PLAN }>;

@Injectable()
export class PlannerService {
  constructor(private prisma: PrismaService) {}

  /** Da a la planificación el formato que consume el frontend. */
  private formatear(p: PlanCompleto) {
    const actividades = p.actividades.map(({ actividad }) => ({
      id: actividad.id,
      titulo: actividad.titulo,
      descripcion: actividad.descripcion,
      duracionMinutos: actividad.duracionMinutos,
    }));
    return {
      id: p.id,
      titulo: p.titulo,
      fecha: p.fecha.toISOString().slice(0, 10),
      notas: p.notas ?? '',
      objetivo: {
        id: p.objetivo.id,
        codigo: p.objetivo.codigo,
        descripcion: p.objetivo.descripcion,
      },
      asignatura: {
        id: p.objetivo.asignatura.id,
        nombre: p.objetivo.asignatura.nombre,
        nivel: p.objetivo.asignatura.nivel,
      },
      recursos: p.recursos.map(({ recurso }) => ({
        id: recurso.id,
        titulo: recurso.titulo,
        tipo: recurso.tipo.toLowerCase(),
        url: recurso.url,
        unidad: recurso.unidad,
      })),
      actividades,
      duracionTotalMinutos: actividades.reduce((t, a) => t + a.duracionMinutos, 0),
    };
  }

  /** Busca una planificación del docente; si no existe o es de otro docente, responde 404. */
  private async buscarPropia(docenteId: string, id: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, docenteId },
      include: INCLUDE_PLAN,
    });
    if (!plan) {
      throw new NotFoundException('La clase no existe o no pertenece a tu cuenta.');
    }
    return plan;
  }

  /**
   * Verifica que el objetivo, los recursos y las actividades existan antes de guardar.
   * Los recursos y actividades deben ser del catálogo o del propio docente.
   */
  private async validarReferencias(docenteId: string, dto: {
    objetivoId?: string;
    recursoIds?: string[];
    actividadIds?: string[];
  }) {
    if (dto.objetivoId !== undefined) {
      const objetivo = await this.prisma.objetivo.findUnique({ where: { id: dto.objetivoId } });
      if (!objetivo) {
        throw new BadRequestException('El objetivo de aprendizaje seleccionado no existe.');
      }
    }
    if (dto.recursoIds?.length) {
      const unicos = [...new Set(dto.recursoIds)];
      const total = await this.prisma.recurso.count({
        where: { id: { in: unicos }, ...visiblesPara(docenteId) },
      });
      if (total !== unicos.length) {
        throw new BadRequestException('Alguno de los recursos seleccionados no existe.');
      }
    }
    if (dto.actividadIds?.length) {
      const unicas = [...new Set(dto.actividadIds)];
      const total = await this.prisma.actividad.count({
        where: { id: { in: unicas }, ...visiblesPara(docenteId) },
      });
      if (total !== unicas.length) {
        throw new BadRequestException('Alguna de las actividades seleccionadas no existe.');
      }
    }
  }

  private recursosAnidados(ids: string[] = []) {
    return [...new Set(ids)].map((recursoId, orden) => ({ recursoId, orden }));
  }

  private actividadesAnidadas(ids: string[] = []) {
    return [...new Set(ids)].map((actividadId, orden) => ({ actividadId, orden }));
  }

  async listarPorDocente(docenteId: string) {
    const planes = await this.prisma.plan.findMany({
      where: { docenteId },
      include: INCLUDE_PLAN,
      orderBy: [{ fecha: 'asc' }, { createdAt: 'asc' }],
    });
    return planes.map((p) => this.formatear(p));
  }

  async obtener(docenteId: string, id: string) {
    return this.formatear(await this.buscarPropia(docenteId, id));
  }

  async crear(docenteId: string, dto: CreatePlanDto) {
    await this.validarReferencias(docenteId, dto);
    const plan = await this.prisma.plan.create({
      data: {
        titulo: dto.titulo.trim(),
        fecha: new Date(dto.fecha),
        notas: dto.notas?.trim() || null,
        docenteId,
        objetivoId: dto.objetivoId,
        recursos: { create: this.recursosAnidados(dto.recursoIds) },
        actividades: { create: this.actividadesAnidadas(dto.actividadIds) },
      },
      include: INCLUDE_PLAN,
    });
    return this.formatear(plan);
  }

  async actualizar(docenteId: string, id: string, dto: UpdatePlanDto) {
    await this.buscarPropia(docenteId, id);
    await this.validarReferencias(docenteId, dto);
    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        titulo: dto.titulo?.trim(),
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        notas: dto.notas !== undefined ? dto.notas.trim() || null : undefined,
        objetivoId: dto.objetivoId,
        // Si se envía la lista, reemplaza por completo la anterior (y su orden).
        recursos: dto.recursoIds
          ? { deleteMany: {}, create: this.recursosAnidados(dto.recursoIds) }
          : undefined,
        actividades: dto.actividadIds
          ? { deleteMany: {}, create: this.actividadesAnidadas(dto.actividadIds) }
          : undefined,
      },
      include: INCLUDE_PLAN,
    });
    return this.formatear(plan);
  }

  async duplicar(docenteId: string, id: string) {
    const original = await this.buscarPropia(docenteId, id);
    const copia = await this.prisma.plan.create({
      data: {
        titulo: `${original.titulo} (copia)`.slice(0, 120),
        fecha: original.fecha,
        notas: original.notas,
        docenteId,
        objetivoId: original.objetivoId,
        recursos: {
          create: original.recursos.map((r) => ({ recursoId: r.recursoId, orden: r.orden })),
        },
        actividades: {
          create: original.actividades.map((a) => ({ actividadId: a.actividadId, orden: a.orden })),
        },
      },
      include: INCLUDE_PLAN,
    });
    return this.formatear(copia);
  }

  async eliminar(docenteId: string, id: string) {
    await this.buscarPropia(docenteId, id);
    await this.prisma.plan.delete({ where: { id } });
    return { id };
  }
}
