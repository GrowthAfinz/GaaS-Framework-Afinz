import React, { useRef, useState, useLayoutEffect } from 'react';

interface AfinzLogoProps {
    className?: string;
    height?: number;
}

/**
 * Afinz Logo — brand guide faithful.
 * "afinz" bold, lowercase, NO italics.
 * "z" has a teal #00c6cc bar centered on the letter.
 *
 * Bar position is measured via getBoundingClientRect so it works
 * regardless of which font is actually rendered (Arial Black, fallback, etc).
 */
export const AfinzLogo: React.FC<AfinzLogoProps> = ({ className = '', height = 32 }) => {
    const fontSize = height * 0.95;
    const fontStyle: React.CSSProperties = {
        fontFamily: "'Arial Black', 'Arial Bold', 'Helvetica Black', sans-serif",
        fontWeight: 900,
        fontStyle: 'normal',
        fontSize,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        color: 'currentColor',
        display: 'inline-block',
    };

    const zRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLSpanElement>(null);
    const [barTop, setBarTop] = useState<number | null>(null);
    const [barHeight, setBarHeight] = useState<number | null>(null);

    useLayoutEffect(() => {
        const measure = () => {
            if (!zRef.current || !containerRef.current) return;
            const zRect = zRef.current.getBoundingClientRect();
            const cRect = containerRef.current.getBoundingClientRect();
            const bh = Math.round(zRect.height * 0.22); // ~22% of glyph height
            const bt = Math.round(zRect.top - cRect.top + (zRect.height - bh) / 2);
            setBarHeight(bh);
            setBarTop(bt);
        };
        measure();
        // Re-measure on font load (if font is async)
        if (document.fonts) {
            document.fonts.ready.then(measure);
        }
    }, [height]);

    return (
        <span
            ref={containerRef}
            className={`inline-flex items-end select-none ${className}`}
            aria-label="afinz"
            style={{ height, position: 'relative' }}
        >
            {/* "afin" */}
            <span style={fontStyle}>afin</span>

            {/* "z" — positioned relatively so the bar can reference it */}
            <span style={{ ...fontStyle, position: 'relative', marginLeft: '-0.01em' }}>
                <span ref={zRef} style={{ position: 'relative', zIndex: 2 }}>z</span>
                {barTop !== null && barHeight !== null && (
                    <span
                        style={{
                            position: 'absolute',
                            // left: aligns with left edge of z glyph; right extends ~10% past it
                            left: 0,
                            right: '-0.06em',
                            top: barTop,
                            height: barHeight,
                            backgroundColor: '#00c6cc',
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />
                )}
            </span>
        </span>
    );
};
