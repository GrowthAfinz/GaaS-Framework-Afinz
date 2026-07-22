import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Densidade da interface (zoom interno do app).
 *
 * O GaaS foi desenhado para um canvas de ~1920px (ver `max-w-[1920px]` no MainLayout).
 * Em telas menores (notebooks de 1280-1536px) o layout fica apertado e o usuario
 * precisava dar zoom-out manual no navegador. Este contexto aplica esse zoom
 * automaticamente via a propriedade CSS `zoom` na raiz do documento — mesmo efeito
 * do zoom do navegador, porem persistido e aplicado so ao app.
 */

export type UIScalePreference = 'auto' | number;

const STORAGE_KEY = 'gaas:ui-scale';

/** Largura de canvas para a qual o app foi desenhado. O modo auto mira nela. */
const DESIGN_WIDTH = 1920;
const MIN_SCALE = 0.67;
const MAX_SCALE = 1;

/** Passos manuais, espelhando os presets de zoom do navegador. */
export const SCALE_STEPS: { value: number; label: string; hint: string }[] = [
    { value: 1, label: '100%', hint: 'Confortavel' },
    { value: 0.9, label: '90%', hint: 'Padrao' },
    { value: 0.8, label: '80%', hint: 'Compacto' },
    { value: 0.67, label: '67%', hint: 'Denso' },
];

/**
 * Escala do modo automatico: razao entre a largura real da janela e o canvas de
 * design, arredondada em passos de 5% e limitada a [0.67, 1].
 * Ex.: 1366px -> 0.70 | 1536px -> 0.80 | 1920px -> 1.00
 */
export function resolveAutoScale(viewportWidth: number): number {
    if (!viewportWidth) return MAX_SCALE;
    const raw = viewportWidth / DESIGN_WIDTH;
    const snapped = Math.round(raw * 20) / 20;
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, snapped));
}

function readStoredPreference(): UIScalePreference {
    if (typeof window === 'undefined') return 'auto';
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw || raw === 'auto') return 'auto';
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed >= MIN_SCALE && parsed <= MAX_SCALE ? parsed : 'auto';
    } catch {
        return 'auto';
    }
}

interface UIScaleContextValue {
    /** O que o usuario escolheu ('auto' ou um valor fixo). */
    preference: UIScalePreference;
    /** Escala efetivamente aplicada no DOM. */
    scale: number;
    setPreference: (preference: UIScalePreference) => void;
}

const UIScaleContext = createContext<UIScaleContextValue | null>(null);

export const UIScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [preference, setPreferenceState] = useState<UIScalePreference>(readStoredPreference);
    const [viewportWidth, setViewportWidth] = useState<number>(
        () => (typeof window === 'undefined' ? DESIGN_WIDTH : window.innerWidth)
    );

    // `window.innerWidth` nao e afetado pelo `zoom` da raiz, entao nao ha loop de feedback.
    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const scale = useMemo(
        () => (preference === 'auto' ? resolveAutoScale(viewportWidth) : preference),
        [preference, viewportWidth]
    );

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--ui-scale', String(scale));
        return () => {
            root.style.removeProperty('--ui-scale');
        };
    }, [scale]);

    const setPreference = useCallback((next: UIScalePreference) => {
        setPreferenceState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next === 'auto' ? 'auto' : String(next));
        } catch {
            /* localStorage indisponivel (modo privado) — a escala vale so para a sessao */
        }
    }, []);

    const value = useMemo(() => ({ preference, scale, setPreference }), [preference, scale, setPreference]);

    return <UIScaleContext.Provider value={value}>{children}</UIScaleContext.Provider>;
};

export function useUIScale(): UIScaleContextValue {
    const ctx = useContext(UIScaleContext);
    if (!ctx) throw new Error('useUIScale precisa estar dentro de <UIScaleProvider>');
    return ctx;
}
