import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

/**
 * Orígenes que pueden llamar a la API desde el navegador (CORS).
 * Se pueden cambiar con la variable CORS_ORIGINS (lista separada por comas).
 */
const ORIGENES_POR_DEFECTO = [
  'https://software-educativo-azure.vercel.app', // frontend en producción (Vercel)
  'http://localhost:5173', // frontend en desarrollo (Vite)
  'http://localhost:4173', // vista previa del build (vite preview)
  'https://localhost', // app Android con Capacitor
  'capacitor://localhost',
];
// Vistas previas de Vercel de este mismo proyecto (software-educativo-…vercel.app)
const PREVIEWS_VERCEL = /^https:\/\/software-educativo(-[a-z0-9-]+)?\.vercel\.app$/;

export function origenesPermitidos(): string[] {
  const env = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
  return env?.length ? env : ORIGENES_POR_DEFECTO;
}

export function origenPermitido(origen: string | undefined): boolean {
  // Sin encabezado Origin: no es un navegador haciendo una petición entre sitios (curl, la app nativa, etc.)
  if (!origen) return true;
  return origenesPermitidos().includes(origen) || PREVIEWS_VERCEL.test(origen);
}

/** Configuración de seguridad y validación común a main.ts y a las pruebas. */
export function configurarApp(app: INestApplication) {
  const express = app as NestExpressApplication;
  // Render atiende detrás de un proxy: así Express lee el protocolo real (HTTPS).
  express.set('trust proxy', true);
  express.disable('x-powered-by');

  app.setGlobalPrefix('api');

  // Encabezados de seguridad HTTP (nosniff, frame-ancestors, HSTS, etc.).
  // La API solo responde JSON, así que su política de contenido puede ser la más estricta.
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    }),
  );

  app.enableCors({
    origin: (origen, callback) => callback(null, origenPermitido(origen)),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
