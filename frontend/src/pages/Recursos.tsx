import { useEffect, useState } from 'react';
import { Layers, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';

interface Recurso {
  id: string;
  titulo: string;
  tipo: 'video' | 'documento' | 'imagen';
  asignatura: string;
  unidad: string;
}

const iconByTipo = {
  video: Video,
  documento: FileText,
  imagen: ImageIcon,
};

export default function Recursos() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Recurso[]>('/resources')
      .then((res) => setRecursos(res.data))
      .catch(() => setError('No se pudo conectar con el backend todavía.'));
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
          <Layers size={22} className="text-brand-600" />
          Recursos
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Material interactivo listo para proyectar: videos, guías e imágenes
          organizadas por unidad.
        </p>
      </header>

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error} Conecta el backend en <code>/api/resources</code> para ver
          datos reales.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {recursos.map((r) => {
          const Icon = iconByTipo[r.tipo];
          return (
            <div
              key={r.id}
              className="flex items-start gap-3 rounded-card border border-ink-300/20 bg-white p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <Icon size={16} />
              </div>
              <div>
                <p className="font-medium text-ink-900">{r.titulo}</p>
                <p className="text-xs text-ink-500">
                  {r.asignatura} · {r.unidad}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
