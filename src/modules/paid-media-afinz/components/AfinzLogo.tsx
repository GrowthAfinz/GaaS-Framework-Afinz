import React from 'react';

interface AfinzLogoProps {
    className?: string;
    height?: number;
    width?: number;
}

export const AfinzLogo: React.FC<AfinzLogoProps> = ({ className = '', height = 32, width }) => {
    // Preserve aspect ratio based on original manual sizing
    const viewBoxWidth = 120;
    const viewBoxHeight = 40;

    // Calculate width if only height is provided to maintain aspect ratio
    const calculatedWidth = width || (height * (viewBoxWidth / viewBoxHeight));

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            height={height}
            width={calculatedWidth}
            className={className}
            fill="none"
        >
            {/* 
              Brand Guidelines:
              - Black lowercase text (#000000 or rounded to dark slate #1e293b to match UI)
              - Distinctive 'z' with a cyan horizontal stroke (#00CEDB or similar)
            */}
            <g fill="currentColor">
                {/* 'a' */}
                <path d="M26.5 28.8c-1.5 1.5-3.5 2.2-6 2.2-2.5 0-4.6-.8-6.1-2.4-1.5-1.6-2.3-3.8-2.3-6.4 0-2.6.8-4.7 2.3-6.3 1.5-1.6 3.6-2.4 6-2.4 2.5 0 4.5.8 6 2.3v-2H34v16.8H26.5v-1.8zm-5.7-3.8c1.3 0 2.3-.4 3.1-1.2.8-.8 1.2-1.8 1.2-3.1 0-1.3-.4-2.3-1.2-3.1-.8-.8-1.8-1.2-3.1-1.2-1.3 0-2.3.4-3.1 1.2-.8.8-1.2 1.8-1.2 3.1 0 1.2.4 2.2 1.2 3.1.8.8 1.8 1.2 3.1 1.2z" />

                {/* 'f' */}
                <path d="M48 13.8v3.5h-3.2v13.5h-7.5V17.3h-2.5v-3.5h2.5V11c0-2.5.7-4.4 2.1-5.7 1.4-1.3 3.3-1.8 5.6-1.8 1.2 0 2.5.2 3.8.5v5.8c-.8-.2-1.5-.3-2.1-.3-.6 0-1 .2-1.4.5-.3.3-.5.8-.5 1.5v2.2H48z" />

                {/* 'i' */}
                <path d="M56.5 7.8c0-1.2-.4-2.2-1.2-3-.8-.8-1.8-1.2-3.1-1.2-1.2 0-2.2.4-3.1 1.2-.8.8-1.2 1.8-1.2 3s.4 2.2 1.2 3.1c.8.8 1.8 1.2 3.1 1.2 1.3 0 2.3-.4 3.1-1.2.8-.9 1.2-1.9 1.2-3.1zm-8.1 23h7.5V13.8h-7.5v17z" />

                {/* 'n' */}
                <path d="M62 30.8h7.5v-9.5c0-1.2.3-2.2 1-2.9.7-.7 1.6-1 2.8-1 1.2 0 2 .3 2.7 1 .7.7 1 1.6 1 2.9v9.5h7.5V18.5c0-2.2-.6-3.8-1.8-5-1.2-1.2-3-1.8-5.3-1.8-2 0-3.8.7-5.3 2.1v-1.8H62v18.8z" />

                {/* 'z' (base structure) */}
                <path d="M90.5 30.8h17.8V25l-9.8-7.5h9v-5.8h-17v5.8l9.5 7.5h-9.5v5.8z" />
            </g>

            {/* Cyan Stroke extending through the 'z' */}
            <path d="M90 20.8h22v3.5H90z" fill="#00CEDB" />
        </svg>
    );
};
