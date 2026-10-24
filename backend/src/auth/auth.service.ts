import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

/**
 * Hash bcrypt de una contraseña cualquiera. Cuando el correo no existe se compara igual
 * contra este hash, para que la respuesta tarde lo mismo y no revele qué correos tienen cuenta.
 */
const HASH_DE_RELLENO = bcrypt.hashSync('contraseña-de-relleno', 10);

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existente = await this.prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usuario = await this.prisma.usuario.create({
      data: { nombre: dto.nombre.trim(), email, passwordHash },
    });

    return this.respuestaSesion(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!usuario) {
      await bcrypt.compare(dto.password, HASH_DE_RELLENO);
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return this.respuestaSesion(usuario);
  }

  /** Datos del docente con sesión activa (sin la contraseña). */
  async perfil(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException('La cuenta ya no existe.');
    }
    return this.datosPublicos(usuario);
  }

  private datosPublicos(usuario: Usuario) {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };
  }

  private respuestaSesion(usuario: Usuario) {
    const accessToken = this.jwt.sign({ sub: usuario.id, email: usuario.email });
    return { accessToken, usuario: this.datosPublicos(usuario) };
  }
}
