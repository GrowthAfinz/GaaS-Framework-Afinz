import React from 'react';
import { PeriodSelector } from '../period-selector/PeriodSelector';


interface PageHeaderProps {
    title: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title }) => {
    return (
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
                <div className="mt-1">
                    <PeriodSelector />
                </div>
            </div>
        </div>
    );
};
