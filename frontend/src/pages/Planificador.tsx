import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Puzzle,
  Trash2,
} from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { hoyISO, partesFecha } from '../lib/fechas';
import type { Clase } from '../lib/tipos';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Planificador() {
  const navigate = useNavigate();
  const location = useLocation();

  const [clases, setClases] = useState<Clase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(
    (location.state as { mensaje?: string } | null)?.mensaje ?? null,
  );
  const [porEliminar, setPorEliminar] = useState<Clase | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);

  const cargar = useCallback(() => {
    return api
      .get<Clase[]>('/planner')
      .then((res) => {
        setClases(res.data);
        setError(null);
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar tus clases.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // El aviso de éxito se oculta solo y no reaparece al recargar la página.
  useEffect(() => {
    if (!aviso) return;
    window.history.replaceState({}, '');
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const { proximas, anteriores } = useMemo(() => {
    const hoy = hoyISO();
    return {
      proximas: clases.filter((c) => c.fecha >= hoy),
      anteriores: clases.filter((c) => c.fecha < hoy).reverse(),
    };
  }, [clases]);

  async function duplicar(clase: Clase) {
    setDuplicandoId(clase.id);
    try {
      await api.post(`/planner/${clase.id}/duplicar`);
      await cargar();
      setAviso(`Se creó una copia de «${clase.titulo}».`);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo duplicar la clase.'));
    } finally {
      setDuplicandoId(null);
    }
  }

  async function confirmarEliminar() {
    if (!porEliminar) return;
    setEliminando(true);
    try {
      await api.delete(`/planner/${porEliminar.id}`);
      setClases((actuales) => actuales.filter((c) => c.id !== porEliminar.id));
      setAviso(`Se eliminó «${porEliminar.titulo}».`);
      setPorEliminar(null);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar la clase.'));
      setPorEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  const tarjeta = (c: Clase, pasada = false) => {
    const f = partesFecha(c.fecha);
    return (
      <li
        key={c.id}
        className={[
          'group flex gap-4 rounded-card border border-ink-300/20 bg-white p-4 transition-shadow hover:shadow-md',
          pasada ? 'opacity-75' : '',
        ].join(' ')}
      >
        {/* Fecha */}
        <div
          className={[
            'flex w-14 shrink-0 flex-col items-center justify-center rounded-lg py-2',
            pasada ? 'bg-surface-muted text-ink-500' : 'bg-brand-50 text-brand-700',
          ].join(' ')}
          aria-label={c.fecha}
        >
          <span className="text-[11px] font-medium uppercase">{f.diaSemana}</span>
          <span className="text-xl font-bold leading-tight">{f.dia}</span>
          <span className="text-[11px] uppercase">{f.mes}</span>
        </div>

        {/* Contenido */}
        <button
          onClick={() => navigate(`/planificador/${c.id}/editar`)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-semibold text-ink-900">{c.titulo}</p>
          <p className="text-xs text-ink-500">
            {c.asignatura.nombre} · {c.asignatura.nivel}
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm text-ink-700">
            <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {c.objetivo.codigo}
            </span>
            <span className="line-clamp-1">{c.objetivo.descripcion}</span>
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <Layers size={13} /> {c.recursos.length}{' '}
              {c.recursos.length === 1 ? 'recurso' : 'recursos'}
            </span>
            <span className="flex items-center gap-1">
              <Puzzle size={13} /> {c.actividades.length}{' '}
              {c.actividades.length === 1 ? 'actividad' : 'actividades'}
            </span>
            {c.duracionTotalMinutos > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={13} /> {c.duracionTotalMinutos} min
              </span>
            )}
          </p>
        </button>

        {/* Acciones */}
        <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-start">
          <Link
            to={`/planificador/${c.id}/editar`}
            title="Editar"
            aria-label={`Editar ${c.titulo}`}
            className="rounded-lg p-2 text-ink-500 hover:bg-surface-muted hover:text-ink-900"
          >
            <Pencil size={16} />
          </Link>
          <button
            onClick={() => duplicar(c)}
            disabled={duplicandoId === c.id}
            title="Duplicar"
            aria-label={`Duplicar ${c.titulo}`}
            className="rounded-lg p-2 text-ink-500 hover:bg-surface-muted hover:text-ink-900 disabled:opacity-60"
          >
            {duplicandoId === c.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Copy size={16} />
            )}
          </button>
          <button
            onClick={() => setPorEliminar(c)}
            title="Eliminar"
            aria-label={`Eliminar ${c.titulo}`}
            className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
            <CalendarDays size={22} className="text-brand-600" />
            Planificador
          </h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Combina objetivos, recursos y actividades en tu clase.
          </p>
        </div>
        <Link
          to="/planificador/nueva"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={16} />
          Nueva clase
        </Link>
      </header>

      {aviso && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700"
        >
          <CheckCircle2 size={16} />
          {aviso}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {cargando && (
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 size={16} className="animate-spin" />
          Cargando tus clases…
        </p>
      )}

      {!error && !cargando && clases.length === 0 && (
        <div className="rounded-card border border-dashed border-ink-300/40 bg-white px-6 py-12 text-center">
          <p className="font-medium text-ink-900">Aún no tienes clases planificadas.</p>
          <p className="mt-1 text-sm text-ink-500">
            Usa «Nueva clase» para armar tu primera planificación.
          </p>
        </div>
      )}

      {proximas.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Próximas clases
          </h2>
          <ul className="flex flex-col gap-3">{proximas.map((c) => tarjeta(c))}</ul>
        </section>
      )}

      {anteriores.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Clases anteriores
          </h2>
          <ul className="flex flex-col gap-3">{anteriores.map((c) => tarjeta(c, true))}</ul>
        </section>
      )}

      <ConfirmDialog
        abierto={!!porEliminar}
        titulo="¿Eliminar esta clase?"
        mensaje={`Se eliminará la planificación «${porEliminar?.titulo ?? ''}». Los recursos y actividades seguirán disponibles en tu biblioteca. Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        procesando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPorEliminar(null)}
      />
    </div>
  );
}
