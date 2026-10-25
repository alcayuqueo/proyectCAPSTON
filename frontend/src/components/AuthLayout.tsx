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
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-[#1F56C2] px-12 py-10 text-white md:flex">
        {/* Formas decorativas */}
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 500 800" preserveAspectRatio="xMidYMid slice">
          <circle cx="470" cy="80" r="150" fill="#3D7BF7" />
          <circle cx="40" cy="760" r="170" fill="#3D7BF7" />
          <circle cx="430" cy="690" r="46" fill="#FFC93C" />
          <circle cx="90" cy="230" r="14" fill="#F6C2D6" />
          <polygon points="400,330 409,348 429,351 414,365 418,385 400,375 382,385 386,365 371,351 391,348" fill="#FFC93C" />
        </svg>
        <Link to="/" className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-[2.5px] border-ink-900 bg-sol text-ink-900">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="font-[Fredoka] text-[17px] font-semibold leading-tight">Software Educativo</p>
            <p className="text-xs leading-tight text-white/80">Apoyo docente · MINEDUC</p>
          </div>
        </Link>

        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">
            Tu clase, alineada al currículum y lista para proyectar.
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {beneficios.map(({ icon: Icon, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-[15px] font-semibold text-white">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sol text-ink-900">
                  <Icon size={16} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/80">Proyecto APT · Ingeniería en Informática · Duoc UC</p>
      </aside>

      {/* Formulario */}
      <main className="flex flex-1 items-center justify-center bg-surface-muted px-4 py-10">
        <div className="w-full max-w-sm rounded-card border-[3px] border-ink-900 bg-white p-6 shadow-sticker sm:p-8">
          <Link to="/" className="mb-8 flex items-center gap-3 md:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-[2.5px] border-ink-900 bg-sol text-ink-900">
              <GraduationCap size={22} />
            </div>
            <p className="font-[Fredoka] text-[17px] font-semibold text-ink-900">Software Educativo</p>
          </Link>
          <h1 className="text-3xl font-bold text-ink-900">{titulo}</h1>
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
          'w-full rounded-xl border-2 bg-white px-3 py-2.5 text-sm outline-none transition-colors',
          error ? 'border-red-400 focus:border-red-500' : 'border-ink-300/70 focus:border-brand-500',
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
