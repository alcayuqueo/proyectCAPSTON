import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  /** Mientras se guarda, la ventana no se cierra con Escape ni tocando el fondo. */
  bloqueado?: boolean;
  children: ReactNode;
}

/**
 * Ventana para formularios. En el celular aparece desde abajo y ocupa todo el ancho.
 * Se cierra con Escape, con la X o tocando el fondo, y enfoca el primer campo al abrir.
 */
export default function Modal({ abierto, titulo, onCerrar, bloqueado = false, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !bloqueado) onCerrar();
    };
    window.addEventListener('keydown', alPresionar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflow;
      anterior?.focus(); // devuelve el foco al botón que abrió la ventana
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 sm:items-center sm:px-4"
      onClick={() => !bloqueado && onCerrar()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-card bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-card sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-titulo" className="text-lg font-semibold text-ink-900">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            disabled={bloqueado}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 rounded-lg p-2 text-ink-500 hover:bg-ink-300/10 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
