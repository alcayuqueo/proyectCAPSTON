import { useEffect } from 'react';
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
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/curriculum', label: 'Explorador curricular', icon: BookOpen },
  { to: '/recursos', label: 'Recursos', icon: Layers },
  { to: '/actividades', label: 'Actividades', icon: Puzzle },
  { to: '/planificador', label: 'Planificador', icon: CalendarDays },
];

interface Props {
  /** En pantallas chicas, indica si el menú está abierto. */
  abierto: boolean;
  onCerrar: () => void;
}

export default function Sidebar({ abierto, onCerrar }: Props) {
  const { usuario, cerrarSesion } = useAuth();

  // Con el menú abierto en el celular: Escape lo cierra y el fondo no se desplaza.
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alPresionar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [abierto, onCerrar]);
  const navigate = useNavigate();
  const nombreVisible = usuario?.nombre || usuario?.email || '';
  const inicial = nombreVisible.charAt(0).toUpperCase();

  function salir() {
    cerrarSesion();
    navigate('/');
  }

  return (
    <>
    {/* Fondo oscuro detrás del menú en pantallas chicas; al tocarlo se cierra */}
    <div
      onClick={onCerrar}
      aria-hidden="true"
      className={[
        'fixed inset-0 z-30 bg-ink-900/40 transition-opacity lg:hidden',
        abierto ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
    />
    <aside
      id="menu-principal"
      className={[
        'fixed inset-y-0 left-0 z-40 flex h-full w-72 max-w-[85vw] shrink-0 flex-col border-r border-ink-300/20 bg-surface-sidebar shadow-xl transition-[transform,visibility] duration-200',
        'lg:visible lg:static lg:w-64 lg:translate-x-0 lg:shadow-none',
        // Cerrado: fuera de la pantalla e invisible, para que el teclado no llegue a sus enlaces.
        abierto ? 'visible translate-x-0' : 'invisible -translate-x-full',
      ].join(' ')}
    >
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
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar menú"
          className="ml-auto rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-300/10 lg:hidden"
        >
          <X size={18} />
        </button>
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
    </>
  );
}
