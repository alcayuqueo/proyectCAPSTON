import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { LIMITES, MINUTO } from '../common/limite-solicitudes.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: LIMITES.registro, ttl: MINUTO } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** Máximo 10 intentos por minuto para cada correo: frena los ataques de fuerza bruta. */
  @Post('login')
  @Throttle({ default: { limit: LIMITES.login, ttl: MINUTO } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Devuelve los datos del docente asociado al token. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  perfil(@Req() req: any) {
    return this.authService.perfil(req.user.userId);
  }
}
