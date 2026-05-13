import React, { useRef, useEffect, useState, useCallback } from 'react';

interface GaaSLogoProps {
    className?: string;
    height?: number;
}

/**
 * GaaS Logo — Calibri Bold, teal bar (#00C6CC) centrada na tinta do 'S'.
 * Mesma técnica do AfinzLogo:
 *   X → SVG getBBox() do texto invisível "Gaa" (onde o 'S' começa)
 *   Y → Canvas actualBoundingBoxAscent/Descent do glifo 'S'
 */
export const GaaSLogo: React.FC<GaaSLogoProps> = ({ className = '', height = 32 }) => {
    const textRef = useRef<SVGTextElement>(null);
    const prefixRef = useRef<SVGTextElement>(null);

    const fontSize  = Math.round(height * 0.88);
    const baseline  = Math.round(height * 0.80);
    const fontDecl  = `bold ${fontSize}px Calibri, 'Trebuchet MS', sans-serif`;

    const [svgWidth, setSvgWidth] = useState(height * 2.8);
    const [bar, setBar]  = useState<{ x: number; y: number; w: number; h: number } | null>(null);

    const measure = useCallback(() => {
        const full   = textRef.current;
        const prefix = prefixRef.current;
        if (!full || !prefix) return;

        try {
            const fullBox   = full.getBBox();
            const prefixBox = prefix.getBBox();
            const sX = prefixBox.x + prefixBox.width;
            const sW = (fullBox.x + fullBox.width) - sX;
            setSvgWidth(fullBox.x + fullBox.width + 2);

            const canvas = document.createElement('canvas');
            const ctx    = canvas.getContext('2d');
            if (!ctx || sW <= 0) return;

            ctx.font = fontDecl;
            const m = ctx.measureText('S');

            let barH: number;
            let barY: number;

            if (m.actualBoundingBoxAscent != null) {
                const inkTop    = baseline - m.actualBoundingBoxAscent;
                const inkBottom = baseline + (m.actualBoundingBoxDescent ?? 0);
                const inkH      = inkBottom - inkTop;
                barH = Math.max(inkH * 0.20, 1.8);
                barY = inkTop + (inkH - barH) / 2;
            } else {
                const capH = fontSize * 0.72;
                barH = Math.max(capH * 0.20, 1.8);
                barY = baseline - capH / 2 - barH / 2;
            }

            setBar({ x: sX, y: barY, w: sW, h: barH });
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
            aria-label="GaaS"
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
                GaaS
            </text>

            {/* "Gaa" invisível — mede onde 'S' começa no eixo X */}
            <text
                ref={prefixRef}
                x={0}
                y={baseline}
                style={textStyle}
                fill="none"
                aria-hidden="true"
                textAnchor="start"
            >
                Gaa
            </text>

            {/* Barra teal centrada na tinta do 'S' */}
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
