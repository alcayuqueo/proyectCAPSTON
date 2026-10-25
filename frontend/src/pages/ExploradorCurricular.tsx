import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, HelpCircle, Lightbulb, Loader2, Play, Plus, Search, Sparkles, X } from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { urlBusquedaVideos } from '../lib/material';
import { idYoutube } from '../lib/medios';
import type { Asignatura, MaterialOa, Objetivo } from '../lib/tipos';
import ChipAsignatura from '../components/ChipAsignatura';
import Modal from '../components/Modal';

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
  const [soloMaterial, setSoloMaterial] = useState(false);
  const [verMaterial, setVerMaterial] = useState<Objetivo | null>(null);

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

  const hayFiltros = Boolean(asignatura || nivel || eje || query || soloMaterial);
  const visibles = soloMaterial ? objetivos.filter((o) => o.tieneMaterial) : objetivos;
  const conMaterial = objetivos.filter((o) => o.tieneMaterial).length;

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
    setSoloMaterial(false);
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
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-ink-700">
          <input
            type="checkbox"
            checked={soloMaterial}
            onChange={(e) => setSoloMaterial(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          <Sparkles size={15} className="text-ink-900" />
          Solo OA con material listo (diapositivas, videos y actividad)
        </label>
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span aria-live="polite">
            {loading
              ? 'Buscando…'
              : `${visibles.length} objetivo${visibles.length === 1 ? '' : 's'}${!soloMaterial && conMaterial > 0 ? ` · ${conMaterial} con material listo` : ''}`}
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

      {!error && !loading && visibles.length === 0 && (
        <p className="text-sm text-ink-500">No hay objetivos que coincidan con tu búsqueda.</p>
      )}

      <ul className="flex flex-col gap-3">
        {visibles.map((o) => (
          <li key={o.id} className="rounded-card border-2 border-ink-900 bg-white shadow-sticker-sm p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-full border-2 border-ink-900 bg-sol px-2.5 py-0.5 font-extrabold text-ink-900">{o.codigo}</span>
              {o.eje && (
                <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-bold text-ink-700">{o.eje}</span>
              )}
              <ChipAsignatura asignatura={o.asignatura} nivel={o.nivel} />
              {o.tieneMaterial && (
                <span className="flex items-center gap-1 rounded-full bg-[#FFF6D6] px-2.5 py-0.5 font-bold text-ink-900 ring-1 ring-ink-900/20">
                  <Sparkles size={12} /> Material listo · {o.tema}
                </span>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-900">
              {o.descripcion}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {o.tieneMaterial && (
                <>
                  <button
                    type="button"
                    onClick={() => setVerMaterial(o)}
                    className="flex items-center gap-1.5 rounded-full border-2 border-ink-900 bg-sol px-3.5 py-1.5 font-bold text-ink-900 shadow-sticker-sm"
                  >
                    <Sparkles size={14} /> Ver material
                  </button>
                  <Link
                    to={`/planificador/nueva?objetivo=${o.id}`}
                    className="flex items-center gap-1.5 rounded-full border-2 border-ink-900 bg-white px-3.5 py-1.5 font-bold text-ink-900"
                  >
                    <Plus size={14} /> Crear clase con este material
                  </Link>
                </>
              )}
              <a
                href={urlBusquedaVideos(o)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border-2 border-ink-300/70 bg-white px-3.5 py-1.5 font-semibold text-ink-700 hover:border-ink-900"
              >
                <Search size={14} /> {o.tieneMaterial ? 'Más videos' : 'Buscar videos para este OA'}
              </a>
            </div>
          </li>
        ))}
      </ul>

      <Modal abierto={!!verMaterial} titulo={verMaterial ? `Material listo · ${verMaterial.codigo}` : ''} onCerrar={() => setVerMaterial(null)}>
        {verMaterial && <VistaMaterial objetivo={verMaterial} />}
      </Modal>

      <p className="text-xs text-ink-500">
        Fuente: Bases Curriculares Primero a Sexto Básico, Ministerio de Educación de Chile (2018).
      </p>
    </div>
  );
}

/** Vista previa del material listo de un OA: diapositivas, videos y actividad sugerida. */
function VistaMaterial({ objetivo }: { objetivo: Objetivo }) {
  const [material, setMaterial] = useState<MaterialOa | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<MaterialOa>(`/curriculum/objetivos/${objetivo.id}/material`)
      .then((res) => setMaterial(res.data))
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar el material.')));
  }, [objetivo.id]);

  if (error) return <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>;
  if (!material) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-500">
        <Loader2 size={16} className="animate-spin" /> Cargando material…
      </p>
    );
  }

  const explicacion = material.diapositivas.filter((d) => d.tipo !== 'pregunta');
  const preguntas = material.diapositivas.filter((d) => d.tipo === 'pregunta');
  return (
    <div className="flex flex-col gap-5 text-sm">
      <div>
        <p className="text-lg font-bold text-ink-900">{material.tema}</p>
        <p className="text-ink-500">
          {objetivo.asignatura} · {objetivo.nivel}
        </p>
      </div>

      <section>
        <h3 className="mb-2 flex items-center gap-1.5 font-bold text-ink-900">
          <Lightbulb size={15} /> Diapositivas de explicación
        </h3>
        <ol className="flex flex-col gap-2">
          {explicacion.map((d, i) => (
            <li key={i} className="rounded-xl bg-surface-muted p-3">
              <p className="font-semibold text-ink-900">
                {d.emoji} {d.titulo}
              </p>
              {d.texto && <p className="mt-1 text-ink-700">{d.texto}</p>}
              {d.puntos && (
                <ul className="mt-1 list-disc pl-5 text-ink-700">
                  {d.puntos.map((p, j) => (
                    <li key={j}>{p}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>

      {preguntas.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 font-bold text-ink-900">
            <HelpCircle size={15} /> Preguntas para el curso
          </h3>
          <ol className="flex flex-col gap-2">
            {preguntas.map((d, i) => (
              <li key={i} className="rounded-xl bg-surface-muted p-3">
                <p className="font-semibold text-ink-900">{d.titulo}</p>
                <p className="mt-1 text-emerald-800">Respuesta: {d.respuesta}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {material.recursos.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 font-bold text-ink-900">
            <Play size={15} /> Videos
          </h3>
          <ul className="flex flex-col gap-2">
            {material.recursos.map((r) => {
              const id = r.url ? idYoutube(r.url) : null;
              return (
                <li key={r.id}>
                  <a
                    href={r.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border-2 border-ink-300/40 p-2 hover:border-ink-900"
                  >
                    {id ? (
                      <img
                        src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        className="h-14 w-24 shrink-0 rounded-lg bg-ink-300/20 object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                        <Play size={18} />
                      </span>
                    )}
                    <span className="font-semibold text-ink-900">{r.titulo}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {material.actividades.map((a) => (
        <section key={a.id} className="rounded-xl border-2 border-ink-900 bg-[#FFF6D6] p-3">
          <p className="flex items-center justify-between gap-2 font-bold text-ink-900">
            Actividad sugerida: {a.titulo}
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-ink-700">
              <Clock size={12} /> {a.duracionMinutos} min
            </span>
          </p>
          <p className="mt-1 text-ink-700">{a.descripcion}</p>
        </section>
      ))}

      <Link
        to={`/planificador/nueva?objetivo=${objetivo.id}`}
        className="flex items-center justify-center gap-1.5 rounded-full border-[2.5px] border-ink-900 bg-sol px-5 py-2.5 font-bold text-ink-900 shadow-sticker-sm"
      >
        <Plus size={16} /> Crear clase con este material
      </Link>
    </div>
  );
}
