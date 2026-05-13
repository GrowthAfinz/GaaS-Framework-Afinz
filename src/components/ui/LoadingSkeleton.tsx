import React from 'react';

interface LoadingSkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    className = "",
    width = "100%",
    height = "20px"
}) => {
    return (
        <div
            className={`bg-slate-800/50 animate-pulse rounded-md ${className}`}
            style={{ width, height }}
        />
    );
};
