import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Eye,
  HelpCircle,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  Plus,
  Puzzle,
  RotateCcw,
  Target,
  Video,
  X,
} from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { fechaLarga } from '../lib/fechas';
import { medioDe } from '../lib/medios';
import type { Clase, DiapositivaContenido } from '../lib/tipos';
import { temaDe, variablesTema } from '../lib/temas';

type RecursoClase = Clase['recursos'][number];
type ActividadClase = Clase['actividades'][number];

type Diapositiva =
  | { tipo: 'portada' }
  | { tipo: 'contenido'; contenido: DiapositivaContenido; numero: number; total: number }
  | { tipo: 'pregunta'; contenido: DiapositivaContenido; numero: number; total: number }
  | { tipo: 'recurso'; recurso: RecursoClase; numero: number; total: number }
  | { tipo: 'actividad'; actividad: ActividadClase; numero: number; total: number }
  | { tipo: 'cierre' };

/** Estado del cronómetro de una actividad: tiempo restante, o momento en que termina si está corriendo. */
interface Cronometro {
  restanteMs: number;
  terminaEn: number | null;
}

const ICONO_RECURSO = { video: Video, documento: FileText, imagen: ImageIcon };
const NOMBRE_TIPO = { video: 'Video', documento: 'Documento', imagen: 'Imagen' };

