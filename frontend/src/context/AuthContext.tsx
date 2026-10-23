import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, SESION_EXPIRADA, TOKEN_KEY } from '../lib/api';

export interface Usuario {
  id: string;
  email: string;
  nombre?: string;
  rol?: 'DOCENTE' | 'ADMIN';
}

/** Respuesta del backend al iniciar sesión o registrarse. */
interface RespuestaSesion {
  accessToken: string;
  usuario?: Usuario;
}

interface AuthContextValue {
  usuario: Usuario | null;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrarse: (nombre: string, email: string, password: string) => Promise<void>;
  cerrarSesion: () => void;
}

const USUARIO_KEY = 'usuario';
const AuthContext = createContext<AuthContextValue | null>(null);

/** Lee el contenido (payload) del JWT sin verificar la firma; la verifica el backend. */
function leerPayload(token: string): { sub: string; email: string; exp?: number } | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function guardar(clave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch {
    /* almacenamiento no disponible: la sesión dura mientras la pestaña esté abierta */
  }
}

/** Recupera la sesión guardada si el token sigue vigente. */
function sesionInicial(): Usuario | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const datos = localStorage.getItem(USUARIO_KEY);
    if (!token || !datos) return null;
    const payload = leerPayload(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) return null;
    return JSON.parse(datos) as Usuario;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(sesionInicial);

  const abrirSesion = useCallback((respuesta: RespuestaSesion) => {
    const payload = leerPayload(respuesta.accessToken);
    if (!payload) throw new Error('Token inválido');
    const nuevo: Usuario = {
      id: payload.sub,
      email: payload.email,
      nombre: respuesta.usuario?.nombre,
      rol: respuesta.usuario?.rol,
    };
    guardar(TOKEN_KEY, respuesta.accessToken);
    guardar(USUARIO_KEY, JSON.stringify(nuevo));
    setUsuario(nuevo);
  }, []);

  const cerrarSesion = useCallback(() => {
    guardar(TOKEN_KEY, null);
    guardar(USUARIO_KEY, null);
    setUsuario(null);
  }, []);

  const iniciarSesion = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<RespuestaSesion>('/auth/login', { email, password });
      abrirSesion(data);
    },
    [abrirSesion],
  );

  const registrarse = useCallback(
    async (nombre: string, email: string, password: string) => {
      const { data } = await api.post<RespuestaSesion>('/auth/register', {
        nombre,
        email,
        password,
      });
      abrirSesion(data);
    },
    [abrirSesion],
  );

  // Sesiones guardadas antes de que el login devolviera el nombre:
  // se completan los datos del docente consultando su perfil.
  const faltaNombre = !!usuario && !usuario.nombre;
  useEffect(() => {
    if (!faltaNombre) return;
    api
      .get<Usuario>('/auth/me')
      .then(({ data }) => {
        setUsuario((actual) => {
          if (!actual) return actual;
          const completo = { ...actual, nombre: data.nombre, rol: data.rol };
          guardar(USUARIO_KEY, JSON.stringify(completo));
          return completo;
        });
      })
      .catch(() => {
        /* si falla, se sigue mostrando el correo */
      });
  }, [faltaNombre]);

  // Si la API rechaza el token (expiró), se cierra la sesión automáticamente.
  useEffect(() => {
    window.addEventListener(SESION_EXPIRADA, cerrarSesion);
    return () => window.removeEventListener(SESION_EXPIRADA, cerrarSesion);
  }, [cerrarSesion]);

  const value = useMemo(
    () => ({ usuario, iniciarSesion, registrarse, cerrarSesion }),
    [usuario, iniciarSesion, registrarse, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
