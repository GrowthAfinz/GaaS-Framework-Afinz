import React from 'react';
import { ReportLiveCard } from './ReportLiveCard';

interface ReportLiveOutputCardProps {
  periodStart: Date;
  periodEnd: Date;
  onOpenOperations: () => void;
}

export const ReportLiveOutputCard: React.FC<ReportLiveOutputCardProps> = ({
  periodStart,
  periodEnd,
  onOpenOperations,
}) => (
  <ReportLiveCard
    periodStart={periodStart}
    periodEnd={periodEnd}
    variant="output"
    onOpenOperations={onOpenOperations}
  />
);
