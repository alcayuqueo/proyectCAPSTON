import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, GraduationCap, MonitorPlay } from 'lucide-react';

const beneficios = [
  { icon: BookOpen, texto: 'Objetivos de aprendizaje oficiales del MINEDUC' },
  { icon: CalendarDays, texto: 'Planificaciones guardadas en tu cuenta' },
  { icon: MonitorPlay, texto: 'Clases listas para la pantalla interactiva' },
];

interface Props {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}

/** Diseño compartido por las pantallas de inicio de sesión y registro. */
export default function AuthLayout({ titulo, subtitulo, children }: Props) {
  return (
    <div className="flex min-h-full w-full">
      {/* Panel de marca (solo en pantallas medianas y grandes) */}
      <aside className="hidden w-[44%] max-w-xl flex-col justify-between bg-brand-900 px-12 py-10 text-white md:flex">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-tight">Software Educativo</p>
            <p className="text-xs leading-tight text-brand-100/70">Apoyo docente · MINEDUC</p>
          </div>
        </Link>

        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Tu clase, alineada al currículum y lista para proyectar.
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {beneficios.map(({ icon: Icon, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-[15px] text-brand-100">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={16} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-brand-100/60">Proyecto APT · Ingeniería en Informática · Duoc UC</p>
      </aside>

      {/* Formulario */}
      <main className="flex flex-1 items-center justify-center bg-surface-muted px-4 py-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-3 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap size={20} />
            </div>
            <p className="text-[15px] font-semibold text-ink-900">Software Educativo</p>
          </Link>
          <h1 className="text-2xl font-bold text-ink-900">{titulo}</h1>
          <p className="mt-1 text-[15px] text-ink-500">{subtitulo}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

/** Campo de formulario con etiqueta y mensaje de error. */
export function Campo({
  id,
  etiqueta,
  error,
  ...input
}: {
  id: string;
  etiqueta: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {etiqueta}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          'w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors',
          error ? 'border-red-400 focus:border-red-500' : 'border-ink-300/40 focus:border-brand-500',
        ].join(' ')}
        {...input}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
