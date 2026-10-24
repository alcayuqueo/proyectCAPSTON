import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Video,
} from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { claseCampo, ordenarAsignaturas, useAviso } from '../lib/formularios';
import type { Asignatura, Recurso, TipoRecurso } from '../lib/tipos';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Campo from '../components/Campo';
import ConfirmDialog from '../components/ConfirmDialog';
import SelectorOrigen, { type Origen } from '../components/SelectorOrigen';

const TIPOS: { valor: TipoRecurso; etiqueta: string; icono: typeof Video }[] = [
  { valor: 'video', etiqueta: 'Video', icono: Video },
  { valor: 'documento', etiqueta: 'Documento', icono: FileText },
  { valor: 'imagen', etiqueta: 'Imagen', icono: ImageIcon },
];
const iconoDe = (tipo: TipoRecurso) => TIPOS.find((t) => t.valor === tipo)?.icono ?? FileText;

interface Datos {
  titulo: string;
  tipo: TipoRecurso;
  url: string;
  unidad: string;
  asignaturaId: string;
}
type Errores = Partial<Record<keyof Datos, string>>;

/** id del campo de cada dato, para llevar el foco al primer error. */
const ID_CAMPO: Record<keyof Datos, string> = {
  titulo: 'r-titulo',
  tipo: 'r-titulo',
  url: 'r-url',
  unidad: 'r-unidad',
  asignaturaId: 'r-asignatura',
};

const VACIO: Datos = { titulo: '', tipo: 'video', url: '', unidad: '', asignaturaId: '' };

/** Las mismas reglas que valida el backend, para avisar antes de enviar. */
function validar(d: Datos): Errores {
  const e: Errores = {};
  if (!d.titulo.trim()) e.titulo = 'Ingresa un título para el recurso.';
  if (!d.unidad.trim()) e.unidad = 'Indica la unidad o tema del recurso.';
  if (!d.asignaturaId) e.asignaturaId = 'Selecciona la asignatura y el nivel.';
  const url = d.url.trim();
  if (url && !/^https?:\/\/[^\s/.]+\.[^\s]+$/i.test(url)) {
    e.url = 'El enlace debe ser una dirección web que empiece con http:// o https://.';
  }
  return e;
}

