import React, { useState } from 'react';
import { Activity } from '../../types/framework';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityEditModalProps {
    activity: Activity;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Activity>) => void;
}

export const ActivityEditModal: React.FC<ActivityEditModalProps> = ({ activity, onClose, onSave }) => {
    const [date, setDate] = useState(format(activity.dataDisparo, 'yyyy-MM-dd'));
    const [name] = useState(activity.id); // Using ID as name for now as per type

    const handleSave = () => {
        // Adjust for timezone if needed, but simple date string parsing usually sets to UTC or local 00:00
        // Ideally use a date picker that returns a Date object or handle timezone explicitly.
        // For now, assuming local date.
        const [y, m, d] = date.split('-').map(Number);
        const adjustedDate = new Date(y, m - 1, d);

        onSave(activity.id, {
            dataDisparo: adjustedDate,
            // id: name // ID usually shouldn't change, but if it's the name...
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-[400px] p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Editar Atividade</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">Nome / ID</label>
                        <input
                            type="text"
                            value={name}
                            disabled
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 focus:outline-none focus:border-blue-500 opacity-50 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">Data de Disparo</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                        >
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
