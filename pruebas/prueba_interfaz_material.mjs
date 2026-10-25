// Prueba de interfaz del material listo por OA (explorador, formulario de clase y modo
// presentación) con la API simulada. Usa el material real de backend/prisma/data.
// Uso (desde la raíz del repo, con el frontend compilado: cd frontend && npm run build):
//   npm install --no-save playwright && npx playwright install chromium
//   node pruebas/prueba_interfaz_material.mjs capturas_salida
// (Opcional: CHROMIUM_PATH=/ruta/a/chromium para usar otro navegador.)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const FE = fileURLToPath(new URL('../frontend', import.meta.url));
const DATA = fileURLToPath(new URL('../backend/prisma/data/', import.meta.url));
const OUT = process.argv[2] || 'capturas_material';
mkdirSync(OUT, { recursive: true });

// ---- Datos simulados a partir del material real
const matematica = JSON.parse(readFileSync(DATA + 'material-matematica.json', 'utf-8'));
const lenguaje = JSON.parse(readFileSync(DATA + 'material-lenguaje.json', 'utf-8'));
const fr = matematica.find((e) => e.nivel === '5° básico' && e.codigo === 'OA07');
const poemas = lenguaje.find((e) => e.nivel === '3° básico' && e.codigo === 'OA05');

const asignaturas = [
  { id: 'mat5', nombre: 'Matemática', nivel: '5° básico' },
  { id: 'len3', nombre: 'Lenguaje y Comunicación', nivel: '3° básico' },
];
const objetivos = [
  { id: 'o7', codigo: 'OA07', descripcion: 'Demostrar que comprenden las fracciones propias:\n• representándolas de manera concreta, pictórica y simbólica', eje: 'Números y Operaciones', asignaturaId: 'mat5', asignatura: 'Matemática', nivel: '5° básico', tema: fr.tema, tieneMaterial: true },
  { id: 'o8', codigo: 'OA08', descripcion: 'Demostrar que comprenden las fracciones impropias de uso común de denominadores 2, 3, 4, 5, 6, 8, 10, 12 y los números mixtos asociados.', eje: 'Números y Operaciones', asignaturaId: 'mat5', asignatura: 'Matemática', nivel: '5° básico', tema: null, tieneMaterial: false },
  { id: 'p5', codigo: 'OA05', descripcion: 'Comprender poemas adecuados al nivel e interpretar el lenguaje figurado presente en ellos.', eje: 'Lectura', asignaturaId: 'len3', asignatura: 'Lenguaje y Comunicación', nivel: '3° básico', tema: poemas.tema, tieneMaterial: true },
];
const video = (id, e, i, asig, oa) => ({ id, titulo: e.videos[i].titulo, tipo: 'video', url: e.videos[i].url, unidad: 'Números y Operaciones', asignaturaId: asig, asignatura: 'Matemática', nivel: '5° básico', objetivoId: oa, propio: false, usos: 0 });
const recursos = [
  { id: 'rg', titulo: 'Guía de ejercicios de fracciones', tipo: 'documento', url: null, unidad: 'Unidad 1', asignaturaId: 'mat5', asignatura: 'Matemática', nivel: '5° básico', objetivoId: null, propio: false, usos: 0 },
  video('rv1', fr, 0, 'mat5', 'o7'),
  video('rv2', fr, 1, 'mat5', 'o7'),
];
const actividades = [
  { id: 'ag', titulo: 'Pizarra interactiva: ordenar fracciones', descripcion: 'Los estudiantes arrastran fracciones a una recta numérica proyectada.', duracionMinutos: 15, asignaturaId: 'mat5', asignatura: 'Matemática', nivel: '5° básico', objetivoId: null, propio: false, usos: 0 },
  { id: 'as', ...fr.actividad, asignaturaId: 'mat5', asignatura: 'Matemática', nivel: '5° básico', objetivoId: 'o7', propio: false, usos: 0 },
];
const materialOa = {
  objetivo: { id: 'o7', codigo: 'OA07', descripcion: objetivos[0].descripcion, eje: 'Números y Operaciones', asignatura: 'Matemática', nivel: '5° básico' },
  tema: fr.tema, diapositivas: fr.diapositivas,
  recursos: recursos.slice(1).map(({ id, titulo, tipo, url, unidad }) => ({ id, titulo, tipo, url, unidad })),
  actividades: [actividades[1]].map(({ id, titulo, descripcion, duracionMinutos }) => ({ id, titulo, descripcion, duracionMinutos })),
};
const clase = (usarMaterial) => ({
  id: 'c1', titulo: fr.tema, fecha: '2026-10-30', notas: '', usarMaterial,
  material: usarMaterial ? { tema: fr.tema, diapositivas: fr.diapositivas } : null,
  objetivo: { id: 'o7', codigo: 'OA07', descripcion: objetivos[0].descripcion },
  asignatura: asignaturas[0],
  recursos: materialOa.recursos, actividades: materialOa.actividades, duracionTotalMinutos: fr.actividad.duracionMinutos,
});
let claseActual = clase(true);
let enviado = null;

