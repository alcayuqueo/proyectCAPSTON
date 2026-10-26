import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, ClipboardList, Clock, Eye, Layers, Loader2, Play, Puzzle, Sparkles } from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { hoyISO } from '../lib/fechas';
import type { Clase, ClaseLista, DatosClase } from '../lib/tipos';
import ChipAsignatura from './ChipAsignatura';
import Modal from './Modal';
import VistaMaterial from './VistaMaterial';

const claseSelect =
  'w-full rounded-xl border-2 border-ink-300/70 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500';

const numeroNivel = (nivel: string) => parseInt(nivel, 10) || 0;

/**
 * Galería de clases listas para usar (una por cada OA con material): el docente puede
 * presentarla de inmediato, sin guardarla, o agregarla a sus clases eligiendo la fecha.
 */
export default function ClasesListas({ onAgregada }: { onAgregada: (titulo: string) => void }) {
  const [clases, setClases] = useState<ClaseLista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asignatura, setAsignatura] = useState('');
  const [nivel, setNivel] = useState('');
  const [detalle, setDetalle] = useState<ClaseLista | null>(null);
  const [porAgregar, setPorAgregar] = useState<ClaseLista | null>(null);

  useEffect(() => {
    api
      .get<ClaseLista[]>('/curriculum/clases-listas')
      .then((res) => setClases(res.data))
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar las clases listas.')))
      .finally(() => setCargando(false));
  }, []);

  const asignaturas = useMemo(() => [...new Set(clases.map((c) => c.asignatura))].sort((a, b) => a.localeCompare(b, 'es')), [clases]);
  const niveles = useMemo(
    () => [...new Set(clases.filter((c) => !asignatura || c.asignatura === asignatura).map((c) => c.nivel))].sort((a, b) => numeroNivel(a) - numeroNivel(b)),
    [clases, asignatura],
  );
  const visibles = clases.filter((c) => (!asignatura || c.asignatura === asignatura) && (!nivel || c.nivel === nivel));

  // Agrupadas por asignatura y nivel, en orden de nivel.
  const grupos = useMemo(() => {
    const mapa = new Map<string, ClaseLista[]>();
    for (const c of [...visibles].sort((a, b) => a.asignatura.localeCompare(b.asignatura, 'es') || numeroNivel(a.nivel) - numeroNivel(b.nivel))) {
      const clave = `${c.asignatura} · ${c.nivel}`;
      mapa.set(clave, [...(mapa.get(clave) ?? []), c]);
    }
    return [...mapa.entries()];
  }, [visibles]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-card border-2 border-ink-900 bg-white p-4 shadow-sticker-sm">
        <p className="flex items-start gap-2 text-sm text-ink-700">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-ink-900" />
          <span>
            Clases completas de unos 45 minutos, listas para proyectar: inicio, explicación, videos, práctica, preguntas,
            dos actividades y ticket de salida. Preséntalas tal cual o agrégalas a tus clases para editarlas.
          </span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            aria-label="Asignatura"
            value={asignatura}
            onChange={(e) => {
              setAsignatura(e.target.value);
              setNivel('');
            }}
            className={claseSelect}
          >
            <option value="">Todas las asignaturas</option>
            {asignaturas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select aria-label="Nivel" value={nivel} onChange={(e) => setNivel(e.target.value)} className={claseSelect}>
            <option value="">Todos los niveles</option>
            {niveles.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-ink-500" aria-live="polite">
          {cargando ? 'Cargando…' : `${visibles.length} clase${visibles.length === 1 ? '' : 's'} lista${visibles.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>}
      {cargando && (
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 size={16} className="animate-spin" /> Cargando clases listas…
        </p>
      )}
      {!cargando && !error && clases.length === 0 && (
        <p className="rounded-card border-2 border-dashed border-ink-300 bg-white px-6 py-10 text-center text-sm text-ink-500">
          Todavía no hay clases listas cargadas.
        </p>
      )}

      {grupos.map(([grupo, lista]) => (
        <section key={grupo}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">{grupo}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {lista.map((c) => (
              <li key={c.objetivoId} className="flex flex-col gap-3 rounded-card border-2 border-ink-900 bg-white p-4 shadow-sticker-sm">
                <div>
                  <p className="font-[Fredoka] text-lg font-semibold leading-tight text-ink-900">{c.tema}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <ChipAsignatura asignatura={c.asignatura} nivel={c.nivel} />
                    <span className="rounded-full border-2 border-ink-900 bg-sol px-2 py-0.5 font-extrabold text-ink-900">{c.codigo}</span>
                    {c.eje && <span className="rounded-full bg-surface-muted px-2 py-0.5 font-bold text-ink-700">{c.eje}</span>}
                  </div>
                </div>
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-500">
                  <span className="flex items-center gap-1 font-bold text-ink-900">
                    <Clock size={13} /> ~{c.duracionMinutos} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={13} /> {c.diapositivas} diapositivas
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers size={13} /> {c.videos} {c.videos === 1 ? 'video' : 'videos'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Puzzle size={13} /> {c.actividades} {c.actividades === 1 ? 'actividad' : 'actividades'}
                  </span>
                </p>
                {c.preparacion && (
                  <p className="flex items-start gap-1.5 text-xs text-ink-700">
                    <ClipboardList size={13} className="mt-0.5 shrink-0" />
                    <span>
                      <strong>Preparar:</strong> {c.preparacion}
                    </span>
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-2 text-sm">
                  <Link
                    to={`/clases-listas/${c.objetivoId}/presentar`}
                    className="flex items-center gap-1.5 rounded-full border-[2.5px] border-ink-900 bg-sol px-3.5 py-1.5 font-bold text-ink-900 shadow-sticker-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    <Play size={15} /> Presentar ahora
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPorAgregar(c)}
                    className="flex items-center gap-1.5 rounded-full border-2 border-ink-900 bg-white px-3.5 py-1.5 font-bold text-ink-900"
                  >
                    <CalendarPlus size={15} /> Agregar a mis clases
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetalle(c)}
                    aria-label={`Ver la clase ${c.tema}`}
                    className="flex items-center gap-1.5 rounded-full border-2 border-ink-300/70 bg-white px-3 py-1.5 font-semibold text-ink-700 hover:border-ink-900"
                  >
                    <Eye size={15} /> Ver
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Modal abierto={!!detalle} titulo={detalle ? `Clase lista · ${detalle.codigo}` : ''} onCerrar={() => setDetalle(null)}>
        {detalle && (
          <VistaMaterial
            objetivoId={detalle.objetivoId}
            accion={
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  to={`/clases-listas/${detalle.objetivoId}/presentar`}
                  className="flex items-center gap-1.5 rounded-full border-[2.5px] border-ink-900 bg-sol px-5 py-2.5 font-bold text-ink-900 shadow-sticker-sm"
                >
                  <Play size={16} /> Presentar ahora
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setPorAgregar(detalle);
                    setDetalle(null);
                  }}
                  className="flex items-center gap-1.5 rounded-full border-2 border-ink-900 bg-white px-5 py-2.5 font-bold text-ink-900"
                >
                  <CalendarPlus size={16} /> Agregar a mis clases
                </button>
              </div>
            }
          />
        )}
      </Modal>

      <AgregarClase
        clase={porAgregar}
        onCerrar={() => setPorAgregar(null)}
        onAgregada={(titulo) => {
          setPorAgregar(null);
          onAgregada(titulo);
        }}
      />
    </div>
  );
}

/** Ventana para copiar una clase lista a las clases del docente, eligiendo la fecha. */
function AgregarClase({
  clase,
  onCerrar,
  onAgregada,
}: {
  clase: ClaseLista | null;
  onCerrar: () => void;
  onAgregada: (titulo: string) => void;
}) {
  const [fecha, setFecha] = useState(hoyISO());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clase) {
      setFecha(hoyISO());
      setError(null);
    }
  }, [clase]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!clase) return;
    if (!fecha) {
      setError('Elige la fecha de la clase.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const { data: lista } = await api.get<Clase>(`/curriculum/objetivos/${clase.objetivoId}/clase`);
      const datos: DatosClase = {
        titulo: lista.titulo,
        fecha,
        objetivoId: lista.objetivo.id,
        notas: lista.notas ? `Preparar: ${lista.notas}` : '',
        usarMaterial: true,
        recursoIds: lista.recursos.map((r) => r.id),
        actividadIds: lista.actividades.map((a) => a.id),
      };
      await api.post('/planner', datos);
      onAgregada(lista.titulo);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo agregar la clase. Inténtalo de nuevo.'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal abierto={!!clase} titulo="Agregar a mis clases" onCerrar={onCerrar} bloqueado={guardando}>
      {clase && (
        <form onSubmit={guardar} className="flex flex-col gap-4 text-sm">
          <p className="text-ink-700">
            Se agregará «<strong>{clase.tema}</strong>» ({clase.asignatura} · {clase.nivel}) con sus diapositivas, videos y
            actividades. Después podrás editarla como cualquier clase.
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fecha-clase-lista" className="font-medium text-ink-700">
              Fecha de la clase
            </label>
            <input
              id="fecha-clase-lista"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border-2 border-ink-300/70 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            />
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCerrar} disabled={guardando} className="rounded-lg border border-ink-300/40 px-4 py-2 font-medium text-ink-700 hover:bg-surface-muted">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 rounded-full border-[2.5px] border-ink-900 bg-sol px-5 py-2 font-bold text-ink-900 shadow-sticker-sm disabled:opacity-70"
            >
              {guardando && <Loader2 size={15} className="animate-spin" />}
              {guardando ? 'Agregando…' : 'Agregar clase'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
