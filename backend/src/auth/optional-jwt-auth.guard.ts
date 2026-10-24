import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Como JwtAuthGuard, pero no exige sesión: si el token es válido deja los datos del
 * docente en req.user; si no hay token (o no es válido), la petición sigue como anónima.
 * Se usa en listados públicos que muestran algo más cuando hay sesión.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(_err: unknown, user: TUser): TUser | null {
    return user || null;
  }
}
