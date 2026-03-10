import React from 'react';
import { HeatmapCell, ExplorerMetric } from '../../../types/explorer';
import { formatMetricValue } from '../../../hooks/explorer/useComparisonData';

interface TimelineHeatmapProps {
  cells: HeatmapCell[];
  weekLabels: string[];
  metric: ExplorerMetric;
}

function intensityToColor(intensity: number, baseColor: string): string {
  const opacities = [0, 0.15, 0.35, 0.6, 0.85, 1];
  const idx = Math.min(opacities.length - 1, Math.floor(intensity * (opacities.length - 1)));
  const opacity = opacities[idx];
  // baseColor is hex like #3B82F6
  return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

// Group cells by row
function groupByRow(cells: HeatmapCell[]): Map<string, HeatmapCell[]> {
  const map = new Map<string, HeatmapCell[]>();
  for (const cell of cells) {
    if (!map.has(cell.rowId)) map.set(cell.rowId, []);
    map.get(cell.rowId)!.push(cell);
  }
  return map;
}

export const TimelineHeatmap: React.FC<TimelineHeatmapProps> = ({ cells, weekLabels, metric }) => {
  if (cells.length === 0 || weekLabels.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-slate-500 text-xs">
        Sem dados temporais para o período
      </div>
    );
  }

  const rowMap = groupByRow(cells);
  const rows = Array.from(rowMap.entries());

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left text-slate-500 font-normal pb-1 pr-3 w-24" />
            {weekLabels.map((label) => (
              <th key={label} className="text-center text-slate-500 font-mono font-normal pb-1 px-1">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([rowId, rowCells]) => {
            const firstCell = rowCells[0];
            // Use a neutral color for rows without a known BU color
            const baseColor = '#3B82F6';

            return (
              <tr key={rowId}>
                <td className="text-slate-600 font-medium pr-3 py-0.5 truncate max-w-[96px]" title={firstCell.rowLabel}>
                  {firstCell.rowLabel.length > 12
                    ? firstCell.rowLabel.slice(0, 12) + '…'
                    : firstCell.rowLabel}
                </td>
                {weekLabels.map((label) => {
                  const cell = rowCells.find((c) => c.columnLabel === label);
                  const bg = cell && cell.count > 0
                    ? intensityToColor(cell.intensity, baseColor)
                    : 'transparent';
                  const tooltip = cell
                    ? `${label} · ${firstCell.rowLabel}\n${cell.count} disparos · ${formatMetricValue(cell.value, metric)}`
                    : '';
                  return (
                    <td key={label} className="px-1 py-0.5 text-center">
                      <div
                        className="mx-auto rounded"
                        style={{
                          width: 28,
                          height: 20,
                          backgroundColor: bg,
                          border: cell && cell.count > 0 ? `1px solid ${baseColor}44` : '1px solid transparent',
                        }}
                        title={tooltip}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
