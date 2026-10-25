/**
 * Material listo para usar de un OA: diapositivas de contenido que se muestran en el modo
 * presentación (explicación, ejemplo y preguntas para el curso), más videos y una actividad
 * sugerida que se guardan como recursos y actividades del catálogo vinculados al OA.
 *
 * El material se carga con `npm run material:cargar` desde prisma/data/material-*.json.
 */

export type TipoDiapositiva = 'concepto' | 'ejemplo' | 'pregunta';

export interface DiapositivaContenido {
  tipo: TipoDiapositiva;
  titulo: string;
  texto?: string;
  /** Viñetas (concepto y ejemplo) u opciones de respuesta (pregunta). */
  puntos?: string[];
  /** Solo en preguntas: se muestra al tocar «Ver respuesta». */
  respuesta?: string;
  emoji?: string;
}

/** Lo que se guarda en la columna Objetivo.material. */
export interface MaterialObjetivo {
  tema: string;
  diapositivas: DiapositivaContenido[];
}

/** Una entrada de los archivos prisma/data/material-*.json. */
export interface EntradaMaterial extends MaterialObjetivo {
  asignatura: string;
  nivel: string;
  codigo: string;
  videos: { titulo: string; url: string }[];
  actividad: { titulo: string; descripcion: string; duracionMinutos: number };
}

const TIPOS: TipoDiapositiva[] = ['concepto', 'ejemplo', 'pregunta'];
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
  if (d.tipo === 'pregunta') {
    if (!esTexto(d.respuesta)) errores.push(`${donde}: la pregunta no tiene respuesta`);
  } else if (d.respuesta !== undefined) {
    errores.push(`${donde}: solo las preguntas llevan respuesta`);
  }
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
  if (!Array.isArray(e.diapositivas) || e.diapositivas.length < 2 || e.diapositivas.length > 10) {
    errores.push(`${nombre}: debe tener entre 2 y 10 diapositivas`);
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
  const a = e.actividad;
  if (!a || !esTexto(a.titulo, 120) || !esTexto(a.descripcion, 1000) || !Number.isInteger(a.duracionMinutos) || a.duracionMinutos < 1 || a.duracionMinutos > 180) {
    errores.push(`${nombre}: la actividad sugerida no es válida`);
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
