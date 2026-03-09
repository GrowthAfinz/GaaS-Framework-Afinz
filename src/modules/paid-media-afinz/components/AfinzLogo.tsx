import React from 'react';

interface AfinzLogoProps {
    className?: string;
    height?: number;
}

/**
 * Afinz Logo — brand guide faithful.
 * "afinz" bold, lowercase, NO italics.
 * Double-story 'a' (using Arial Black).
 * "z" has a teal #00C6CC bar positioned at the TOP of the letter's beginning.
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
        display: 'inline-block'
    };

    return (
        <span
            className={`inline-flex items-end select-none ${className}`}
            aria-label="afinz"
            style={{ height }}
        >
            {/* "afin" — Double-story 'a', bold, no italics */}
            <span style={fontStyle}>afin</span>

            {/* "z" with teal bar crossing the TOP portion */}
            <span style={{
                position: 'relative',
                display: 'inline-block',
                ...fontStyle,
                marginLeft: '-0.02em',
                transform: 'translateY(1.5%)'
            }}>
                z
                <span
                    style={{
                        position: 'absolute',
                        left: '-5%',
                        right: '-5%',
                        // Positioned at the TOP of the lowercase 'z'
                        top: '15%',
                        height: Math.max(3, fontSize * 0.13),
                        backgroundColor: '#00C6CC',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                />
            </span>
        </span>
    );
};
