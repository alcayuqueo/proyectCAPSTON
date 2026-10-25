import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Layers, Puzzle, CalendarDays } from 'lucide-react';

// Cada módulo tiene el color de su sección en el menú.
const modules = [
  {
    to: '/curriculum',
    icon: BookOpen,
    color: '#C5D9FB',
    title: 'Explorador curricular',
    description:
      'Busca objetivos de aprendizaje (OA) del MINEDUC por asignatura y nivel, listos para usar en tu planificación.',
  },
  {
    to: '/recursos',
    icon: Layers,
    color: '#F6C2D6',
    title: 'Recursos',
    description:
      'Material interactivo (imágenes, videos, guías) organizado por unidad, pensado para pantallas táctiles.',
  },
  {
    to: '/actividades',
    icon: Puzzle,
    color: '#FFE3A3',
    title: 'Actividades',
    description:
      'Actividades listas para proyectar y realizar en clase junto a tus estudiantes, sin preparación técnica.',
  },
  {
    to: '/planificador',
    icon: CalendarDays,
    color: '#BFE6D0',
    title: 'Planificador',
    description:
      'Arma tu clase combinando objetivos, recursos y actividades, y preséntala en la pantalla interactiva.',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      {/* Portada */}
      <section className="relative overflow-hidden rounded-card border-[3px] border-ink-900 bg-white p-8 shadow-sticker sm:p-10">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-72 sm:block"
          viewBox="0 0 280 320"
          preserveAspectRatio="xMaxYMid slice"
        >
          <circle cx="250" cy="40" r="120" fill="#E1ECFE" />
          <circle cx="190" cy="250" r="60" fill="#FCE4EE" />
          <circle cx="120" cy="70" r="22" fill="#FFE3A3" />
          <polygon points="245,190 254,208 274,211 259,225 263,245 245,235 227,245 231,225 216,211 236,208" fill="#FFC93C" />
        </svg>

        <div className="relative">
          <span className="inline-block rounded-full bg-sol px-3 py-1 text-xs font-extrabold text-ink-900">
            Fase 2 · Desarrollo
          </span>

          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight text-ink-900 sm:text-5xl">
            Tecnología interactiva al servicio de tu clase
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-500">
            Software Educativo reúne el currículum del MINEDUC, recursos y actividades en un solo
            lugar, pensado para pantallas interactivas de uso docente. Menos pasos técnicos, más
            tiempo para enseñar.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/curriculum')}
              className="flex items-center gap-2 rounded-full border-[2.5px] border-ink-900 bg-sol px-5 py-2.5 text-sm font-bold text-ink-900 shadow-sticker-sm transition hover:bg-[#FFD35A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Explorar currículum
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/planificador')}
              className="rounded-full border-[2.5px] border-ink-900 bg-white px-5 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-surface-muted"
            >
              Planificar una clase
            </button>
          </div>
        </div>
      </section>

      {/* Módulos principales */}
      <section>
        <h2 className="text-3xl font-bold text-ink-900">Módulos principales</h2>
        <p className="mt-1 text-base text-ink-500">Todo lo que necesitas para preparar y conducir tu clase.</p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {modules.map(({ to, icon: Icon, color, title, description }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex flex-col items-start gap-3 rounded-card border-2 border-ink-900 bg-white p-5 text-left shadow-sticker-sm transition hover:-translate-y-0.5"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-ink-900 text-ink-900"
                style={{ background: color }}
              >
                <Icon size={22} />
              </div>
              <p className="font-[Fredoka] text-xl font-semibold text-ink-900">{title}</p>
              <p className="text-sm leading-relaxed text-ink-500">{description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
