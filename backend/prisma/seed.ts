import { PrismaClient, TipoRecurso } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matematica5 = await prisma.asignatura.create({
    data: { nombre: 'Matemática', nivel: '5° básico' },
  });
  const ciencias5 = await prisma.asignatura.create({
    data: { nombre: 'Ciencias Naturales', nivel: '5° básico' },
  });

  await prisma.objetivo.createMany({
    data: [
      {
        codigo: 'OA05',
        descripcion:
          'Demostrar que comprenden las fracciones propias e impropias.',
        asignaturaId: matematica5.id,
      },
      {
        codigo: 'OA08',
        descripcion:
          'Resolver problemas rutinarios y no rutinarios que involucren las cuatro operaciones.',
        asignaturaId: matematica5.id,
      },
      {
        codigo: 'OA03',
        descripcion:
          'Investigar y explicar la estructura y función de los principales órganos de la nutrición humana.',
        asignaturaId: ciencias5.id,
      },
    ],
  });

  await prisma.recurso.createMany({
    data: [
      {
        titulo: 'Video: ¿Qué es una fracción?',
        tipo: TipoRecurso.VIDEO,
        unidad: 'Unidad 1 - Números',
        asignaturaId: matematica5.id,
      },
      {
        titulo: 'Guía interactiva: Sistema digestivo',
        tipo: TipoRecurso.DOCUMENTO,
        unidad: 'Unidad 2 - Cuerpo humano',
        asignaturaId: ciencias5.id,
      },
    ],
  });

  await prisma.actividad.createMany({
    data: [
      {
        titulo: 'Pizarra interactiva: ordenar fracciones',
        descripcion:
          'Los estudiantes arrastran fracciones a una recta numérica proyectada.',
        duracionMinutos: 15,
        asignaturaId: matematica5.id,
      },
      {
        titulo: 'Rotulado del sistema digestivo',
        descripcion:
          'Actividad grupal para identificar órganos en un diagrama interactivo.',
        duracionMinutos: 20,
        asignaturaId: ciencias5.id,
      },
    ],
  });

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