// ---- Navegador y servidor
const srv = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { cwd: FE, stdio: 'ignore', shell: process.platform === 'win32' });
await new Promise((r) => setTimeout(r, 2500));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = `${b64({ alg: 'HS256' })}.${b64({ sub: 'u1', email: 'alex@duoc.cl', exp: Math.floor(Date.now() / 1000) + 3600 })}.x`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } : {});
const errores = [];
let ok = 0;
const fallas = [];
const chk = (c, m) => { if (c) ok++; else fallas.push(m); };

const MINIATURA = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#22303f"/><circle cx="160" cy="90" r="34" fill="#e33"/><path d="M150 72 L178 90 L150 108 Z" fill="#fff"/></svg>';
const REPRODUCTOR = '<html><head><meta charset="utf-8"></head><body style="margin:0;background:#22303f;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#cfd8e2"><div style="text-align:center"><div style="width:96px;height:68px;border-radius:18px;background:#e33;margin:0 auto 14px;display:flex;align-items:center;justify-content:center"><div style="border-left:26px solid #fff;border-top:16px solid transparent;border-bottom:16px solid transparent;margin-left:6px"></div></div>Video de YouTube<br><small>(en la app real se reproduce aquí)</small></div></body></html>';

async function nueva(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(([t]) => { localStorage.setItem('token', t); localStorage.setItem('usuario', JSON.stringify({ id: 'u1', email: 'alex@duoc.cl', nombre: 'Alex' })); }, [token]);
  await ctx.route('**/api/**', (r) => {
    const u = new URL(r.request().url());
    const ruta = u.pathname.replace(/^\/api/, '');
    if (ruta === '/curriculum/asignaturas') return r.fulfill({ json: asignaturas });
    if (ruta === '/curriculum/objetivos/o7/material') return r.fulfill({ json: materialOa });
    if (ruta === '/curriculum/objetivos') return r.fulfill({ json: objetivos });
    if (ruta === '/resources') return r.fulfill({ json: recursos });
    if (ruta === '/activities') return r.fulfill({ json: actividades });
    if (ruta === '/planner' && r.request().method() === 'POST') { enviado = r.request().postDataJSON(); return r.fulfill({ status: 201, json: claseActual }); }
    if (ruta === '/planner/c1') return r.fulfill({ json: claseActual });
    return r.fulfill({ json: [] });
  });
  await ctx.route('https://i.ytimg.com/**', (r) => r.fulfill({ contentType: 'image/svg+xml', body: MINIATURA }));
  await ctx.route('https://www.youtube-nocookie.com/**', (r) => r.fulfill({ contentType: 'text/html', body: REPRODUCTOR }));
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/youtube|ytimg|favicon/.test(m.text())) errores.push(m.text()); });
  return p;
}

