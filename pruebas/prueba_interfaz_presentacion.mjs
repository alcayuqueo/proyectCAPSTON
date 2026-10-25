// Prueba de interfaz del modo presentación (estilo lúdico) con la API simulada.
// Uso (desde la raíz del repo, con el frontend compilado: cd frontend && npm run build):
//   npm install --no-save playwright && npx playwright install chromium
//   node pruebas/prueba_interfaz_presentacion.mjs capturas_salida
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
const FE=fileURLToPath(new URL('../frontend', import.meta.url)), OUT=process.argv[2]||'capturas_presentacion';
mkdirSync(OUT,{recursive:true});
const srv=spawn('npx',['vite','preview','--port','4173','--strictPort'],{cwd:FE,stdio:'ignore',shell:process.platform==='win32'});
await new Promise(r=>setTimeout(r,2500));
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const token=`${b64({alg:'HS256'})}.${b64({sub:'u1',email:'alex@duoc.cl',exp:Math.floor(Date.now()/1000)+3600})}.x`;
const clase=(asig, nivel, extra={})=>({id:'c1',titulo:'Los órganos de la nutrición',fecha:'2026-10-30',notas:'',
 objetivo:{id:'o1',codigo:'OA03',descripcion:'Investigar y explicar la estructura y función de los principales órganos de la nutrición humana.'},
 asignatura:{id:'a1',nombre:asig,nivel},
 recursos:[{id:'r1',titulo:'El sistema digestivo',tipo:'video',url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',unidad:'Unidad: el cuerpo humano'},
           {id:'r2',titulo:'Principales órganos',tipo:'documento',url:'https://example.org/organos.pdf',unidad:'Unidad: el cuerpo humano'}],
 actividades:[{id:'t1',titulo:'Mapa del cuerpo',descripcion:'En parejas, dibujen la silueta de un compañero y ubiquen la boca, el estómago, el hígado y los intestinos. ¡Expliquen qué hace cada uno!',duracionMinutos:2}],
 duracionTotalMinutos:2,...extra});
let actual=clase('Ciencias Naturales','5° básico');
const browser=await chromium.launch();
const errores=[]; let ok=0, fallas=[];
const chk=(c,m)=>{ if(c) ok++; else fallas.push(m); };
async function nueva(w,h){
  const ctx=await browser.newContext({viewport:{width:w,height:h}});
  await ctx.addInitScript(([t])=>{localStorage.setItem('token',t);localStorage.setItem('usuario',JSON.stringify({id:'u1',email:'alex@duoc.cl',nombre:'Alex'}));},[token]);
  await ctx.route('**/api/**',r=>{const u=r.request().url();
    if(u.includes('/planner/c1')) return r.fulfill({json:actual});
    return r.fulfill({json:[]});});
  await ctx.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({contentType:'text/html',body:'<html><head><meta charset="utf-8"></head><body style="margin:0;background:#22303f;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#cfd8e2"><div style="text-align:center"><div style="width:96px;height:68px;border-radius:18px;background:#e33;margin:0 auto 14px;display:flex;align-items:center;justify-content:center"><div style="border-left:26px solid #fff;border-top:16px solid transparent;border-bottom:16px solid transparent;margin-left:6px"></div></div>Video de YouTube<br><small>(en la app real se reproduce aquí)</small></div></body></html>'}));
  const p=await ctx.newPage(); p.on('pageerror',e=>errores.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/youtube|example/.test(m.text()))errores.push(m.text())});
  return p;
}
const URL_CLASE='http://localhost:4173/planificador/c1/presentar';
// ---- Escritorio 1280x720 (Ciencias)
let p=await nueva(1280,720);
await p.goto(URL_CLASE); await p.getByText('¡Hoy vamos a descubrir!').waitFor();
await p.waitForTimeout(400);
await p.screenshot({path:`${OUT}/01_portada_ciencias.png`});
chk(await p.getByText('Nuestra meta · OA03').isVisible(),'meta visible');
chk(await p.getByRole('button',{name:/Comencemos/}).isVisible(),'boton comencemos');
await p.getByRole('button',{name:/Comencemos/}).click();
await p.getByRole('heading',{name:'El sistema digestivo'}).waitFor(); await p.waitForTimeout(600);
const src=await p.locator('iframe').getAttribute('src'); chk(src?.startsWith('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),'iframe src '+src);
await p.screenshot({path:`${OUT}/02_recurso_video.png`});
await p.keyboard.press('ArrowRight'); await p.getByRole('link',{name:/Abrir recurso/}).waitFor(); await p.waitForTimeout(500);
await p.screenshot({path:`${OUT}/03_recurso_enlace.png`});
await p.keyboard.press('ArrowRight'); await p.getByRole('heading',{name:'Mapa del cuerpo'}).waitFor();
chk((await p.getByRole('timer').textContent())==='02:00','timer inicial');
await p.screenshot({path:`${OUT}/04_actividad_lista.png`});
await p.getByRole('button',{name:'Iniciar'}).click(); await p.waitForTimeout(1300);
const t1=await p.getByRole('timer').textContent(); chk(t1==='01:59'||t1==='01:58','timer corre '+t1);
await p.getByRole('button',{name:'Sumar un minuto'}).click(); await p.waitForTimeout(300);
const t2=await p.getByRole('timer').textContent(); chk(t2.startsWith('02:5'),'+1 min '+t2);
await p.screenshot({path:`${OUT}/05_actividad_en_curso.png`});
await p.getByRole('button',{name:'Pausar'}).click(); chk(await p.getByText('En pausa').isVisible(),'pausa');
await p.getByRole('button',{name:'Reiniciar cronómetro'}).click(); chk((await p.getByRole('timer').textContent())==='02:00','reinicio');
// forzar fin: reloj del navegador
await p.clock?.install?.().catch(()=>{});
await p.keyboard.press('End'); await p.getByRole('heading',{name:'¡Lo logramos!'}).waitFor(); await p.waitForTimeout(300);
chk(await p.getByText('Recordemos nuestra meta · OA03').isVisible(),'cierre meta');
chk(await p.getByRole('button',{name:'Terminar'}).isVisible(),'terminar');
await p.screenshot({path:`${OUT}/07_cierre.png`});
await p.keyboard.press('Home'); chk(await p.getByText('¡Hoy vamos a descubrir!').isVisible(),'home');
await p.getByRole('button',{name:/Ir a la diapositiva 4/}).click(); chk(await p.getByRole('heading',{name:'Mapa del cuerpo'}).isVisible(),'puntos');
await p.context().close();
// ---- Tiempo cumplido con reloj simulado
p=await nueva(1280,720); await p.clock.install(); await p.goto(URL_CLASE); await p.getByText('¡Hoy vamos a descubrir!').waitFor();
await p.keyboard.press('End'); await p.keyboard.press('ArrowLeft'); await p.getByRole('button',{name:'Iniciar'}).click();
await p.clock.runFor(119_000); await p.waitForTimeout(100);
await p.clock.runFor(1500); await p.waitForTimeout(300);
chk(await p.getByText('¡Tiempo!').isVisible(),'tiempo cumplido');
await p.screenshot({path:`${OUT}/06_actividad_tiempo.png`});
await p.context().close();
// ---- Pantalla interactiva Full HD y colores de otras asignaturas
p=await nueva(1920,1080); await p.goto(URL_CLASE); await p.getByText('¡Hoy vamos a descubrir!').waitFor(); await p.waitForTimeout(300);
await p.screenshot({path:`${OUT}/08_pantalla_interactiva_1080p.png`});
actual=clase('Matemática','3° básico',{titulo:'Fracciones en la vida diaria',objetivo:{id:'o2',codigo:'OA11',descripcion:'Demostrar que comprenden las fracciones de uso común: 1/4, 1/3, 1/2, 2/3, 3/4.'}});
await p.goto(URL_CLASE); await p.getByText('¡Hoy vamos a descubrir!').waitFor(); await p.waitForTimeout(300);
await p.screenshot({path:`${OUT}/09_portada_matematica.png`});
actual=clase('Lenguaje y Comunicación','2° básico',{titulo:'Leemos un cuento',objetivo:{id:'o3',codigo:'OA05',descripcion:'Demostrar comprensión de las narraciones leídas.'}});
await p.goto(URL_CLASE); await p.getByText('¡Hoy vamos a descubrir!').waitFor(); await p.waitForTimeout(300);
await p.screenshot({path:`${OUT}/10_portada_lenguaje.png`});
await p.context().close();
// ---- Celular
actual=clase('Ciencias Naturales','5° básico');
p=await nueva(390,844); await p.goto(URL_CLASE); await p.getByText('¡Hoy vamos a descubrir!').waitFor(); await p.waitForTimeout(300);
chk(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'sin scroll horizontal movil');
await p.screenshot({path:`${OUT}/11_movil_portada.png`});
await p.keyboard.press('End'); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(300);
chk(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'sin scroll horizontal movil actividad');
await p.screenshot({path:`${OUT}/12_movil_actividad.png`});
// deslizar
await p.context().close();
await browser.close(); srv.kill();
console.log(`OK ${ok} · fallas ${fallas.length}`, fallas, 'errores consola', errores);
