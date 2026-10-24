import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Límite de solicitudes (ThrottlerGuard) con dos formas de contar:
 *
 * - Inicio de sesión: por **correo**. Así nadie puede probar contraseñas contra una cuenta
 *   cambiando de IP, y los docentes de un mismo colegio (que comparten red) no se bloquean
 *   entre sí.
 * - Resto de la API: por IP del visitante, leída detrás del proxy de Render
 *   (CF-Connecting-IP o la primera dirección de X-Forwarded-For). Es una protección básica
 *   contra el abuso; nunca agrupa por error a docentes distintos.
 */
@Injectable()
export class LimiteSolicitudesGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ruta: string = req.originalUrl ?? req.url ?? '';
    const correo = req.body?.email;
    if (ruta.split('?')[0].endsWith('/auth/login') && typeof correo === 'string' && correo.trim()) {
      return `correo:${correo.trim().toLowerCase()}`;
    }
    const cabecera = (nombre: string) => {
      const v = req.headers?.[nombre];
      return (Array.isArray(v) ? v[0] : v)?.toString().split(',')[0].trim();
    };
    return `ip:${cabecera('cf-connecting-ip') || cabecera('x-forwarded-for') || req.ip || 'desconocida'}`;
  }
}

/** Límites (solicitudes por minuto). */
export const LIMITES = {
  general: 300, // por IP: uso normal de la aplicación
  login: 10, // por correo: intentos de inicio de sesión
  registro: 5, // por IP: creación de cuentas
};
export const MINUTO = 60_000;
