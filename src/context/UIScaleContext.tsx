import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Densidade da interface (zoom interno do app).
 *
 * O GaaS foi desenhado para um canvas de ~1920px (ver `max-w-[1920px]` no MainLayout).
 * Em telas menores (notebooks de 1280-1536px) o layout fica apertado. Este contexto
 * reduz a interface automaticamente via a propriedade CSS `zoom` na raiz — mesmo
 * efeito do zoom do navegador, porem automatico.
 *
 * Nao ha controle manual por decisao de produto: o usuario nao deveria precisar
 * configurar nada para ter uma tela bem aproveitada. Quem quiser ajuste fino
 * continua tendo o zoom nativo do navegador (Ctrl +/-), que se multiplica a este.
 */

/** Largura de canvas para a qual o app foi desenhado. A escala automatica mira nela. */
const DESIGN_WIDTH = 1920;
const MIN_SCALE = 0.67;
const MAX_SCALE = 1;

/**
 * Escala automatica: razao entre a largura real da janela e o canvas de design,
 * arredondada em passos de 5% e limitada a [0.67, 1].
 * Ex.: 1280px -> 0.67 | 1366px -> 0.70 | 1536px -> 0.80 | 1920px -> 1.00
 */
export function resolveAutoScale(viewportWidth: number): number {
    if (!viewportWidth) return MAX_SCALE;
    const raw = viewportWidth / DESIGN_WIDTH;
    const snapped = Math.round(raw * 20) / 20;
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, snapped));
}

/* ──────────────────────────────────────────────────────────────
   Conversao de coordenadas (ver invariante 2 no CLAUDE.md)

   Com `zoom` na raiz convivem dois espacos de coordenadas:
     - FISICO: getBoundingClientRect(), event.clientX/Y, window.innerWidth/Height
     - LOCAL:  style.top/left/transform, que ja sao multiplicados pela escala

   Quem mede em fisico e posiciona via style (tooltips, hover cards, popovers)
   PRECISA converter, senao o elemento aparece deslocado. Estas funcoes vivem
   fora do React de proposito: sao chamadas dentro de handlers e effects.
   ────────────────────────────────────────────────────────────── */

let currentScale = MAX_SCALE;

/** Escala em vigor. */
export function getUIScale(): number {
    return currentScale;
}

/** Converte um valor em px fisicos (rect, clientX/Y, innerWidth/Height) para px locais. */
export function toLocalPx(physicalPx: number): number {
    return physicalPx / currentScale;
}

/** Viewport em px locais — use no lugar de window.innerWidth/innerHeight ao posicionar. */
export function getLocalViewport(): { width: number; height: number } {
    return {
        width: toLocalPx(window.innerWidth),
        height: toLocalPx(window.innerHeight),
    };
}

/** Converte um DOMRect (fisico) para px locais. */
export function toLocalRect(rect: DOMRect): {
    top: number; left: number; right: number; bottom: number; width: number; height: number;
} {
    return {
        top: toLocalPx(rect.top),
        left: toLocalPx(rect.left),
        right: toLocalPx(rect.right),
        bottom: toLocalPx(rect.bottom),
        width: toLocalPx(rect.width),
        height: toLocalPx(rect.height),
    };
}

interface UIScaleContextValue {
    /** Escala efetivamente aplicada no DOM. */
    scale: number;
}

const UIScaleContext = createContext<UIScaleContextValue | null>(null);

export const UIScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [viewportWidth, setViewportWidth] = useState<number>(
        () => (typeof window === 'undefined' ? DESIGN_WIDTH : window.innerWidth)
    );

    // `window.innerWidth` nao e afetado pelo `zoom` da raiz, entao nao ha loop de feedback.
    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const scale = useMemo(() => resolveAutoScale(viewportWidth), [viewportWidth]);

    // useLayoutEffect para que `currentScale` e a variavel CSS estejam corretos
    // antes de qualquer medicao feita por filhos no mesmo commit.
    React.useLayoutEffect(() => {
        currentScale = scale;
        const root = document.documentElement;
        root.style.setProperty('--ui-scale', String(scale));
        return () => {
            root.style.removeProperty('--ui-scale');
        };
    }, [scale]);

    const value = useMemo(() => ({ scale }), [scale]);

    return <UIScaleContext.Provider value={value}>{children}</UIScaleContext.Provider>;
};

export function useUIScale(): UIScaleContextValue {
    const ctx = useContext(UIScaleContext);
    if (!ctx) throw new Error('useUIScale precisa estar dentro de <UIScaleProvider>');
    return ctx;
}
