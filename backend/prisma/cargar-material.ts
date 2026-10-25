/**
 * Carga el material listo para usar de los OA (diapositivas de contenido, videos de YouTube
 * y una actividad sugerida por OA) desde prisma/data/material-matematica.json y
 * prisma/data/material-lenguaje.json.
 *
 * Requisito: haber cargado antes el currículum (npm run curriculum:cargar).
 *
 * Se puede ejecutar las veces que sea necesario: no duplica datos.
 *  - Las diapositivas del OA se reemplazan por las del archivo.
 *  - Los videos se identifican por su URL dentro de la asignatura: si ya existen en el
 *    catálogo, se actualiza su título y su OA; si no, se crean.
 *  - Los videos del catálogo que ya no están en el archivo se quitan del OA (se eliminan si
 *    ninguna clase los usa).
 *  - La actividad se identifica por su título dentro de la asignatura.
 *  - Solo se tocan elementos del catálogo (sin autor), nunca los creados por docentes.
 *
 * Uso:  npm run material:cargar
 */
import { PrismaClient, TipoRecurso } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { EntradaMaterial, validarEntrada } from '../src/common/material';

const ARCHIVOS = ['material-matematica.json', 'material-lenguaje.json'];

const prisma = new PrismaClient();

function leerEntradas(): EntradaMaterial[] {
  const entradas = ARCHIVOS.flatMap(
    (archivo) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', archivo), 'utf-8')) as EntradaMaterial[],
  );
  const errores = entradas.flatMap(validarEntrada);
  if (errores.length) {
    throw new Error(`El material tiene errores, no se cargó nada:\n- ${errores.join('\n- ')}`);
  }
  return entradas;
}

async function main() {
  const entradas = leerEntradas();
  let oas = 0;
  let videosNuevos = 0;
  let videosQuitados = 0;
  let actividadesNuevas = 0;
  const faltantes: string[] = [];

  for (const e of entradas) {
    const objetivo = await prisma.objetivo.findFirst({
      where: { codigo: e.codigo, asignatura: { is: { nombre: e.asignatura, nivel: e.nivel } } },
      orderBy: { id: 'asc' },
    });
    if (!objetivo) {
      faltantes.push(`${e.asignatura} ${e.nivel} ${e.codigo}`);
      continue;
    }

    await prisma.objetivo.update({
      where: { id: objetivo.id },
      data: { material: { tema: e.tema, diapositivas: e.diapositivas } as object },
    });
    oas++;

    for (const v of e.videos) {
      const existente = await prisma.recurso.findFirst({
        where: { asignaturaId: objetivo.asignaturaId, url: v.url, autorId: null },
      });
      const datos = { titulo: v.titulo, unidad: objetivo.eje ?? e.tema, objetivoId: objetivo.id };
      if (existente) {
        await prisma.recurso.update({ where: { id: existente.id }, data: datos });
      } else {
        await prisma.recurso.create({
          data: { ...datos, tipo: TipoRecurso.VIDEO, url: v.url, asignaturaId: objetivo.asignaturaId },
        });
        videosNuevos++;
      }
    }

    // Videos del catálogo que quedaron vinculados a este OA pero ya no están en el archivo
    // (por ejemplo, uno reemplazado): si ninguna clase los usa se eliminan; si no, solo se
    // desvinculan del OA para no cambiar las clases de los docentes.
    const sobrantes = await prisma.recurso.findMany({
      where: { objetivoId: objetivo.id, autorId: null, url: { notIn: e.videos.map((v) => v.url) } },
      include: { _count: { select: { planes: true } } },
    });
    for (const r of sobrantes) {
      if (r._count.planes === 0) await prisma.recurso.delete({ where: { id: r.id } });
      else await prisma.recurso.update({ where: { id: r.id }, data: { objetivoId: null } });
      videosQuitados++;
    }

    const a = e.actividad;
    const actividad = await prisma.actividad.findFirst({
      where: { asignaturaId: objetivo.asignaturaId, titulo: a.titulo, autorId: null },
    });
    const datosActividad = { descripcion: a.descripcion, duracionMinutos: a.duracionMinutos, objetivoId: objetivo.id };
    if (actividad) {
      await prisma.actividad.update({ where: { id: actividad.id }, data: datosActividad });
    } else {
      await prisma.actividad.create({
        data: { ...datosActividad, titulo: a.titulo, asignaturaId: objetivo.asignaturaId },
      });
      actividadesNuevas++;
    }
  }

  console.log(`OA con material listo: ${oas} de ${entradas.length}`);
  console.log(`Videos nuevos en el catálogo: ${videosNuevos}`);
  if (videosQuitados) console.log(`Videos reemplazados quitados del material: ${videosQuitados}`);
  console.log(`Actividades sugeridas nuevas: ${actividadesNuevas}`);
  if (faltantes.length) {
    console.warn(`No se encontraron estos OA (¿falta ejecutar npm run curriculum:cargar?):\n- ${faltantes.join('\n- ')}`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
