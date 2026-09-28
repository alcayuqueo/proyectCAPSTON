import { useEffect, useState } from 'react';
import { Puzzle, Clock } from 'lucide-react';
import { api } from '../lib/api';

interface Actividad {
  id: string;
  titulo: string;
  descripcion: string;
  duracionMinutos: number;
  asignatura: string;
}

export default function Actividades() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Actividad[]>('/activities')
      .then((res) => setActividades(res.data))
      .catch(() => setError('No se pudo conectar con el backend todavía.'));
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
          <Puzzle size={22} className="text-brand-600" />
          Actividades
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Actividades listas para realizar en clase junto a tus estudiantes.
        </p>
      </header>

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error} Conecta el backend en <code>/api/activities</code> para ver
          datos reales.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {actividades.map((a) => (
          <li
            key={a.id}
            className="rounded-card border border-ink-300/20 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink-900">{a.titulo}</p>
              <span className="flex items-center gap-1 text-xs text-ink-500">
                <Clock size={13} />
                {a.duracionMinutos} min
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-500">{a.descripcion}</p>
            <span className="mt-2 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              {a.asignatura}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
