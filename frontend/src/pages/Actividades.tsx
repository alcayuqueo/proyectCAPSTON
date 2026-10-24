import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Loader2, Pencil, Plus, Puzzle, Search, Trash2 } from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { claseCampo, ordenarAsignaturas, useAviso } from '../lib/formularios';
import type { Actividad, Asignatura } from '../lib/tipos';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Campo from '../components/Campo';
import ConfirmDialog from '../components/ConfirmDialog';
import SelectorOrigen, { type Origen } from '../components/SelectorOrigen';

interface Datos {
  titulo: string;
  descripcion: string;
  duracionMinutos: string; // texto mientras se escribe; se envía como número
  asignaturaId: string;
}
type Errores = Partial<Record<keyof Datos, string>>;

const VACIO: Datos = { titulo: '', descripcion: '', duracionMinutos: '15', asignaturaId: '' };
const DURACIONES_SUGERIDAS = [10, 15, 20, 30, 45];

/** id del campo de cada dato, para llevar el foco al primer error. */
const ID_CAMPO: Record<keyof Datos, string> = {
  titulo: 'a-titulo',
  descripcion: 'a-descripcion',
  duracionMinutos: 'a-duracion',
  asignaturaId: 'a-asignatura',
};

/** Las mismas reglas que valida el backend, para avisar antes de enviar. */
function validar(d: Datos): Errores {
  const e: Errores = {};
  if (!d.titulo.trim()) e.titulo = 'Ingresa un título para la actividad.';
  if (!d.descripcion.trim()) e.descripcion = 'Describe brevemente la actividad.';
  const min = Number(d.duracionMinutos);
  if (!d.duracionMinutos.trim() || !Number.isInteger(min)) {
    e.duracionMinutos = 'La duración debe ser un número entero de minutos.';
  } else if (min < 1 || min > 240) {
    e.duracionMinutos = 'La duración debe estar entre 1 y 240 minutos.';
  }
  if (!d.asignaturaId) e.asignaturaId = 'Selecciona la asignatura y el nivel.';
  return e;
}

