import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileSpreadsheet,
  LayoutGrid,
  Loader2,
  Pencil,
  Play,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { fechaLarga, hoyISO } from '../lib/fechas';
import { temaDe } from '../lib/temas';
import type { Clase, ClaseLista } from '../lib/tipos';
import ChipAsignatura from '../components/ChipAsignatura';
import Modal from '../components/Modal';
import { agregarClaseLista } from '../components/ClasesListas';
import { useAuth } from '../context/AuthContext';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const claseCampo =
  'w-full rounded-xl border-2 border-ink-300/70 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500';

/** AAAA-MM-DD de una fecha local. */
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MESES = Array.from({ length: 12 }, (_, i) => i);

/** «Marzo» a partir del número de mes (0 = enero). */
function nombreDelMes(anio: number, mes: number): string {
  const n = new Date(anio, mes, 1, 12).toLocaleDateString('es-CL', { month: 'long' });
  return `${n.charAt(0).toUpperCase()}${n.slice(1)}`;
}

/** AAAA-MM de un mes (0 = enero). */
const claveMes = (anio: number, mes: number) => `${anio}-${String(mes + 1).padStart(2, '0')}`;

/** Los días que muestra la cuadrícula del mes: de lunes a domingo, semanas completas. */
function diasDelMes(anio: number, mes: number): Date[] {
  const primero = new Date(anio, mes, 1, 12);
  const desfase = (primero.getDay() + 6) % 7; // lunes = 0
  const inicio = new Date(anio, mes, 1 - desfase, 12);
  const ultimo = new Date(anio, mes + 1, 0, 12);
  const total = Math.ceil((desfase + ultimo.getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i, 12));
}

const numeroNivel = (nivel: string) => parseInt(nivel, 10) || 0;

/** «miércoles 25 de noviembre», sin la coma que agrega el formato es-CL. */
const fechaTexto = (d: string) => fechaLarga(d).replace(',', '');

/**
 * Calendario del docente: muestra sus clases en cada día del mes para planificar el año.
 * En un mismo día puede haber varias clases. Desde un día se puede crear una clase nueva,
 * copiar una clase ya creada (mismo tema en otra fecha) o agregar una clase lista.
 *
 * Vistas: sin ?dia se muestra el año (12 meses en tarjetas, ?anio=AAAA opcional);
 * al tocar un mes se abre el mes completo (?dia=AAAA-MM-DD). «Ver año» vuelve a las tarjetas.
 */
