import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { PrismaFalso } from '../test/prisma-falso';

describe('ActivitiesService', () => {
  let db: PrismaFalso;
  let servicio: ActivitiesService;

  const nueva = {
    titulo: 'Recta numérica',
    descripcion: 'Ubicar fracciones en una recta proyectada.',
    duracionMinutos: 15,
    asignaturaId: 'mat3',
  };

  beforeEach(async () => {
    db = new PrismaFalso();
    servicio = new ActivitiesService(db as any);
    await db.actividad.create({
      data: { titulo: 'Actividad del catálogo', descripcion: 'd', duracionMinutos: 20, asignaturaId: 'len5' },
    });
  });

  it('crea una actividad propia del docente', async () => {
    const a = await servicio.crear('ana', nueva);
    expect(a).toMatchObject({ titulo: 'Recta numérica', duracionMinutos: 15, propio: true, usos: 0 });
    expect(a.nivel).toBe('3° básico');
  });

  it('rechaza una asignatura que no existe', async () => {
    await expect(servicio.crear('ana', { ...nueva, asignaturaId: 'zzz' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('con sesión lista el catálogo y las propias, sin las de otros docentes', async () => {
    await servicio.crear('ana', nueva);
    await servicio.crear('beto', { ...nueva, titulo: 'De Beto' });
    const lista = await servicio.listar('ana');
    expect(lista.map((a) => a.titulo).sort()).toEqual(['Actividad del catálogo', 'Recta numérica']);
    expect(lista.find((a) => a.titulo === 'Actividad del catálogo')?.propio).toBe(false);
  });

  it('edita la duración y la asignatura', async () => {
    const a = await servicio.crear('ana', nueva);
    const editada = await servicio.actualizar('ana', a.id, { duracionMinutos: 30, asignaturaId: 'len5' });
    expect(editada).toMatchObject({ duracionMinutos: 30, asignatura: 'Lenguaje y Comunicación' });
  });

  it('no permite modificar actividades del catálogo', async () => {
    const id = db.actividad.filas[0].id;
    await expect(servicio.actualizar('ana', id, { titulo: 'x' })).rejects.toThrow(ForbiddenException);
    await expect(servicio.eliminar('ana', id)).rejects.toThrow(ForbiddenException);
  });

  it('un docente no puede modificar actividades de otro', async () => {
    const a = await servicio.crear('ana', nueva);
    await expect(servicio.eliminar('beto', a.id)).rejects.toThrow(NotFoundException);
  });

  it('elimina una actividad propia', async () => {
    const a = await servicio.crear('ana', nueva);
    await servicio.eliminar('ana', a.id);
    expect(db.actividad.filas.map((x) => x.id)).not.toContain(a.id);
  });
});
