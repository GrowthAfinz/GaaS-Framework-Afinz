import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Activity } from '../../types/framework';
import { Clock } from 'lucide-react';

interface ActivityCardProps {
    activity: Activity;
    index: number;
    onClick?: (activity: Activity) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, index, onClick }) => {
    // Determine status color/icon
    const getStatusConfig = () => {
        return {
            bg: 'bg-blue-600',
            border: 'border-blue-500',
            icon: Clock
        };
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <Draggable draggableId={activity.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
                        rounded border shadow-sm overflow-hidden mb-1
                        ${config.bg} ${config.border}
                        ${snapshot.isDragging ? 'z-50 ring-2 ring-white scale-105' : 'z-10'}
                        group cursor-grab active:cursor-grabbing relative
                        hover:ring-1 hover:ring-white/50 transition-all
                    `}
                    style={{
                        ...provided.draggableProps.style,
                    }}
                    onClick={() => onClick?.(activity)}
                >
                    <div className="p-1.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Icon size={10} className="shrink-0 text-white/70" />
                            <span className="text-[10px] font-bold text-white truncate leading-tight">
                                {activity.id}
                            </span>
                        </div>

                        {/* Mini KPIs */}
                        <div className="grid grid-cols-2 gap-1 text-[9px] text-white/80 leading-none">
                            <div title="Cartões">
                                💳 {activity.kpis.cartoes || 0}
                            </div>
                            <div title="Custo">
                                💲 {new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(activity.kpis.custoTotal || 0)}
                            </div>
                        </div>
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-48 bg-white border border-slate-200 rounded-lg shadow-xl p-2 text-xs">
                        <div className="font-bold text-slate-900 mb-1">{activity.id}</div>
                        <div className="text-slate-500 mb-2">{activity.canal} - {activity.segmento}</div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-slate-500 block">Cartões</span>
                                <span className="text-slate-900 font-medium">{activity.kpis.cartoes || 0}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Custo</span>
                                <span className="text-slate-900 font-medium">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activity.kpis.custoTotal || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};