export default function Calendario() {
  const [parametros, setParametros] = useSearchParams();
  const { state } = useLocation() as { state: { mensaje?: string } | null };
  const navigate = useNavigate();

  const diaParametro = parametros.get('dia');
  const diaValido = diaParametro && ES_FECHA.test(diaParametro) ? diaParametro : null;
  const anioParametro = Number(parametros.get('anio'));
  const anioValido = Number.isInteger(anioParametro) && anioParametro >= 2000 && anioParametro <= 2100 ? anioParametro : null;
  const vista: 'anio' | 'mes' = diaValido ? 'mes' : 'anio';

  const diaInicial = diaValido ?? hoyISO();
  const [seleccionado, setSeleccionado] = useState(diaInicial);
  const [anio, setAnio] = useState(() => (diaValido ? Number(diaInicial.slice(0, 4)) : anioValido ?? Number(diaInicial.slice(0, 4))));
  const [mes, setMes] = useState(() => Number(diaInicial.slice(5, 7)) - 1);

  // Al usar atrás/adelante del navegador, la vista sigue a la dirección.
  useEffect(() => {
    if (diaValido) {
      setSeleccionado(diaValido);
      setAnio(Number(diaValido.slice(0, 4)));
      setMes(Number(diaValido.slice(5, 7)) - 1);
    } else if (anioValido) {
      setAnio(anioValido);
    }
  }, [diaValido, anioValido]);

  const [clases, setClases] = useState<Clase[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(state?.mensaje ?? null);
  const [modal, setModal] = useState<'copiar' | 'lista' | null>(null);
  const [exportando, setExportando] = useState(false);
  const { usuario } = useAuth();

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
    // El mensaje de la página anterior se muestra una sola vez.
    if (state?.mensaje) navigate('.', { replace: true, state: null, preventScrollReset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, Clase[]>();
    for (const c of clases) mapa.set(c.fecha, [...(mapa.get(c.fecha) ?? []), c]);
    return mapa;
  }, [clases]);

  const dias = useMemo(() => diasDelMes(anio, mes), [anio, mes]);
  const hoy = hoyISO();
  const nombreMes = `${nombreDelMes(anio, mes)} ${anio}`;
  const clasesDelMes = clases.filter((c) => c.fecha.startsWith(claveMes(anio, mes))).length;
  const clasesDelAnio = clases.filter((c) => c.fecha.startsWith(`${anio}-`)).length;
  const delDia = porDia.get(seleccionado) ?? [];

  function elegirDia(d: string) {
    setSeleccionado(d);
    setParametros({ dia: d }, { replace: true });
  }

  function moverMes(delta: number) {
    const d = new Date(anio, mes + delta, 1, 12);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  }

  function irAHoy() {
    abrirMes(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)) - 1);
  }

  /** Abre el mes completo. Se elige hoy si cae en ese mes; si no, el primer día con clases o el día 1. */
  function abrirMes(a: number, m: number) {
    const prefijo = claveMes(a, m);
    const conClases = clases.map((c) => c.fecha).filter((f) => f.startsWith(prefijo)).sort()[0];
    const dia = hoy.startsWith(prefijo) ? hoy : conClases ?? `${prefijo}-01`;
    setAnio(a);
    setMes(m);
    setSeleccionado(dia);
    // Se agrega al historial para que «atrás» del navegador vuelva a la vista del año.
    setParametros({ dia });
  }

  function verAnio() {
    setParametros({ anio: String(anio) });
  }

  function moverAnio(delta: number) {
    setAnio(anio + delta);
    setParametros({ anio: String(anio + delta) }, { replace: true });
  }

  /** Descarga el año que se está viendo como carta Gantt en Excel. El generador se carga solo al usarlo. */
  async function exportarExcel() {
    setExportando(true);
    try {
      const { exportarPlanificadorExcel } = await import('../lib/exportarGantt');
      const nombre = exportarPlanificadorExcel({ anio, clases, docente: usuario?.nombre });
      setAviso(`Se descargó «${nombre}».`);
    } catch {
      setError('No se pudo crear el archivo Excel. Inténtalo de nuevo.');
    } finally {
      setExportando(false);
    }
  }

  async function alAgregar(titulo: string) {
    setModal(null);
    setAviso(`Se agregó «${titulo}» al ${fechaTexto(seleccionado)}.`);
    await cargar();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-ink-900">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-ink-900 shadow-sticker-sm" style={{ background: '#D9D2FF' }} aria-hidden="true">
            <CalendarRange size={22} />
          </span>
          Planificador
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">
          {vista === 'anio'
            ? 'Planifica tus clases durante el año. Toca un mes para abrirlo completo.'
            : 'Cada día muestra los temas de tus clases; toca un día para ver sus clases o agregar más.'}
        </p>
      </header>

      {aviso && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <CheckCircle2 size={16} />
          {aviso}
        </p>
      )}
      {error && <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>}

      {vista === 'anio' && (
        <VistaAnio
          anio={anio}
          porDia={porDia}
          hoy={hoy}
          cargando={cargando}
          totalAnio={clasesDelAnio}
          onMoverAnio={moverAnio}
          onAbrirMes={abrirMes}
          onHoy={irAHoy}
        />
      )}

      {vista === 'mes' && (
      <>
      {/* Mes */}
      <section className="rounded-card border-2 border-ink-900 bg-white p-3 shadow-sticker-sm sm:p-5" aria-label="Calendario del mes">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={verAnio}
            className="flex items-center gap-1.5 rounded-full border-2 border-ink-900 bg-white px-3 py-1.5 text-sm font-bold text-ink-900 hover:bg-surface-muted"
          >
            <LayoutGrid size={15} /> Ver año {anio}
          </button>
          <button type="button" onClick={() => moverMes(-1)} aria-label="Mes anterior" className="rounded-full border-2 border-ink-900 p-2 text-ink-900 hover:bg-surface-muted">
            <ChevronLeft size={18} />
          </button>
          <h2 className="min-w-[10rem] text-center font-[Fredoka] text-xl font-semibold text-ink-900" aria-live="polite">
            {nombreMes}
          </h2>
          <button type="button" onClick={() => moverMes(1)} aria-label="Mes siguiente" className="rounded-full border-2 border-ink-900 p-2 text-ink-900 hover:bg-surface-muted">
            <ChevronRight size={18} />
          </button>
          <button type="button" onClick={irAHoy} className="rounded-full border-2 border-ink-900 bg-sol px-4 py-1.5 text-sm font-bold text-ink-900">
            Hoy
          </button>
          <p className="ml-auto text-xs text-ink-500">
            {cargando ? (
              <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Cargando…</span>
            ) : (
              `${clasesDelMes} clase${clasesDelMes === 1 ? '' : 's'} este mes`
            )}
          </p>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {DIAS_SEMANA.map((d) => (
            <p key={d} className="pb-1 text-center text-[11px] font-extrabold uppercase tracking-wide text-ink-500 sm:text-xs">
              {d}
            </p>
          ))}
          {dias.map((d) => {
            const clave = iso(d);
            const lista = porDia.get(clave) ?? [];
            const delMes = d.getMonth() === mes;
            const esHoy = clave === hoy;
            const activo = clave === seleccionado;
            return (
              <button
                key={clave}
                type="button"
                onClick={() => elegirDia(clave)}
                aria-pressed={activo}
                aria-label={`${fechaTexto(clave)}${lista.length ? `, ${lista.length} clase${lista.length === 1 ? '' : 's'}` : ', sin clases'}`}
                className={[
                  'flex min-h-[3.5rem] flex-col items-stretch gap-1 rounded-xl border-2 p-1 text-left transition sm:min-h-[5.75rem] sm:p-1.5',
                  activo ? 'border-ink-900 bg-[#FFF4D6] shadow-[3px_3px_0_#7B6CF0]' : 'border-ink-300/40 hover:border-ink-900',
                  delMes ? '' : 'opacity-45',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-6 w-6 items-center justify-center self-center rounded-full text-xs font-bold sm:self-start',
                    esHoy ? 'bg-ink-900 text-white' : 'text-ink-900',
                  ].join(' ')}
                >
                  {d.getDate()}
                </span>
                {/* Celular: un punto por clase. Pantallas grandes: el tema de cada clase. */}
                {lista.length > 0 && (
                  <span className="flex flex-wrap justify-center gap-0.5 sm:hidden" aria-hidden="true">
                    {lista.slice(0, 4).map((c) => (
                      <span key={c.id} className="h-1.5 w-1.5 rounded-full" style={{ background: temaDe(c.asignatura.nombre).fuerte }} />
                    ))}
                  </span>
                )}
                <span className="hidden flex-col gap-1 sm:flex" aria-hidden="true">
                  {lista.slice(0, 2).map((c) => {
                    const tema = temaDe(c.asignatura.nombre);
                    return (
                      <span key={c.id} className="truncate rounded-md px-1.5 py-0.5 text-[11px] font-bold leading-tight" style={{ background: tema.suave, color: tema.oscuro }}>
                        {c.titulo}
                      </span>
                    );
                  })}
                  {lista.length > 2 && <span className="px-1 text-[11px] font-bold text-ink-500">+{lista.length - 2} más</span>}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Día seleccionado */}
      <section className="flex flex-col gap-4 rounded-card border-2 border-ink-900 bg-white p-4 shadow-sticker-sm sm:p-5" aria-labelledby="titulo-dia">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="titulo-dia" className="font-[Fredoka] text-xl font-semibold first-letter:uppercase text-ink-900">
            {fechaTexto(seleccionado)}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/planificador/nueva?fecha=${seleccionado}&volver=calendario`}
              className="flex items-center gap-1.5 rounded-full border-[2.5px] border-ink-900 bg-sol px-3.5 py-1.5 text-sm font-bold text-ink-900 shadow-sticker-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Plus size={15} /> Nueva clase
            </Link>
            <button
              type="button"
              onClick={() => setModal('copiar')}
              disabled={clases.length === 0}
              title={clases.length === 0 ? 'Primero crea una clase en Mis clases' : undefined}
              className="flex items-center gap-1.5 rounded-full border-2 border-ink-900 bg-white px-3.5 py-1.5 text-sm font-bold text-ink-900 hover:bg-surface-muted disabled:opacity-50"
            >
              <Copy size={15} /> Copiar una clase
            </button>
            <button
              type="button"
              onClick={() => setModal('lista')}
              className="flex items-center gap-1.5 rounded-full border-2 border-ink-900 bg-white px-3.5 py-1.5 text-sm font-bold text-ink-900 hover:bg-surface-muted"
            >
              <Sparkles size={15} /> Clase lista
            </button>
          </div>
        </div>

        {delDia.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-ink-300 px-4 py-6 text-center text-sm text-ink-500">
            No hay clases este día. Agrega una clase nueva, copia una que ya creaste o elige una clase lista.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {delDia.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 rounded-xl border-2 border-ink-900 p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{c.titulo}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <ChipAsignatura asignatura={c.asignatura.nombre} nivel={c.asignatura.nivel} />
                    <span className="rounded-full border-2 border-ink-900 bg-sol px-2 py-0.5 font-extrabold text-ink-900">{c.objetivo.codigo}</span>
                    {c.duracionTotalMinutos > 0 && <span className="text-ink-500">{c.duracionTotalMinutos} min de actividades</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/planificador/${c.id}/presentar`}
                    state={{ volver: `/calendario?dia=${seleccionado}` }}
                    className="flex items-center gap-1.5 rounded-full border-2 border-ink-900 bg-sol px-3 py-1.5 text-sm font-bold text-ink-900"
                  >
                    <Play size={14} /> Presentar
                  </Link>
                  <Link
                    to={`/planificador/${c.id}/editar?volver=calendario`}
                    aria-label={`Editar ${c.titulo}`}
                    className="flex items-center gap-1.5 rounded-full border-2 border-ink-900 px-3 py-1.5 text-sm font-bold text-ink-900 hover:bg-surface-muted"
                  >
                    <Pencil size={14} /> Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </>
      )}

      {/* Exportar el año completo */}
      <section className="flex flex-col items-start gap-3 rounded-card border-2 border-ink-900 bg-white p-4 shadow-sticker-sm sm:flex-row sm:items-center sm:justify-between sm:p-5" aria-label="Exportar">
        <div>
          <h2 className="font-[Fredoka] text-lg font-semibold text-ink-900">Exportar el año {anio}</h2>
          <p className="text-sm text-ink-500">
            {clasesDelAnio > 0
              ? 'Descarga tu planificación completa en Excel como carta Gantt: cada clase en la semana que corresponde, por asignatura y nivel.'
              : `Aún no hay clases en ${anio} para exportar.`}
          </p>
        </div>
        <button
          type="button"
          onClick={exportarExcel}
          disabled={exportando || cargando || clasesDelAnio === 0}
          className="flex shrink-0 items-center gap-2 rounded-full border-[2.5px] border-ink-900 bg-[#BFE6D0] px-4 py-2 text-sm font-bold text-ink-900 shadow-sticker-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
        >
          {exportando ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
          {exportando ? 'Creando Excel…' : 'Exportar a Excel (carta Gantt)'}
        </button>
      </section>

      <CopiarClase abierto={modal === 'copiar'} clases={clases} fecha={seleccionado} onCerrar={() => setModal(null)} onAgregada={alAgregar} />
      <ElegirClaseLista abierto={modal === 'lista'} fecha={seleccionado} onCerrar={() => setModal(null)} onAgregada={alAgregar} />
    </div>
  );
}

interface PropsVistaAnio {
  anio: number;
  porDia: Map<string, Clase[]>;
  hoy: string;
  cargando: boolean;
  totalAnio: number;
  onMoverAnio: (delta: number) => void;
  onAbrirMes: (anio: number, mes: number) => void;
  onHoy: () => void;
}

/** Los 12 meses del año como botones con su nombre; al tocar uno se abre el mes completo. */
function VistaAnio({ anio, porDia, hoy, cargando, totalAnio, onMoverAnio, onAbrirMes, onHoy }: PropsVistaAnio) {
  return (
    <section className="rounded-card border-2 border-ink-900 bg-white p-3 shadow-sticker-sm sm:p-5" aria-label={`Meses de ${anio}`}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onMoverAnio(-1)} aria-label="Año anterior" className="rounded-full border-2 border-ink-900 p-2 text-ink-900 hover:bg-surface-muted">
          <ChevronLeft size={18} />
        </button>
        <h2 className="min-w-[5rem] text-center font-[Fredoka] text-xl font-semibold text-ink-900" aria-live="polite">
          {anio}
        </h2>
        <button type="button" onClick={() => onMoverAnio(1)} aria-label="Año siguiente" className="rounded-full border-2 border-ink-900 p-2 text-ink-900 hover:bg-surface-muted">
          <ChevronRight size={18} />
        </button>
        <button type="button" onClick={onHoy} className="rounded-full border-2 border-ink-900 bg-sol px-4 py-1.5 text-sm font-bold text-ink-900">
          Hoy
        </button>
        <p className="ml-auto text-xs text-ink-500">
          {cargando ? (
            <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Cargando…</span>
          ) : (
            `${totalAnio} clase${totalAnio === 1 ? '' : 's'} este año`
          )}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 lg:gap-8">
        {MESES.map((m) => {
          const prefijo = claveMes(anio, m);
          let total = 0;
          for (const [fecha, lista] of porDia) if (fecha.startsWith(prefijo)) total += lista.length;
          const esMesActual = hoy.startsWith(prefijo);
          const nombre = nombreDelMes(anio, m);
          return (
            <li key={m}>
              <button
                type="button"
                onClick={() => onAbrirMes(anio, m)}
                aria-label={`${nombre} ${anio}, ${total ? `${total} clase${total === 1 ? '' : 's'}` : 'sin clases'}`}
                className={[
                  'flex h-24 w-full items-center justify-center rounded-2xl border-[2.5px] border-ink-900 px-3 font-[Fredoka] text-xl font-semibold text-ink-900 shadow-sticker-sm transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#7B6CF0] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:h-28 sm:text-2xl',
                  esMesActual ? 'bg-sol' : 'bg-white',
                ].join(' ')}
              >
                {nombre}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface PropsVentana {
  abierto: boolean;
  fecha: string;
  onCerrar: () => void;
  onAgregada: (titulo: string) => void;
}

/** Copia una clase ya creada al día elegido: mismo tema, objetivo, recursos y actividades. */
function CopiarClase({ abierto, clases, fecha, onCerrar, onAgregada }: PropsVentana & { clases: Clase[] }) {
  const [texto, setTexto] = useState('');
  const [elegida, setElegida] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setTexto('');
      setElegida('');
      setError(null);
    }
  }, [abierto]);

  // Una opción por tema: si la misma clase ya se copió a varios días, aparece una sola vez (la más reciente).
  const opciones = useMemo(() => {
    const vistos = new Map<string, Clase>();
    for (const c of [...clases].sort((a, b) => b.fecha.localeCompare(a.fecha))) {
      const clave = `${c.titulo}|${c.objetivo.id}`;
      if (!vistos.has(clave)) vistos.set(clave, c);
    }
    const q = texto.trim().toLowerCase();
    return [...vistos.values()]
      .filter((c) => !q || `${c.titulo} ${c.asignatura.nombre} ${c.objetivo.codigo}`.toLowerCase().includes(q))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
  }, [clases, texto]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!elegida) {
      setError('Elige la clase que quieres copiar.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const { data } = await api.post<Clase>(`/planner/${elegida}/duplicar`, { fecha });
      onAgregada(data.titulo);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo copiar la clase. Inténtalo de nuevo.'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal abierto={abierto} titulo="Copiar una clase" onCerrar={onCerrar} bloqueado={guardando}>
      <form onSubmit={guardar} className="flex flex-col gap-4 text-sm">
        <p className="text-ink-700">
          Elige una de tus clases para repetir su tema el <strong>{fechaTexto(fecha)}</strong>. Se copian el objetivo, los
          recursos y las actividades; después puedes editarla.
        </p>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por título, asignatura u OA…"
            aria-label="Buscar clase"
            className={`${claseCampo} pl-9`}
          />
        </div>
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto" role="radiogroup" aria-label="Clases">
          {opciones.map((c) => (
            <li key={c.id}>
              <label className={['flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3', elegida === c.id ? 'border-ink-900 bg-[#FFF4D6]' : 'border-ink-300/50 hover:border-ink-900'].join(' ')}>
                <input type="radio" name="clase-a-copiar" value={c.id} checked={elegida === c.id} onChange={() => setElegida(c.id)} className="mt-1" />
                <span className="min-w-0">
                  <span className="block font-semibold text-ink-900">{c.titulo}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <ChipAsignatura asignatura={c.asignatura.nombre} nivel={c.asignatura.nivel} />
                    <span className="font-bold text-ink-500">{c.objetivo.codigo}</span>
                  </span>
                </span>
              </label>
            </li>
          ))}
          {opciones.length === 0 && <li className="px-1 text-ink-500">No hay clases que coincidan con la búsqueda.</li>}
        </ul>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}
        <BotonesVentana onCerrar={onCerrar} guardando={guardando} texto="Copiar clase" />
      </form>
    </Modal>
  );
}

/** Agrega una de las clases listas (45 minutos) al día elegido. */
function ElegirClaseLista({ abierto, fecha, onCerrar, onAgregada }: PropsVentana) {
  const [listas, setListas] = useState<ClaseLista[]>([]);
  const [cargando, setCargando] = useState(false);
  const [asignatura, setAsignatura] = useState('');
  const [nivel, setNivel] = useState('');
  const [elegida, setElegida] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setElegida('');
    setError(null);
    if (listas.length > 0) return;
    setCargando(true);
    api
      .get<ClaseLista[]>('/curriculum/clases-listas')
      .then((res) => setListas(res.data))
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar las clases listas.')))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const asignaturas = useMemo(() => [...new Set(listas.map((c) => c.asignatura))].sort((a, b) => a.localeCompare(b, 'es')), [listas]);
  const niveles = useMemo(
    () => [...new Set(listas.filter((c) => !asignatura || c.asignatura === asignatura).map((c) => c.nivel))].sort((a, b) => numeroNivel(a) - numeroNivel(b)),
    [listas, asignatura],
  );
  const visibles = listas
    .filter((c) => (!asignatura || c.asignatura === asignatura) && (!nivel || c.nivel === nivel))
    .sort((a, b) => a.asignatura.localeCompare(b.asignatura, 'es') || numeroNivel(a.nivel) - numeroNivel(b.nivel) || a.tema.localeCompare(b.tema, 'es'));

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!elegida) {
      setError('Elige la clase lista que quieres agregar.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      onAgregada(await agregarClaseLista(elegida, fecha));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo agregar la clase. Inténtalo de nuevo.'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal abierto={abierto} titulo="Agregar una clase lista" onCerrar={onCerrar} bloqueado={guardando}>
      <form onSubmit={guardar} className="flex flex-col gap-4 text-sm">
        <p className="text-ink-700">
          Clases completas de unos 45 minutos. Se agregará al <strong>{fechaTexto(fecha)}</strong> con sus diapositivas,
          videos y actividades.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select aria-label="Asignatura" value={asignatura} onChange={(e) => { setAsignatura(e.target.value); setNivel(''); }} className={claseCampo}>
            <option value="">Todas las asignaturas</option>
            {asignaturas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select aria-label="Nivel" value={nivel} onChange={(e) => setNivel(e.target.value)} className={claseCampo}>
            <option value="">Todos los niveles</option>
            {niveles.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        {cargando ? (
          <p className="flex items-center gap-2 text-ink-500"><Loader2 size={15} className="animate-spin" /> Cargando clases listas…</p>
        ) : (
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto" role="radiogroup" aria-label="Clases listas">
            {visibles.map((c) => (
              <li key={c.objetivoId}>
                <label className={['flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3', elegida === c.objetivoId ? 'border-ink-900 bg-[#FFF4D6]' : 'border-ink-300/50 hover:border-ink-900'].join(' ')}>
                  <input type="radio" name="clase-lista" value={c.objetivoId} checked={elegida === c.objetivoId} onChange={() => setElegida(c.objetivoId)} className="mt-1" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink-900">{c.tema}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <ChipAsignatura asignatura={c.asignatura} nivel={c.nivel} />
                      <span className="font-bold text-ink-500">{c.codigo}</span>
                    </span>
                  </span>
                </label>
              </li>
            ))}
            {visibles.length === 0 && <li className="px-1 text-ink-500">No hay clases listas para ese filtro.</li>}
          </ul>
        )}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}
        <BotonesVentana onCerrar={onCerrar} guardando={guardando} texto="Agregar clase" />
      </form>
    </Modal>
  );
}

function BotonesVentana({ onCerrar, guardando, texto }: { onCerrar: () => void; guardando: boolean; texto: string }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCerrar} disabled={guardando} className="rounded-lg border border-ink-300/40 px-4 py-2 font-medium text-ink-700 hover:bg-surface-muted">
        Cancelar
      </button>
      <button
        type="submit"
        disabled={guardando}
        className="flex items-center gap-2 rounded-full border-[2.5px] border-ink-900 bg-sol px-5 py-2 font-bold text-ink-900 shadow-sticker-sm disabled:opacity-70"
      >
        {guardando ? <Loader2 size={15} className="animate-spin" /> : <CalendarDays size={15} />}
        {guardando ? 'Guardando…' : texto}
      </button>
    </div>
  );
}
