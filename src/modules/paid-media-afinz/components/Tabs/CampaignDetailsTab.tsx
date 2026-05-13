import React from 'react';
import { useFilters } from '../../context/FilterContext';
import { CampaignPerformanceTable } from '../CampaignPerformanceTable';
import { InsightsPanel } from '../InsightsPanel';

export const CampaignDetailsTab: React.FC = () => {
    const { filteredData } = useFilters();

    return (
        <div className="animate-fade-in space-y-6">
            <CampaignPerformanceTable data={filteredData} />
            <InsightsPanel />
        </div>
    );
};
