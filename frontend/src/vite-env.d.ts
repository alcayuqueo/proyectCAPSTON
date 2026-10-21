/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API. Vacío en desarrollo (usa el proxy de Vite hacia localhost:3000). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
