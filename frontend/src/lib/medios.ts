import type { TipoRecurso } from './tipos';

/**
 * Cómo mostrar un recurso dentro del modo presentación, según su enlace.
 * Solo se incrustan sitios conocidos (YouTube y Google Drive), armando la dirección
 * a partir del identificador del video o archivo; cualquier otro enlace se abre en
 * una pestaña nueva.
 */
export type Medio =
  | { tipo: 'youtube'; src: string }
  | { tipo: 'drive'; src: string }
  | { tipo: 'imagen'; src: string }
  | { tipo: 'video'; src: string }
  | { tipo: 'enlace'; href: string }
  | { tipo: 'sin-enlace' };

const ID_SEGURO = /^[\w-]{6,80}$/;

function leerUrl(texto: string): URL | null {
  try {
    const u = new URL(texto);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

/** Identificador de un video de YouTube (watch, youtu.be, shorts, embed o live). */
export function idYoutube(texto: string): string | null {
  const u = leerUrl(texto);
  if (!u) return null;
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([^/?#]+)/);
      id = m ? m[2] : null;
    }
  }
  return id && ID_SEGURO.test(id) ? id : null;
}

/** Identificador de un archivo de Google Drive (/file/d/ID/... u open?id=ID). */
export function idDrive(texto: string): string | null {
  const u = leerUrl(texto);
  if (!u || u.hostname !== 'drive.google.com') return null;
  const m = u.pathname.match(/^\/file\/d\/([^/]+)/);
  const id = m ? m[1] : u.searchParams.get('id');
  return id && ID_SEGURO.test(id) ? id : null;
}

export function medioDe(recurso: { tipo: TipoRecurso; url: string | null }): Medio {
  if (!recurso.url) return { tipo: 'sin-enlace' };
  const u = leerUrl(recurso.url);
  if (!u) return { tipo: 'sin-enlace' };

  const yt = idYoutube(recurso.url);
  if (yt) return { tipo: 'youtube', src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0` };

  const drive = idDrive(recurso.url);
  if (drive) return { tipo: 'drive', src: `https://drive.google.com/file/d/${drive}/preview` };

  const ruta = u.pathname.toLowerCase();
  if (recurso.tipo === 'imagen' || /\.(png|jpe?g|gif|webp|svg)$/.test(ruta)) {
    return { tipo: 'imagen', src: u.href };
  }
  if (/\.(mp4|webm|ogg)$/.test(ruta)) return { tipo: 'video', src: u.href };
  return { tipo: 'enlace', href: u.href };
}
