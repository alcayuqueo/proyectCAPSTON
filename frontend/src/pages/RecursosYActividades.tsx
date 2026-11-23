import { useLocation, useNavigate } from 'react-router-dom';
import { Layers, Puzzle } from 'lucide-react';
import Recursos from './Recursos';
import Actividades from './Actividades';

/**
 * Recursos y actividades en una sola sección del menú, con dos pestañas.
 * Cada pestaña mantiene su propia ruta (/recursos y /actividades), así los enlaces
 * anteriores siguen funcionando.
 */
export default function RecursosYActividades() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const vista = pathname.startsWith('/actividades') ? 'actividades' : 'recursos';

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-ink-900">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-ink-900 shadow-sticker-sm" style={{ background: '#F6C2D6' }} aria-hidden="true">
            <Layers size={22} />
          </span>
          Recursos y actividades
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Videos, guías e imágenes para proyectar, y actividades para realizar en clase con la
          pantalla interactiva. Usa los del catálogo o agrega los tuyos.
        </p>
      </header>

      <div role="tablist" aria-label="Recursos y actividades" className="flex w-full gap-1 rounded-full border-2 border-ink-900 bg-white p-1 shadow-sticker-sm sm:w-fit">
        {(
          [
            ['recursos', 'Recursos', Layers],
            ['actividades', 'Actividades', Puzzle],
          ] as const
        ).map(([v, texto, Icono]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={vista === v}
            onClick={() => navigate(`/${v}`, { replace: true })}
            className={[
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold transition-colors sm:flex-none',
              vista === v ? 'bg-sol text-ink-900' : 'text-ink-500 hover:text-ink-900',
            ].join(' ')}
          >
            <Icono size={15} />
            {texto}
          </button>
        ))}
      </div>

      {vista === 'recursos' ? <Recursos key="recursos" embebido /> : <Actividades key="actividades" embebido />}
    </div>
  );
}
