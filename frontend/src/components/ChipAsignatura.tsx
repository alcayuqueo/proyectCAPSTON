import { temaDe } from '../lib/temas';

/** Asignatura y nivel en una etiqueta con el color de la asignatura. */
export default function ChipAsignatura({ asignatura, nivel }: { asignatura: string; nivel: string }) {
  const tema = temaDe(asignatura);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={{ background: tema.suave, color: tema.oscuro }}
    >
      {asignatura} · {nivel}
    </span>
  );
}
