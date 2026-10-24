import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export const TIPOS_RECURSO = ['video', 'documento', 'imagen'] as const;
export type TipoRecursoApi = (typeof TIPOS_RECURSO)[number];

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateRecursoDto {
  @Transform(recortar)
  @IsString({ message: 'El título debe ser un texto.' })
  @IsNotEmpty({ message: 'Ingresa un título para el recurso.' })
  @MaxLength(120, { message: 'El título no puede superar los 120 caracteres.' })
  titulo: string;

  @IsIn(TIPOS_RECURSO, { message: 'El tipo debe ser video, documento o imagen.' })
  tipo: TipoRecursoApi;

  // Opcional. Solo enlaces http(s), para que no se puedan guardar enlaces peligrosos (javascript:, data:).
  @Transform(recortar)
  @IsOptional()
  @ValidateIf((_, v) => v !== '')
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'El enlace debe ser una dirección web que empiece con http:// o https://.' },
  )
  @MaxLength(500, { message: 'El enlace no puede superar los 500 caracteres.' })
  url?: string;

  @Transform(recortar)
  @IsString({ message: 'La unidad debe ser un texto.' })
  @IsNotEmpty({ message: 'Indica la unidad o tema del recurso.' })
  @MaxLength(80, { message: 'La unidad no puede superar los 80 caracteres.' })
  unidad: string;

  @IsString({ message: 'Selecciona la asignatura y el nivel.' })
  @IsNotEmpty({ message: 'Selecciona la asignatura y el nivel.' })
  asignaturaId: string;
}

/** Todos los campos son opcionales: solo se actualiza lo que se envía. */
export class UpdateRecursoDto {
  @Transform(recortar)
  @IsOptional()
  @IsString({ message: 'El título debe ser un texto.' })
  @IsNotEmpty({ message: 'Ingresa un título para el recurso.' })
  @MaxLength(120, { message: 'El título no puede superar los 120 caracteres.' })
  titulo?: string;

  @IsOptional()
  @IsIn(TIPOS_RECURSO, { message: 'El tipo debe ser video, documento o imagen.' })
  tipo?: TipoRecursoApi;

  // Opcional. Solo enlaces http(s), para que no se puedan guardar enlaces peligrosos (javascript:, data:).
  @Transform(recortar)
  @IsOptional()
  @ValidateIf((_, v) => v !== '')
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'El enlace debe ser una dirección web que empiece con http:// o https://.' },
  )
  @MaxLength(500, { message: 'El enlace no puede superar los 500 caracteres.' })
  url?: string;

  @Transform(recortar)
  @IsOptional()
  @IsString({ message: 'La unidad debe ser un texto.' })
  @IsNotEmpty({ message: 'Indica la unidad o tema del recurso.' })
  @MaxLength(80, { message: 'La unidad no puede superar los 80 caracteres.' })
  unidad?: string;

  @IsOptional()
  @IsString({ message: 'Selecciona la asignatura y el nivel.' })
  @IsNotEmpty({ message: 'Selecciona la asignatura y el nivel.' })
  asignaturaId?: string;
}
