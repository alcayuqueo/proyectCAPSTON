import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlannerService {
  constructor(private prisma: PrismaService) {}

  async listarPorDocente(docenteId: string) {
    const planes = await this.prisma.plan.findMany({
      where: { docenteId },
      include: { objetivo: { include: { asignatura: true } } },
      orderBy: { fecha: 'asc' },
    });

    return planes.map((p) => ({
      id: p.id,
      fecha: p.fecha.toISOString().slice(0, 10),
      asignatura: p.objetivo.asignatura.nombre,
      objetivoCodigo: p.objetivo.codigo,
      notas: p.notas ?? '',
    }));
  }

  crear(docenteId: string, dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        fecha: new Date(dto.fecha),
        objetivoId: dto.objetivoId,
        notas: dto.notas,
        docenteId,
      },
    });
  }
}
