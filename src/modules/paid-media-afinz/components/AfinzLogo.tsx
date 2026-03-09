import React from 'react';

interface AfinzLogoProps {
    className?: string;
    height?: number;
    width?: number;
}

/**
 * Afinz Logo — based on brand guide.
 * Bold "Afinz" text with a teal (#00C6CC) horizontal bar crossing through the middle of the "z".
 * Uses SVG foreignObject approach to ensure font consistency.
 */
export const AfinzLogo: React.FC<AfinzLogoProps> = ({ className = '', height = 32 }) => {
    const scale = height / 40;

    return (
        <span
            className={`inline-flex items-center gap-0 select-none ${className}`}
            style={{ height }}
            aria-label="Afinz"
        >
            {/* "Afin" in bold black */}
            <span
                style={{
                    fontFamily: "'Arial Black', 'Arial Bold', 'Helvetica Neue', sans-serif",
                    fontWeight: 900,
                    fontSize: height * 0.9,
                    lineHeight: 1,
                    color: 'currentColor',
                    letterSpacing: '-0.03em',
                }}
            >
                Afin
            </span>

            {/* "z" with teal bar overlay */}
            <span style={{ position: 'relative', display: 'inline-block', lineHeight: 1 }}>
                <span
                    style={{
                        fontFamily: "'Arial Black', 'Arial Bold', 'Helvetica Neue', sans-serif",
                        fontWeight: 900,
                        fontSize: height * 0.9,
                        lineHeight: 1,
                        color: 'currentColor',
                        letterSpacing: '-0.03em',
                    }}
                >
                    z
                </span>
                {/* Cyan bar crossing through the middle of the "z" */}
                <span
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: '44%',
                        height: Math.max(2, height * 0.1),
                        backgroundColor: '#00C6CC',
                        borderRadius: 1,
                        pointerEvents: 'none',
                    }}
                />
            </span>
        </span>
    );
};
