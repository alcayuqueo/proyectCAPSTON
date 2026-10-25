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
    <div role="group" aria-label="Mostrar" className="flex rounded-full border-2 border-ink-900 bg-white p-1 text-xs font-bold">
      {opciones.map(([o, etiqueta]) => (
        <button
          key={o}
          type="button"
          aria-pressed={valor === o}
          onClick={() => onCambiar(o)}
          className={[
            'rounded-full px-3 py-1.5 transition-colors',
            valor === o ? 'bg-sol text-ink-900' : 'text-ink-500 hover:text-ink-900',
          ].join(' ')}
        >
          {etiqueta}
        </button>
      ))}
    </div>
  );
}
