import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TipoRecurso } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { verificarAutor, visiblesPara } from '../common/catalogo';
import { CreateRecursoDto, TipoRecursoApi, UpdateRecursoDto } from './dto/recurso.dto';

const NOMBRE = { singular: 'recurso', articulo: 'El', terminacion: 'o' } as const;

const INCLUDE = {
  asignatura: true,
  _count: { select: { planes: true } },
} satisfies Prisma.RecursoInclude;

type RecursoCompleto = Prisma.RecursoGetPayload<{ include: typeof INCLUDE }>;

const aTipoBd = (tipo: TipoRecursoApi) => tipo.toUpperCase() as TipoRecurso;

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  private formatear(r: RecursoCompleto, docenteId?: string | null) {
    return {
      id: r.id,
      titulo: r.titulo,
      tipo: r.tipo.toLowerCase(),
      url: r.url,
      unidad: r.unidad,
      asignaturaId: r.asignaturaId,
      asignatura: r.asignatura.nombre,
      nivel: r.asignatura.nivel,
      /** OA para el que se sugiere (material listo); null si sirve para toda la asignatura. */
      objetivoId: r.objetivoId ?? null,
      /** true si lo creó el docente con sesión (puede editarlo y eliminarlo). */
      propio: !!docenteId && r.autorId === docenteId,
      /** En cuántas clases se usa. */
      usos: r._count.planes,
    };
  }

  private async validarAsignatura(asignaturaId?: string) {
    if (asignaturaId === undefined || asignaturaId === null) return;
    const existe = await this.prisma.asignatura.findUnique({ where: { id: asignaturaId } });
    if (!existe) throw new BadRequestException('La asignatura seleccionada no existe.');
  }

  /** Recursos del catálogo y, si hay sesión, los propios del docente. */
  async listar(docenteId?: string | null) {
    const recursos = await this.prisma.recurso.findMany({
      where: visiblesPara(docenteId),
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return recursos.map((r) => this.formatear(r, docenteId));
  }

  async crear(docenteId: string, dto: CreateRecursoDto) {
    await this.validarAsignatura(dto.asignaturaId);
    const recurso = await this.prisma.recurso.create({
      data: {
        titulo: dto.titulo,
        tipo: aTipoBd(dto.tipo),
        url: dto.url || null,
        unidad: dto.unidad,
        asignaturaId: dto.asignaturaId,
        autorId: docenteId,
      },
      include: INCLUDE,
    });
    return this.formatear(recurso, docenteId);
  }

  async actualizar(docenteId: string, id: string, dto: UpdateRecursoDto) {
    verificarAutor(await this.prisma.recurso.findUnique({ where: { id } }), docenteId, NOMBRE);
    await this.validarAsignatura(dto.asignaturaId);
    const recurso = await this.prisma.recurso.update({
      where: { id },
      data: {
        ...(dto.titulo != null && { titulo: dto.titulo }),
        ...(dto.tipo != null && { tipo: aTipoBd(dto.tipo) }),
        // Enviar el enlace vacío lo quita.
        ...(dto.url !== undefined && { url: dto.url || null }),
        ...(dto.unidad != null && { unidad: dto.unidad }),
        ...(dto.asignaturaId != null && { asignaturaId: dto.asignaturaId }),
      },
      include: INCLUDE,
    });
    return this.formatear(recurso, docenteId);
  }

  /** Elimina el recurso; las clases que lo usaban simplemente dejan de incluirlo. */
  async eliminar(docenteId: string, id: string) {
    verificarAutor(await this.prisma.recurso.findUnique({ where: { id } }), docenteId, NOMBRE);
    await this.prisma.recurso.delete({ where: { id } });
    return { id };
  }
}
