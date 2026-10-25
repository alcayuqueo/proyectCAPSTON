/**
 * Verifica que los videos del material listo sigan disponibles en YouTube y que se puedan
 * ver dentro de la app (incrustados). Usa el servicio público oEmbed de YouTube, que no
 * necesita clave:
 *   200 → disponible e incrustable
 *   401/403 → el autor no permite verlo incrustado (en la app solo se abriría en YouTube)
 *   404 → el video fue eliminado o es privado
 *
 * No necesita la base de datos. Uso:  npm run material:verificar
 */
import * as fs from 'fs';
import * as path from 'path';
import { EntradaMaterial } from '../src/common/material';

const ARCHIVOS = ['material-matematica.json', 'material-lenguaje.json'];

async function estado(url: string): Promise<number> {
  const consulta = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(consulta, { signal: AbortSignal.timeout(15_000) });
    return res.status;
  } catch {
    return 0;
  }
}

async function main() {
  const entradas = ARCHIVOS.flatMap(
    (a) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', a), 'utf-8')) as EntradaMaterial[],
  );
  const videos = entradas.flatMap((e) => e.videos.map((v) => ({ ...v, oa: `${e.asignatura} ${e.nivel} ${e.codigo}` })));
  const problemas: string[] = [];
  let disponibles = 0;

  // De a 5 a la vez, para no saturar el servicio.
  for (let i = 0; i < videos.length; i += 5) {
    const lote = videos.slice(i, i + 5);
    const estados = await Promise.all(lote.map((v) => estado(v.url)));
    lote.forEach((v, j) => {
      const s = estados[j];
      if (s === 200) disponibles++;
      else {
        const motivo =
          s === 401 || s === 403 ? 'no permite verse incrustado'
          : s === 404 ? 'eliminado o privado'
          : s === 0 ? 'sin respuesta (¿hay conexión a internet?)'
          : `respuesta ${s}`;
        problemas.push(`${v.oa} · ${v.titulo} · ${v.url} → ${motivo}`);
      }
    });
  }

  console.log(`Videos disponibles e incrustables: ${disponibles} de ${videos.length}`);
  if (problemas.length) {
    console.log(`\nRevisar (reemplazar la URL en prisma/data/material-*.json y volver a ejecutar npm run material:cargar):\n- ${problemas.join('\n- ')}`);
    process.exit(1);
  }
}

main();
