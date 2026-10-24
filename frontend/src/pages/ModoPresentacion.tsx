import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Image as ImageIcon,
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
import type { Clase } from '../lib/tipos';

type RecursoClase = Clase['recursos'][number];
type ActividadClase = Clase['actividades'][number];

type Diapositiva =
  | { tipo: 'portada' }
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
 * la pantalla interactiva. Diapositivas: objetivo de la clase, cada recurso (videos de
 * YouTube, imágenes y archivos de Drive se ven dentro de la diapositiva), cada actividad
 * con su cronómetro y un cierre. Se avanza con los botones, las flechas del teclado,
 * un control de presentaciones o deslizando el dedo.
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

  useEffect(() => {
    if (clase) document.title = `${clase.titulo} · Modo presentación`;
    return () => {
      document.title = 'Software Educativo · Apoyo docente MINEDUC';
    };
  }, [clase]);

  const diapositivas = useMemo<Diapositiva[]>(() => {
    if (!clase) return [];
    return [
      { tipo: 'portada' },
      ...clase.recursos.map((recurso, i) => ({
        tipo: 'recurso' as const,
        recurso,
        numero: i + 1,
        total: clase.recursos.length,
      })),
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

  return (
    <div
      className="flex h-[100dvh] w-full flex-col overflow-hidden bg-surface-muted text-ink-900"
      onTouchStart={alTocar}
      onTouchEnd={alSoltar}
    >
      {/* Barra superior */}
      <header className="flex shrink-0 items-center gap-3 border-b border-ink-300/20 bg-white px-4 py-2.5 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{clase.titulo}</p>
          <p className="truncate text-xs text-ink-500">
            {clase.asignatura.nombre} · {clase.asignatura.nivel}
          </p>
        </div>
        <span className="shrink-0 text-sm tabular-nums text-ink-500" aria-live="polite">
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
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-10 sm:py-8 [@media(max-height:700px)]:py-3" aria-roledescription="diapositiva">
        <div key={indice} className="mx-auto flex w-full max-w-6xl flex-1 flex-col animate-[aparecer_.25s_ease-out]">
          {actual.tipo === 'portada' && <Portada clase={clase} />}
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
      <nav className="flex shrink-0 items-center gap-3 border-t border-ink-300/20 bg-white px-3 py-3 sm:px-6" aria-label="Navegación de la presentación">
        <button
          type="button"
          onClick={anterior}
          disabled={indice === 0}
          className="flex h-14 items-center gap-2 rounded-xl border border-ink-300/40 px-4 text-base font-medium text-ink-700 hover:bg-surface-muted disabled:opacity-40 sm:px-6"
        >
          <ChevronLeft size={24} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <ol className="flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-x-auto px-1">
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
                    'block h-2.5 rounded-full transition-all',
                    i === indice ? 'w-8 bg-brand-600' : i < indice ? 'w-2.5 bg-brand-400/60' : 'w-2.5 bg-ink-300/50',
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
            className="flex h-14 items-center gap-2 rounded-xl bg-brand-600 px-4 text-base font-semibold text-white hover:bg-brand-700 sm:px-6"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight size={24} />
          </button>
        ) : (
          <button
            type="button"
            onClick={salir}
            className="flex h-14 items-center gap-2 rounded-xl bg-brand-600 px-4 text-base font-semibold text-white hover:bg-brand-700 sm:px-6"
          >
            <Flag size={20} />
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
  return d.actividad.titulo;
}

// ---------------------------------------------------------------------------------------

function PantallaMensaje({ children }: { children: ReactNode }) {
  return <div className="flex h-[100dvh] flex-col items-center justify-center bg-surface-muted px-6 text-center">{children}</div>;
}

function BotonIcono({ onClick, etiqueta, children }: { onClick: () => void; etiqueta: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-700 hover:bg-surface-muted"
    >
      {children}
    </button>
  );
}

function Etiqueta({ icono: Icono, children }: { icono: typeof Target; children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-700 sm:text-base">
      <Icono size={18} />
      {children}
    </p>
  );
}

/** Texto de un OA, con sus viñetas en una lista. */
function TextoObjetivo({ texto, grande = false }: { texto: string; grande?: boolean }) {
  const [enunciado, ...vinetas] = texto.split('\n• ');
  return (
    <div className={grande ? 'text-xl leading-relaxed sm:text-[1.7rem] sm:leading-snug' : 'text-lg leading-relaxed sm:text-xl'}>
      <p>{enunciado}</p>
      {vinetas.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-6 text-[0.85em] text-ink-700">
          {vinetas.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Portada({ clase }: { clase: Clase }) {
  const agenda = [
    ...clase.recursos.map((r) => ({ id: r.id, icono: ICONO_RECURSO[r.tipo], texto: r.titulo, min: null as number | null })),
    ...clase.actividades.map((a) => ({ id: a.id, icono: Puzzle, texto: a.titulo, min: a.duracionMinutos })),
  ];
  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <div>
        <p className="text-base text-ink-500 sm:text-lg">
          {mayusculaInicial(fechaLarga(clase.fecha))} · {clase.asignatura.nombre} · {clase.asignatura.nivel}
        </p>
        <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-6xl">{clase.titulo}</h1>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
        <Etiqueta icono={Target}>Objetivo de la clase</Etiqueta>
        <div className="mt-4 flex items-start gap-4">
          <span className="shrink-0 rounded-full bg-brand-100 px-3 py-1 text-base font-bold text-brand-700 sm:text-lg">
            {clase.objetivo.codigo}
          </span>
          <TextoObjetivo texto={clase.objetivo.descripcion} grande />
        </div>
      </section>

      {agenda.length > 0 && (
        <section>
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Lo que haremos hoy
            {clase.duracionTotalMinutos > 0 && (
              <span className="flex items-center gap-1 font-normal normal-case tracking-normal">
                · <Clock size={14} /> {clase.duracionTotalMinutos} min de actividades
              </span>
            )}
          </p>
          <ol className="grid gap-2 sm:grid-cols-2">
            {agenda.map(({ id, icono: Icono, texto, min }, i) => (
              <li key={id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-base sm:text-lg">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-ink-500">
                  {i + 1}
                </span>
                <Icono size={18} className="shrink-0 text-brand-600" />
                <span className="min-w-0 flex-1 truncate">{texto}</span>
                {min !== null && <span className="shrink-0 text-sm text-ink-500">{min} min</span>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function DiapositivaRecurso({ recurso, numero, total }: { recurso: RecursoClase; numero: number; total: number }) {
  const medio = medioDe(recurso);
  const Icono = ICONO_RECURSO[recurso.tipo];
  const [falloImagen, setFalloImagen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-4 [@media(max-height:700px)]:gap-2">
      <div>
        <Etiqueta icono={Icono}>
          Recurso {numero} de {total} · {NOMBRE_TIPO[recurso.tipo]}
        </Etiqueta>
        <h2 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl [@media(max-height:700px)]:text-2xl">{recurso.titulo}</h2>
        {/* En pantallas bajas se omite la unidad para dejar más espacio al video */}
        <p className="mt-1 text-ink-500 [@media(max-height:700px)]:hidden">{recurso.unidad}</p>
      </div>

      {/* Para videos e imágenes, el contenedor mide el espacio libre (container-type: size) y el
          medio usa el máximo que cabe sin tapar el título: 100cqw de ancho o 100cqh de alto. */}
      <div
        className={[
          'flex flex-1 items-center justify-center',
          medio.tipo === 'youtube' || medio.tipo === 'drive' || medio.tipo === 'video' || (medio.tipo === 'imagen' && !falloImagen)
            ? 'min-h-[180px] [container-type:size]'
            : 'min-h-[240px]',
        ].join(' ')}
      >
        {(medio.tipo === 'youtube' || medio.tipo === 'drive') && (
          <div
            className="aspect-video overflow-hidden rounded-2xl bg-black shadow-lg"
            style={{ width: 'min(100cqw, 72rem, 100cqh * 16 / 9)' }}
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
            style={{ maxHeight: '100cqh' }}
            className="max-w-full rounded-2xl bg-white object-contain shadow-lg"
          />
        )}
        {medio.tipo === 'video' && (
          <video
            src={medio.src}
            controls
            style={{ maxHeight: '100cqh' }}
            className="w-full max-w-5xl rounded-2xl bg-black shadow-lg"
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
          <div className="flex max-w-lg flex-col items-center rounded-2xl border border-dashed border-ink-300/50 bg-white px-8 py-10 text-center">
            <Icono size={40} className="text-ink-300" />
            <p className="mt-4 text-lg text-ink-700">Este recurso no tiene un enlace para mostrar.</p>
            <p className="mt-1 text-sm text-ink-500">Puedes agregar uno desde la sección Recursos.</p>
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
    <div className="flex max-w-lg flex-col items-center rounded-2xl bg-white px-8 py-10 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <Icono size={30} />
      </div>
      <p className="mt-4 text-lg text-ink-700">{mensaje}</p>
      {sitio && <p className="mt-1 text-sm text-ink-500">{sitio}</p>}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex h-14 items-center gap-2 rounded-xl bg-brand-600 px-6 text-base font-semibold text-white hover:bg-brand-700"
      >
        <ExternalLink size={20} />
        Abrir recurso
      </a>
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
  const terminado = restanteMs === 0;
  const completo = restanteMs === actividad.duracionMinutos * 60_000 && !corriendo;
  // Aviso de que queda poco: último 25 % del tiempo, como máximo el último minuto.
  const quedaPoco = corriendo && restanteMs <= Math.min(60_000, actividad.duracionMinutos * 15_000);

  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
      <div className="flex-1">
        <Etiqueta icono={Puzzle}>
          Actividad {numero} de {total} · {actividad.duracionMinutos} min
        </Etiqueta>
        <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-5xl">{actividad.titulo}</h2>
        <p className="mt-4 whitespace-pre-line text-xl leading-relaxed text-ink-700 sm:text-2xl">{actividad.descripcion}</p>
      </div>

      <section
        aria-label="Cronómetro"
        className={[
          'flex shrink-0 flex-col items-center rounded-3xl px-6 py-6 shadow-sm transition-colors sm:px-10 lg:w-[380px]',
          terminado ? 'bg-amber-50 ring-2 ring-amber-400' : 'bg-white',
        ].join(' ')}
      >
        <p className="flex items-center gap-2 text-sm font-medium text-ink-500">
          <Clock size={16} />
          {terminado ? '¡Tiempo!' : corriendo ? 'En curso' : completo ? 'Listo para comenzar' : 'En pausa'}
        </p>
        <p
          role="timer"
          aria-live={terminado ? 'assertive' : 'off'}
          className={[
            'mt-1 font-bold tabular-nums leading-none',
            'text-[clamp(4rem,14vw,7.5rem)]',
            terminado ? 'animate-pulse text-amber-600' : quedaPoco ? 'text-amber-600' : 'text-ink-900',
          ].join(' ')}
        >
          {formatoTiempo(restanteMs)}
        </p>
        <div className="mt-5 flex w-full items-center justify-center gap-3">
          {corriendo ? (
            <button
              type="button"
              onClick={onPausar}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 text-base font-semibold text-white hover:bg-ink-700"
            >
              <Pause size={20} /> Pausar
            </button>
          ) : (
            <button
              type="button"
              onClick={terminado ? onReiniciar : onIniciar}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-base font-semibold text-white hover:bg-brand-700"
            >
              {terminado ? <RotateCcw size={20} /> : <Play size={20} />}
              {terminado ? 'Reiniciar' : completo ? 'Iniciar' : 'Continuar'}
            </button>
          )}
          <button
            type="button"
            onClick={onSumarMinuto}
            aria-label="Sumar un minuto"
            title="Sumar un minuto"
            className="flex h-14 items-center gap-1 rounded-xl border border-ink-300/40 px-4 text-base font-medium text-ink-700 hover:bg-surface-muted"
          >
            <Plus size={18} />1
          </button>
          {!completo && !terminado && (
            <button
              type="button"
              onClick={onReiniciar}
              aria-label="Reiniciar cronómetro"
              title="Reiniciar"
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-ink-300/40 text-ink-700 hover:bg-surface-muted"
            >
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Cierre({ clase, onSalir }: { clase: Clase; onSalir: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <div>
        <Flag size={44} className="mx-auto text-brand-600" />
        <h2 className="mt-4 text-4xl font-bold sm:text-6xl">¡Buen trabajo!</h2>
        <p className="mt-3 text-xl text-ink-500 sm:text-2xl">¿Qué aprendimos hoy?</p>
      </div>
      <section className="w-full max-w-4xl rounded-2xl bg-white p-6 text-left shadow-sm sm:p-8">
        <Etiqueta icono={Target}>Recordemos el objetivo · {clase.objetivo.codigo}</Etiqueta>
        <div className="mt-3">
          <TextoObjetivo texto={clase.objetivo.descripcion} />
        </div>
      </section>
      <button
        type="button"
        onClick={onSalir}
        className="rounded-xl border border-ink-300/40 bg-white px-6 py-3 font-medium text-ink-700 hover:bg-surface-muted"
      >
        Volver al planificador
      </button>
    </div>
  );
}
