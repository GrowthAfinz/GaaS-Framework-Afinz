import React from 'react';

interface AfinzLogoProps {
    className?: string;
    height?: number;
}

/**
 * Afinz Logo — brand guide faithful.
 * "afinz" bold lowercase, "z" has a teal #00C6CC horizontal bar at mid-height.
 */
export const AfinzLogo: React.FC<AfinzLogoProps> = ({ className = '', height = 32 }) => {
    const fontSize = height * 0.9;
    const fontStyle: React.CSSProperties = {
        fontFamily: "'Arial Black', 'Arial Bold', 'Helvetica Neue', sans-serif",
        fontWeight: 900,
        fontSize,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        color: 'currentColor',
    };

    return (
        <span
            className={`inline-flex items-end select-none ${className}`}
            aria-label="afinz"
            style={{ lineHeight: 1 }}
        >
            {/* "afin" — solid */}
            <span style={fontStyle}>afin</span>

            {/* "z" with teal bar at mid-height */}
            <span style={{ position: 'relative', display: 'inline-block', ...fontStyle }}>
                z
                {/* 
                    The bar sits at approx. 50% of the x-height of lowercase z.
                    Arial Black x-height ≈ 55% of font-size.
                    Middle of z from bottom ≈ 55%/2 = 27.5% of font-size = 28% from bottom.
                */}
                <span
                    style={{
                        position: 'absolute',
                        left: '-8%',
                        right: '-8%',
                        bottom: `${fontSize * 0.28}px`,
                        height: Math.max(2.5, fontSize * 0.11),
                        backgroundColor: '#00C6CC',
                        borderRadius: 1,
                        pointerEvents: 'none',
                    }}
                />
            </span>
        </span>
    );
};
