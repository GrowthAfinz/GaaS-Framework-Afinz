import React from 'react';

interface AfinzLogoProps {
    className?: string;
    height?: number;
}

/**
 * Afinz Logo — brand guide faithful.
 * "afinz" bold, lowercase, NO italics.
 * "z" has a teal #00c6cc bar centered on the letter.
 *
 * IMPORTANT: fontStyle spread must come FIRST in zContainerStyle so that
 * display: 'inline-flex' and alignItems: 'center' are not overridden by
 * fontStyle's display: 'inline-block'.
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
        ...fontStyle,              // spread FIRST — explicit props below override it
        position: 'relative',
        display: 'inline-flex',    // overrides fontStyle.display = 'inline-block'
        alignItems: 'center',      // now works: vertically centers the z glyph
        justifyContent: 'center',
        width: '0.6em',
        height: '1em',
        marginLeft: '-0.01em',
    };

    return (
        <span
            className={`inline-flex items-end select-none ${className}`}
            aria-label="afinz"
            style={{ height }}
        >
            {/* "afin" */}
            <span style={fontStyle}>afin</span>

            {/* "z" with teal bar centered via top:50% + translateY(-50%) */}
            <span style={zContainerStyle}>
                <span style={{ position: 'relative', zIndex: 2, lineHeight: 1 }}>z</span>
                <span
                    style={{
                        position: 'absolute',
                        left: '0',
                        right: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '0.14em',
                        backgroundColor: '#00c6cc',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                />
            </span>
        </span>
    );
};
