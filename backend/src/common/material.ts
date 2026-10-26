/**
 * Material listo para usar de un OA: una clase completa de 45 minutos. Las diapositivas de
 * contenido se muestran en el modo presentación (inicio, explicación, ejemplo, práctica,
 * preguntas y ticket de salida); los videos y las actividades se guardan como recursos y
 * actividades del catálogo vinculados al OA.
 *
 * El material se carga con `npm run material:cargar` desde prisma/data/material-*.json.
 */

/**
 * inicio: activación de conocimientos previos · concepto y ejemplo: explicación ·
 * practica: ejercicios con soluciones · pregunta: alternativas con respuesta ·
 * cierre: ticket de salida.
 */
export type TipoDiapositiva = 'inicio' | 'concepto' | 'ejemplo' | 'practica' | 'pregunta' | 'cierre';

export interface DiapositivaContenido {
  tipo: TipoDiapositiva;
  titulo: string;
  texto?: string;
  /** Viñetas, ejercicios (práctica), alternativas (pregunta) o preguntas del ticket (cierre). */
  puntos?: string[];
  /** Solo en práctica y preguntas: se muestra al tocar «Ver respuesta» o «Ver soluciones». */
  respuesta?: string;
  emoji?: string;
}

/** Lo que se guarda en la columna Objetivo.material. */
export interface MaterialObjetivo {
  tema: string;
  /** Qué preparar antes de la clase (solo para el docente). */
  preparacion?: string;
  diapositivas: DiapositivaContenido[];
}

/** Una entrada de los archivos prisma/data/material-*.json. */
export interface EntradaMaterial extends MaterialObjetivo {
  asignatura: string;
  nivel: string;
  codigo: string;
  videos: { titulo: string; url: string }[];
  actividades: { titulo: string; descripcion: string; duracionMinutos: number }[];
}

const TIPOS: TipoDiapositiva[] = ['inicio', 'concepto', 'ejemplo', 'practica', 'pregunta', 'cierre'];
const CON_RESPUESTA: TipoDiapositiva[] = ['practica', 'pregunta'];

/** Minutos estimados de las diapositivas y videos de una clase lista (inicio a cierre). */
export const MINUTOS_CONTENIDO = 20;
const MAX_TEXTO = 400;
const ID_YOUTUBE = /^[\w-]{11}$/;

const esTexto = (v: unknown, max = MAX_TEXTO): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;

/** Identificador del video si la URL es de YouTube (watch?v=, youtu.be o shorts). */
export function idVideoYoutube(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.replace(/^www\.|^m\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com') {
      id = u.pathname === '/watch' ? u.searchParams.get('v') : u.pathname.match(/^\/shorts\/([^/]+)/)?.[1] ?? null;
    }
    return id && ID_YOUTUBE.test(id) ? id : null;
  } catch {
    return null;
  }
}

function validarDiapositiva(d: any, donde: string): string[] {
  const errores: string[] = [];
  if (!d || typeof d !== 'object') return [`${donde}: no es un objeto`];
  if (!TIPOS.includes(d.tipo)) errores.push(`${donde}: tipo «${d.tipo}» no válido`);
  if (!esTexto(d.titulo, 200)) errores.push(`${donde}: falta el título o es muy largo`);
  if (d.texto !== undefined && !esTexto(d.texto)) errores.push(`${donde}: texto vacío o muy largo`);
  if (d.emoji !== undefined && !esTexto(d.emoji, 16)) errores.push(`${donde}: emoji no válido`);
  if (d.puntos !== undefined) {
    if (!Array.isArray(d.puntos) || d.puntos.length === 0 || d.puntos.length > 6 || !d.puntos.every((p: unknown) => esTexto(p, 200))) {
      errores.push(`${donde}: los puntos deben ser entre 1 y 6 textos`);
    }
  }
  if (CON_RESPUESTA.includes(d.tipo)) {
    if (!esTexto(d.respuesta)) errores.push(`${donde}: le falta la respuesta`);
  } else if (d.respuesta !== undefined) {
    errores.push(`${donde}: solo la práctica y las preguntas llevan respuesta`);
  }
  if (d.tipo === 'practica' && !d.puntos) errores.push(`${donde}: la práctica no tiene ejercicios`);
  if (d.tipo !== 'pregunta' && !d.texto && !d.puntos) errores.push(`${donde}: no tiene contenido`);
  return errores;
}

