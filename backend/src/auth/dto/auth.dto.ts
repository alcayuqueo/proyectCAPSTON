import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Ingresa tu nombre.' })
  @IsNotEmpty({ message: 'Ingresa tu nombre.' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres.' })
  nombre: string;

  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  email: string;

  @IsString({ message: 'La contraseña debe ser un texto.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  email: string;

  @IsString({ message: 'Ingresa tu contraseña.' })
  @IsNotEmpty({ message: 'Ingresa tu contraseña.' })
  password: string;
}
