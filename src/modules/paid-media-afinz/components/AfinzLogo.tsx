import React from 'react';

interface AfinzLogoProps {
    className?: string;
    height?: number;
    width?: number;
    dark?: boolean; // dark=true → white text (for dark backgrounds); false (default) → dark text
}

/**
 * Afinz Logo — rebuilt from brand guide.
 * 
 * Brand characteristics:
 * - All lowercase bold "afinz" lettering
 * - The "z" has a cyan (#00C6CC) horizontal bar crossing through its middle
 * - Two modes: dark text (default, for light backgrounds) and white text (for dark backgrounds)
 */
export const AfinzLogo: React.FC<AfinzLogoProps> = ({ className = '', height = 32, width, dark = false }) => {
    const textColor = dark ? '#ffffff' : '#1a1a1a';
    const accentColor = '#00C6CC';
    const vbW = 130;
    const vbH = 36;
    const calcWidth = width || (height * (vbW / vbH));

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${vbW} ${vbH}`}
            height={height}
            width={calcWidth}
            className={className}
            aria-label="Afinz"
            role="img"
        >
            {/* "afinz" — rendered in a heavy, condensed sans-serif style using text */}
            <text
                x="0"
                y="27"
                fontFamily="'Arial Black', 'Arial Bold', 'Helvetica Neue', sans-serif"
                fontWeight="900"
                fontSize="32"
                letterSpacing="-1"
                fill={textColor}
            >
                afinz
            </text>

            {/* 
                Cyan accent bar crossing through the "z" — the "z" starts around x=100 in 130px wide at 32px font.
                The bar sits at mid-height of the letter (roughly y=18‒21).
                We overlay it specifically on the "z", which spans ~x=101 to x=130.
            */}
            <rect x="101" y="16" width="29" height="4.5" rx="0.5" fill={accentColor} />
        </svg>
    );
};
