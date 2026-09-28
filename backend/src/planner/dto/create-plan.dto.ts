import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreatePlanDto {
  @IsDateString()
  fecha: string;

  @IsString()
  objetivoId: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