let p;
try {
  // ---- 1. Explorador curricular
  p = await nueva(1280, 860);
  await p.goto('http://localhost:4174/curriculum');
  await p.getByText(`Material listo · ${fr.tema}`).waitFor();
  chk(await p.getByText('3 objetivos · 2 con material listo').isVisible(), 'contador con material');
  const buscar = await p.getByRole('link', { name: 'Buscar videos para este OA' }).getAttribute('href');
  chk(buscar?.startsWith('https://www.youtube.com/results?search_query=') && buscar.includes('5%C2%B0%20b%C3%A1sico'), 'enlace de búsqueda ' + buscar);
  await p.screenshot({ path: `${OUT}/01_explorador_material.png` });
  await p.getByLabel(/Solo OA con material listo/).check();
  chk((await p.getByRole('button', { name: 'Ver material' }).count()) === 2, 'filtro solo material');
  chk((await p.getByRole('link', { name: 'Buscar videos para este OA' }).count()) === 0, 'filtro oculta OA sin material');
  await p.getByRole('button', { name: 'Ver material' }).first().click();
  await p.getByRole('dialog').getByText('Preguntas para el curso').waitFor();
  chk(await p.getByRole('dialog').getByText(fr.diapositivas[1].texto ?? fr.diapositivas[1].puntos[0]).isVisible(), 'diapositivas en vista previa');
  chk(await p.getByRole('dialog').getByText(fr.actividad.titulo, { exact: false }).isVisible(), 'actividad en vista previa');
  chk((await p.getByRole('dialog').locator('img').count()) === 2, 'miniaturas de videos');
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/02_vista_previa_material.png` });

  // ---- 2. Crear clase con el material (desde el explorador)
  await p.getByRole('dialog').getByRole('link', { name: 'Crear clase con este material' }).click();
  await p.getByRole('heading', { name: 'Nueva clase' }).waitFor();
  chk((await p.locator('#titulo').inputValue()) === fr.tema, 'título con el tema');
  chk(await p.locator('input[name="objetivo"][value="o7"]').isChecked(), 'OA elegido');
  chk(await p.getByRole('button', { name: 'Videos y actividad agregados' }).isDisabled(), 'material ya agregado');
  chk((await p.getByText('Sugerido para este OA').count()) === 2, 'videos sugeridos marcados');
  await p.getByText(`Material listo: ${fr.tema}`).scrollIntoViewIfNeeded();
  await p.getByText(`Material listo: ${fr.tema}`).evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/03_formulario_material_listo.png` });
  await p.getByRole('button', { name: 'Crear clase' }).click();
  await p.waitForURL('**/planificador');
  chk(enviado?.objetivoId === 'o7' && enviado.usarMaterial === true, 'envía usarMaterial');
  chk(JSON.stringify(enviado?.recursoIds) === '["rv1","rv2"]' && JSON.stringify(enviado?.actividadIds) === '["as"]', 'envía videos y actividad ' + JSON.stringify(enviado));

  // ---- 3. Formulario: OA sin material y botón «Usar material sugerido»
  await p.goto('http://localhost:4174/planificador/nueva');
  await p.locator('#asignatura').selectOption('mat5');
  await p.locator('input[name="objetivo"][value="o8"]').check();
  chk(await p.getByText('Este OA aún no tiene material listo.').isVisible(), 'aviso sin material');
  chk((await p.getByRole('link', { name: 'Buscar videos para este OA' }).getAttribute('href'))?.includes('fracciones'), 'búsqueda con palabras del OA');
  await p.screenshot({ path: `${OUT}/04_formulario_sin_material.png` });
  await p.locator('input[name="objetivo"][value="o7"]').check();
  await p.getByRole('button', { name: 'Usar material sugerido' }).click();
  chk((await p.locator('#titulo').inputValue()) === fr.tema, 'usar material pone el título');
  chk(await p.getByRole('button', { name: 'Videos y actividad agregados' }).isVisible(), 'usar material agrega');
  await p.getByLabel('Mostrar las diapositivas de contenido en el modo presentación').uncheck();
  await p.getByRole('button', { name: 'Crear clase' }).click();
  await p.waitForURL('**/planificador');
  chk(enviado?.usarMaterial === false, 'desmarcar diapositivas');
  await p.context().close();

  // ---- 4. Modo presentación con material
  p = await nueva(1280, 720);
  await p.goto('http://localhost:4174/planificador/c1/presentar');
  await p.getByText('¡Hoy vamos a descubrir!').waitFor();
  chk(await p.getByText(`Aprendemos: ${fr.tema}`).isVisible(), 'agenda explicación');
  chk(await p.getByText('¡A pensar! 2 preguntas').isVisible(), 'agenda preguntas');
  // portada + 2 explicación + 2 videos + 2 preguntas + 1 actividad + cierre = 9
  chk((await p.getByText('1 / 9').count()) === 1, 'total de diapositivas');
  await p.screenshot({ path: `${OUT}/05_portada_con_material.png` });
  await p.keyboard.press('ArrowRight');
  await p.getByRole('heading', { name: fr.diapositivas[0].titulo }).waitFor();
  chk(await p.getByText('Aprendemos · 1 de 2').isVisible(), 'etiqueta explicación');
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/06_diapositiva_explicacion.png` });
  await p.keyboard.press('ArrowRight');
  await p.getByText('Ejemplo · 2 de 2').waitFor();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/07_diapositiva_ejemplo.png` });
  await p.keyboard.press('ArrowRight');
  await p.locator('iframe').waitFor();
  chk((await p.locator('iframe').getAttribute('src'))?.includes('/embed/7TshNkQIZxo'), 'video del material');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/08_video_material.png` });
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('ArrowRight');
  await p.getByText('¡A pensar! · Pregunta 1 de 2').waitFor();
  const preg = fr.diapositivas.find((d) => d.tipo === 'pregunta');
  await p.getByRole('button', { name: new RegExp(preg.puntos[1].replace('/', '\\/')) }).click();
  chk((await p.getByRole('button', { name: new RegExp(preg.puntos[1].replace('/', '\\/')) }).getAttribute('aria-pressed')) === 'true', 'marcar opción');
  await p.screenshot({ path: `${OUT}/09_pregunta.png` });
  await p.getByRole('button', { name: 'Ver respuesta' }).click();
  chk((await p.getByRole('status').textContent())?.includes(preg.respuesta), 'respuesta visible');
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/10_pregunta_respuesta.png` });
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('ArrowRight');
  await p.getByRole('heading', { name: fr.actividad.titulo }).waitFor();
  chk(true, 'actividad después de las preguntas');
  await p.context().close();

  // ---- 5. Celular y pantalla interactiva
  p = await nueva(390, 844);
  await p.goto('http://localhost:4174/planificador/c1/presentar');
  await p.getByText('¡Hoy vamos a descubrir!').waitFor();
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/11_celular_explicacion.png` });
  await p.keyboard.press('End'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft');
  await p.getByText('¡A pensar! · Pregunta 1 de 2').waitFor();
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/12_celular_pregunta.png` });
  await p.goto('http://localhost:4174/curriculum');
  await p.getByText(`Material listo · ${fr.tema}`).waitFor();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/13_celular_explorador.png` });
  await p.context().close();

  p = await nueva(1920, 1080);
  await p.goto('http://localhost:4174/planificador/c1/presentar');
  await p.getByText('¡Hoy vamos a descubrir!').waitFor();
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/14_pantalla_interactiva_explicacion.png` });
  await p.context().close();

  // ---- 6. Clase sin diapositivas de contenido (usarMaterial = false)
  claseActual = clase(false);
  p = await nueva(1280, 720);
  await p.goto('http://localhost:4174/planificador/c1/presentar');
  await p.getByText('¡Hoy vamos a descubrir!').waitFor();
  chk((await p.getByText('1 / 5').count()) === 1, 'sin material: 5 diapositivas');
  chk((await p.getByText(/Aprendemos:/).count()) === 0, 'sin material: sin explicación en agenda');
  await p.keyboard.press('ArrowRight');
  await p.locator('iframe').waitFor();
  chk(true, 'sin material: pasa directo al video');
  await p.context().close();
} catch (e) {
  fallas.push('excepción: ' + e.message.split('\n')[0]);
  await p?.screenshot({ path: `${OUT}/error.png` }).catch(() => {});
} finally {
  await browser.close();
  srv.kill();
}

chk(errores.length === 0, 'errores en consola: ' + errores.join(' | '));
console.log(`Prueba de interfaz del material: ${ok}/${ok + fallas.length} verificaciones correctas`);
if (fallas.length) { console.log('Fallas:\n- ' + fallas.join('\n- ')); process.exit(1); }
