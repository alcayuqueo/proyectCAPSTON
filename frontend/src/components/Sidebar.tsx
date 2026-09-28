import { NavLink } from 'react-router-dom';
import {
  GraduationCap,
  Home,
  BookOpen,
  Layers,
  Puzzle,
  CalendarDays,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/curriculum', label: 'Explorador curricular', icon: BookOpen },
  { to: '/recursos', label: 'Recursos', icon: Layers },
  { to: '/actividades', label: 'Actividades', icon: Puzzle },
  { to: '/planificador', label: 'Planificador', icon: CalendarDays },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-ink-300/20 bg-surface-sidebar">
      {/* Logo / marca */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
          <GraduationCap size={20} />
        </div>
        <div>
          <p className="text-[15px] font-semibold leading-tight text-ink-900">
            Software Educativo
          </p>
          <p className="text-xs leading-tight text-ink-500">
            Apoyo docente · MINEDUC
          </p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-brand-100 font-medium text-brand-700'
                  : 'text-ink-700 hover:bg-ink-300/10',
              ].join(' ')
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Estado del proyecto */}
      <div className="border-t border-ink-300/20 px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Fase 1 · MVP en desarrollo
        </div>
      </div>
    </aside>
  );
}
