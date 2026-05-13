import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  size?: number;
  children?: React.ReactNode;
}

// Tooltip via portal para evitar cortes por overflow e glitches de layout
export const Tooltip: React.FC<TooltipProps> = ({ content, side = 'top', size = 14, children }) => {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!visible || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();

    const gap = 8; // 8px de espaçamento
    let top = rect.top;
    let left = rect.left;

    switch (side) {
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        break;
      case 'top':
      default:
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
    }

    // Clamp para manter na viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    left = Math.max(8, Math.min(vw - 8, left));
    top = Math.max(8, Math.min(vh - 8, top));
    setPos({ top, left });
  }, [visible, side]);

  return (
    <span
      ref={anchorRef}
      className="inline-flex items-center align-middle select-none"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children ? children : <Info size={size} className="text-slate-400 hover:text-slate-300 transition-colors cursor-default" />}
      {visible && pos &&
        createPortal(
          <div
            className="fixed z-50 opacity-0 animate-[fadeIn_120ms_ease-out_forwards]"
            style={{ top: pos.top, left: pos.left, transform: side === 'top' || side === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)' }}
          >
            <div className="max-w-xs text-xs text-slate-300 bg-slate-900/90 border border-slate-700 rounded-md shadow-xl px-3 py-2 whitespace-pre-line">
              {content}
            </div>
          </div>,
          document.body
        )}
      <style>
        {`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}
      </style>
    </span>
  );
};
