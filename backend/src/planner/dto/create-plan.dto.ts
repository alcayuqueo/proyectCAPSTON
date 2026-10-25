import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePlanDto {
  @IsString({ message: 'El título debe ser un texto.' })
  @IsNotEmpty({ message: 'Ingresa un título para la clase.' })
  @MaxLength(120, { message: 'El título no puede superar los 120 caracteres.' })
  titulo: string;

  @IsDateString({}, { message: 'La fecha no es válida.' })
  fecha: string;

  @IsString({ message: 'Selecciona un objetivo de aprendizaje.' })
  @IsNotEmpty({ message: 'Selecciona un objetivo de aprendizaje.' })
  objetivoId: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser un texto.' })
  @MaxLength(2000, { message: 'Las notas no pueden superar los 2000 caracteres.' })
  notas?: string;

  @IsOptional()
  @IsArray({ message: 'Los recursos deben enviarse como una lista.' })
  @ArrayMaxSize(20, { message: 'Una clase puede tener como máximo 20 recursos.' })
  @IsString({ each: true, message: 'Los recursos seleccionados no son válidos.' })
  recursoIds?: string[];

  @IsOptional()
  @IsArray({ message: 'Las actividades deben enviarse como una lista.' })
  @ArrayMaxSize(20, { message: 'Una clase puede tener como máximo 20 actividades.' })
  @IsString({ each: true, message: 'Las actividades seleccionadas no son válidas.' })
  actividadIds?: string[];

  @IsOptional()
  @IsBoolean({ message: 'La opción de material debe ser verdadero o falso.' })
  usarMaterial?: boolean;
}
