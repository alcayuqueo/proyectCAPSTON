import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Layers,
  Loader2,
  Pencil,
  Play,
  Plus,
  Puzzle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { hoyISO, partesFecha } from '../lib/fechas';
import type { Clase } from '../lib/tipos';
import ConfirmDialog from '../components/ConfirmDialog';
import ChipAsignatura from '../components/ChipAsignatura';
import ClasesListas from '../components/ClasesListas';
import { temaDe } from '../lib/temas';

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
  // Pestañas: «Mis clases» o «Clases listas» (?vista=listas). Sin clases propias, se abre en «Clases listas».
  const [parametros, setParametros] = useSearchParams();
  const vistaUrl = parametros.get('vista');
  const vista: 'mias' | 'listas' =
    vistaUrl === 'listas' || vistaUrl === 'mias' ? vistaUrl : !cargando && clases.length === 0 && !error ? 'listas' : 'mias';
  const cambiarVista = (v: 'mias' | 'listas') => setParametros(v === 'mias' ? { vista: 'mias' } : { vista: 'listas' }, { replace: true });

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
          'group flex gap-4 rounded-card border-2 border-ink-900 bg-white shadow-sticker-sm p-4 transition-shadow hover:-translate-y-0.5',
          pasada ? 'opacity-75' : '',
        ].join(' ')}
      >
        {/* Fecha */}
        <div
          className={[
            'flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl border-2 py-2',
            pasada ? 'border-ink-300 bg-surface-muted text-ink-500' : 'border-ink-900',
          ].join(' ')}
          style={pasada ? undefined : { background: temaDe(c.asignatura.nombre).suave, color: temaDe(c.asignatura.nombre).oscuro }}
          aria-label={c.fecha}
        >
          <span className="text-[11px] font-medium uppercase">{f.diaSemana}</span>
          <span className="font-[Fredoka] text-2xl font-bold leading-tight">{f.dia}</span>
          <span className="text-[11px] uppercase">{f.mes}</span>
        </div>

        {/* Contenido */}
        <button
          onClick={() => navigate(`/planificador/${c.id}/editar`)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-[Fredoka] text-lg font-semibold text-ink-900">{c.titulo}</p>
          <p className="mt-1">
            <ChipAsignatura asignatura={c.asignatura.nombre} nivel={c.asignatura.nivel} />
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm text-ink-700">
            <span className="shrink-0 rounded-full border-2 border-ink-900 bg-sol px-2 py-0.5 text-xs font-extrabold text-ink-900">
              {c.objetivo.codigo}
            </span>
            <span className="line-clamp-1">{c.objetivo.descripcion}</span>
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
            {c.material && (
              <span className="flex items-center gap-1 font-bold text-ink-900">
                <Sparkles size={13} /> {c.material.diapositivas.length} diapositivas de contenido
              </span>
            )}
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
            to={`/planificador/${c.id}/presentar`}
            title="Presentar en la pantalla"
            aria-label={`Presentar ${c.titulo}`}
            className="flex items-center gap-1.5 rounded-full border-[2.5px] border-ink-900 bg-sol p-2 text-sm font-bold text-ink-900 hover:bg-[#FFD35A] sm:px-3 shadow-sticker-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Play size={16} />
            <span className="hidden sm:inline">Presentar</span>
          </Link>
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
          <h1 className="flex items-center gap-3 text-3xl font-bold text-ink-900">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-ink-900 shadow-sticker-sm" style={{ background: '#BFE6D0' }} aria-hidden="true">
              <CalendarDays size={22} />
            </span>
            Planificador
          </h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Tus clases y clases listas para proyectar en la sala.
          </p>
        </div>
        <Link
          to="/planificador/nueva"
          className="flex items-center gap-2 rounded-full border-[2.5px] border-ink-900 bg-sol px-4 py-2 text-sm font-bold text-ink-900 hover:bg-[#FFD35A] shadow-sticker-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Plus size={16} />
          Nueva clase
        </Link>
      </header>

      <div role="tablist" aria-label="Clases" className="flex w-full gap-1 rounded-full border-2 border-ink-900 bg-white p-1 shadow-sticker-sm sm:w-fit">
        {(
          [
            ['mias', 'Mis clases'],
            ['listas', 'Clases listas'],
          ] as const
        ).map(([v, texto]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={vista === v}
            onClick={() => cambiarVista(v)}
            className={[
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold transition-colors sm:flex-none',
              vista === v ? 'bg-sol text-ink-900' : 'text-ink-500 hover:text-ink-900',
            ].join(' ')}
          >
            {v === 'listas' && <Sparkles size={15} />}
            {texto}
            {v === 'mias' && !cargando && <span className="text-xs font-semibold opacity-70">({clases.length})</span>}
          </button>
        ))}
      </div>

      {aviso && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700"
        >
          <CheckCircle2 size={16} />
          {aviso}
        </p>
      )}

      {vista === 'listas' && (
        <ClasesListas
          onAgregada={(titulo) => {
            cargar();
            cambiarVista('mias');
            setAviso(`Se agregó «${titulo}» a tus clases.`);
          }}
        />
      )}

      {vista === 'mias' && error && (
        <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {vista === 'mias' && cargando && (
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 size={16} className="animate-spin" />
          Cargando tus clases…
        </p>
      )}

      {vista === 'mias' && !error && !cargando && clases.length === 0 && (
        <div className="rounded-card border-2 border-dashed border-ink-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-ink-900">Aún no tienes clases planificadas.</p>
          <p className="mt-1 text-sm text-ink-500">
            Elige una clase lista para empezar, o usa «Nueva clase» para armar la tuya.
          </p>
          <button
            type="button"
            onClick={() => cambiarVista('listas')}
            className="mx-auto mt-4 flex items-center gap-1.5 rounded-full border-[2.5px] border-ink-900 bg-sol px-4 py-2 text-sm font-bold text-ink-900 shadow-sticker-sm"
          >
            <Sparkles size={15} /> Ver clases listas
          </button>
        </div>
      )}

      {vista === 'mias' && proximas.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Próximas clases
          </h2>
          <ul className="flex flex-col gap-3">{proximas.map((c) => tarjeta(c))}</ul>
        </section>
      )}

      {vista === 'mias' && anteriores.length > 0 && (
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
