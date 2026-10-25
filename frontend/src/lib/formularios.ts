import { useEffect, useState } from 'react';
import type { Asignatura } from './tipos';

/** Clases de Tailwind para un campo de formulario, con borde rojo si tiene error. */
export function claseCampo(error?: string) {
  return [
    'w-full rounded-xl border-2 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors',
    error ? 'border-red-400 focus:border-red-500' : 'border-ink-300/70 focus:border-brand-500',
  ].join(' ');
}

/** Ordena por asignatura y luego por nivel (1° … 6°), no alfabéticamente. */
export function ordenarAsignaturas(lista: Asignatura[]) {
  return [...lista].sort(
    (a, b) =>
      a.nombre.localeCompare(b.nombre, 'es') || (parseInt(a.nivel, 10) || 0) - (parseInt(b.nivel, 10) || 0),
  );
}

/** Aviso de éxito que se oculta solo después de unos segundos. */
export function useAviso(duracionMs = 4000) {
  const [aviso, setAviso] = useState<string | null>(null);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), duracionMs);
    return () => clearTimeout(t);
  }, [aviso, duracionMs]);
  return [aviso, setAviso] as const;
}
