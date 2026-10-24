const SECRETO_DESARROLLO = 'dev-secret-cambiar-en-produccion';

/** Valores de ejemplo publicados en el repositorio: no deben usarse en producción. */
const SECRETOS_PUBLICOS = [SECRETO_DESARROLLO, 'cambia-esto-por-un-secreto-largo-y-aleatorio'];

/** Secreto con que se firman y verifican los JWT (variable JWT_SECRET). */
export function secretoJwt(): string {
  return process.env.JWT_SECRET || SECRETO_DESARROLLO;
}

/**
 * En producción el backend no arranca sin JWT_SECRET, y avisa en el registro si el
 * secreto es uno de los valores de ejemplo del repositorio o es demasiado corto: con un
 * secreto conocido, cualquiera podría fabricar tokens válidos.
 */
export function verificarSecretoJwt() {
  const secreto = process.env.JWT_SECRET;
  const produccion = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
  if (!secreto) {
    if (produccion) throw new Error('Falta configurar JWT_SECRET en las variables de entorno de producción.');
    console.warn('Aviso: JWT_SECRET no está definido; se usa el secreto de desarrollo.');
    return;
  }
  if (produccion && SECRETOS_PUBLICOS.includes(secreto)) {
    console.warn('ADVERTENCIA DE SEGURIDAD: JWT_SECRET es un valor de ejemplo público. Reemplázalo por uno aleatorio.');
  } else if (produccion && secreto.length < 32) {
    console.warn('Aviso: JWT_SECRET es corto; se recomiendan al menos 32 caracteres aleatorios.');
  }
}
