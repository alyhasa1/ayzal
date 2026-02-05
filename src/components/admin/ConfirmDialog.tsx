import { useEffect, useRef, type ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    confirmRef.current?.focus();

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white border border-[#111]/10 shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="text-sm text-[#6E6E6E]">{message}</p>
        {children}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            className="px-4 py-2 text-sm border border-[#111]/10 hover:bg-[#111]/5 transition-colors"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`px-4 py-2 text-sm text-white transition-colors ${
              destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#111] hover:bg-[#111]/80'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
