import type { CSSProperties } from 'react';

/**
 * Colores por asignatura. Los estudiantes reconocen la materia por su color en el modo
 * presentación, y el docente la ve igual en las listas. "oscuro" se usa para texto e
 * íconos (contraste ≥ 4,5:1 sobre blanco y crema); "fuerte", "medio" y "suave" para
 * fondos, anillos y decoración.
 */
export interface Tema {
  fuerte: string;
  oscuro: string;
  medio: string;
  suave: string;
  /** Decoración extra del modo presentación: letras flotantes para Lenguaje. */
  letras?: boolean;
}

export const TEMAS = {
  matematica: { fuerte: '#3D7BF7', oscuro: '#1F56C2', medio: '#C5D9FB', suave: '#E1ECFE' },
  // Lenguaje: fucsia vivo con amarillo, letras flotantes (estilo de juego de lectura, diseño propio)
  lenguaje: { fuerte: '#E23E7B', oscuro: '#A31F57', medio: '#F6C2D6', suave: '#FCE4EE', letras: true },
  ciencias: { fuerte: '#2BB673', oscuro: '#0F7445', medio: '#BFE6D0', suave: '#DDF3E7' },
  otra: { fuerte: '#14B8C4', oscuro: '#0B6F78', medio: '#BDEBEF', suave: '#E0F6F8' },
} satisfies Record<string, Tema>;

export function temaDe(asignatura: string): Tema {
  const n = asignatura
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (n.includes('matem')) return TEMAS.matematica;
  if (n.includes('lengua')) return TEMAS.lenguaje;
  if (n.includes('ciencia')) return TEMAS.ciencias;
  return TEMAS.otra;
}

/** Variables CSS del tema, para usar con clases como bg-[var(--tema-suave)]. */
export function variablesTema(t: Tema): CSSProperties {
  return {
    '--tema-fuerte': t.fuerte,
    '--tema-oscuro': t.oscuro,
    '--tema-medio': t.medio,
    '--tema-suave': t.suave,
  } as CSSProperties;
}