/** Revisa una entrada de material. Devuelve la lista de problemas (vacía si está bien). */
export function validarEntrada(e: any): string[] {
  const nombre = `${e?.asignatura} ${e?.nivel} ${e?.codigo}`;
  const errores: string[] = [];
  if (!esTexto(e?.asignatura) || !esTexto(e?.nivel) || !/^OA\d{2}$/.test(e?.codigo ?? '')) {
    return [`${nombre}: asignatura, nivel o código no válidos`];
  }
  if (!esTexto(e.tema, 80)) errores.push(`${nombre}: falta el tema`);
  if (e.preparacion !== undefined && !esTexto(e.preparacion, 300)) errores.push(`${nombre}: preparación vacía o muy larga`);
  if (!Array.isArray(e.diapositivas) || e.diapositivas.length < 2 || e.diapositivas.length > 12) {
    errores.push(`${nombre}: debe tener entre 2 y 12 diapositivas`);
  } else {
    e.diapositivas.forEach((d: any, i: number) => errores.push(...validarDiapositiva(d, `${nombre} diapositiva ${i + 1}`)));
  }
  if (!Array.isArray(e.videos) || e.videos.length === 0 || e.videos.length > 4) {
    errores.push(`${nombre}: debe tener entre 1 y 4 videos`);
  } else {
    for (const v of e.videos) {
      if (!esTexto(v?.titulo, 120)) errores.push(`${nombre}: video sin título`);
      if (!idVideoYoutube(v?.url ?? '')) errores.push(`${nombre}: la URL «${v?.url}» no es un video de YouTube`);
    }
  }
  if (!Array.isArray(e.actividades) || e.actividades.length === 0 || e.actividades.length > 3) {
    errores.push(`${nombre}: debe tener entre 1 y 3 actividades`);
  } else {
    e.actividades.forEach((a: any, i: number) => {
      if (!a || !esTexto(a.titulo, 120) || !esTexto(a.descripcion, 1000) || !Number.isInteger(a.duracionMinutos) || a.duracionMinutos < 1 || a.duracionMinutos > 180) {
        errores.push(`${nombre}: la actividad ${i + 1} no es válida`);
      }
    });
    const titulos = e.actividades.map((a: any) => a?.titulo);
    if (new Set(titulos).size !== titulos.length) errores.push(`${nombre}: hay actividades con el mismo título`);
  }
  return errores;
}

/**
 * Lee la columna Objetivo.material de forma defensiva: si el contenido no tiene la forma
 * esperada, se ignora (devuelve null) en vez de romper la presentación.
 */
export function leerMaterial(valor: unknown): MaterialObjetivo | null {
  if (!valor || typeof valor !== 'object') return null;
  const m = valor as Record<string, unknown>;
  if (!esTexto(m.tema, 80) || !Array.isArray(m.diapositivas)) return null;
  const diapositivas = m.diapositivas.filter(
    (d) => validarDiapositiva(d, '').length === 0,
  ) as DiapositivaContenido[];
  if (diapositivas.length === 0) return null;
  return {
    tema: m.tema,
    ...(esTexto(m.preparacion, 300) && { preparacion: m.preparacion }),
    diapositivas: diapositivas.map(({ tipo, titulo, texto, puntos, respuesta, emoji }) => ({
      tipo,
      titulo,
      ...(texto !== undefined && { texto }),
      ...(puntos !== undefined && { puntos }),
      ...(respuesta !== undefined && { respuesta }),
      ...(emoji !== undefined && { emoji }),
    })),
  };
}
