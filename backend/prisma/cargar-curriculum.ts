/**
 * Carga los Objetivos de Aprendizaje oficiales de Matemática y Lenguaje y
 * Comunicación (1° a 6° básico) y algunas actividades de ejemplo.
 *
 * Fuente: Bases Curriculares Primero a Sexto Básico, MINEDUC (2018).
 * El texto de cada OA se extrajo del PDF oficial (ver prisma/data/oa-basica-1-6.json).
 *
 * Se puede ejecutar las veces que sea necesario: no duplica datos.
 *  - Si la asignatura y nivel ya existen, los reutiliza.
 *  - Si el OA ya existe (misma asignatura y código), actualiza su texto y eje.
 *  - Si la actividad de ejemplo ya existe (mismo título en la asignatura), la omite.
 *
 * Uso:  npm run curriculum:cargar
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface OaJson {
  asignatura: string;
  nivel: string;
  eje: string;
  codigo: string;
  descripcion: string;
}

interface ActividadJson {
  asignatura: string;
  nivel: string;
  titulo: string;
  descripcion: string;
  duracionMinutos: number;
}

const prisma = new PrismaClient();

function leer<T>(archivo: string): T {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', archivo), 'utf-8'));
}

/** Devuelve el id de la asignatura y nivel, creándola si no existe. */
async function obtenerAsignatura(cache: Map<string, string>, nombre: string, nivel: string) {
  const clave = `${nombre}|${nivel}`;
  const enCache = cache.get(clave);
  if (enCache) return enCache;

  const existente = await prisma.asignatura.findFirst({
    where: { nombre, nivel },
    orderBy: { id: 'asc' },
  });
  const id = existente
    ? existente.id
    : (await prisma.asignatura.create({ data: { nombre, nivel } })).id;
  cache.set(clave, id);
  return id;
}

/**
 * El seed inicial (prisma/seed.ts) creó dos OA de ejemplo de Matemática 5° básico con
 * códigos que no coinciden con las Bases Curriculares: "OA05" (fracciones) y "OA08"
 * (cuatro operaciones). En el currículum oficial, esos contenidos son el OA07 y el OA06.
 * Antes de cargar el texto oficial, las clases que usaban esos OA de ejemplo se pasan al
 * OA oficial equivalente, para que ninguna planificación cambie de contenido.
 */
const OA_DE_EJEMPLO = [
  {
    asignatura: 'Matemática',
    nivel: '5° básico',
    codigo: 'OA05',
    textoEjemplo: 'Demostrar que comprenden las fracciones propias e impropias.',
    codigoOficial: 'OA07',
  },
  {
    asignatura: 'Matemática',
    nivel: '5° básico',
    codigo: 'OA08',
    textoEjemplo:
      'Resolver problemas rutinarios y no rutinarios que involucren las cuatro operaciones.',
    codigoOficial: 'OA06',
  },
];

async function reubicarObjetivosDeEjemplo(objetivos: OaJson[], asignaturas: Map<string, string>) {
  for (const ej of OA_DE_EJEMPLO) {
    const asignatura = await prisma.asignatura.findFirst({
      where: { nombre: ej.asignatura, nivel: ej.nivel },
      orderBy: { id: 'asc' },
    });
    if (!asignatura) continue;
    const antiguo = await prisma.objetivo.findUnique({
      where: { asignaturaId_codigo: { asignaturaId: asignatura.id, codigo: ej.codigo } },
    });
    if (!antiguo || antiguo.descripcion !== ej.textoEjemplo) continue;

    const oficial = objetivos.find(
      (o) => o.asignatura === ej.asignatura && o.nivel === ej.nivel && o.codigo === ej.codigoOficial,
    );
    if (!oficial) continue;
    asignaturas.set(`${ej.asignatura}|${ej.nivel}`, asignatura.id);
    const destino = await prisma.objetivo.upsert({
      where: { asignaturaId_codigo: { asignaturaId: asignatura.id, codigo: oficial.codigo } },
      create: {
        asignaturaId: asignatura.id,
        codigo: oficial.codigo,
        descripcion: oficial.descripcion,
        eje: oficial.eje,
      },
      update: {},
    });
    const { count } = await prisma.plan.updateMany({
      where: { objetivoId: antiguo.id },
      data: { objetivoId: destino.id },
    });
    console.log(
      `${ej.asignatura} ${ej.nivel}: ${ej.codigo} de ejemplo → ${ej.codigoOficial} oficial (${count} clase(s) actualizadas)`,
    );
  }
}

async function main() {
  const { objetivos } = leer<{ objetivos: OaJson[] }>('oa-basica-1-6.json');
  const actividades = leer<ActividadJson[]>('actividades-ejemplo.json');
  const asignaturas = new Map<string, string>();

  await reubicarObjetivosDeEjemplo(objetivos, asignaturas);

  // Objetivos que ya están en la base, para informar cuántos son nuevos.
  const yaCargados = new Set(
    (await prisma.objetivo.findMany({ select: { asignaturaId: true, codigo: true } })).map(
      (o) => `${o.asignaturaId}|${o.codigo}`,
    ),
  );

  let nuevos = 0;
  let actualizados = 0;
  for (const oa of objetivos) {
    const asignaturaId = await obtenerAsignatura(asignaturas, oa.asignatura, oa.nivel);
    await prisma.objetivo.upsert({
      where: { asignaturaId_codigo: { asignaturaId, codigo: oa.codigo } },
      create: { asignaturaId, codigo: oa.codigo, descripcion: oa.descripcion, eje: oa.eje },
      update: { descripcion: oa.descripcion, eje: oa.eje },
    });
    if (yaCargados.has(`${asignaturaId}|${oa.codigo}`)) actualizados++;
    else nuevos++;
  }

  let actividadesNuevas = 0;
  for (const a of actividades) {
    const asignaturaId = await obtenerAsignatura(asignaturas, a.asignatura, a.nivel);
    const existe = await prisma.actividad.findFirst({ where: { asignaturaId, titulo: a.titulo } });
    if (existe) continue;
    await prisma.actividad.create({
      data: {
        asignaturaId,
        titulo: a.titulo,
        descripcion: a.descripcion,
        duracionMinutos: a.duracionMinutos,
      },
    });
    actividadesNuevas++;
  }

  console.log(`Asignaturas y niveles: ${asignaturas.size}`);
  console.log(`Objetivos de aprendizaje: ${nuevos} nuevos, ${actualizados} actualizados (total ${objetivos.length})`);
  console.log(`Actividades de ejemplo: ${actividadesNuevas} nuevas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
