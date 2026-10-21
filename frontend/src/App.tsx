import { Outlet, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import RutaProtegida from './components/RutaProtegida';
import Home from './pages/Home';
import ExploradorCurricular from './pages/ExploradorCurricular';
import Recursos from './pages/Recursos';
import Actividades from './pages/Actividades';
import Planificador from './pages/Planificador';
import Login from './pages/Login';
import Registro from './pages/Registro';

/** Diseño principal: barra lateral + contenido. */
function LayoutPrincipal() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Pantallas de autenticación, sin barra lateral */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

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
      </Route>
    </Routes>
  );
}
