import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
  Search,
  Sparkles,
  Video,
} from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { hoyISO } from '../lib/fechas';
import { urlBusquedaVideos } from '../lib/material';
import type { Actividad, Asignatura, Clase, DatosClase, Objetivo, Recurso } from '../lib/tipos';

const iconoRecurso = { video: Video, documento: FileText, imagen: ImageIcon };

type Errores = Partial<Record<'titulo' | 'fecha' | 'objetivo', string>>;

/** Sección numerada del formulario. */
function Seccion({
  numero,
  titulo,
  ayuda,
  children,
}: {
  numero: number;
  titulo: string;
  ayuda?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border-2 border-ink-900 bg-white shadow-sticker-sm p-5 sm:p-6">
      <h2 className="flex items-center gap-3 font-semibold text-ink-900">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
          {numero}
        </span>
        {titulo}
      </h2>
      {ayuda && <p className="ml-9 mt-1 text-sm text-ink-500">{ayuda}</p>}
      <div className="mt-4 sm:ml-9">{children}</div>
    </section>
  );
}

/** Agrega o quita un elemento manteniendo el orden en que se seleccionó. */
function alternar(lista: string[], id: string) {
  return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
}

export default function FormularioClase() {
  const { id } = useParams<{ id: string }>();
  const editando = !!id;
  const navigate = useNavigate();
  // Desde el explorador curricular: /planificador/nueva?objetivo=ID abre la clase con el material del OA.
  const [parametros] = useSearchParams();
  const objetivoInicial = editando ? null : parametros.get('objetivo');

  // Catálogos
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);

  // Formulario
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [asignaturaId, setAsignaturaId] = useState('');
  const [objetivoId, setObjetivoId] = useState('');
  const [recursoIds, setRecursoIds] = useState<string[]>([]);
  const [actividadIds, setActividadIds] = useState<string[]>([]);
  const [notas, setNotas] = useState('');
  const [usarMaterial, setUsarMaterial] = useState(true);

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const catalogos = Promise.all([
      api.get<Asignatura[]>('/curriculum/asignaturas'),
      api.get<Objetivo[]>('/curriculum/objetivos'),
      api.get<Recurso[]>('/resources'),
      api.get<Actividad[]>('/activities'),
    ]);
    const clase = editando ? api.get<Clase>(`/planner/${id}`) : Promise.resolve(null);

    Promise.all([catalogos, clase])
      .then(([[a, o, r, act], c]) => {
        setAsignaturas(a.data);
        setObjetivos(o.data);
        setRecursos(r.data);
        setActividades(act.data);
        if (c) {
          setTitulo(c.data.titulo);
          setFecha(c.data.fecha);
          setAsignaturaId(c.data.asignatura.id);
          setObjetivoId(c.data.objetivo.id);
          setRecursoIds(c.data.recursos.map((x) => x.id));
          setActividadIds(c.data.actividades.map((x) => x.id));
          setNotas(c.data.notas);
          setUsarMaterial(c.data.usarMaterial ?? true);
        } else if (objetivoInicial && o.data.some((x) => x.id === objetivoInicial)) {
          const oa = o.data.find((x) => x.id === objetivoInicial)!;
          setAsignaturaId(oa.asignaturaId);
          setObjetivoId(oa.id);
          if (oa.tieneMaterial) {
            setRecursoIds(r.data.filter((x) => x.objetivoId === oa.id).map((x) => x.id));
            setActividadIds(act.data.filter((x) => x.objetivoId === oa.id).map((x) => x.id));
            if (oa.tema) setTitulo(oa.tema);
          }
        } else if (a.data.length === 1) {
          setAsignaturaId(a.data[0].id);
        }
      })
      .catch((err) =>
        setErrorCarga(
          mensajeDeError(
            err,
            editando ? 'No se pudo cargar la clase.' : 'No se pudo cargar el currículum.',
          ),
        ),
      )
      .finally(() => setCargando(false));
  }, [editando, id, objetivoInicial]);

  // Solo se muestran los objetivos, recursos y actividades de la asignatura elegida.
  const objetivosAsignatura = useMemo(
    () => objetivos.filter((o) => o.asignaturaId === asignaturaId),
    [objetivos, asignaturaId],
  );
  // Los OA se agrupan por eje (Números y Operaciones, Lectura…), en el orden de las Bases.
  const ejesAsignatura = useMemo(() => {
    const grupos = new Map<string, Objetivo[]>();
    for (const o of objetivosAsignatura) {
      const clave = o.eje ?? '';
      grupos.set(clave, [...(grupos.get(clave) ?? []), o]);
    }
    return [...grupos.entries()];
  }, [objetivosAsignatura]);
  const objetivoElegido = objetivos.find((o) => o.id === objetivoId) ?? null;
  // Primero lo sugerido para el OA elegido (material listo), después el resto de la asignatura.
  const sugeridoPrimero = <T extends { objetivoId: string | null }>(lista: T[]) =>
    [...lista].sort((a, b) => Number(b.objetivoId === objetivoId && !!objetivoId) - Number(a.objetivoId === objetivoId && !!objetivoId));
  const recursosAsignatura = useMemo(
    () => sugeridoPrimero(recursos.filter((r) => r.asignaturaId === asignaturaId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recursos, asignaturaId, objetivoId],
  );
  const actividadesAsignatura = useMemo(
    () => sugeridoPrimero(actividades.filter((a) => a.asignaturaId === asignaturaId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actividades, asignaturaId, objetivoId],
  );
  const recursosSugeridos = recursos.filter((r) => objetivoId && r.objetivoId === objetivoId);
  const actividadesSugeridas = actividades.filter((a) => objetivoId && a.objetivoId === objetivoId);
  const materialAgregado =
    recursosSugeridos.every((r) => recursoIds.includes(r.id)) &&
    actividadesSugeridas.every((a) => actividadIds.includes(a.id));

  /** Agrega a la clase los videos y la actividad sugeridos para el OA (sin quitar lo ya elegido). */
  function usarMaterialSugerido() {
    if (!objetivoElegido) return;
    setRecursoIds((ids) => [...ids, ...recursosSugeridos.map((r) => r.id).filter((x) => !ids.includes(x))]);
    setActividadIds((ids) => [...ids, ...actividadesSugeridas.map((a) => a.id).filter((x) => !ids.includes(x))]);
    if (!titulo.trim() && objetivoElegido.tema) setTitulo(objetivoElegido.tema);
    setUsarMaterial(true);
  }
  const duracionTotal = actividades
    .filter((a) => actividadIds.includes(a.id))
    .reduce((t, a) => t + a.duracionMinutos, 0);

  function cambiarAsignatura(nueva: string) {
    setAsignaturaId(nueva);
    // Lo elegido de otra asignatura deja de aplicar.
    setObjetivoId('');
    setRecursoIds((ids) => ids.filter((x) => recursos.find((r) => r.id === x)?.asignaturaId === nueva));
    setActividadIds((ids) =>
      ids.filter((x) => actividades.find((a) => a.id === x)?.asignaturaId === nueva),
    );
    setErrores((e) => ({ ...e, objetivo: undefined }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nuevos: Errores = {};
    if (!titulo.trim()) nuevos.titulo = 'Ingresa un título para la clase.';
    else if (titulo.trim().length > 120) nuevos.titulo = 'El título no puede superar los 120 caracteres.';
    if (!fecha) nuevos.fecha = 'Elige la fecha de la clase.';
    if (!objetivoId) nuevos.objetivo = 'Selecciona el objetivo de aprendizaje de la clase.';
    setErrores(nuevos);
    setErrorGeneral(null);
    if (Object.keys(nuevos).length > 0) {
      document.getElementById(`campo-${Object.keys(nuevos)[0]}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    const datos: DatosClase = {
      titulo: titulo.trim(),
      fecha,
      objetivoId,
      notas: notas.trim(),
      usarMaterial,
      recursoIds,
      actividadIds,
    };
    setGuardando(true);
    try {
      if (editando) {
        await api.patch(`/planner/${id}`, datos);
      } else {
        await api.post('/planner', datos);
      }
      navigate('/planificador', {
        state: { mensaje: editando ? 'Cambios guardados.' : `Clase «${datos.titulo}» creada.` },
      });
    } catch (err) {
      setErrorGeneral(mensajeDeError(err, 'No se pudo guardar la clase. Inténtalo de nuevo.'));
      setGuardando(false);
    }
  }

  const volver = (
    <Link
      to="/planificador"
      className="flex w-fit items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
    >
      <ArrowLeft size={15} />
      Volver al planificador
    </Link>
  );

  if (cargando) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {volver}
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 size={16} className="animate-spin" />
          Cargando…
        </p>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {volver}
        <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {errorCarga}
        </p>
      </div>
    );
  }

  const claseCampo = (error?: string) =>
    [
      'w-full rounded-xl border-2 bg-white px-3 py-2.5 text-sm outline-none transition-colors',
      error ? 'border-red-400 focus:border-red-500' : 'border-ink-300/70 focus:border-brand-500',
    ].join(' ');

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto flex max-w-3xl flex-col gap-5 pb-24">
      {volver}
      <header>
        <h1 className="text-2xl font-bold text-ink-900">
          {editando ? 'Editar clase' : 'Nueva clase'}
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Elige el objetivo de aprendizaje y arma la clase con los recursos y actividades que vas a
          usar.
        </p>
      </header>

      {errorGeneral && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorGeneral}
        </p>
      )}

      {/* 1. Datos */}
      <Seccion numero={1} titulo="Datos de la clase">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <div id="campo-titulo" className="flex flex-col gap-1.5">
            <label htmlFor="titulo" className="text-sm font-medium text-ink-700">
              Título
            </label>
            <input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={120}
              placeholder="Ej.: Fracciones en la recta numérica"
              aria-invalid={!!errores.titulo}
              className={claseCampo(errores.titulo)}
            />
            {errores.titulo && <p className="text-xs text-red-600">{errores.titulo}</p>}
          </div>
          <div id="campo-fecha" className="flex flex-col gap-1.5">
            <label htmlFor="fecha" className="text-sm font-medium text-ink-700">
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              aria-invalid={!!errores.fecha}
              className={claseCampo(errores.fecha)}
            />
            {errores.fecha && <p className="text-xs text-red-600">{errores.fecha}</p>}
          </div>
        </div>
      </Seccion>

      {/* 2. Objetivo */}
      <Seccion
        numero={2}
        titulo="Objetivo de aprendizaje"
        ayuda="Elige la asignatura y el OA del currículum MINEDUC que trabajarás."
      >
        <div id="campo-objetivo" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="asignatura" className="text-sm font-medium text-ink-700">
              Asignatura y nivel
            </label>
            <select
              id="asignatura"
              value={asignaturaId}
              onChange={(e) => cambiarAsignatura(e.target.value)}
              className={claseCampo()}
            >
              <option value="">Selecciona una asignatura…</option>
              {asignaturas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} · {a.nivel}
                </option>
              ))}
            </select>
          </div>

          {asignaturaId && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-sm font-medium text-ink-700">
                Objetivo (OA)
              </legend>
              {objetivosAsignatura.length === 0 && (
                <p className="text-sm text-ink-500">Esta asignatura aún no tiene objetivos cargados.</p>
              )}
              {ejesAsignatura.map(([eje, lista]) => (
                <div key={eje} className="flex flex-col gap-2">
                  {eje && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                      {eje}
                    </p>
                  )}
                  {lista.map((o) => {
                    const elegido = objetivoId === o.id;
                    return (
                      <label
                        key={o.id}
                        className={[
                          'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-brand-400',
                          elegido
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-ink-300/30 hover:border-ink-300/60',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="objetivo"
                          value={o.id}
                          checked={elegido}
                          onChange={() => {
                            setObjetivoId(o.id);
                            setErrores((e) => ({ ...e, objetivo: undefined }));
                          }}
                          className="mt-0.5 accent-brand-600"
                        />
                        <span className="flex shrink-0 flex-col items-start gap-1">
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                            {o.codigo}
                          </span>
                          {o.tieneMaterial && (
                            <span title="Tiene diapositivas, videos y actividad listos" className="flex items-center gap-0.5 rounded-full bg-sol px-1.5 py-0.5 text-[10px] font-bold text-ink-900">
                              <Sparkles size={10} /> Listo
                            </span>
                          )}
                        </span>
                        <span className="whitespace-pre-line text-ink-700">{o.descripcion}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </fieldset>
          )}
          {errores.objetivo && <p className="text-xs text-red-600">{errores.objetivo}</p>}

          {objetivoElegido && (
            <div
              aria-live="polite"
              className={[
                'rounded-xl border-2 p-4 text-sm',
                objetivoElegido.tieneMaterial ? 'border-ink-900 bg-[#FFF6D6]' : 'border-dashed border-ink-300/60 bg-surface-muted',
              ].join(' ')}
            >
              {objetivoElegido.tieneMaterial ? (
                <>
                  <p className="flex items-center gap-2 font-bold text-ink-900">
                    <Sparkles size={16} className="shrink-0" />
                    Material listo: {objetivoElegido.tema}
                  </p>
                  <p className="mt-1 text-ink-700">
                    Diapositivas de explicación y preguntas para el curso, {recursosSugeridos.length}{' '}
                    {recursosSugeridos.length === 1 ? 'video' : 'videos'} y{' '}
                    {actividadesSugeridas.length === 1 ? 'una actividad sugerida' : `${actividadesSugeridas.length} actividades sugeridas`}.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={usarMaterialSugerido}
                      disabled={materialAgregado}
                      className="flex items-center gap-1.5 rounded-full border-2 border-ink-900 bg-sol px-4 py-1.5 font-bold text-ink-900 shadow-sticker-sm disabled:border-ink-300 disabled:bg-white disabled:text-ink-500 disabled:shadow-none"
                    >
                      {materialAgregado ? <Check size={15} /> : <Sparkles size={15} />}
                      {materialAgregado ? 'Videos y actividad agregados' : 'Usar material sugerido'}
                    </button>
                    <a
                      href={urlBusquedaVideos(objetivoElegido)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border-2 border-ink-300/70 bg-white px-3 py-1.5 font-semibold text-ink-700 hover:border-ink-900"
                    >
                      <Search size={14} /> Buscar más videos
                    </a>
                  </div>
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-ink-700">
                    <input
                      type="checkbox"
                      checked={usarMaterial}
                      onChange={(e) => setUsarMaterial(e.target.checked)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    Mostrar las diapositivas de contenido en el modo presentación
                  </label>
                </>
              ) : (
                <>
                  <p className="font-semibold text-ink-700">Este OA aún no tiene material listo.</p>
                  <p className="mt-1 text-ink-500">
                    Puedes buscar videos para este objetivo y agregarlos como recursos con su enlace de YouTube.
                  </p>
                  <a
                    href={urlBusquedaVideos(objetivoElegido)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-ink-900 bg-white px-4 py-1.5 font-bold text-ink-900 shadow-sticker-sm"
                  >
                    <Search size={14} /> Buscar videos para este OA
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </Seccion>

      {/* 3. Recursos */}
      <Seccion
        numero={3}
        titulo="Recursos"
        ayuda="Opcional. Se presentarán en el orden en que los selecciones."
      >
        {!asignaturaId ? (
          <p className="text-sm text-ink-500">Primero elige una asignatura.</p>
        ) : recursosAsignatura.length === 0 ? (
          <p className="text-sm text-ink-500">Aún no hay recursos para esta asignatura.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {recursosAsignatura.map((r) => {
              const posicion = recursoIds.indexOf(r.id);
              const Icono = iconoRecurso[r.tipo] ?? FileText;
              return (
                <label
                  key={r.id}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-brand-400',
                    posicion >= 0
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-ink-300/30 hover:border-ink-300/60',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={posicion >= 0}
                    onChange={() => setRecursoIds((ids) => alternar(ids, r.id))}
                    className="sr-only"
                  />
                  <span
                    className={[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                      posicion >= 0 ? 'border-2 border-ink-900 bg-sol text-ink-900' : 'bg-brand-100 text-brand-700',
                    ].join(' ')}
                  >
                    {posicion >= 0 ? posicion + 1 : <Icono size={15} />}
                  </span>
                  <span>
                    <span className="block font-medium text-ink-900">{r.titulo}</span>
                    <span className="text-xs text-ink-500">{r.unidad}</span>
                    {objetivoId && r.objetivoId === objetivoId && (
                      <span className="mt-1 flex w-fit items-center gap-0.5 rounded-full bg-sol px-1.5 py-0.5 text-[10px] font-bold text-ink-900">
                        <Sparkles size={10} /> Sugerido para este OA
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </Seccion>

      {/* 4. Actividades */}
      <Seccion
        numero={4}
        titulo="Actividades"
        ayuda="Opcional. Se realizarán en el orden en que las selecciones."
      >
        {!asignaturaId ? (
          <p className="text-sm text-ink-500">Primero elige una asignatura.</p>
        ) : actividadesAsignatura.length === 0 ? (
          <p className="text-sm text-ink-500">Aún no hay actividades para esta asignatura.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {actividadesAsignatura.map((a) => {
              const posicion = actividadIds.indexOf(a.id);
              return (
                <label
                  key={a.id}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-brand-400',
                    posicion >= 0
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-ink-300/30 hover:border-ink-300/60',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={posicion >= 0}
                    onChange={() => setActividadIds((ids) => alternar(ids, a.id))}
                    className="sr-only"
                  />
                  <span
                    className={[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                      posicion >= 0 ? 'border-2 border-ink-900 bg-sol text-ink-900' : 'border border-ink-300/50 text-ink-300',
                    ].join(' ')}
                  >
                    {posicion >= 0 ? posicion + 1 : <Check size={14} />}
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-ink-900">{a.titulo}</span>
                    <span className="text-ink-500">{a.descripcion}</span>
                    {objetivoId && a.objetivoId === objetivoId && (
                      <span className="mt-1 flex w-fit items-center gap-0.5 rounded-full bg-sol px-1.5 py-0.5 text-[10px] font-bold text-ink-900">
                        <Sparkles size={10} /> Sugerida para este OA
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-ink-500">
                    <Clock size={13} />
                    {a.duracionMinutos} min
                  </span>
                </label>
              );
            })}
            {actividadIds.length > 0 && (
              <p className="mt-1 text-right text-sm text-ink-700">
                Duración total de las actividades: <strong>{duracionTotal} min</strong>
              </p>
            )}
          </div>
        )}
      </Seccion>

      {/* 5. Notas */}
      <Seccion numero={5} titulo="Notas" ayuda="Opcional. Recordatorios para ti, no se muestran a los estudiantes.">
        <textarea
          id="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Ej.: llevar reglas, formar grupos de 4…"
          className={claseCampo()}
        />
      </Seccion>

      {/* Barra de acciones fija (en pantallas grandes empieza después de la barra lateral) */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-ink-300/20 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3 px-4 py-3 sm:px-8">
          <Link
            to="/planificador"
            className="rounded-lg border border-ink-300/40 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 whitespace-nowrap rounded-full border-[2.5px] border-ink-900 bg-sol px-5 py-2 text-sm font-bold text-ink-900 hover:bg-[#FFD35A] disabled:opacity-70 shadow-sticker-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {guardando && <Loader2 size={15} className="animate-spin" />}
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear clase'}
          </button>
        </div>
      </div>
    </form>
  );
}
