import { IsInt, IsOptional, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateActividadDto {
  @Transform(recortar)
  @IsString({ message: 'El título debe ser un texto.' })
  @IsNotEmpty({ message: 'Ingresa un título para la actividad.' })
  @MaxLength(120, { message: 'El título no puede superar los 120 caracteres.' })
  titulo: string;

  @Transform(recortar)
  @IsString({ message: 'La descripción debe ser un texto.' })
  @IsNotEmpty({ message: 'Describe brevemente la actividad.' })
  @MaxLength(1000, { message: 'La descripción no puede superar los 1000 caracteres.' })
  descripcion: string;

  @IsInt({ message: 'La duración debe ser un número entero de minutos.' })
  @Min(1, { message: 'La duración debe ser de al menos 1 minuto.' })
  @Max(240, { message: 'La duración no puede superar los 240 minutos.' })
  duracionMinutos: number;

  @IsString({ message: 'Selecciona la asignatura y el nivel.' })
  @IsNotEmpty({ message: 'Selecciona la asignatura y el nivel.' })
  asignaturaId: string;
}

/** Todos los campos son opcionales: solo se actualiza lo que se envía. */
export class UpdateActividadDto {
  @Transform(recortar)
  @IsOptional()
  @IsString({ message: 'El título debe ser un texto.' })
  @IsNotEmpty({ message: 'Ingresa un título para la actividad.' })
  @MaxLength(120, { message: 'El título no puede superar los 120 caracteres.' })
  titulo?: string;

  @Transform(recortar)
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto.' })
  @IsNotEmpty({ message: 'Describe brevemente la actividad.' })
  @MaxLength(1000, { message: 'La descripción no puede superar los 1000 caracteres.' })
  descripcion?: string;

  @IsOptional()
  @IsInt({ message: 'La duración debe ser un número entero de minutos.' })
  @Min(1, { message: 'La duración debe ser de al menos 1 minuto.' })
  @Max(240, { message: 'La duración no puede superar los 240 minutos.' })
  duracionMinutos?: number;

  @IsOptional()
  @IsString({ message: 'Selecciona la asignatura y el nivel.' })
  @IsNotEmpty({ message: 'Selecciona la asignatura y el nivel.' })
  asignaturaId?: string;
}
