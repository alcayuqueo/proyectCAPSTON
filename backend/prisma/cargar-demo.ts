/**
 * Crea (o vuelve a crear) una cuenta docente de demostración con una planificación anual
 * completa de 3° básico, Matemática y Lenguaje y Comunicación, año escolar 2026.
 *
 * La planificación está en prisma/data/planificacion-demo-3basico.json y sigue:
 *  - Programas de Estudio 3° básico (MINEDUC): unidades, OA de cada unidad y horas
 *    («Visión global del año»), y en Lenguaje los objetivos para todas las unidades.
 *  - Plan de estudio 1° a 4° básico (Decreto 2960/2012): Lenguaje 8 h y Matemática 6 h semanales.
 *  - Calendario escolar 2026 de la Región Metropolitana: 4 de marzo a 4 de diciembre (JEC),
 *    vacaciones de invierno del 22 de junio al 3 de julio, sin clases en feriados.
 *
 * Se puede ejecutar las veces que sea necesario: si la cuenta ya existe, borra SOLO las clases
 * de esa cuenta y las vuelve a crear. No toca a otros docentes.
 *
 * Requisitos: haber cargado el currículum (npm run curriculum:cargar) y, para las clases
 * listas, el material (npm run material:cargar).
 *
 * Uso (Git Bash, en backend/, con el .env apuntando a la base de datos):
 *   DEMO_PASSWORD="una-clave-segura" npm run demo:cargar
 * Opcional: DEMO_EMAIL (por defecto demo.3basico@educapp.cl) y DEMO_NOMBRE.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

interface ClaseDemo {
  fecha: string; // AAAA-MM-DD
  asignatura: string;
  nivel: string;
  codigo: string;
  titulo: string;
  unidad: string;
  tipo: 'clase' | 'evaluacion' | 'transversal';
  notas: string;
  claseLista: boolean;
}

interface Material {
  tema?: string;
  preparacion?: string;
}

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.DEMO_EMAIL ?? 'demo.3basico@educapp.cl').trim().toLowerCase();
  const nombre = process.env.DEMO_NOMBRE ?? 'Docente Demo 3° básico';
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('Define DEMO_PASSWORD (mínimo 8 caracteres). Ej.: DEMO_PASSWORD="..." npm run demo:cargar');
  }

  const datos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'planificacion-demo-3basico.json'), 'utf-8')) as {
    clases: ClaseDemo[];
  };

  // OA de las asignaturas que usa la planificación.
  const objetivos = new Map<string, { id: string; material: Material | null }>();
  const pares = [...new Set(datos.clases.map((c) => `${c.asignatura}|${c.nivel}`))].map((x) => x.split('|'));
  for (const [asignatura, nivel] of pares) {
    const encontrada = await prisma.asignatura.findFirst({
      where: { nombre: asignatura, nivel },
      include: { objetivos: { select: { id: true, codigo: true, material: true } } },
    });
    if (!encontrada) throw new Error(`No existe ${asignatura} ${nivel}. Ejecuta antes: npm run curriculum:cargar`);
    for (const o of encontrada.objetivos) {
      objetivos.set(`${asignatura}|${nivel}|${o.codigo}`, { id: o.id, material: (o.material as Material | null) ?? null });
    }
  }
  for (const c of datos.clases) {
    if (!objetivos.has(`${c.asignatura}|${c.nivel}|${c.codigo}`)) {
      throw new Error(`Falta el ${c.codigo} de ${c.asignatura} ${c.nivel}. Ejecuta antes: npm run curriculum:cargar`);
    }
  }

  // Cuenta demo.
  const passwordHash = await bcrypt.hash(password, 10);
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente && existente.rol !== 'DOCENTE') throw new Error(`${email} no es una cuenta docente; no se modifica.`);
  const docente = existente
    ? await prisma.usuario.update({ where: { id: existente.id }, data: { nombre, passwordHash } })
    : await prisma.usuario.create({ data: { nombre, email, passwordHash } });

  const borradas = await prisma.plan.deleteMany({ where: { docenteId: docente.id } });

  let listas = 0;
  for (const c of datos.clases) {
    const objetivo = objetivos.get(`${c.asignatura}|${c.nivel}|${c.codigo}`)!;
    const conMaterial = c.claseLista && !!objetivo.material?.tema;
    let recursos: { id: string }[] = [];
    let actividades: { id: string }[] = [];
    if (conMaterial) {
      // Igual que «Agregar clase lista»: los recursos y actividades del catálogo para ese OA.
      [recursos, actividades] = await Promise.all([
        prisma.recurso.findMany({ where: { objetivoId: objetivo.id, autorId: null }, orderBy: { createdAt: 'asc' }, select: { id: true } }),
        prisma.actividad.findMany({ where: { objetivoId: objetivo.id, autorId: null }, orderBy: { createdAt: 'asc' }, select: { id: true } }),
      ]);
      listas++;
    }
    const notas = conMaterial
      ? `${c.notas} Clase lista de Educapp.${objetivo.material?.preparacion ? ` Preparar: ${objetivo.material.preparacion}` : ''}`
      : c.notas;
    await prisma.plan.create({
      data: {
        titulo: (conMaterial ? objetivo.material!.tema! : c.titulo).slice(0, 120),
        fecha: new Date(c.fecha),
        notas: notas.slice(0, 2000),
        usarMaterial: conMaterial,
        docenteId: docente.id,
        objetivoId: objetivo.id,
        recursos: { create: recursos.map((r, i) => ({ recursoId: r.id, orden: i })) },
        actividades: { create: actividades.map((a, i) => ({ actividadId: a.id, orden: i })) },
      },
    });
  }

  console.log(`Cuenta demo: ${email} (${existente ? 'actualizada' : 'creada'}).`);
  if (borradas.count) console.log(`Se borraron ${borradas.count} clases anteriores de esa cuenta.`);
  console.log(`Se crearon ${datos.clases.length} clases (${listas} con clase lista).`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
