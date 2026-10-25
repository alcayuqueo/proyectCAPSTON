import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import type { Asignatura, Objetivo } from '../lib/tipos';
import ChipAsignatura from '../components/ChipAsignatura';

const claseSelect =
  'w-full rounded-xl border-2 border-ink-300/70 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500';

/** Ordena "1° básico", "2° básico"… por número y no alfabéticamente. */
function numeroNivel(nivel: string) {
  return parseInt(nivel, 10) || 0;
}

export default function ExploradorCurricular() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [ejes, setEjes] = useState<string[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);

  const [asignatura, setAsignatura] = useState('');
  const [nivel, setNivel] = useState('');
  const [eje, setEje] = useState('');
  const [query, setQuery] = useState('');
  const [busqueda, setBusqueda] = useState(''); // query con retardo, para no consultar en cada tecla

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Asignatura[]>('/curriculum/asignaturas')
      .then((res) => setAsignaturas(res.data))
      .catch(() => {});
  }, []);

  // Ejes de la asignatura elegida (Números y Operaciones, Lectura, etc.).
  useEffect(() => {
    if (!asignatura) {
      setEjes([]);
      return;
    }
    api
      .get<string[]>('/curriculum/ejes', { params: { asignatura } })
      .then((res) => setEjes(res.data))
      .catch(() => setEjes([]));
  }, [asignatura]);

  useEffect(() => {
    const t = setTimeout(() => setBusqueda(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    api
      .get<Objetivo[]>('/curriculum/objetivos', {
        params: {
          q: busqueda || undefined,
          asignatura: asignatura || undefined,
          nivel: nivel || undefined,
          eje: eje || undefined,
        },
      })
      .then((res) => {
        setObjetivos(res.data);
        setError(null);
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar los objetivos.')))
      .finally(() => setLoading(false));
  }, [busqueda, asignatura, nivel, eje]);

  const nombresAsignatura = useMemo(
    () => [...new Set(asignaturas.map((a) => a.nombre))].sort((a, b) => a.localeCompare(b, 'es')),
    [asignaturas],
  );
  const niveles = useMemo(
    () =>
      [
        ...new Set(
          asignaturas.filter((a) => !asignatura || a.nombre === asignatura).map((a) => a.nivel),
        ),
      ].sort((a, b) => numeroNivel(a) - numeroNivel(b)),
    [asignaturas, asignatura],
  );

  const hayFiltros = Boolean(asignatura || nivel || eje || query);

  function cambiarAsignatura(nueva: string) {
    setAsignatura(nueva);
    setEje('');
    // Si el nivel elegido no existe en la nueva asignatura, se quita.
    if (nivel && !asignaturas.some((a) => a.nombre === nueva && a.nivel === nivel)) setNivel('');
  }

  function limpiar() {
    setAsignatura('');
    setNivel('');
    setEje('');
    setQuery('');
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-ink-900">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-ink-900 shadow-sticker-sm" style={{ background: '#C5D9FB' }} aria-hidden="true">
            <BookOpen size={22} />
          </span>
          Explorador curricular
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Objetivos de aprendizaje (OA) de las Bases Curriculares del MINEDUC. Filtra por
          asignatura, nivel y eje, o busca por palabra clave.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-card border-2 border-ink-900 bg-white shadow-sticker-sm p-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: fracciones, poemas, perímetro…"
            aria-label="Buscar por palabra clave"
            className="w-full rounded-xl border-2 border-ink-300/70 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            aria-label="Asignatura"
            value={asignatura}
            onChange={(e) => cambiarAsignatura(e.target.value)}
            className={claseSelect}
          >
            <option value="">Todas las asignaturas</option>
            {nombresAsignatura.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select
            aria-label="Nivel"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            className={claseSelect}
          >
            <option value="">Todos los niveles</option>
            {niveles.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select
            aria-label="Eje"
            value={eje}
            onChange={(e) => setEje(e.target.value)}
            disabled={!asignatura || ejes.length === 0}
            className={`${claseSelect} disabled:bg-surface-muted disabled:text-ink-300`}
          >
            <option value="">{asignatura ? 'Todos los ejes' : 'Elige una asignatura para ver ejes'}</option>
            {ejes.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span aria-live="polite">
            {loading ? 'Buscando…' : `${objetivos.length} objetivo${objetivos.length === 1 ? '' : 's'}`}
          </span>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiar}
              className="flex items-center gap-1 font-medium text-brand-700 hover:underline"
            >
              <X size={12} /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>
      )}

      {!error && !loading && objetivos.length === 0 && (
        <p className="text-sm text-ink-500">No hay objetivos que coincidan con tu búsqueda.</p>
      )}

      <ul className="flex flex-col gap-3">
        {objetivos.map((o) => (
          <li key={o.id} className="rounded-card border-2 border-ink-900 bg-white shadow-sticker-sm p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-full border-2 border-ink-900 bg-sol px-2.5 py-0.5 font-extrabold text-ink-900">{o.codigo}</span>
              {o.eje && (
                <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-bold text-ink-700">{o.eje}</span>
              )}
              <ChipAsignatura asignatura={o.asignatura} nivel={o.nivel} />
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-900">
              {o.descripcion}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-xs text-ink-500">
        Fuente: Bases Curriculares Primero a Sexto Básico, Ministerio de Educación de Chile (2018).
      </p>
    </div>
  );
}
