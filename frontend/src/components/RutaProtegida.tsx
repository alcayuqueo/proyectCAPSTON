import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Redirige al inicio de sesión si no hay una sesión activa. */
export default function RutaProtegida({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
