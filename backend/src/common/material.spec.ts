import * as fs from 'fs';
import * as path from 'path';
import { EntradaMaterial, idVideoYoutube, leerMaterial, MINUTOS_CONTENIDO, validarEntrada } from './material';

const DATA = path.join(__dirname, '..', '..', 'prisma', 'data');
const leer = <T>(archivo: string): T => JSON.parse(fs.readFileSync(path.join(DATA, archivo), 'utf-8'));

const entradas = [
  ...leer<EntradaMaterial[]>('material-matematica.json'),
  ...leer<EntradaMaterial[]>('material-lenguaje.json'),
];
const { objetivos } = leer<{ objetivos: { asignatura: string; nivel: string; eje: string; codigo: string }[] }>(
  'oa-basica-1-6.json',
);

describe('Material listo para usar (prisma/data/material-*.json)', () => {
  it('todas las entradas tienen el formato correcto', () => {
    expect(entradas.flatMap(validarEntrada)).toEqual([]);
  });

  it('cada entrada corresponde a un OA oficial de las Bases Curriculares', () => {
    const oficiales = new Set(objetivos.map((o) => `${o.asignatura}|${o.nivel}|${o.codigo}`));
    const desconocidos = entradas.map((e) => `${e.asignatura}|${e.nivel}|${e.codigo}`).filter((k) => !oficiales.has(k));
    expect(desconocidos).toEqual([]);
  });

  it('cubre un OA por cada eje y nivel de Matemática y Lenguaje (48 en total)', () => {
    const ejeDe = new Map(objetivos.map((o) => [`${o.asignatura}|${o.nivel}|${o.codigo}`, o.eje]));
    const cubiertos = entradas.map((e) => `${e.asignatura}|${e.nivel}|${ejeDe.get(`${e.asignatura}|${e.nivel}|${e.codigo}`)}`);
    const todos = new Set(objetivos.map((o) => `${o.asignatura}|${o.nivel}|${o.eje}`));
    expect(new Set(cubiertos)).toEqual(todos);
    expect(cubiertos).toHaveLength(48);
  });

  it('no repite OA ni videos', () => {
    const oas = entradas.map((e) => `${e.asignatura}|${e.nivel}|${e.codigo}`);
    const videos = entradas.flatMap((e) => e.videos.map((v) => idVideoYoutube(v.url)));
    expect(new Set(oas).size).toBe(oas.length);
    expect(new Set(videos).size).toBe(videos.length);
  });

  it('cada OA es una clase completa: inicio, explicación, práctica, preguntas y ticket de salida', () => {
    const incompletas = entradas
      .filter((e) => {
        const tipos = e.diapositivas.map((d) => d.tipo);
        return !(
          tipos[0] === 'inicio' &&
          tipos.includes('concepto') &&
          tipos.includes('practica') &&
          tipos.includes('pregunta') &&
          tipos[tipos.length - 1] === 'cierre'
        );
      })
      .map((e) => `${e.asignatura} ${e.nivel} ${e.codigo}`);
    expect(incompletas).toEqual([]);
  });

  it('cada clase dura 45 minutos (20 de contenido + 25 de actividades) y trae preparación', () => {
    const fuera = entradas
      .filter((e) => MINUTOS_CONTENIDO + e.actividades.reduce((t, a) => t + a.duracionMinutos, 0) !== 45 || !e.preparacion)
      .map((e) => `${e.asignatura} ${e.nivel} ${e.codigo}`);
    expect(fuera).toEqual([]);
    expect(entradas.every((e) => e.actividades.length === 2)).toBe(true);
  });
});

describe('idVideoYoutube', () => {
  it('reconoce enlaces de YouTube', () => {
    expect(idVideoYoutube('https://www.youtube.com/watch?v=toXyHn3zqiw')).toBe('toXyHn3zqiw');
    expect(idVideoYoutube('https://youtu.be/toXyHn3zqiw')).toBe('toXyHn3zqiw');
  });

  it('rechaza enlaces que no son de YouTube o no son seguros', () => {
    expect(idVideoYoutube('http://www.youtube.com/watch?v=toXyHn3zqiw')).toBeNull();
    expect(idVideoYoutube('https://youtube.com.ejemplo.cl/watch?v=toXyHn3zqiw')).toBeNull();
    expect(idVideoYoutube('https://www.youtube.com/watch?v=<script>')).toBeNull();
    expect(idVideoYoutube('no es una url')).toBeNull();
  });
});

describe('leerMaterial', () => {
  it('devuelve null si la columna está vacía o mal formada', () => {
    expect(leerMaterial(null)).toBeNull();
    expect(leerMaterial('texto')).toBeNull();
    expect(leerMaterial({ tema: 'Algo' })).toBeNull();
    expect(leerMaterial({ tema: 'Algo', diapositivas: [{ tipo: 'otro', titulo: 'x' }] })).toBeNull();
  });

  it('descarta las diapositivas inválidas y los campos desconocidos', () => {
    const material = leerMaterial({
      tema: 'Fracciones',
      diapositivas: [
        { tipo: 'concepto', titulo: 'Qué es', texto: 'Partes iguales', html: '<b>x</b>' },
        { tipo: 'pregunta', titulo: 'Sin respuesta' },
      ],
    });
    expect(material).toEqual({
      tema: 'Fracciones',
      diapositivas: [{ tipo: 'concepto', titulo: 'Qué es', texto: 'Partes iguales' }],
    });
  });
});
