import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateRecursoDto, UpdateRecursoDto } from '../resources/dto/recurso.dto';
import { CreateActividadDto } from '../activities/dto/actividad.dto';

/** Mensajes de error que produciría el ValidationPipe de la API. */
function errores<T extends object>(clase: new () => T, datos: object): string[] {
  const dto = plainToInstance(clase, datos);
  return validateSync(dto, { whitelist: true }).flatMap((e) => Object.values(e.constraints ?? {}));
}

const recursoValido = {
  titulo: 'Guía',
  tipo: 'documento',
  url: 'https://ejemplo.cl/guia.pdf',
  unidad: 'Unidad 1',
  asignaturaId: 'mat3',
};

describe('Validación de recursos', () => {
  it('acepta un recurso válido, con o sin enlace', () => {
    expect(errores(CreateRecursoDto, recursoValido)).toEqual([]);
    expect(errores(CreateRecursoDto, { ...recursoValido, url: '' })).toEqual([]);
    expect(errores(CreateRecursoDto, { ...recursoValido, url: undefined })).toEqual([]);
  });

  it('exige título, unidad y asignatura (un título con solo espacios no sirve)', () => {
    const e = errores(CreateRecursoDto, { tipo: 'video', titulo: '   ' });
    expect(e).toEqual(
      expect.arrayContaining([
        'Ingresa un título para el recurso.',
        'Indica la unidad o tema del recurso.',
        'Selecciona la asignatura y el nivel.',
      ]),
    );
  });

  it('rechaza tipos desconocidos', () => {
    expect(errores(CreateRecursoDto, { ...recursoValido, tipo: 'audio' })).toContain(
      'El tipo debe ser video, documento o imagen.',
    );
  });

  it.each(['javascript:alert(1)', 'data:text/html,<script>', 'ftp://ejemplo.cl/a', 'www.ejemplo.cl'])(
    'rechaza el enlace inseguro o incompleto %s',
    (url) => {
      expect(errores(CreateRecursoDto, { ...recursoValido, url })).toContain(
        'El enlace debe ser una dirección web que empiece con http:// o https://.',
      );
    },
  );

  it('al editar, todos los campos son opcionales', () => {
    expect(errores(UpdateRecursoDto, {})).toEqual([]);
    expect(errores(UpdateRecursoDto, { titulo: '' })).toContain('Ingresa un título para el recurso.');
  });
});

describe('Validación de actividades', () => {
  const valida = { titulo: 'A', descripcion: 'B', duracionMinutos: 15, asignaturaId: 'mat3' };

  it('acepta una actividad válida', () => {
    expect(errores(CreateActividadDto, valida)).toEqual([]);
  });

  it.each([
    [0, 'La duración debe ser de al menos 1 minuto.'],
    [241, 'La duración no puede superar los 240 minutos.'],
    [12.5, 'La duración debe ser un número entero de minutos.'],
  ])('rechaza una duración de %p minutos', (duracionMinutos, mensaje) => {
    expect(errores(CreateActividadDto, { ...valida, duracionMinutos })).toContain(mensaje);
  });
});
