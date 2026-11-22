import axios, { AxiosError } from 'axios';

// En la web la API siempre se llama en el mismo dominio, en '/api':
// - en local, Vite la redirige a localhost:3000;
// - en Vercel, vercel.json la redirige al backend en Render.
// Así los navegadores antiguos de algunas pantallas interactivas, que no
// reconocen el certificado HTTPS de Render, solo hablan con Vercel.
// Solo la app Android (vite build --mode android) usa VITE_API_URL, porque
// no tiene el proxy de Vite ni el de Vercel.
const baseURL =
  import.meta.env.MODE === 'android' && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : '/api';

export const api = axios.create({ baseURL });

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
  // 5xx: el backend falló o no está disponible (en local, el proxy de Vite
  // responde 500 cuando no puede conectarse a localhost:3000).
  if (err.response.status >= 500) {
    return 'El servidor no está respondiendo. Inténtalo de nuevo en unos segundos.';
  }
  // Los mensajes del backend vienen en español: errores propios (401, 404, 409)
  // como texto y errores de validación (400) como lista.
  const msg = err.response.data?.message;
  if (typeof msg === 'string' && msg.trim()) {
    return msg;
  }
  if (Array.isArray(msg) && msg.length > 0) {
    return msg.join(' ');
  }
  return porDefecto;
}