export default function Actividades() {
  const { usuario } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useAviso();

  // Filtros
  const [texto, setTexto] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [origen, setOrigen] = useState<Origen>('todos');

  // Formulario (crear o editar)
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Actividad | null>(null);
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Eliminar
  const [porEliminar, setPorEliminar] = useState<Actividad | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(() => {
    return api
      .get<Actividad[]>('/activities')
      .then((res) => {
        setActividades(res.data);
        setError(null);
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar las actividades.')))
      .finally(() => setCargando(false));
  }, []);

  // Se vuelve a cargar al iniciar o cerrar sesión (cambian las actividades propias).
  useEffect(() => {
    cargar();
  }, [cargar, usuario?.id]);

  useEffect(() => {
    api
      .get<Asignatura[]>('/curriculum/asignaturas')
      .then((res) => setAsignaturas(ordenarAsignaturas(res.data)))
      .catch(() => {});
  }, []);

  const visibles = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return actividades.filter(
      (a) =>
        (!asignaturaId || a.asignaturaId === asignaturaId) &&
        (origen === 'todos' || (origen === 'propios' ? a.propio : !a.propio)) &&
        (!q || `${a.titulo} ${a.descripcion}`.toLowerCase().includes(q)),
    );
  }, [actividades, texto, asignaturaId, origen]);

  const cantidadPropias = actividades.filter((a) => a.propio).length;
  const otrosFiltros = Boolean(texto || asignaturaId);

  function abrirNueva() {
    setEditando(null);
    setDatos({ ...VACIO, asignaturaId });
    setErrores({});
    setErrorForm(null);
    setFormAbierto(true);
  }

  function abrirEdicion(a: Actividad) {
    setEditando(a);
    setDatos({
      titulo: a.titulo,
      descripcion: a.descripcion,
      duracionMinutos: String(a.duracionMinutos),
      asignaturaId: a.asignaturaId,
    });
    setErrores({});
    setErrorForm(null);
    setFormAbierto(true);
  }

  const cerrarForm = useCallback(() => setFormAbierto(false), []);

  function cambiar<K extends keyof Datos>(campo: K, valor: Datos[K]) {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const nuevos = validar(datos);
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      document.getElementById(ID_CAMPO[Object.keys(nuevos)[0] as keyof Datos])?.focus();
      return;
    }
    setGuardando(true);
    setErrorForm(null);
    const cuerpo = {
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      duracionMinutos: Number(datos.duracionMinutos),
      asignaturaId: datos.asignaturaId,
    };
    try {
      if (editando) {
        await api.patch(`/activities/${editando.id}`, cuerpo);
        setAviso(`Se guardaron los cambios de «${cuerpo.titulo}».`);
      } else {
        await api.post('/activities', cuerpo);
        setAviso(`Se agregó «${cuerpo.titulo}» a tus actividades.`);
        if (origen === 'catalogo') setOrigen('todos');
      }
      setFormAbierto(false);
      await cargar();
    } catch (err) {
      setErrorForm(mensajeDeError(err, 'No se pudo guardar la actividad.'));
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (!porEliminar) return;
    setEliminando(true);
    try {
      await api.delete(`/activities/${porEliminar.id}`);
      setAviso(`Se eliminó «${porEliminar.titulo}».`);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar la actividad.'));
    } finally {
      setPorEliminar(null);
      setEliminando(false);
    }
  }

  function limpiarFiltros() {
    setTexto('');
    setAsignaturaId('');
    setOrigen('todos');
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
            <Puzzle size={22} className="text-brand-600" />
            Actividades
          </h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Actividades para realizar en clase con la pantalla interactiva. Usa las del catálogo o
            crea las tuyas.
          </p>
        </div>
        {usuario && (
          <button
            type="button"
            onClick={abrirNueva}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={16} />
            Nueva actividad
          </button>
        )}
      </header>

      {!usuario && (
        <p className="rounded-lg border border-ink-300/20 bg-white px-4 py-3 text-sm text-ink-700">
          Estás viendo el catálogo.{' '}
          <Link to="/login" state={{ desde: '/actividades' }} className="font-medium text-brand-700 hover:underline">
            Inicia sesión
          </Link>{' '}
          para crear tus propias actividades.
        </p>
      )}

      {aviso && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <CheckCircle2 size={16} />
          {aviso}
        </p>
      )}

      {/* Filtros */}
      <div className="flex flex-col gap-3 rounded-card border border-ink-300/20 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar actividades…"
              aria-label="Buscar actividades"
              className="w-full rounded-lg border border-ink-300/30 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <select
            aria-label="Filtrar por asignatura y nivel"
            value={asignaturaId}
            onChange={(e) => setAsignaturaId(e.target.value)}
            className={claseCampo()}
          >
            <option value="">Todas las asignaturas y niveles</option>
            {asignaturas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} · {a.nivel}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {usuario ? (
            <SelectorOrigen valor={origen} onCambiar={setOrigen} etiquetaPropios={`Mis actividades (${cantidadPropias})`} />
          ) : (
            <span />
          )}
          <span className="text-xs text-ink-500">
            <span aria-live="polite">
              {visibles.length} actividad{visibles.length === 1 ? '' : 'es'}
            </span>
            {(otrosFiltros || origen !== 'todos') && (
              <button type="button" onClick={limpiarFiltros} className="ml-3 font-medium text-brand-700 hover:underline">
                Limpiar filtros
              </button>
            )}
          </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {cargando && (
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 size={16} className="animate-spin" />
          Cargando actividades…
        </p>
      )}

      {!cargando && !error && visibles.length === 0 && (
        <div className="rounded-card border border-dashed border-ink-300/40 bg-white px-6 py-10 text-center">
          <p className="font-medium text-ink-900">
            {origen === 'propios' && !otrosFiltros
              ? 'Aún no has creado actividades propias.'
              : 'No hay actividades que coincidan con los filtros.'}
          </p>
          {usuario && <p className="mt-1 text-sm text-ink-500">Usa «Nueva actividad» para crear una.</p>}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {visibles.map((a) => (
          <li key={a.id} className="rounded-card border border-ink-300/20 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-medium text-ink-900">{a.titulo}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {a.asignatura} · {a.nivel}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {a.propio && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                    Mía
                  </span>
                )}
                <span className="flex items-center gap-1 whitespace-nowrap text-xs text-ink-500">
                  <Clock size={13} />
                  {a.duracionMinutos} min
                </span>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{a.descripcion}</p>
            {(a.usos > 0 || a.propio) && (
              <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
                <span>{a.usos > 0 ? `En ${a.usos} clase${a.usos === 1 ? '' : 's'}` : ''}</span>
                {a.propio && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => abrirEdicion(a)}
                      aria-label={`Editar «${a.titulo}»`}
                      title="Editar"
                      className="rounded-lg p-2 text-ink-500 hover:bg-ink-300/10 hover:text-ink-900"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPorEliminar(a)}
                      aria-label={`Eliminar «${a.titulo}»`}
                      title="Eliminar"
                      className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <Modal
        abierto={formAbierto}
        titulo={editando ? 'Editar actividad' : 'Nueva actividad'}
        onCerrar={cerrarForm}
        bloqueado={guardando}
      >
        <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
          {errorForm && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorForm}
            </p>
          )}
          <Campo id="a-titulo" etiqueta="Título" error={errores.titulo}>
            <input
              id="a-titulo"
              value={datos.titulo}
              onChange={(e) => cambiar('titulo', e.target.value)}
              placeholder="Ej.: Fracciones en la recta numérica"
              maxLength={120}
              aria-invalid={!!errores.titulo}
              aria-describedby={errores.titulo ? 'a-titulo-error' : undefined}
              className={claseCampo(errores.titulo)}
            />
          </Campo>

          <Campo id="a-asignatura" etiqueta="Asignatura y nivel" error={errores.asignaturaId}>
            <select
              id="a-asignatura"
              value={datos.asignaturaId}
              onChange={(e) => cambiar('asignaturaId', e.target.value)}
              aria-invalid={!!errores.asignaturaId}
              aria-describedby={errores.asignaturaId ? 'a-asignatura-error' : undefined}
              className={claseCampo(errores.asignaturaId)}
            >
              <option value="">Selecciona…</option>
              {asignaturas.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nombre} · {x.nivel}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            id="a-descripcion"
            etiqueta="Descripción"
            ayuda="Qué hacen los estudiantes y cómo se usa la pantalla."
            error={errores.descripcion}
          >
            <textarea
              id="a-descripcion"
              value={datos.descripcion}
              onChange={(e) => cambiar('descripcion', e.target.value)}
              rows={4}
              maxLength={1000}
              aria-invalid={!!errores.descripcion}
              aria-describedby={errores.descripcion ? 'a-descripcion-error' : 'a-descripcion-ayuda'}
              className={`${claseCampo(errores.descripcion)} resize-y`}
            />
          </Campo>

          <Campo id="a-duracion" etiqueta="Duración (minutos)" error={errores.duracionMinutos}>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="a-duracion"
                type="number"
                inputMode="numeric"
                min={1}
                max={240}
                step={1}
                value={datos.duracionMinutos}
                onChange={(e) => cambiar('duracionMinutos', e.target.value)}
                aria-invalid={!!errores.duracionMinutos}
                aria-describedby={errores.duracionMinutos ? 'a-duracion-error' : undefined}
                className={`${claseCampo(errores.duracionMinutos)} w-24`}
              />
              {DURACIONES_SUGERIDAS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => cambiar('duracionMinutos', String(m))}
                  aria-pressed={datos.duracionMinutos === String(m)}
                  className={[
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    datos.duracionMinutos === String(m)
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-ink-300/30 text-ink-700 hover:border-ink-300/60',
                  ].join(' ')}
                >
                  {m} min
                </button>
              ))}
            </div>
          </Campo>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={cerrarForm}
              disabled={guardando}
              className="rounded-lg border border-ink-300/40 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-70"
            >
              {guardando && <Loader2 size={15} className="animate-spin" />}
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear actividad'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={!!porEliminar}
        titulo="¿Eliminar esta actividad?"
        mensaje={
          porEliminar
            ? `«${porEliminar.titulo}» se eliminará de forma permanente.` +
              (porEliminar.usos > 0
                ? ` También se quitará de ${porEliminar.usos === 1 ? 'la clase' : `las ${porEliminar.usos} clases`} donde la usas.`
                : '')
            : ''
        }
        textoConfirmar="Eliminar"
        procesando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPorEliminar(null)}
      />
    </div>
  );
}
