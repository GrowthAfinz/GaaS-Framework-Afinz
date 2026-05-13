import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface FullscreenButtonProps {
  className?: string;
  size?: number;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({ className = '', size = 18 }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    setIsFullscreen(!!document.fullscreenElement);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg transition-all text-slate-400 hover:text-slate-700 hover:bg-slate-100 ${className}`}
      title={isFullscreen ? 'Sair da tela cheia (F11)' : 'Tela cheia (F11)'}
    >
      {isFullscreen ? <Minimize2 size={size} /> : <Maximize2 size={size} />}
    </button>
  );
};
