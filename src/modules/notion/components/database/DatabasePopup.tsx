import React, { useLayoutEffect, useRef } from 'react';

export function DatabasePopup({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog ref={dialog} aria-label={title} onCancel={onClose}
      className="m-auto w-80 max-w-[90vw] rounded-lg border border-[var(--notion-border)] bg-[var(--notion-card)] p-4 text-left text-xs font-normal text-[var(--notion-text)] shadow-lg backdrop:bg-slate-950/30">
      <div className="mb-3 flex items-center justify-between gap-2">
        <strong>{title}</strong>
        <button type="button" onClick={onClose} className="rounded px-2 py-1 hover:bg-[var(--notion-hover)]">Fechar</button>
      </div>
      {children}
    </dialog>
  );
}
