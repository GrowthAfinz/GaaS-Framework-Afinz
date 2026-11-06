import { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';

// Shared, restrained visual language. Notes cannot override security or inject configuration.
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true, theme: 'base', look: 'classic', htmlLabels: false,
  flowchart: { htmlLabels: false, useMaxWidth: false, curve: 'linear', nodeSpacing: 30, rankSpacing: 48 },
  themeVariables: { fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', primaryColor: '#f8fafc', primaryTextColor: '#1e293b', primaryBorderColor: '#cbd5e1', lineColor: '#64748b', secondaryColor: '#ecfeff', tertiaryColor: '#ffffff', clusterBkg: '#ffffff', clusterBorder: '#cbd5e1', edgeLabelBackground: '#ffffff' },
});

export default function WikiDiagramCanvas({ source, zoom, expanded }: { source: string; zoom: number; expanded: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setError(false);
    const render = async () => {
      try {
        if (source.length > 50000 || /%%\s*\{|^\s*---|\bclick\s+\S+\s+(?:href|call|"|')/m.test(source)) throw new Error('unsupported_diagram');
        const { svg } = await mermaid.render(`wiki-flow-${id}`, source);
        if (active && host.current) {
          host.current.innerHTML = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true }, FORBID_TAGS: ['foreignObject', 'script', 'a', 'image'], FORBID_ATTR: ['onload', 'onclick'] });
          const diagram = host.current.querySelector('svg');
          const naturalWidth = diagram?.viewBox.baseVal.width;
          if (diagram && naturalWidth && !expanded) diagram.style.maxWidth = `${naturalWidth}px`;
        }
      } catch { if (active) setError(true); }
    };
    void render();
    return () => { active = false; };
  }, [source, id, expanded]);
  if (error) return <div className="p-5 text-sm" role="alert"><p>Não foi possível desenhar este fluxo. Confira a sintaxe Mermaid na nota-fonte.</p><details className="mt-3"><summary className="cursor-pointer text-cyan-800">Consultar definição do fluxo</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs">{source}</pre></details></div>;
  return <div className="overflow-auto p-4" tabIndex={0} aria-label="Diagrama; role para percorrer o fluxo"><div ref={host} role="img" aria-label="Fluxo descrito na seção da estratégia" style={{ width: expanded ? `${zoom}%` : '100%', minWidth: expanded ? 700 * zoom / 100 : 560 }} className="[&>svg]:mx-auto [&>svg]:h-auto [&>svg]:w-full" /></div>;
}
