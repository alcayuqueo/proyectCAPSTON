export type Origen = 'todos' | 'catalogo' | 'propios';

/** Botones para ver todo, solo el catálogo o solo lo creado por el docente. */
export default function SelectorOrigen({
  valor,
  onCambiar,
  etiquetaPropios,
}: {
  valor: Origen;
  onCambiar: (o: Origen) => void;
  etiquetaPropios: string;
}) {
  const opciones: [Origen, string][] = [
    ['todos', 'Todos'],
    ['catalogo', 'Catálogo'],
    ['propios', etiquetaPropios],
  ];
  return (
    <div role="group" aria-label="Mostrar" className="flex rounded-lg bg-surface-muted p-1 text-xs font-medium">
      {opciones.map(([o, etiqueta]) => (
        <button
          key={o}
          type="button"
          aria-pressed={valor === o}
          onClick={() => onCambiar(o)}
          className={[
            'rounded-md px-3 py-1.5 transition-colors',
            valor === o ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900',
          ].join(' ')}
        >
          {etiqueta}
        </button>
      ))}
    </div>
  );
}
