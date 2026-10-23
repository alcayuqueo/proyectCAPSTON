import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
  Video,
} from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { hoyISO } from '../lib/fechas';
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
    <section className="rounded-card border border-ink-300/20 bg-white p-5 sm:p-6">
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
  }, [editando, id]);

  // Solo se muestran los objetivos, recursos y actividades de la asignatura elegida.
  const objetivosAsignatura = useMemo(
    () => objetivos.filter((o) => o.asignaturaId === asignaturaId),
    [objetivos, asignaturaId],
  );
  const recursosAsignatura = useMemo(
    () => recursos.filter((r) => r.asignaturaId === asignaturaId),
    [recursos, asignaturaId],
  );
  const actividadesAsignatura = useMemo(
    () => actividades.filter((a) => a.asignaturaId === asignaturaId),
    [actividades, asignaturaId],
  );
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
      'w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors',
      error ? 'border-red-400 focus:border-red-500' : 'border-ink-300/40 focus:border-brand-500',
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
              {objetivosAsignatura.map((o) => {
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
                    <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      {o.codigo}
                    </span>
                    <span className="text-ink-700">{o.descripcion}</span>
                  </label>
                );
              })}
            </fieldset>
          )}
          {errores.objetivo && <p className="text-xs text-red-600">{errores.objetivo}</p>}
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
                      posicion >= 0 ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700',
                    ].join(' ')}
                  >
                    {posicion >= 0 ? posicion + 1 : <Icono size={15} />}
                  </span>
                  <span>
                    <span className="block font-medium text-ink-900">{r.titulo}</span>
                    <span className="text-xs text-ink-500">{r.unidad}</span>
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
                      posicion >= 0 ? 'bg-brand-600 text-white' : 'border border-ink-300/50 text-ink-300',
                    ].join(' ')}
                  >
                    {posicion >= 0 ? posicion + 1 : <Check size={14} />}
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-ink-900">{a.titulo}</span>
                    <span className="text-ink-500">{a.descripcion}</span>
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

      {/* Barra de acciones fija */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-ink-300/20 bg-white/95 backdrop-blur left-64">
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
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-70"
          >
            {guardando && <Loader2 size={15} className="animate-spin" />}
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear clase'}
          </button>
        </div>
      </div>
    </form>
  );
}
