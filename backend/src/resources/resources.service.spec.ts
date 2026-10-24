import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { PrismaFalso } from '../test/prisma-falso';

describe('ResourcesService', () => {
  let db: PrismaFalso;
  let servicio: ResourcesService;

  const nuevo = {
    titulo: 'Video: fracciones',
    tipo: 'video' as const,
    url: 'https://www.youtube.com/watch?v=abc',
    unidad: 'Unidad 2 · Fracciones',
    asignaturaId: 'mat3',
  };

  beforeEach(async () => {
    db = new PrismaFalso();
    servicio = new ResourcesService(db as any);
    // Un recurso del catálogo (sin autor)
    await db.recurso.create({
      data: { titulo: 'Guía del catálogo', tipo: 'DOCUMENTO', unidad: 'U1', asignaturaId: 'mat3' },
    });
  });

  it('crea un recurso propio del docente con el tipo en el formato de la API', async () => {
    const r = await servicio.crear('ana', nuevo);
    expect(r).toMatchObject({ titulo: 'Video: fracciones', tipo: 'video', propio: true, usos: 0 });
    expect(r.asignatura).toBe('Matemática');
    expect(db.recurso.filas.at(-1)).toMatchObject({ autorId: 'ana', tipo: 'VIDEO' });
  });

  it('guarda el enlace vacío como null', async () => {
    const r = await servicio.crear('ana', { ...nuevo, url: '' });
    expect(r.url).toBeNull();
  });

  it('rechaza una asignatura que no existe', async () => {
    await expect(servicio.crear('ana', { ...nuevo, asignaturaId: 'no-existe' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('sin sesión lista solo el catálogo', async () => {
    await servicio.crear('ana', nuevo);
    const lista = await servicio.listar(undefined);
    expect(lista.map((r) => r.titulo)).toEqual(['Guía del catálogo']);
    expect(lista[0].propio).toBe(false);
  });

  it('con sesión lista el catálogo y los propios, pero no los de otros docentes', async () => {
    await servicio.crear('ana', nuevo);
    await servicio.crear('beto', { ...nuevo, titulo: 'Recurso de Beto' });
    const titulos = (await servicio.listar('ana')).map((r) => r.titulo).sort();
    expect(titulos).toEqual(['Guía del catálogo', 'Video: fracciones']);
  });

  it('informa en cuántas clases se usa cada recurso', async () => {
    const r = await servicio.crear('ana', nuevo);
    db.usos[r.id] = 3;
    const lista = await servicio.listar('ana');
    expect(lista.find((x) => x.id === r.id)?.usos).toBe(3);
  });

  it('edita solo los campos enviados y permite quitar el enlace', async () => {
    const r = await servicio.crear('ana', nuevo);
    const editado = await servicio.actualizar('ana', r.id, { titulo: 'Nuevo título', url: '' });
    expect(editado).toMatchObject({ titulo: 'Nuevo título', url: null, unidad: nuevo.unidad });
  });

  it('no permite editar ni eliminar recursos del catálogo', async () => {
    const catalogo = db.recurso.filas[0];
    await expect(servicio.actualizar('ana', catalogo.id, { titulo: 'x' })).rejects.toThrow(
      ForbiddenException,
    );
    await expect(servicio.eliminar('ana', catalogo.id)).rejects.toThrow(ForbiddenException);
  });

  it('un docente no puede editar ni eliminar recursos de otro (responde como si no existiera)', async () => {
    const r = await servicio.crear('ana', nuevo);
    await expect(servicio.actualizar('beto', r.id, { titulo: 'x' })).rejects.toThrow(NotFoundException);
    await expect(servicio.eliminar('beto', r.id)).rejects.toThrow(NotFoundException);
    expect(db.recurso.filas).toHaveLength(2);
  });

  it('elimina un recurso propio', async () => {
    const r = await servicio.crear('ana', nuevo);
    await expect(servicio.eliminar('ana', r.id)).resolves.toEqual({ id: r.id });
    expect(db.recurso.filas).toHaveLength(1);
  });

  it('responde 404 si el recurso no existe', async () => {
    await expect(servicio.eliminar('ana', 'no-existe')).rejects.toThrow(NotFoundException);
  });
});
