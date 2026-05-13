import React from 'react';
import { ActivityRow } from '../../types/activity';
import { Calendar, Clock, Edit2, Trash2, Send, Tag } from 'lucide-react';

interface DispatchCardProps {
    dispatch: ActivityRow;
    onEdit: (dispatch: ActivityRow) => void;
    onDelete: (id: string) => void;
    onPublish: (id: string) => void;
}

/**
 * Card Component para renderizar um disparo/atividade individual (GaaS)
 */
export const DispatchCard: React.FC<DispatchCardProps> = ({
    dispatch,
    onEdit,
    onDelete,
    onPublish,
}) => {
    // Determinar cor baseado em status E BU
    const getCardColors = () => {
        if (dispatch.status === 'Rascunho') {
            return {
                bg: 'bg-amber-900/20',
                border: 'border-amber-600',
                badge: 'bg-amber-600 text-white',
            };
        }

        const BU_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
            'B2C': {
                bg: 'bg-blue-900/20',
                border: 'border-blue-700',
                badge: 'bg-blue-600 text-white',
            },
            'B2B2C': {
                bg: 'bg-emerald-900/20',
                border: 'border-emerald-700',
                badge: 'bg-emerald-600 text-white',
            },
            'Plurix': {
                bg: 'bg-purple-900/20',
                border: 'border-purple-700',
                badge: 'bg-purple-600 text-white',
            },
        };

        return BU_COLORS[dispatch.BU] || {
            bg: 'bg-slate-800',
            border: 'border-slate-600',
            badge: 'bg-slate-600 text-white',
        };
    };

    const colors = getCardColors();
    const isFuture = new Date(dispatch['Data de Disparo']) > new Date();

    return (
        <div className={`rounded-lg border-2 p-3 ${colors.bg} ${colors.border} transition-all hover:shadow-lg`}>
            {/* Badge Status + BU */}
            <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded font-medium ${colors.badge}`}>
                    {dispatch.status === 'Rascunho' ? '📝 RASCUNHO' : dispatch.BU}
                </span>
                {dispatch.status === 'Scheduled' && (
                    <span className="text-xs text-slate-400">Agendado</span>
                )}
                {dispatch.status === 'Enviado' && (
                    <span className="text-xs text-green-400">Enviado</span>
                )}
            </div>

            {/* Jornada */}
            <h4 className="text-sm font-semibold text-white mb-1 truncate" title={dispatch.jornada}>
                {dispatch.jornada}
            </h4>

            {/* Activity Name */}
            <p className="text-xs text-slate-400 mb-2 truncate font-mono" title={dispatch['Activity name / Taxonomia']}>
                {dispatch['Activity name / Taxonomia']}
            </p>

            {/* Datas */}
            <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
                <Calendar className="w-3 h-3" />
                <span>
                    {new Date(dispatch['Data de Disparo']).toLocaleDateString('pt-BR')}
                    {dispatch['Data Fim'] && dispatch['Data Fim'] !== dispatch['Data de Disparo'] && (
                        <> → {new Date(dispatch['Data Fim']).toLocaleDateString('pt-BR')}</>
                    )}
                </span>
            </div>

            {/* Ofertas */}
            {(dispatch.Oferta || dispatch.Promocional) && (
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                    <Tag className="w-3 h-3" />
                    <span className="truncate">
                        {dispatch.Oferta || dispatch.Promocional}
                    </span>
                </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-700">
                <button
                    onClick={() => onEdit(dispatch)}
                    className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Editar"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(dispatch.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                    title="Excluir"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                {dispatch.status === 'Rascunho' && (
                    <button
                        onClick={() => onPublish(dispatch.id)}
                        className="p-1.5 text-slate-400 hover:text-green-400 transition-colors"
                        title="Agendar"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};
