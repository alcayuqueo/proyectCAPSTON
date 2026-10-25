import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  procesando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/** Ventana de confirmación para acciones que no se pueden deshacer. */
export default function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  procesando = false,
  onConfirmar,
  onCancelar,
}: Props) {
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    cancelarRef.current?.focus();
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !procesando) onCancelar();
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto, procesando, onCancelar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4"
      onClick={() => !procesando && onCancelar()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        aria-describedby="confirm-mensaje"
        className="w-full max-w-sm rounded-card border-[3px] border-ink-900 bg-white p-6 shadow-sticker"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-titulo" className="text-lg font-semibold text-ink-900">
          {titulo}
        </h2>
        <p id="confirm-mensaje" className="mt-2 text-sm leading-relaxed text-ink-500">
          {mensaje}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelarRef}
            onClick={onCancelar}
            disabled={procesando}
            className="rounded-lg border border-ink-300/40 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={procesando}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
          >
            {procesando && <Loader2 size={15} className="animate-spin" />}
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
