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

// Cada sección tiene su color, el mismo de su título y de su tarjeta en el inicio.
const navItems = [
  { to: '/', label: 'Inicio', icon: Home, color: '#FFE3A3' },
  { to: '/curriculum', label: 'Explorador curricular', icon: BookOpen, color: '#C5D9FB' },
  { to: '/recursos', label: 'Recursos', icon: Layers, color: '#F6C2D6' },
  { to: '/actividades', label: 'Actividades', icon: Puzzle, color: '#FFE3A3' },
  { to: '/planificador', label: 'Planificador', icon: CalendarDays, color: '#BFE6D0' },
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
        'fixed inset-y-0 left-0 z-40 flex h-full w-72 max-w-[85vw] shrink-0 flex-col border-r-2 border-ink-900 fondo-estrellas shadow-xl transition-[transform,visibility] duration-200',
        'lg:visible lg:static lg:w-64 lg:translate-x-0 lg:shadow-none',
        // Cerrado: fuera de la pantalla e invisible, para que el teclado no llegue a sus enlaces.
        abierto ? 'visible translate-x-0' : 'invisible -translate-x-full',
      ].join(' ')}
    >
      {/* Logo / marca */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-[2.5px] border-ink-900 bg-sol text-ink-900 shadow-[3px_3px_0_#7B6CF0]">
          <GraduationCap size={22} />
        </div>
        <div>
          <p className="font-[Fredoka] text-[17px] font-semibold leading-tight text-white">
            Software Educativo
          </p>
          <p className="text-xs leading-tight text-[#C9D0F2]">
            Apoyo docente · MINEDUC
          </p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar menú"
          className="ml-auto rounded-lg p-2 text-[#C9D0F2] transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1.5 px-3">
        {navItems.map(({ to, label, icon: Icon, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-2xl border-2 px-2.5 py-2 text-[15px] font-bold transition',
                isActive
                  ? 'border-ink-900 bg-white text-ink-900 shadow-[4px_4px_0_#7B6CF0]'
                  : 'border-transparent text-[#EEF1FF] hover:bg-white/10',
              ].join(' ')
            }
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-ink-900" style={{ background: color }}>
              <Icon size={17} />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sesión del docente */}
      <div className="border-t border-white/15 px-3 py-3">
        {usuario ? (
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink-900 bg-[#C5D9FB] font-[Fredoka] text-sm font-bold text-ink-900">
              {inicial}
            </div>
            <div className="min-w-0 flex-1">
              {usuario.nombre && (
                <p className="truncate text-sm font-bold text-white">{usuario.nombre}</p>
              )}
              <p className="truncate text-xs text-[#C9D0F2]">{usuario.email}</p>
            </div>
            <button
              onClick={salir}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="rounded-lg p-2 text-[#C9D0F2] transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink-900 bg-sol px-3 py-2.5 text-sm font-bold text-ink-900 shadow-[4px_4px_0_#7B6CF0] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <LogIn size={18} />
            Iniciar sesión
          </Link>
        )}
      </div>

      {/* Estado del proyecto */}
      <div className="border-t border-white/15 px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-[#C9D0F2]">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Fase 2 · Desarrollo del proyecto
        </div>
      </div>
    </aside>
    </>
  );
}