const mayusculaInicial = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function formatoTiempo(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Modo presentación: muestra una clase del planificador en pantalla completa, pensada para
 * la pantalla interactiva. Diapositivas: objetivo de la clase, la explicación del material
 * listo del OA (si tiene), cada recurso (videos de YouTube, imágenes y archivos de Drive se
 * ven dentro de la diapositiva), las preguntas para el curso, cada actividad con su
 * cronómetro y un cierre. Se avanza con los botones, las flechas del teclado,
 * un control de presentaciones o deslizando el dedo. El diseño es lúdico y toma el color
 * de la asignatura, porque lo ven los estudiantes en la sala.
 */
export default function ModoPresentacion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [clase, setClase] = useState<Clase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [indice, setIndice] = useState(0);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [cronometros, setCronometros] = useState<Record<string, Cronometro>>({});
  const [ahora, setAhora] = useState(() => Date.now());
  const toque = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    api
      .get<Clase>(`/planner/${id}`)
      .then((res) => setClase(res.data))
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar la clase.')));
  }, [id]);

  // En pantallas grandes (pantalla interactiva Full HD o 4K) todo se agranda en proporción.
  useEffect(() => {
    document.documentElement.classList.add('modo-presentacion');
    return () => document.documentElement.classList.remove('modo-presentacion');
  }, []);

  useEffect(() => {
    if (clase) document.title = `${clase.titulo} · Modo presentación`;
    return () => {
      document.title = 'Software Educativo · Apoyo docente MINEDUC';
    };
  }, [clase]);

  const diapositivas = useMemo<Diapositiva[]>(() => {
    if (!clase) return [];
    // Material listo del OA: la explicación va antes de los recursos y las preguntas después.
    const contenido = clase.material?.diapositivas ?? [];
    const explicacion = contenido.filter((d) => d.tipo !== 'pregunta');
    const preguntas = contenido.filter((d) => d.tipo === 'pregunta');
    return [
      { tipo: 'portada' },
      ...explicacion.map((d, i) => ({ tipo: 'contenido' as const, contenido: d, numero: i + 1, total: explicacion.length })),
      ...clase.recursos.map((recurso, i) => ({
        tipo: 'recurso' as const,
        recurso,
        numero: i + 1,
        total: clase.recursos.length,
      })),
      ...preguntas.map((d, i) => ({ tipo: 'pregunta' as const, contenido: d, numero: i + 1, total: preguntas.length })),
      ...clase.actividades.map((actividad, i) => ({
        tipo: 'actividad' as const,
        actividad,
        numero: i + 1,
        total: clase.actividades.length,
      })),
      { tipo: 'cierre' },
    ];
  }, [clase]);

  const total = diapositivas.length;
  const ir = useCallback((i: number) => setIndice(Math.max(0, Math.min(total - 1, i))), [total]);
  const siguiente = useCallback(() => ir(indice + 1), [ir, indice]);
  const anterior = useCallback(() => ir(indice - 1), [ir, indice]);
  const salir = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    navigate('/planificador');
  }, [navigate]);

  // ---- Pantalla completa ----
  const puedePantallaCompleta = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const alternarPantallaCompleta = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  useEffect(() => {
    const alCambiar = () => setPantallaCompleta(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', alCambiar);
    return () => {
      document.removeEventListener('fullscreenchange', alCambiar);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  // ---- Teclado (también sirve para los controles de presentación, que envían flechas o AvPág/RePág) ----
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const enControl = (e.target as HTMLElement)?.closest('button, a, input, textarea, select, iframe');
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          siguiente();
          break;
        case ' ':
          if (enControl) return; // la barra espaciadora activa el botón enfocado
          e.preventDefault();
          siguiente();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          anterior();
          break;
        case 'Home':
          ir(0);
          break;
        case 'End':
          ir(total - 1);
          break;
        case 'f':
        case 'F':
          alternarPantallaCompleta();
          break;
      }
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [siguiente, anterior, ir, total, alternarPantallaCompleta]);

  // ---- Cronómetros de las actividades ----
  const algunoCorriendo = Object.values(cronometros).some((c) => c.terminaEn !== null);
  useEffect(() => {
    if (!algunoCorriendo) return;
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, [algunoCorriendo]);

  // Cuando un cronómetro llega a cero, se detiene.
  useEffect(() => {
    const terminados = Object.entries(cronometros).filter(([, c]) => c.terminaEn !== null && c.terminaEn <= ahora);
    if (!terminados.length) return;
    setCronometros((prev) => {
      const nuevo = { ...prev };
      for (const [k] of terminados) nuevo[k] = { restanteMs: 0, terminaEn: null };
      return nuevo;
    });
  }, [ahora, cronometros]);

  const cronometroDe = (a: ActividadClase): Cronometro =>
    cronometros[a.id] ?? { restanteMs: a.duracionMinutos * 60_000, terminaEn: null };
  const restante = (a: ActividadClase) => {
    const c = cronometroDe(a);
    return c.terminaEn !== null ? Math.max(0, c.terminaEn - ahora) : c.restanteMs;
  };
  const actualizar = (a: ActividadClase, c: Cronometro) => setCronometros((prev) => ({ ...prev, [a.id]: c }));
  const iniciar = (a: ActividadClase) => {
    const ms = restante(a) || a.duracionMinutos * 60_000;
    setAhora(Date.now());
    actualizar(a, { restanteMs: ms, terminaEn: Date.now() + ms });
  };
  const pausar = (a: ActividadClase) => actualizar(a, { restanteMs: restante(a), terminaEn: null });
  const reiniciar = (a: ActividadClase) => actualizar(a, { restanteMs: a.duracionMinutos * 60_000, terminaEn: null });
  const sumarMinuto = (a: ActividadClase) => {
    const c = cronometroDe(a);
    actualizar(
      a,
      c.terminaEn !== null
        ? { restanteMs: 0, terminaEn: Math.max(c.terminaEn, Date.now()) + 60_000 }
        : { restanteMs: c.restanteMs + 60_000, terminaEn: null },
    );
  };

  // ---- Gestos: deslizar a la izquierda o derecha ----
  const alTocar = (e: TouchEvent) => {
    const t = e.touches[0];
    toque.current = { x: t.clientX, y: t.clientY };
  };
  const alSoltar = (e: TouchEvent) => {
    if (!toque.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - toque.current.x;
    const dy = t.clientY - toque.current.y;
    toque.current = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) siguiente();
      else anterior();
    }
  };

  if (error) {
    return (
      <PantallaMensaje>
        <p role="alert" className="text-lg text-ink-900">
          {error}
        </p>
        <Link to="/planificador" className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">
          Volver al planificador
        </Link>
      </PantallaMensaje>
    );
  }

  if (!clase) {
    return (
      <PantallaMensaje>
        <Loader2 size={28} className="animate-spin text-brand-600" />
        <p className="mt-3 text-ink-500">Preparando la presentación…</p>
      </PantallaMensaje>
    );
  }

  const actual = diapositivas[indice];
  const tema = temaDe(clase.asignatura.nombre);
  const enPortada = indice === 0;

  return (
    <div
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-crema font-ronda text-tinta"
      style={variablesTema(tema)}
      onTouchStart={alTocar}
      onTouchEnd={alSoltar}
    >
      <Decoracion letras={tema.letras} />

      {/* Barra superior */}
      <header className="relative z-10 flex shrink-0 items-center gap-3 px-4 pb-1 pt-3 sm:px-8 sm:pt-5">
        <span className="hidden shrink-0 rounded-full bg-[var(--tema-oscuro)] px-4 py-2 text-sm font-extrabold text-white sm:inline sm:text-base">
          {clase.asignatura.nombre} · {clase.asignatura.nivel}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-tinta-suave sm:text-lg">{clase.titulo}</p>
          <p className="truncate text-xs font-bold text-tinta-suave sm:hidden">
            {clase.asignatura.nombre} · {clase.asignatura.nivel}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full border-[3px] border-tinta bg-white px-3 py-0.5 font-infantil text-base font-semibold tabular-nums sm:px-4 sm:text-xl"
          aria-live="polite"
        >
          {indice + 1} / {total}
        </span>
        {puedePantallaCompleta && (
          <BotonIcono
            onClick={alternarPantallaCompleta}
            etiqueta={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {pantallaCompleta ? <Minimize size={20} /> : <Maximize size={20} />}
          </BotonIcono>
        )}
        <BotonIcono onClick={salir} etiqueta="Cerrar presentación">
          <X size={22} />
        </BotonIcono>
      </header>

      {/* Diapositiva */}
      <main
        className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-10 sm:py-6 [@media(max-height:700px)]:py-3"
        aria-roledescription="diapositiva"
      >
        <div key={indice} className="mx-auto flex w-full max-w-6xl flex-1 flex-col animate-[aparecer_.3s_ease-out]">
          {actual.tipo === 'portada' && <Portada clase={clase} />}
          {actual.tipo === 'contenido' && <DiapositivaExplicacion {...actual} />}
          {actual.tipo === 'pregunta' && <DiapositivaPregunta {...actual} />}
          {actual.tipo === 'recurso' && <DiapositivaRecurso {...actual} />}
          {actual.tipo === 'actividad' && (
            <DiapositivaActividad
              {...actual}
              restanteMs={restante(actual.actividad)}
              corriendo={cronometroDe(actual.actividad).terminaEn !== null}
              onIniciar={() => iniciar(actual.actividad)}
              onPausar={() => pausar(actual.actividad)}
              onReiniciar={() => reiniciar(actual.actividad)}
              onSumarMinuto={() => sumarMinuto(actual.actividad)}
            />
          )}
          {actual.tipo === 'cierre' && <Cierre clase={clase} onSalir={salir} />}
        </div>
      </main>

      {/* Navegación: botones grandes para tocar en la pantalla interactiva */}
      <nav className="relative z-10 flex shrink-0 items-center gap-3 px-3 pb-4 pt-2 sm:px-8 sm:pb-6" aria-label="Navegación de la presentación">
        <button
          type="button"
          onClick={anterior}
          disabled={indice === 0}
          className="flex h-14 items-center gap-2 rounded-full border-[3px] border-tinta bg-white px-4 font-infantil text-lg font-semibold shadow-sticker-sm transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:border-tinta/25 disabled:text-tinta/40 disabled:shadow-none sm:h-16 sm:px-6"
        >
          <ChevronLeft size={26} strokeWidth={3} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <ol className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto px-1">
          {diapositivas.map((d, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir a la diapositiva ${i + 1}: ${nombreDiapositiva(d)}`}
                aria-current={i === indice ? 'step' : undefined}
                className="flex h-10 items-center px-0.5"
              >
                <span
                  className={[
                    'block h-4 rounded-full transition-all',
                    i === indice ? 'w-10 bg-[var(--tema-oscuro)]' : i < indice ? 'w-4 bg-[var(--tema-fuerte)]' : 'w-4 bg-[var(--tema-medio)]',
                  ].join(' ')}
                />
              </button>
            </li>
          ))}
        </ol>

        {indice < total - 1 ? (
          <button
            type="button"
            onClick={siguiente}
            className="flex h-14 items-center gap-2 rounded-full border-[3px] border-tinta bg-sol px-5 font-infantil text-lg font-bold shadow-sticker-sm transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:h-16 sm:px-7 sm:text-xl"
          >
            <span className="hidden sm:inline">{enPortada ? '¡Comencemos!' : 'Siguiente'}</span>
            <ChevronRight size={26} strokeWidth={3} />
          </button>
        ) : (
          <button
            type="button"
            onClick={salir}
            className="flex h-14 items-center gap-2 rounded-full border-[3px] border-tinta bg-sol px-5 font-infantil text-lg font-bold shadow-sticker-sm transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:h-16 sm:px-7 sm:text-xl"
          >
            <Flag size={22} strokeWidth={2.5} />
            <span className="hidden sm:inline">Terminar</span>
          </button>
        )}
      </nav>
    </div>
  );
}

function nombreDiapositiva(d: Diapositiva) {
  if (d.tipo === 'portada') return 'Objetivo de la clase';
  if (d.tipo === 'cierre') return 'Cierre';
  if (d.tipo === 'recurso') return d.recurso.titulo;
  if (d.tipo === 'contenido' || d.tipo === 'pregunta') return d.contenido.titulo;
  return d.actividad.titulo;
}

// ---------------------------------------------------------------------------------------
/** Formas decorativas de fondo (no se leen ni se pueden tocar). */
function Decoracion({ letras = false }: { letras?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1280 720"
      preserveAspectRatio="xMidYMid slice"
    >
      <circle cx="1190" cy="90" r="210" fill="var(--tema-suave)" />
      <circle cx="990" cy="56" r="40" fill="#FFE3A3" />
      <circle cx="60" cy="680" r="150" fill="var(--tema-suave)" />
      <circle cx="1225" cy="650" r="70" fill="#FFE3A3" />
      <Estrella x={1070} y={300} r={30} />
      <Estrella x={34} y={330} r={18} color="var(--tema-fuerte)" />
      {letras && (
        <g fontFamily="Fredoka, Nunito, sans-serif" fontWeight="700">
          <text x="6" y="520" fontSize="58" fill="var(--tema-fuerte)" transform="rotate(-10 6 520)">A</text>
          <text x="1236" y="560" fontSize="50" fill="#FFC93C" transform="rotate(-10 1236 560)">b</text>
          <text x="150" y="712" fontSize="52" fill="var(--tema-medio)" transform="rotate(-14 150 712)">c</text>
          <text x="690" y="58" fontSize="48" fill="var(--tema-medio)" transform="rotate(8 690 58)">ñ</text>
        </g>
      )}
    </svg>
  );
}

function Estrella({ x, y, r, color = '#FFC93C' }: { x: number; y: number; r: number; color?: string }) {
  const puntos = Array.from({ length: 10 }, (_, i) => {
    const radio = i % 2 === 0 ? r : r * 0.45;
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    return `${(x + radio * Math.cos(ang)).toFixed(1)},${(y + radio * Math.sin(ang)).toFixed(1)}`;
  }).join(' ');
  return <polygon points={puntos} fill={color} />;
}

// ---------------------------------------------------------------------------------------

function PantallaMensaje({ children }: { children: ReactNode }) {
  return <div className="flex h-[100dvh] flex-col items-center justify-center bg-crema px-6 text-center font-ronda">{children}</div>;
}

function BotonIcono({ onClick, etiqueta, children }: { onClick: () => void; etiqueta: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-tinta bg-white text-tinta hover:bg-[var(--tema-suave)]"
    >
      {children}
    </button>
  );
}

function Etiqueta({
  icono: Icono,
  children,
  color = 'tema',
  centrada = false,
}: {
  icono: typeof Target;
  children: ReactNode;
  color?: 'tema' | 'sol';
  centrada?: boolean;
}) {
  return (
    <p
      className={[
        centrada ? 'self-center' : 'self-start',
        'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide sm:text-base',
        color === 'sol' ? 'bg-[#FFE3A3] text-[#6B4A00]' : 'bg-[var(--tema-suave)] text-[var(--tema-oscuro)]',
      ].join(' ')}
    >
      <Icono size={18} strokeWidth={2.5} />
      {children}
    </p>
  );
}

/** Diana con los colores de la asignatura: representa la meta (objetivo) de la clase. */
function Diana({ tamano = 56 }: { tamano?: number }) {
  return (
    <svg aria-hidden="true" width={tamano} height={tamano} viewBox="0 0 56 56" className="shrink-0">
      <circle cx="28" cy="28" r="26" fill="var(--tema-fuerte)" />
      <circle cx="28" cy="28" r="17" fill="#FFFFFF" />
      <circle cx="28" cy="28" r="8" fill="#FFC93C" />
    </svg>
  );
}

/** Texto de un OA, con sus viñetas en una lista. */
function TextoObjetivo({ texto, grande = false }: { texto: string; grande?: boolean }) {
  const [enunciado, ...vinetas] = texto.split('\n• ');
  return (
    <div className={grande ? 'text-xl font-semibold leading-relaxed sm:text-[1.6rem] sm:leading-snug' : 'text-lg font-semibold leading-relaxed sm:text-xl'}>
      <p>{enunciado}</p>
      {vinetas.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-6 text-[0.85em] font-medium text-tinta-suave">
          {vinetas.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Portada({ clase }: { clase: Clase }) {
  const contenido = clase.material?.diapositivas ?? [];
  const nPreguntas = contenido.filter((d) => d.tipo === 'pregunta').length;
  const agenda = [
    ...(clase.material && contenido.length > nPreguntas
      ? [{ id: 'explicacion', icono: Lightbulb, texto: `Aprendemos: ${clase.material.tema}`, min: null as number | null, actividad: false }]
      : []),
    ...clase.recursos.map((r) => ({ id: r.id, icono: ICONO_RECURSO[r.tipo], texto: r.titulo, min: null as number | null, actividad: false })),
    ...(nPreguntas > 0
      ? [{ id: 'preguntas', icono: HelpCircle, texto: `¡A pensar! ${nPreguntas} ${nPreguntas === 1 ? 'pregunta' : 'preguntas'}`, min: null as number | null, actividad: false }]
      : []),
    ...clase.actividades.map((a) => ({ id: a.id, icono: Puzzle, texto: a.titulo, min: a.duracionMinutos, actividad: true })),
  ];
  return (
    <div className="flex flex-1 flex-col justify-center gap-7">
      <div>
        <p className="font-infantil text-xl font-semibold text-[var(--tema-oscuro)] sm:text-2xl">¡Hoy vamos a descubrir!</p>
        <h1 className="mt-1 font-infantil text-4xl font-bold leading-[1.05] sm:text-6xl">{clase.titulo}</h1>
        <p className="mt-2 text-base font-bold text-tinta-suave sm:text-lg">{mayusculaInicial(fechaLarga(clase.fecha))}</p>
      </div>

      <section className="flex items-start gap-4 rounded-[28px] border-[3px] border-tinta bg-white p-5 shadow-sticker sm:gap-5 sm:p-7" aria-label="Objetivo de la clase">
        <Diana />
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-wider text-[var(--tema-oscuro)] sm:text-base">
            Nuestra meta · {clase.objetivo.codigo}
          </p>
          <div className="mt-1">
            <TextoObjetivo texto={clase.objetivo.descripcion} grande />
          </div>
        </div>
      </section>

      {agenda.length > 0 && (
        <section>
          <p className="mb-3 flex flex-wrap items-center gap-2 font-infantil text-xl font-semibold">
            Lo que haremos hoy
            {clase.duracionTotalMinutos > 0 && (
              <span className="flex items-center gap-1 font-ronda text-base font-bold text-tinta-suave">
                · <Clock size={16} /> {clase.duracionTotalMinutos} min de actividades
              </span>
            )}
          </p>
          <ol className="grid gap-3 sm:grid-cols-2">
            {agenda.map(({ id, icono: Icono, texto, min, actividad }, i) => (
              <li key={id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-base font-bold sm:text-lg">
                <span
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-infantil text-lg font-bold',
                    actividad ? 'bg-sol text-tinta' : 'bg-[var(--tema-oscuro)] text-white',
                  ].join(' ')}
                >
                  {i + 1}
                </span>
                <Icono size={20} className="shrink-0 text-[var(--tema-oscuro)]" />
                <span className="min-w-0 flex-1 truncate">{texto}</span>
                {min !== null && <span className="shrink-0 text-sm font-bold text-tinta-suave">{min} min</span>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/** Explicación del material listo: concepto o ejemplo, con viñetas grandes. */
function DiapositivaExplicacion({ contenido, numero, total }: { contenido: DiapositivaContenido; numero: number; total: number }) {
  const esEjemplo = contenido.tipo === 'ejemplo';
  return (
    <div className="flex flex-1 flex-col justify-center gap-5">
      <Etiqueta icono={Lightbulb}>
        {esEjemplo ? 'Ejemplo' : 'Aprendemos'} · {numero} de {total}
      </Etiqueta>
      <div className="flex items-center gap-4">
        {contenido.emoji && (
          <span aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border-[3px] border-tinta bg-white text-5xl shadow-sticker-sm sm:h-24 sm:w-24 sm:text-6xl">
            {contenido.emoji}
          </span>
        )}
        <h2 className="font-infantil text-3xl font-bold leading-tight sm:text-5xl">{contenido.titulo}</h2>
      </div>
      {contenido.texto && (
        <p className="rounded-[28px] border-[3px] border-tinta bg-white p-5 text-xl font-semibold leading-relaxed shadow-sticker sm:p-6 sm:text-[1.7rem] sm:leading-snug">
          {contenido.texto}
        </p>
      )}
      {contenido.puntos && (
        <ul className="grid gap-3">
          {contenido.puntos.map((p, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-white px-5 py-3 text-lg font-bold sm:text-2xl">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tema-oscuro)] font-infantil text-base text-white sm:h-9 sm:w-9 sm:text-lg">
                {i + 1}
              </span>
              <span className="min-w-0">{p}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pregunta para el curso: las opciones se pueden marcar y la respuesta aparece al tocar «Ver respuesta». */
function DiapositivaPregunta({ contenido, numero, total }: { contenido: DiapositivaContenido; numero: number; total: number }) {
  const [elegida, setElegida] = useState<number | null>(null);
  const [verRespuesta, setVerRespuesta] = useState(false);
  const letras = 'ABCDEF';
  return (
    <div className="flex flex-1 flex-col justify-center gap-5">
      <Etiqueta icono={HelpCircle} color="sol">
        ¡A pensar! · Pregunta {numero} de {total}
      </Etiqueta>
      <h2 className="font-infantil text-3xl font-bold leading-tight sm:text-5xl">{contenido.titulo}</h2>
      {contenido.puntos && (
        <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Opciones">
          {contenido.puntos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setElegida(i)}
              aria-pressed={elegida === i}
              className={[
                'flex min-h-[4.5rem] items-center gap-3 rounded-[24px] border-[3px] border-tinta px-4 py-3 text-left text-xl font-bold transition sm:text-2xl',
                elegida === i ? 'bg-[var(--tema-suave)] shadow-none ring-4 ring-[var(--tema-fuerte)]' : 'bg-white shadow-sticker-sm',
              ].join(' ')}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sol font-infantil text-xl">{letras[i]}</span>
              <span className="min-w-0">{p}</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col items-start gap-3">
        {verRespuesta ? (
          <p role="status" className="w-full rounded-[28px] border-[3px] border-tinta bg-[#E6F7EC] p-5 text-xl font-bold leading-relaxed text-[#14532D] shadow-sticker sm:p-6 sm:text-2xl">
            ✅ {contenido.respuesta}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setVerRespuesta(true)}
            className="flex h-14 items-center gap-2 rounded-full border-[3px] border-tinta bg-white px-6 font-infantil text-xl font-bold shadow-sticker-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Eye size={22} /> Ver respuesta
          </button>
        )}
      </div>
    </div>
  );
}

function DiapositivaRecurso({ recurso, numero, total }: { recurso: RecursoClase; numero: number; total: number }) {
  const medio = medioDe(recurso);
  const Icono = ICONO_RECURSO[recurso.tipo];
  const [falloImagen, setFalloImagen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-4 [@media(max-height:700px)]:gap-2">
      <div className="flex flex-col items-center text-center">
        <Etiqueta icono={Icono} centrada>
          Recurso {numero} de {total} · {NOMBRE_TIPO[recurso.tipo]}
        </Etiqueta>
        <h2 className="mt-2 font-infantil text-3xl font-bold leading-tight sm:text-5xl [@media(max-height:700px)]:text-2xl">{recurso.titulo}</h2>
        {/* En pantallas bajas se omite la unidad para dejar más espacio al video */}
        <p className="mt-1 font-bold text-tinta-suave [@media(max-height:700px)]:hidden">{recurso.unidad}</p>
      </div>

      {/* Para videos e imágenes, el contenedor mide el espacio libre (container-type: size) y el
          medio usa el máximo que cabe sin tapar el título: 100cqw de ancho o 100cqh de alto. */}
      <div
        className={[
          'flex flex-1 items-center justify-center p-1 pb-3 pr-3',
          medio.tipo === 'youtube' || medio.tipo === 'drive' || medio.tipo === 'video' || (medio.tipo === 'imagen' && !falloImagen)
            ? 'min-h-[180px] [container-type:size]'
            : 'min-h-[240px]',
        ].join(' ')}
      >
        {(medio.tipo === 'youtube' || medio.tipo === 'drive') && (
          <div
            className="aspect-video overflow-hidden rounded-[28px] border-4 border-tinta bg-tinta shadow-marco"
            style={{ width: 'min(100cqw - 12px, 72rem, (100cqh - 12px) * 16 / 9)' }}
          >
            <iframe
              src={medio.src}
              title={recurso.titulo}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        )}
        {medio.tipo === 'imagen' && !falloImagen && (
          <img
            src={medio.src}
            alt={recurso.titulo}
            onError={() => setFalloImagen(true)}
            style={{ maxHeight: 'calc(100cqh - 12px)' }}
            className="max-w-full rounded-[28px] border-4 border-tinta bg-white object-contain shadow-marco"
          />
        )}
        {medio.tipo === 'video' && (
          <video
            src={medio.src}
            controls
            style={{ maxHeight: 'calc(100cqh - 12px)' }}
            className="w-full max-w-5xl rounded-[28px] border-4 border-tinta bg-tinta shadow-marco"
          />
        )}
        {(medio.tipo === 'enlace' || (medio.tipo === 'imagen' && falloImagen)) && (
          <TarjetaEnlace
            icono={Icono}
            href={medio.tipo === 'enlace' ? medio.href : medio.src}
            mensaje={
              falloImagen
                ? 'No se pudo mostrar la imagen aquí. Ábrela en una pestaña nueva.'
                : 'Este recurso se abre en una pestaña nueva.'
            }
          />
        )}
        {medio.tipo === 'sin-enlace' && (
          <div className="flex max-w-lg flex-col items-center rounded-[28px] border-[3px] border-dashed border-tinta/40 bg-white px-8 py-10 text-center">
            <Icono size={40} className="text-tinta/40" />
            <p className="mt-4 text-lg font-bold">Este recurso no tiene un enlace para mostrar.</p>
            <p className="mt-1 text-sm font-semibold text-tinta-suave">Puedes agregar uno desde la sección Recursos.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TarjetaEnlace({ icono: Icono, href, mensaje }: { icono: typeof Video; href: string; mensaje: string }) {
  let sitio = '';
  try {
    sitio = new URL(href).hostname.replace(/^www\./, '');
  } catch {
    /* enlace no válido */
  }
  return (
    <div className="flex max-w-lg flex-col items-center rounded-[28px] border-[3px] border-tinta bg-white px-8 py-10 text-center shadow-sticker">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--tema-suave)] text-[var(--tema-oscuro)]">
        <Icono size={30} />
      </div>
      <p className="mt-4 text-lg font-bold">{mensaje}</p>
      {sitio && <p className="mt-1 text-sm font-semibold text-tinta-suave">{sitio}</p>}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex h-14 items-center gap-2 rounded-full border-[3px] border-tinta bg-sol px-6 font-infantil text-lg font-bold text-tinta shadow-sticker-sm"
      >
        <ExternalLink size={20} />
        Abrir recurso
      </a>
    </div>
  );
}

/** Cronómetro circular: el anillo se vacía a medida que pasa el tiempo. */
function AnilloTiempo({ fraccion, color, children }: { fraccion: number; color: string; children: ReactNode }) {
  const r = 150;
  const circunferencia = 2 * Math.PI * r;
  return (
    <div className="relative aspect-square w-[min(18.75rem,62vw)] [@media(max-height:700px)]:w-[13.75rem]">
      <svg aria-hidden="true" viewBox="0 0 340 340" className="absolute inset-0 h-full w-full">
        <circle cx="170" cy="170" r={r} fill="#FFFFFF" stroke="var(--tema-medio)" strokeWidth="24" />
        <circle
          cx="170"
          cy="170"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="24"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - Math.max(0, Math.min(1, fraccion)))}
          transform="rotate(-90 170 170)"
          className="transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function DiapositivaActividad({
  actividad,
  numero,
  total,
  restanteMs,
  corriendo,
  onIniciar,
  onPausar,
  onReiniciar,
  onSumarMinuto,
}: {
  actividad: ActividadClase;
  numero: number;
  total: number;
  restanteMs: number;
  corriendo: boolean;
  onIniciar: () => void;
  onPausar: () => void;
  onReiniciar: () => void;
  onSumarMinuto: () => void;
}) {
  const duracionMs = actividad.duracionMinutos * 60_000;
  const terminado = restanteMs === 0;
  const completo = restanteMs === duracionMs && !corriendo;
  // Aviso de que queda poco: último 25 % del tiempo, como máximo el último minuto.
  const quedaPoco = corriendo && restanteMs <= Math.min(60_000, actividad.duracionMinutos * 15_000);
  const fraccion = restanteMs / Math.max(duracionMs, restanteMs, 1);

  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:items-center lg:gap-14">
      <div className="flex flex-1 flex-col">
        <Etiqueta icono={Puzzle} color="sol">
          Actividad {numero} de {total} · {actividad.duracionMinutos} min
        </Etiqueta>
        <h2 className="mt-3 font-infantil text-3xl font-bold leading-tight sm:text-5xl">{actividad.titulo}</h2>
        {actividad.descripcion && (
          <p className="mt-5 whitespace-pre-line rounded-[28px] border-[3px] border-tinta bg-white p-5 text-xl font-semibold leading-relaxed shadow-sticker sm:p-6 sm:text-2xl">
            {actividad.descripcion}
          </p>
        )}
      </div>

      <section aria-label="Cronómetro" className="flex shrink-0 flex-col items-center gap-4 lg:w-[360px]">
        <AnilloTiempo fraccion={fraccion} color={terminado || quedaPoco ? '#F2A900' : 'var(--tema-fuerte)'}>
          <p
            className={[
              'flex items-center gap-1.5 text-sm font-extrabold sm:text-base',
              terminado ? 'text-[#8A5A00]' : 'text-tinta-suave',
            ].join(' ')}
          >
            <Clock size={16} strokeWidth={2.5} />
            {terminado ? '¡Tiempo!' : corriendo ? 'En curso' : completo ? 'Listo para comenzar' : 'En pausa'}
          </p>
          <p
            role="timer"
            aria-live={terminado ? 'assertive' : 'off'}
            className={[
              'font-infantil font-bold tabular-nums leading-none',
              'text-[clamp(3rem,11vw,5.5rem)] [@media(max-height:700px)]:text-[3.2rem]',
              terminado ? 'animate-bounce text-[#8A5A00]' : quedaPoco ? 'text-[#8A5A00]' : 'text-tinta',
            ].join(' ')}
          >
            {formatoTiempo(restanteMs)}
          </p>
        </AnilloTiempo>

        <div className="flex w-full items-center justify-center gap-3">
          {corriendo ? (
            <button
              type="button"
              onClick={onPausar}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-[3px] border-tinta bg-sol px-5 font-infantil text-xl font-bold shadow-sticker-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Pause size={20} fill="currentColor" /> Pausar
            </button>
          ) : (
            <button
              type="button"
              onClick={terminado ? onReiniciar : onIniciar}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-[3px] border-tinta bg-sol px-5 font-infantil text-xl font-bold shadow-sticker-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              {terminado ? <RotateCcw size={20} strokeWidth={3} /> : <Play size={20} fill="currentColor" />}
              {terminado ? 'Reiniciar' : completo ? 'Iniciar' : 'Continuar'}
            </button>
          )}
          <button
            type="button"
            onClick={onSumarMinuto}
            aria-label="Sumar un minuto"
            title="Sumar un minuto"
            className="flex h-14 items-center gap-1 rounded-full border-[3px] border-tinta bg-white px-4 font-infantil text-xl font-bold"
          >
            <Plus size={18} strokeWidth={3} />1
          </button>
          {!completo && !terminado && (
            <button
              type="button"
              onClick={onReiniciar}
              aria-label="Reiniciar cronómetro"
              title="Reiniciar"
              className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-tinta bg-white"
            >
              <RotateCcw size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Cierre({ clase, onSalir }: { clase: Clase; onSalir: () => void }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <svg aria-hidden="true" viewBox="0 0 300 96" className="h-16 w-auto sm:h-24">
        <Estrella x={50} y={56} r={30} />
        <Estrella x={150} y={46} r={44} />
        <Estrella x={250} y={56} r={30} />
      </svg>
      <div>
        <h2 className="font-infantil text-5xl font-bold text-[var(--tema-oscuro)] sm:text-7xl">¡Lo logramos!</h2>
        <p className="mt-2 font-infantil text-xl font-medium sm:text-3xl">¿Qué aprendimos hoy?</p>
      </div>
      <section className="w-full max-w-4xl rounded-[28px] border-[3px] border-tinta bg-white p-5 text-left shadow-sticker sm:p-7">
        <div className="flex items-start gap-4">
          <Diana tamano={48} />
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase tracking-wider text-[var(--tema-oscuro)] sm:text-base">
              Recordemos nuestra meta · {clase.objetivo.codigo}
            </p>
            <div className="mt-1">
              <TextoObjetivo texto={clase.objetivo.descripcion} />
            </div>
          </div>
        </div>
      </section>
      <button
        type="button"
        onClick={onSalir}
        className="h-14 rounded-full border-[3px] border-tinta bg-white px-7 font-infantil text-lg font-semibold"
      >
        Volver al planificador
      </button>
    </div>
  );
}
