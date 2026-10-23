/** Fecha de hoy en formato AAAA-MM-DD, según la hora local. */
export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Se usa el mediodía para que la zona horaria no cambie el día.
function aFecha(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/** Ej.: "martes 28 de octubre". */
export function fechaLarga(iso: string): string {
  return aFecha(iso).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Partes para el bloque de fecha de las tarjetas: { diaSemana: "mar", dia: "28", mes: "oct" }. */
export function partesFecha(iso: string) {
  const f = aFecha(iso);
  return {
    diaSemana: f.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', ''),
    dia: String(f.getDate()),
    mes: f.toLocaleDateString('es-CL', { month: 'short' }).replace('.', ''),
  };
}
