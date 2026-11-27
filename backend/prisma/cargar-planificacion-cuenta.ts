/**
 * Agrega la planificación anual de ejemplo de 3° básico 2026 (la misma de la cuenta demo) a una
 * cuenta docente que YA EXISTE, por ejemplo la tuya.
 *
 * A diferencia de demo:cargar:
 *  - No crea la cuenta ni cambia su nombre ni su contraseña.
 *  - No borra las clases que la cuenta ya tiene: solo agrega.
 *  - Se puede ejecutar varias veces: si la cuenta ya tiene una clase del mismo OA en el mismo día,
 *    esa clase se salta, así que no se duplican.
 *
 * La planificación está en prisma/data/planificacion-demo-3basico.json (ver cargar-demo.ts).
 *
 * Uso (Git Bash, en backend/, con el .env apuntando a la base de datos):
 *   CUENTA_EMAIL="tu-correo@ejemplo.cl" npm run planificacion:cargar
 * Para quitarla después (borra solo las clases de ese archivo: mismo OA, mismo día y mismo título):
 *   CUENTA_EMAIL="tu-correo@ejemplo.cl" npm run planificacion:cargar -- --quitar
 */
import { PrismaClient } from '@prisma/client';
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

/** Clave de un día (AAAA-MM-DD) a partir de una fecha guardada. */
function dia(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

async function main() {
  const email = (process.env.CUENTA_EMAIL ?? '').trim().toLowerCase();
  if (!email) {
    throw new Error('Define CUENTA_EMAIL. Ej.: CUENTA_EMAIL="tu-correo@ejemplo.cl" npm run planificacion:cargar');
  }
  const quitar = process.argv.includes('--quitar');

  const docente = await prisma.usuario.findUnique({ where: { email } });
  if (!docente) throw new Error(`No existe una cuenta con el correo ${email}. Regístrate primero en la app.`);
  if (docente.rol !== 'DOCENTE') throw new Error(`${email} no es una cuenta docente; no se modifica.`);

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

  // Clases que la cuenta ya tiene, para no duplicar (y para poder quitarlas).
  const existentes = await prisma.plan.findMany({
    where: { docenteId: docente.id },
    select: { id: true, fecha: true, objetivoId: true, titulo: true },
  });
  const porClave = new Map<string, { id: string; titulo: string }[]>();
  for (const p of existentes) {
    const k = `${dia(p.fecha)}|${p.objetivoId}`;
    porClave.set(k, [...(porClave.get(k) ?? []), { id: p.id, titulo: p.titulo }]);
  }

  /** Título con el que el archivo crea cada clase (el tema de la clase lista, si tiene material). */
  const tituloDe = (c: ClaseDemo) => {
    const objetivo = objetivos.get(`${c.asignatura}|${c.nivel}|${c.codigo}`)!;
    const conMaterial = c.claseLista && !!objetivo.material?.tema;
    return { objetivo, conMaterial, titulo: (conMaterial ? objetivo.material!.tema! : c.titulo).slice(0, 120) };
  };

  if (quitar) {
    const ids: string[] = [];
    for (const c of datos.clases) {
      const { objetivo, titulo } = tituloDe(c);
      for (const p of porClave.get(`${c.fecha}|${objetivo.id}`) ?? []) {
        if (p.titulo === titulo) ids.push(p.id);
      }
    }
    const { count } = await prisma.plan.deleteMany({ where: { id: { in: ids }, docenteId: docente.id } });
    console.log(`Cuenta: ${email}. Se quitaron ${count} clases de la planificación de ejemplo.`);
    return;
  }

  let creadas = 0;
  let saltadas = 0;
  let listas = 0;
  for (const c of datos.clases) {
    const { objetivo, conMaterial, titulo } = tituloDe(c);
    if (porClave.has(`${c.fecha}|${objetivo.id}`)) {
      saltadas++;
      continue;
    }
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
      ? `${c.notas} Clase lista de EducaApp.${objetivo.material?.preparacion ? ` Preparar: ${objetivo.material.preparacion}` : ''}`
      : c.notas;
    await prisma.plan.create({
      data: {
        titulo,
        fecha: new Date(c.fecha),
        notas: notas.slice(0, 2000),
        usarMaterial: conMaterial,
        docenteId: docente.id,
        objetivoId: objetivo.id,
        recursos: { create: recursos.map((r, i) => ({ recursoId: r.id, orden: i })) },
        actividades: { create: actividades.map((a, i) => ({ actividadId: a.id, orden: i })) },
      },
    });
    creadas++;
  }

  console.log(`Cuenta: ${email}. Tus clases anteriores no se tocaron.`);
  console.log(`Se agregaron ${creadas} clases (${listas} con clase lista).${saltadas ? ` Se saltaron ${saltadas} que ya tenías.` : ''}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
