/**
 * Ruta interna a la que volver después de iniciar sesión o registrarse.
 * Solo se aceptan rutas de esta misma aplicación ("/algo"). Se rechazan direcciones
 * externas o ambiguas ("//sitio.com", "/\\sitio.com", "https://…") para evitar
 * redirecciones abiertas (CVE-2025-68470 en react-router 6).
 */
export function destinoSeguro(desde: unknown, porDefecto = '/planificador'): string {
  if (typeof desde !== 'string') return porDefecto;
  if (!desde.startsWith('/') || desde.startsWith('//') || desde.includes('\\')) return porDefecto;
  if (/[\u0000-\u001f]/.test(desde)) return porDefecto;
  return desde;
}
