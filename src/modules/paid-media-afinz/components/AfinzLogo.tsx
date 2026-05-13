import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AfinzLogoProps {
    className?: string;
    height?: number;
}

/**
 * Afinz Logo — Calibri Bold como tipografia de sistema.
 *
 * Estratégia de posicionamento da barra teal (#00C6CC):
 *   X + Width → SVG getBBox() do texto invisível "afin" (onde o 'z' começa).
 *   Y (centro) → Canvas 2D actualBoundingBoxAscent/Descent do glifo 'z'.
 *               Única API que retorna os limites reais da tinta, sem line-height.
 *
 * Calibri Bold está disponível nativamente no Windows (fonte de sistema).
 * Fallback: Trebuchet MS → sans-serif genérico.
 */
export const AfinzLogo: React.FC<AfinzLogoProps> = ({ className = '', height = 32 }) => {
    const textRef = useRef<SVGTextElement>(null);
    const afinRef = useRef<SVGTextElement>(null);

    // Calibri: baseline tipicamente a ~80% do tamanho do font
    const fontSize = Math.round(height * 0.88);
    const baseline = Math.round(height * 0.80);

    const fontDecl = `bold ${fontSize}px Calibri, 'Trebuchet MS', sans-serif`;

    const [svgWidth, setSvgWidth] = useState(height * 3.6);
    const [bar, setBar] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

    const measure = useCallback(() => {
        const full = textRef.current;
        const afin = afinRef.current;
        if (!full || !afin) return;

        try {
            /* ── X / Width via SVG getBBox ─────────────────────────── */
            const fullBox = full.getBBox();
            const afinBox = afin.getBBox();
            const zX = afinBox.x + afinBox.width;
            const zW = (fullBox.x + fullBox.width) - zX;
            setSvgWidth(fullBox.x + fullBox.width + 2);

            /* ── Y via Canvas actualBoundingBox ────────────────────── */
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx || zW <= 0) return;

            ctx.font = fontDecl;
            const m = ctx.measureText('z');

            let barH: number;
            let barY: number;

            if (m.actualBoundingBoxAscent != null) {
                // Limites reais da tinta do glifo 'z'
                const inkTop    = baseline - m.actualBoundingBoxAscent;
                const inkBottom = baseline + (m.actualBoundingBoxDescent ?? 0);
                const inkH      = inkBottom - inkTop;
                barH = Math.max(inkH * 0.20, 1.8);
                barY = inkTop + (inkH - barH) / 2;   // centro geométrico exato
            } else {
                // Fallback: x-height Calibri ≈ 0.53 × fontSize
                const xH = fontSize * 0.53;
                barH = Math.max(xH * 0.20, 1.8);
                barY = baseline - xH / 2 - barH / 2;
            }

            setBar({ x: zX, y: barY, w: zW, h: barH });
        } catch {
            /* silently retry */
        }
    }, [baseline, fontSize, fontDecl]);

    useEffect(() => {
        setBar(null);
        const raf = requestAnimationFrame(measure);
        const t   = setTimeout(measure, 200);
        return () => { cancelAnimationFrame(raf); clearTimeout(t); };
    }, [height, measure]);

    const textStyle: React.CSSProperties = {
        fontFamily:    "Calibri, 'Trebuchet MS', sans-serif",
        fontWeight:    700,
        fontStyle:     'normal',
        fontSize,
        letterSpacing: '-0.01em',
    };

    return (
        <svg
            height={height}
            width={svgWidth}
            xmlns="http://www.w3.org/2000/svg"
            aria-label="afinz"
            className={`select-none ${className}`}
            style={{ display: 'block', overflow: 'visible' }}
        >
            {/* Texto principal */}
            <text
                ref={textRef}
                x={0}
                y={baseline}
                style={textStyle}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={0.4}
                strokeLinejoin="round"
                textAnchor="start"
            >
                afinz
            </text>

            {/* "afin" invisível — apenas para medir onde 'z' inicia no eixo X */}
            <text
                ref={afinRef}
                x={0}
                y={baseline}
                style={textStyle}
                fill="none"
                aria-hidden="true"
                textAnchor="start"
            >
                afin
            </text>

            {/* Barra teal centrada na tinta do 'z' */}
            {bar && (
                <rect
                    x={bar.x}
                    y={bar.y}
                    width={bar.w}
                    height={bar.h}
                    fill="#00C6CC"
                    rx={bar.h * 0.15}
                />
            )}
        </svg>
    );
};
