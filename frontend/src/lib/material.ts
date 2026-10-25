import type { Objetivo } from './tipos';

/** Palabras del OA que no ayudan a buscar videos (verbos de los OA y conectores). */
const PALABRAS_VACIAS = new Set(
  'demostrar que comprenden comprende describir aplicar identificar reconocer leer escribir resolver usar utilizar realizar construir desarrollar participar expresarse incorporar asistir habitualmente manera forma concreta pictórica simbólica representando usando mediante través para sobre como entre desde hasta según sus las los del una unos unas con por que y o de la el en a al se su lo e u'
    .split(' '),
);

/** Palabras clave del OA para buscar videos: el tema si tiene material; si no, su primera frase. */
export function palabrasClave(objetivo: Pick<Objetivo, 'descripcion' | 'tema'>): string {
  if (objetivo.tema) return objetivo.tema;
  const frase = objetivo.descripcion.split(/[:\n•(]/)[0];
  return frase
    .toLowerCase()
    .replace(/[.,;]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 2 && !PALABRAS_VACIAS.has(p))
    .slice(0, 6)
    .join(' ');
}

/**
 * Búsqueda de videos en YouTube para un OA (se abre en una pestaña nueva). Sirve como
 * sugerencia para los OA que aún no tienen material listo, o para encontrar más videos.
 */
export function urlBusquedaVideos(objetivo: Pick<Objetivo, 'descripcion' | 'tema' | 'nivel'>): string {
  const consulta = `${palabrasClave(objetivo)} ${objetivo.nivel} para niños`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(consulta)}`;
}
