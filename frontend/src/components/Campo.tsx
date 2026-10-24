import type { ReactNode } from 'react';

/**
 * Etiqueta, campo, texto de ayuda y mensaje de error de un formulario.
 * El campo debe usar aria-describedby={`${id}-error`} o {`${id}-ayuda`}.
 */
export default function Campo({
  id,
  etiqueta,
  opcional,
  ayuda,
  error,
  children,
}: {
  id: string;
  etiqueta: string;
  opcional?: boolean;
  ayuda?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {etiqueta}
        {opcional && <span className="ml-1 font-normal text-ink-500">(opcional)</span>}
      </label>
      {children}
      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="text-xs text-ink-500">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
