import { useEffect, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { api } from '../lib/api';

interface Plan {
  id: string;
  fecha: string;
  asignatura: string;
  objetivoCodigo: string;
  notas: string;
}

export default function Planificador() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Plan[]>('/planner')
      .then((res) => setPlanes(res.data))
      .catch(() => setError('No se pudo conectar con el backend todavía.'));
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
            <CalendarDays size={22} className="text-brand-600" />
            Planificador
          </h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Combina objetivos, recursos y actividades en tu clase.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus size={16} />
          Nueva clase
        </button>
      </header>

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error} Conecta el backend en <code>/api/planner</code> para ver
          datos reales.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {planes.map((p) => (
          <li
            key={p.id}
            className="rounded-card border border-ink-300/20 bg-white p-4"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink-900">{p.asignatura}</span>
              <span className="text-ink-500">{p.fecha}</span>
            </div>
            <p className="mt-1 text-xs text-brand-700">
              OA {p.objetivoCodigo}
            </p>
            <p className="mt-2 text-sm text-ink-500">{p.notas}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
