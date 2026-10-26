import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, HelpCircle, Lightbulb, Loader2, PencilLine, Play, Plus, Rocket, Ticket } from 'lucide-react';
import { api, mensajeDeError } from '../lib/api';
import { idYoutube } from '../lib/medios';
import type { DiapositivaContenido, MaterialOa } from '../lib/tipos';

function Grupo({ icono: Icono, titulo, children }: { icono: typeof Lightbulb; titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 font-bold text-ink-900">
        <Icono size={15} /> {titulo}
      </h3>
      <ol className="flex flex-col gap-2">{children}</ol>
    </section>
  );
}

function Tarjeta({ d, conRespuesta = false }: { d: DiapositivaContenido; conRespuesta?: boolean }) {
  return (
    <li className="rounded-xl bg-surface-muted p-3">
      <p className="font-semibold text-ink-900">
        {d.emoji} {d.titulo}
      </p>
      {d.texto && <p className="mt-1 text-ink-700">{d.texto}</p>}
      {d.puntos && (
        <ul className="mt-1 list-disc pl-5 text-ink-700">
          {d.puntos.map((p, j) => (
            <li key={j}>{p}</li>
          ))}
        </ul>
      )}
      {conRespuesta && d.respuesta && <p className="mt-1 text-emerald-800">Respuesta: {d.respuesta}</p>}
    </li>
  );
}

/**
 * Vista previa del material listo de un OA (la clase completa): preparación, inicio,
 * explicación, videos, práctica, preguntas, actividades y ticket de salida.
 */
export default function VistaMaterial({ objetivoId, accion }: { objetivoId: string; accion?: ReactNode }) {
  const [material, setMaterial] = useState<MaterialOa | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<MaterialOa>(`/curriculum/objetivos/${objetivoId}/material`)
      .then((res) => setMaterial(res.data))
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar el material.')));
  }, [objetivoId]);

  if (error) return <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>;
  if (!material) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-500">
        <Loader2 size={16} className="animate-spin" /> Cargando material…
      </p>
    );
  }

  const de = (...tipos: DiapositivaContenido['tipo'][]) => material.diapositivas.filter((d) => tipos.includes(d.tipo));
  const inicio = de('inicio');
  const explicacion = de('concepto', 'ejemplo');
  const practica = de('practica');
  const preguntas = de('pregunta');
  const cierre = de('cierre');
  const minutos = material.actividades.reduce((t, a) => t + a.duracionMinutos, 0);

  return (
    <div className="flex flex-col gap-5 text-sm">
      <div>
        <p className="text-lg font-bold text-ink-900">{material.tema}</p>
        <p className="text-ink-500">
          {material.objetivo.asignatura} · {material.objetivo.nivel} · {material.objetivo.codigo}
          {minutos > 0 && ` · unos ${20 + minutos} min`}
        </p>
      </div>

      {material.preparacion && (
        <p className="flex items-start gap-2 rounded-xl border-2 border-dashed border-ink-300/70 p-3 text-ink-700">
          <ClipboardList size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>Antes de la clase:</strong> {material.preparacion}
          </span>
        </p>
      )}

      {inicio.length > 0 && (
        <Grupo icono={Rocket} titulo="Para empezar">
          {inicio.map((d, i) => <Tarjeta key={i} d={d} />)}
        </Grupo>
      )}

      {explicacion.length > 0 && (
        <Grupo icono={Lightbulb} titulo="Explicación">
          {explicacion.map((d, i) => <Tarjeta key={i} d={d} />)}
        </Grupo>
      )}

      {material.recursos.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 font-bold text-ink-900">
            <Play size={15} /> Videos
          </h3>
          <ul className="flex flex-col gap-2">
            {material.recursos.map((r) => {
              const id = r.url ? idYoutube(r.url) : null;
              return (
                <li key={r.id}>
                  <a
                    href={r.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border-2 border-ink-300/40 p-2 hover:border-ink-900"
                  >
                    {id ? (
                      <img
                        src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        className="h-14 w-24 shrink-0 rounded-lg bg-ink-300/20 object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                        <Play size={18} />
                      </span>
                    )}
                    <span className="font-semibold text-ink-900">{r.titulo}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {practica.length > 0 && (
        <Grupo icono={PencilLine} titulo="Práctica guiada">
          {practica.map((d, i) => <Tarjeta key={i} d={d} conRespuesta />)}
        </Grupo>
      )}

      {preguntas.length > 0 && (
        <Grupo icono={HelpCircle} titulo="Preguntas para el curso">
          {preguntas.map((d, i) => <Tarjeta key={i} d={d} conRespuesta />)}
        </Grupo>
      )}

      {material.actividades.map((a, i) => (
        <section key={a.id} className="rounded-xl border-2 border-ink-900 bg-[#FFF6D6] p-3">
          <p className="flex items-center justify-between gap-2 font-bold text-ink-900">
            Actividad {i + 1}: {a.titulo}
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-ink-700">
              <Clock size={12} /> {a.duracionMinutos} min
            </span>
          </p>
          <p className="mt-1 text-ink-700">{a.descripcion}</p>
        </section>
      ))}

      {cierre.length > 0 && (
        <Grupo icono={Ticket} titulo="Cierre">
          {cierre.map((d, i) => <Tarjeta key={i} d={d} />)}
        </Grupo>
      )}

      {accion ?? (
        <Link
          to={`/planificador/nueva?objetivo=${objetivoId}`}
          className="flex items-center justify-center gap-1.5 rounded-full border-[2.5px] border-ink-900 bg-sol px-5 py-2.5 font-bold text-ink-900 shadow-sticker-sm"
        >
          <Plus size={16} /> Crear clase con este material
        </Link>
      )}
    </div>
  );
}
