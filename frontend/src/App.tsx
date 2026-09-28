import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import ExploradorCurricular from './pages/ExploradorCurricular';
import Recursos from './pages/Recursos';
import Actividades from './pages/Actividades';
import Planificador from './pages/Planificador';

export default function App() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/curriculum" element={<ExploradorCurricular />} />
          <Route path="/recursos" element={<Recursos />} />
          <Route path="/actividades" element={<Actividades />} />
          <Route path="/planificador" element={<Planificador />} />
        </Routes>
      </main>
    </div>
  );
}
