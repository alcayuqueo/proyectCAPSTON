import axios, { AxiosError } from 'axios';

// En local se usa '/api' (proxy de Vite). En Vercel se define VITE_API_URL
// con la URL del backend publicado en Render.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const TOKEN_KEY = 'token';
export const SESION_EXPIRADA = 'sesion-expirada';

function leerToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = leerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend rechaza el token (expirado o inválido), se cierra la sesión.
// Se excluyen las rutas de autenticación, donde un 401 significa
// "credenciales inválidas" y debe mostrarse en el formulario.
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const url = error.config?.url ?? '';
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      window.dispatchEvent(new Event(SESION_EXPIRADA));
    }
    return Promise.reject(error);
  },
);

/** Traduce un error de la API a un mensaje en español para mostrar al usuario. */
export function mensajeDeError(error: unknown, porDefecto: string): string {
  const err = error as AxiosError<{ message?: string | string[] }>;
  if (!err.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }
  const msg = err.response.data?.message;
  // Los mensajes propios del backend ya vienen en español (409, 401).
  if (typeof msg === 'string' && err.response.status !== 400) {
    return msg;
  }
  return porDefecto;
}
