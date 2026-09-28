import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Layers, Puzzle, CalendarDays } from 'lucide-react';

const modules = [
  {
    to: '/curriculum',
    icon: BookOpen,
    title: 'Explorador curricular',
    description:
      'Busca objetivos de aprendizaje (OA) del MINEDUC por asignatura y nivel, listos para usar en tu planificación.',
  },
  {
    to: '/recursos',
    icon: Layers,
    title: 'Recursos',
    description:
      'Material interactivo (imágenes, videos, guías) organizado por unidad, pensado para pantallas táctiles.',
  },
  {
    to: '/actividades',
    icon: Puzzle,
    title: 'Actividades',
    description:
      'Actividades listas para proyectar y realizar en clase junto a tus estudiantes, sin preparación técnica.',
  },
  {
    to: '/planificador',
    icon: CalendarDays,
    title: 'Planificador',
    description:
      'Arma tu clase combinando objetivos, recursos y actividades en una sola vista semanal.',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      {/* Hero */}
      <section className="rounded-card border border-ink-300/20 bg-white p-10 shadow-sm">
        <span className="inline-block rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-700">
          Fase 1 · MVP
        </span>

        <h1 className="mt-4 text-4xl font-bold leading-tight text-ink-900">
          Tecnología interactiva al servicio de tu clase
        </h1>

        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-500">
          Software Educativo reúne el currículum del MINEDUC, recursos y
          actividades en un solo lugar, pensado para pantallas interactivas de
          uso docente. Menos pasos técnicos, más tiempo para enseñar.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/curriculum')}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Explorar currículum
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/planificador')}
            className="rounded-lg border border-ink-300/30 bg-white px-5 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-surface-muted"
          >
            Planificar una clase
          </button>
        </div>
      </section>

      {/* Módulos principales */}
      <section>
        <h2 className="text-2xl font-bold text-ink-900">Módulos principales</h2>
        <p className="mt-1 text-[15px] text-ink-500">
          Todo lo que necesitas para preparar y conducir tu clase.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {modules.map(({ to, icon: Icon, title, description }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex flex-col items-start gap-3 rounded-card border border-ink-300/20 bg-white p-5 text-left transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <Icon size={18} />
              </div>
              <p className="font-semibold text-ink-900">{title}</p>
              <p className="text-sm leading-relaxed text-ink-500">
                {description}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
