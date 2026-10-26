import { useCallback, useEffect, useState } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { GraduationCap, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import RutaProtegida from './components/RutaProtegida';
import Home from './pages/Home';
import ExploradorCurricular from './pages/ExploradorCurricular';
import Recursos from './pages/Recursos';
import Actividades from './pages/Actividades';
import Planificador from './pages/Planificador';
import FormularioClase from './pages/FormularioClase';
import ModoPresentacion from './pages/ModoPresentacion';
import Login from './pages/Login';
import Registro from './pages/Registro';

/**
 * Diseño principal: barra lateral + contenido.
 * En pantallas grandes la barra queda fija a la izquierda. En celulares y tablets se
 * oculta y se abre como menú desde el botón de la barra superior.
 */
function LayoutPrincipal() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();
  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

  // Al cambiar de página, el menú se cierra.
  useEffect(() => setMenuAbierto(false), [pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar abierto={menuAbierto} onCerrar={cerrarMenu} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior, solo en pantallas chicas */}
        <header className="fondo-estrellas flex shrink-0 items-center gap-3 border-b-2 border-ink-900 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            aria-controls="menu-principal"
            className="-ml-1 rounded-lg p-2 text-white transition-colors hover:bg-white/10"
          >
            <Menu size={22} />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink-900 bg-sol text-ink-900">
            <GraduationCap size={18} />
          </div>
          <p className="font-[Fredoka] text-[17px] font-semibold text-white">Software Educativo</p>
        </header>
        <main className="fondo-universo flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Pantallas de autenticación, sin barra lateral */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Modo presentación: pantalla completa, sin barra lateral */}
      <Route
        path="/planificador/:id/presentar"
        element={
          <RutaProtegida>
            <ModoPresentacion />
          </RutaProtegida>
        }
      />
      <Route
        path="/clases-listas/:objetivoId/presentar"
        element={
          <RutaProtegida>
            <ModoPresentacion />
          </RutaProtegida>
        }
      />

      <Route element={<LayoutPrincipal />}>
        <Route path="/" element={<Home />} />
        <Route path="/curriculum" element={<ExploradorCurricular />} />
        <Route path="/recursos" element={<Recursos />} />
        <Route path="/actividades" element={<Actividades />} />
        <Route
          path="/planificador"
          element={
            <RutaProtegida>
              <Planificador />
            </RutaProtegida>
          }
        />
        <Route
          path="/planificador/nueva"
          element={
            <RutaProtegida>
              <FormularioClase />
            </RutaProtegida>
          }
        />
        <Route
          path="/planificador/:id/editar"
          element={
            <RutaProtegida>
              <FormularioClase />
            </RutaProtegida>
          }
        />
      </Route>
    </Routes>
  );
}
