import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function CellPopover({ anchor, onClose, children }: {
  anchor: HTMLButtonElement;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [rect, setRect] = useState(() => anchor.getBoundingClientRect());
  useLayoutEffect(() => {
    const update = () => setRect(anchor.getBoundingClientRect());
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchor]);
  const width = Math.min(260, window.innerWidth - 16);
  const below = window.innerHeight - rect.bottom;
  const above = below < 260 && rect.top > below;
  return createPortal(
    <div className="nt-cell-popover-layer" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); anchor.focus(); }
    }}>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="nt-cell-popover" style={{
        width, left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        maxHeight: Math.max(60, (above ? rect.top : below) - 8),
        ...(above ? { bottom: window.innerHeight - rect.top + 3 } : { top: rect.bottom + 3 }),
      }}>{children}</div>
    </div>,
    anchor.closest('.nt-root') ?? document.body,
  );
}
