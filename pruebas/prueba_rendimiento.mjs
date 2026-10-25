// Prueba de rendimiento de la API (carga con usuarios simultáneos). Versión en Node.js
// de prueba_rendimiento.py, para equipos sin Python. Requiere Node 18 o superior.
//
// Uso:   node pruebas/prueba_rendimiento.mjs                (contra producción, en Render)
//        API_URL=http://localhost:3000/api node pruebas/prueba_rendimiento.mjs   (contra local)
//
// Solo hace consultas de LECTURA (currículum, recursos y actividades): no crea ni modifica datos.
// Simula 1, 10, 25 y 50 docentes navegando a la vez y mide los tiempos de respuesta. Entre cada
// nivel espera 1 minuto, porque la API limita a 300 solicitudes por minuto por IP y todas las
// solicitudes de esta prueba salen del mismo equipo. Duración aproximada: 5 minutos.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = (process.env.API_URL || 'https://software-educativo-api.onrender.com/api').replace(/\/$/, '');
const NIVELES = [1, 10, 25, 50]; // docentes simultáneos
const SOLICITUDES_POR_NIVEL = 200; // menos de 300 por minuto (límite de la API por IP)
const PAUSA_ENTRE_NIVELES = Number(process.env.PAUSA ?? 61); // segundos
const OBJETIVO_P95_MS = 1000; // requisito: 95 % de las respuestas en menos de 1 s

const q = (o) => new URLSearchParams(o).toString();
// Lo que hace un docente al preparar una clase: explorar el currículum, buscar y revisar recursos y actividades.
const RECORRIDO = [
  '/curriculum/asignaturas',
  '/curriculum/objetivos?' + q({ asignatura: 'Matemática', nivel: '3° básico' }),
  '/curriculum/ejes?' + q({ asignatura: 'Matemática' }),
  '/curriculum/objetivos?' + q({ q: 'fracciones' }),
  '/curriculum/objetivos?' + q({ asignatura: 'Lenguaje y Comunicación', nivel: '5° básico', eje: 'Lectura' }),
  '/resources',
  '/activities',
];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(ruta, timeoutMs = 30_000) {
  const inicio = performance.now();
  let codigo = 0; // 0 = sin respuesta (tiempo agotado o conexión rechazada)
  try {
    const r = await fetch(API + ruta, { signal: AbortSignal.timeout(timeoutMs) });
    await r.arrayBuffer();
    codigo = r.status;
  } catch {
    /* sin respuesta */
  }
  return { codigo, ms: performance.now() - inicio };
}

function percentil(valores, p) {
  if (!valores.length) return 0;
  const v = [...valores].sort((a, b) => a - b);
  return v[Math.min(v.length - 1, Math.round((p / 100) * (v.length - 1)))];
}

async function despertar() {
  console.log('Despertando el servidor (puede tardar hasta 1 minuto)…');
  const inicio = performance.now();
  for (let i = 0; i < 12; i++) {
    const { codigo } = await pedir('/curriculum/asignaturas', 90_000);
    if (codigo === 200) {
      const seg = (performance.now() - inicio) / 1000;
      console.log(`  Servidor listo en ${seg.toFixed(1)} s\n`);
      return seg;
    }
    await esperar(5000);
  }
  console.error('El servidor no respondió. Revisa la dirección de la API o vuelve a intentarlo.');
  process.exit(1);
}

async function nivel(usuarios) {
  const rutas = Array.from({ length: SOLICITUDES_POR_NIVEL }, (_, i) => RECORRIDO[i % RECORRIDO.length]);
  const resultados = [];
  let siguiente = 0;
  const inicio = performance.now();
  // Cada "docente" toma la próxima consulta pendiente hasta que no queden.
  await Promise.all(
    Array.from({ length: usuarios }, async () => {
      while (siguiente < rutas.length) resultados.push(await pedir(rutas[siguiente++]));
    }),
  );
  const duracion = (performance.now() - inicio) / 1000;
  const ok = resultados.filter((r) => r.codigo === 200).map((r) => r.ms);
  return {
    usuarios,
    solicitudes: resultados.length,
    exitosas: ok.length,
    limitadas: resultados.filter((r) => r.codigo === 429).length,
    errores: resultados.filter((r) => r.codigo !== 200 && r.codigo !== 429).length,
    porSegundo: resultados.length / duracion,
    promedio: ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : 0,
    p50: percentil(ok, 50),
    p95: percentil(ok, 95),
    p99: percentil(ok, 99),
    maximo: ok.length ? Math.max(...ok) : 0,
  };
}

const ms = (x) => `${Math.round(x)} ms`;

console.log(`Prueba de rendimiento · ${API}\n`);
const arranque = await despertar();
for (const r of RECORRIDO) await pedir(r); // calentamiento: una vez cada consulta
const filas = [];
for (const [i, u] of NIVELES.entries()) {
  if (i) {
    console.log(`  (pausa de ${PAUSA_ENTRE_NIVELES} s para no superar el límite por minuto)`);
    await esperar(PAUSA_ENTRE_NIVELES * 1000);
  }
  console.log(`Nivel ${i + 1}/${NIVELES.length}: ${u} docente(s) simultáneo(s)…`);
  const f = await nivel(u);
  filas.push(f);
  console.log(
    `  ${f.exitosas}/${f.solicitudes} correctas · ${f.porSegundo.toFixed(1)} solicitudes/s · ` +
      `p50 ${ms(f.p50)} · p95 ${ms(f.p95)} · máx ${ms(f.maximo)}`,
  );
}

const fecha = new Date().toLocaleString('es-CL');
const tabla = [
  '| Docentes simultáneos | Correctas | Solicitudes/s | Promedio | p50 | p95 | p99 | Máximo | Errores |',
  '|---|---|---|---|---|---|---|---|---|',
  ...filas.map(
    (f) =>
      `| ${f.usuarios} | ${f.exitosas}/${f.solicitudes} | ${f.porSegundo.toFixed(1)} | ${ms(f.promedio)} | ${ms(f.p50)} | ` +
      `${ms(f.p95)} | ${ms(f.p99)} | ${ms(f.maximo)} | ${f.errores + f.limitadas} |`,
  ),
];
const cumple = filas.every((f) => f.p95 <= OBJETIVO_P95_MS && f.errores === 0);
const conclusion = `**Requisito (p95 < ${OBJETIVO_P95_MS} ms y sin errores con hasta ${NIVELES.at(-1)} docentes simultáneos):** ${cumple ? '✅ cumple' : '❌ no cumple'}`;
const md = [
  '# Resultado de la prueba de rendimiento\n',
  `- **Fecha:** ${fecha}`,
  `- **API:** \`${API}\``,
  `- **Arranque en frío (Render plan gratuito):** ${arranque.toFixed(1)} s`,
  `- **Solicitudes por nivel:** ${SOLICITUDES_POR_NIVEL}, repartidas entre ${RECORRIDO.length} consultas de lectura`,
  `- **Herramienta:** Node.js ${process.version}\n`,
  ...tabla,
  '',
  conclusion,
  '',
].join('\n');
const salida = join(dirname(fileURLToPath(import.meta.url)), 'resultado_rendimiento.md');
writeFileSync(salida, md, 'utf-8');
console.log('\n' + tabla.join('\n') + '\n\n' + conclusion);
console.log(`\nResultado guardado en ${salida}`);
