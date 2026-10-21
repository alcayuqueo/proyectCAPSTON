import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LogIn,
  LogOut,
  GraduationCap,
  Home,
  BookOpen,
  Layers,
  Puzzle,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/curriculum', label: 'Explorador curricular', icon: BookOpen },
  { to: '/recursos', label: 'Recursos', icon: Layers },
  { to: '/actividades', label: 'Actividades', icon: Puzzle },
  { to: '/planificador', label: 'Planificador', icon: CalendarDays },
];

export default function Sidebar() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const nombreVisible = usuario?.nombre || usuario?.email || '';
  const inicial = nombreVisible.charAt(0).toUpperCase();

  function salir() {
    cerrarSesion();
    navigate('/');
  }

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

      {/* Sesión del docente */}
      <div className="border-t border-ink-300/20 px-3 py-3">
        {usuario ? (
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {inicial}
            </div>
            <div className="min-w-0 flex-1">
              {usuario.nombre && (
                <p className="truncate text-sm font-medium text-ink-900">{usuario.nombre}</p>
              )}
              <p className="truncate text-xs text-ink-500">{usuario.email}</p>
            </div>
            <button
              onClick={salir}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-300/10 hover:text-ink-900"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
          >
            <LogIn size={18} />
            Iniciar sesión
          </Link>
        )}
      </div>

      {/* Estado del proyecto */}
      <div className="border-t border-ink-300/20 px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Fase 2 · Desarrollo del proyecto
        </div>
      </div>
    </aside>
  );
}
