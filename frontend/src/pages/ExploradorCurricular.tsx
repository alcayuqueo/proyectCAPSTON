import { useEffect, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { api } from '../lib/api';

interface Objetivo {
  id: string;
  codigo: string;
  descripcion: string;
  asignatura: string;
  nivel: string;
}

export default function ExploradorCurricular() {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Objetivo[]>('/curriculum/objetivos', { params: { q: query } })
      .then((res) => setObjetivos(res.data))
      .catch(() => setError('No se pudo conectar con el backend todavía.'))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
          <BookOpen size={22} className="text-brand-600" />
          Explorador curricular
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Busca objetivos de aprendizaje (OA) del MINEDUC por asignatura, nivel
          o palabra clave.
        </p>
      </header>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: fracciones, 5° básico, ciencias naturales..."
          className="w-full rounded-lg border border-ink-300/30 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error} Conecta el backend en <code>/api/curriculum/objetivos</code>{' '}
          para ver datos reales.
        </p>
      )}

      {!error && loading && (
        <p className="text-sm text-ink-500">Cargando objetivos…</p>
      )}

      {!error && !loading && objetivos.length === 0 && (
        <p className="text-sm text-ink-500">
          No hay objetivos que coincidan con tu búsqueda.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {objetivos.map((o) => (
          <li
            key={o.id}
            className="rounded-card border border-ink-300/20 bg-white p-4"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-brand-700">
              <span className="rounded-full bg-brand-100 px-2 py-0.5">
                {o.codigo}
              </span>
              <span className="text-ink-500">
                {o.asignatura} · {o.nivel}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-900">{o.descripcion}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
