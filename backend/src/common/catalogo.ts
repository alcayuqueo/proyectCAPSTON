import { ForbiddenException, NotFoundException } from '@nestjs/common';

/**
 * Recursos y actividades pueden ser del catálogo (autorId vacío, compartidos y de solo
 * lectura) o propios de un docente. Solo el autor puede modificarlos o eliminarlos.
 */
export function verificarAutor(
  elemento: { autorId: string | null } | null,
  docenteId: string,
  nombre: { singular: string; articulo: 'El' | 'La'; terminacion: 'o' | 'a' },
) {
  const { singular, articulo, terminacion } = nombre;
  if (!elemento) {
    throw new NotFoundException(`${articulo} ${singular} no existe.`);
  }
  if (elemento.autorId === null) {
    throw new ForbiddenException(
      `${articulo} ${singular} es del catálogo y no se puede modificar. Puedes crear un${terminacion === 'a' ? 'a' : 'o'} propi${terminacion}.`,
    );
  }
  if (elemento.autorId !== docenteId) {
    // Igual que si no existiera: no se revela el contenido de otros docentes.
    throw new NotFoundException(`${articulo} ${singular} no existe.`);
  }
}

/** Filtro de Prisma: elementos del catálogo más los del docente (si hay sesión). */
export function visiblesPara(docenteId?: string | null) {
  return docenteId ? { OR: [{ autorId: null }, { autorId: docenteId }] } : { autorId: null };
}