export default function Recursos() {
  const { usuario } = useAuth();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useAviso();

  // Filtros
  const [texto, setTexto] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [tipo, setTipo] = useState<TipoRecurso | ''>('');
  const [origen, setOrigen] = useState<Origen>('todos');

  // Formulario (crear o editar)
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Recurso | null>(null);
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Eliminar
  const [porEliminar, setPorEliminar] = useState<Recurso | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(() => {
    return api
      .get<Recurso[]>('/resources')
      .then((res) => {
        setRecursos(res.data);
        setError(null);
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar los recursos.')))
      .finally(() => setCargando(false));
  }, []);

  // Se vuelve a cargar al iniciar o cerrar sesión (cambian los recursos propios).
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
    return recursos.filter(
      (r) =>
        (!asignaturaId || r.asignaturaId === asignaturaId) &&
        (!tipo || r.tipo === tipo) &&
        (origen === 'todos' || (origen === 'propios' ? r.propio : !r.propio)) &&
        (!q || `${r.titulo} ${r.unidad} ${r.asignatura}`.toLowerCase().includes(q)),
    );
  }, [recursos, texto, asignaturaId, tipo, origen]);

  const cantidadPropios = recursos.filter((r) => r.propio).length;
  const otrosFiltros = Boolean(texto || asignaturaId || tipo);

  function abrirNuevo() {
    setEditando(null);
    setDatos({ ...VACIO, asignaturaId }); // el filtro de asignatura, si hay, se usa como sugerencia
    setErrores({});
    setErrorForm(null);
    setFormAbierto(true);
  }

  function abrirEdicion(r: Recurso) {
    setEditando(r);
    setDatos({ titulo: r.titulo, tipo: r.tipo, url: r.url ?? '', unidad: r.unidad, asignaturaId: r.asignaturaId });
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
    const cuerpo = { ...datos, titulo: datos.titulo.trim(), unidad: datos.unidad.trim(), url: datos.url.trim() };
    try {
      if (editando) {
        await api.patch(`/resources/${editando.id}`, cuerpo);
        setAviso(`Se guardaron los cambios de «${cuerpo.titulo}».`);
      } else {
        await api.post('/resources', cuerpo);
        setAviso(`Se agregó «${cuerpo.titulo}» a tus recursos.`);
        if (origen === 'catalogo') setOrigen('todos'); // para que se vea el recurso nuevo
      }
      setFormAbierto(false);
      await cargar();
    } catch (err) {
      setErrorForm(mensajeDeError(err, 'No se pudo guardar el recurso.'));
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (!porEliminar) return;
    setEliminando(true);
    try {
      await api.delete(`/resources/${porEliminar.id}`);
      setAviso(`Se eliminó «${porEliminar.titulo}».`);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar el recurso.'));
    } finally {
      setPorEliminar(null);
      setEliminando(false);
    }
  }

  function limpiarFiltros() {
    setTexto('');
    setAsignaturaId('');
    setTipo('');
    setOrigen('todos');
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
            <Layers size={22} className="text-brand-600" />
            Recursos
          </h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Material listo para proyectar: videos, guías e imágenes. Usa los del catálogo o agrega
            los tuyos.
          </p>
        </div>
        {usuario && (
          <button
            type="button"
            onClick={abrirNuevo}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={16} />
            Nuevo recurso
          </button>
        )}
      </header>

      {!usuario && (
        <p className="rounded-lg border border-ink-300/20 bg-white px-4 py-3 text-sm text-ink-700">
          Estás viendo el catálogo.{' '}
          <Link to="/login" state={{ desde: '/recursos' }} className="font-medium text-brand-700 hover:underline">
            Inicia sesión
          </Link>{' '}
          para agregar tus propios recursos.
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
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por título o unidad…"
            aria-label="Buscar recursos"
            className="w-full rounded-lg border border-ink-300/30 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <select
            aria-label="Filtrar por tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoRecurso | '')}
            className={claseCampo()}
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {usuario ? (
            <SelectorOrigen valor={origen} onCambiar={setOrigen} etiquetaPropios={`Mis recursos (${cantidadPropios})`} />
          ) : (
            <span />
          )}
          <span className="text-xs text-ink-500">
            <span aria-live="polite">
              {visibles.length} recurso{visibles.length === 1 ? '' : 's'}
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
          Cargando recursos…
        </p>
      )}

      {!cargando && !error && visibles.length === 0 && (
        <div className="rounded-card border border-dashed border-ink-300/40 bg-white px-6 py-10 text-center">
          <p className="font-medium text-ink-900">
            {origen === 'propios' && !otrosFiltros
              ? 'Aún no has agregado recursos propios.'
              : 'No hay recursos que coincidan con los filtros.'}
          </p>
          {usuario && <p className="mt-1 text-sm text-ink-500">Usa «Nuevo recurso» para agregar uno.</p>}
        </div>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibles.map((r) => {
          const Icono = iconoDe(r.tipo);
          return (
            <li key={r.id} className="flex flex-col gap-3 rounded-card border border-ink-300/20 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Icono size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium text-ink-900">{r.titulo}</p>
                  <p className="text-xs text-ink-500">
                    {r.asignatura} · {r.nivel} · {r.unidad}
                  </p>
                </div>
                {r.propio && (
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                    Mío
                  </span>
                )}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 text-xs text-ink-500">
                <span>{r.usos > 0 ? `En ${r.usos} clase${r.usos === 1 ? '' : 's'}` : ''}</span>
                <div className="flex items-center gap-1">
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium text-brand-700 hover:bg-brand-50"
                    >
                      <ExternalLink size={13} />
                      Abrir
                    </a>
                  )}
                  {r.propio && (
                    <>
                      <button
                        type="button"
                        onClick={() => abrirEdicion(r)}
                        aria-label={`Editar «${r.titulo}»`}
                        title="Editar"
                        className="rounded-lg p-2 text-ink-500 hover:bg-ink-300/10 hover:text-ink-900"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPorEliminar(r)}
                        aria-label={`Eliminar «${r.titulo}»`}
                        title="Eliminar"
                        className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        abierto={formAbierto}
        titulo={editando ? 'Editar recurso' : 'Nuevo recurso'}
        onCerrar={cerrarForm}
        bloqueado={guardando}
      >
        <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
          {errorForm && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorForm}
            </p>
          )}
          <Campo id="r-titulo" etiqueta="Título" error={errores.titulo}>
            <input
              id="r-titulo"
              value={datos.titulo}
              onChange={(e) => cambiar('titulo', e.target.value)}
              placeholder="Ej.: Video: ¿Qué es una fracción?"
              maxLength={120}
              aria-invalid={!!errores.titulo}
              aria-describedby={errores.titulo ? 'r-titulo-error' : undefined}
              className={claseCampo(errores.titulo)}
            />
          </Campo>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink-700">Tipo</legend>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(({ valor, etiqueta, icono: Icono }) => (
                <label
                  key={valor}
                  className={[
                    'flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-brand-400',
                    datos.tipo === valor
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-ink-300/30 text-ink-700 hover:border-ink-300/60',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={valor}
                    checked={datos.tipo === valor}
                    onChange={() => cambiar('tipo', valor)}
                    className="sr-only"
                  />
                  <Icono size={18} />
                  {etiqueta}
                </label>
              ))}
            </div>
          </fieldset>

          <Campo id="r-asignatura" etiqueta="Asignatura y nivel" error={errores.asignaturaId}>
            <select
              id="r-asignatura"
              value={datos.asignaturaId}
              onChange={(e) => cambiar('asignaturaId', e.target.value)}
              aria-invalid={!!errores.asignaturaId}
              aria-describedby={errores.asignaturaId ? 'r-asignatura-error' : undefined}
              className={claseCampo(errores.asignaturaId)}
            >
              <option value="">Selecciona…</option>
              {asignaturas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} · {a.nivel}
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="r-unidad" etiqueta="Unidad o tema" error={errores.unidad}>
            <input
              id="r-unidad"
              value={datos.unidad}
              onChange={(e) => cambiar('unidad', e.target.value)}
              placeholder="Ej.: Unidad 2 · Fracciones"
              maxLength={80}
              aria-invalid={!!errores.unidad}
              aria-describedby={errores.unidad ? 'r-unidad-error' : undefined}
              className={claseCampo(errores.unidad)}
            />
          </Campo>

          <Campo
            id="r-url"
            etiqueta="Enlace"
            opcional
            ayuda="Dirección del video, documento o imagen (YouTube, Drive, etc.)."
            error={errores.url}
          >
            <input
              id="r-url"
              type="url"
              inputMode="url"
              value={datos.url}
              onChange={(e) => cambiar('url', e.target.value)}
              placeholder="https://"
              maxLength={500}
              aria-invalid={!!errores.url}
              aria-describedby={errores.url ? 'r-url-error' : 'r-url-ayuda'}
              className={claseCampo(errores.url)}
            />
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
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar recurso'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={!!porEliminar}
        titulo="¿Eliminar este recurso?"
        mensaje={
          porEliminar
            ? `«${porEliminar.titulo}» se eliminará de forma permanente.` +
              (porEliminar.usos > 0
                ? ` También se quitará de ${porEliminar.usos === 1 ? 'la clase' : `las ${porEliminar.usos} clases`} donde lo usas.`
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
