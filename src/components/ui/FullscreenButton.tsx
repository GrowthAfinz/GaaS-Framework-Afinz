import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface FullscreenButtonProps {
  className?: string;
  size?: number;
  target?: () => HTMLElement | null;
  onFailure?: () => void;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({ className = '', size = 18, target, onFailure }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(target ? document.fullscreenElement===target() : !!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    onChange();
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [target]);

  const toggle = () => {
    if (!isFullscreen) {
      const element=target?.()||document.documentElement;
      if(!element.requestFullscreen){onFailure?.();return;}
      element.requestFullscreen().catch(() => onFailure?.());
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
      className={`p-2 rounded-lg transition-all text-slate-400 hover:text-slate-700 hover:bg-slate-100 ${className}`}
      title={isFullscreen ? 'Sair da tela cheia (F11)' : 'Tela cheia (F11)'}
    >
      {isFullscreen ? <Minimize2 size={size} /> : <Maximize2 size={size} />}
    </button>
  );
};
