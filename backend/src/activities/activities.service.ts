import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { verificarAutor, visiblesPara } from '../common/catalogo';
import { CreateActividadDto, UpdateActividadDto } from './dto/actividad.dto';

const NOMBRE = { singular: 'actividad', articulo: 'La', terminacion: 'a' } as const;

const INCLUDE = {
  asignatura: true,
  _count: { select: { planes: true } },
} satisfies Prisma.ActividadInclude;

type ActividadCompleta = Prisma.ActividadGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  private formatear(a: ActividadCompleta, docenteId?: string | null) {
    return {
      id: a.id,
      titulo: a.titulo,
      descripcion: a.descripcion,
      duracionMinutos: a.duracionMinutos,
      asignaturaId: a.asignaturaId,
      asignatura: a.asignatura.nombre,
      nivel: a.asignatura.nivel,
      /** true si la creó el docente con sesión (puede editarla y eliminarla). */
      propio: !!docenteId && a.autorId === docenteId,
      /** En cuántas clases se usa. */
      usos: a._count.planes,
    };
  }

  private async validarAsignatura(asignaturaId?: string) {
    if (asignaturaId === undefined || asignaturaId === null) return;
    const existe = await this.prisma.asignatura.findUnique({ where: { id: asignaturaId } });
    if (!existe) throw new BadRequestException('La asignatura seleccionada no existe.');
  }

  /** Actividades del catálogo y, si hay sesión, las propias del docente. */
  async listar(docenteId?: string | null) {
    const actividades = await this.prisma.actividad.findMany({
      where: visiblesPara(docenteId),
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return actividades.map((a) => this.formatear(a, docenteId));
  }

  async crear(docenteId: string, dto: CreateActividadDto) {
    await this.validarAsignatura(dto.asignaturaId);
    const actividad = await this.prisma.actividad.create({
      data: {
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        duracionMinutos: dto.duracionMinutos,
        asignaturaId: dto.asignaturaId,
        autorId: docenteId,
      },
      include: INCLUDE,
    });
    return this.formatear(actividad, docenteId);
  }

  async actualizar(docenteId: string, id: string, dto: UpdateActividadDto) {
    verificarAutor(await this.prisma.actividad.findUnique({ where: { id } }), docenteId, NOMBRE);
    await this.validarAsignatura(dto.asignaturaId);
    const actividad = await this.prisma.actividad.update({
      where: { id },
      data: {
        ...(dto.titulo != null && { titulo: dto.titulo }),
        ...(dto.descripcion != null && { descripcion: dto.descripcion }),
        ...(dto.duracionMinutos != null && { duracionMinutos: dto.duracionMinutos }),
        ...(dto.asignaturaId != null && { asignaturaId: dto.asignaturaId }),
      },
      include: INCLUDE,
    });
    return this.formatear(actividad, docenteId);
  }

  /** Elimina la actividad; las clases que la usaban simplemente dejan de incluirla. */
  async eliminar(docenteId: string, id: string) {
    verificarAutor(await this.prisma.actividad.findUnique({ where: { id } }), docenteId, NOMBRE);
    await this.prisma.actividad.delete({ where: { id } });
    return { id };
  }
}
