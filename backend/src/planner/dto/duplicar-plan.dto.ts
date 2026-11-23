import { IsDateString, IsOptional } from 'class-validator';

/** Al duplicar se puede indicar otra fecha (por ejemplo, desde el calendario). */
export class DuplicarPlanDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha no es válida.' })
  fecha?: string;
}
