import React from 'react';

interface AfinzLogoProps {
    className?: string;
    height?: number;
}

/**
 * Afinz Logo — brand guide faithful.
 * "afinz" bold, lowercase, NO italics.
 * Double-story 'a' (using Arial Black).
 * "z" has a teal #00C6CC bar centered on the letter for stable scaling.
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

    const zContainerStyle: React.CSSProperties = {
        ...fontStyle,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '0.6em',
        height: '1em',
        marginLeft: '-0.01em'
    };

    return (
        <span
            className={`inline-flex items-end select-none ${className}`}
            aria-label="afinz"
            style={{ height }}
        >
            {/* "afin" — Double-story 'a', bold, no italics */}
            <span style={fontStyle}>afin</span>

            {/* "z" with centered teal bar */}
            <span style={zContainerStyle}>
                <span style={{ position: 'relative', zIndex: 2, lineHeight: 1 }}>z</span>
                <span
                    style={{
                        position: 'absolute',
                        left: '0',
                        right: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '0.12em',
                        backgroundColor: '#00C6CC',
                        borderRadius: '0.02em',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                />
            </span>
        </span>
    );
};
