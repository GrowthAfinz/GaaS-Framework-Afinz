
import React, { useRef } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useCSVParser } from '../../hooks/useCSVParser';
import { useAppStore } from '../../store/useAppStore';

export const B2CUpload: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { parseB2CCSV, isLoading, error } = useCSVParser();
    const { setB2CData, b2cData } = useAppStore();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const { data, warnings } = await parseB2CCSV(file);
            setB2CData(data);
            if (warnings.length > 0) {
                console.warn('Warnings during upload:', warnings);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Upload size={18} />
                )}
                Upload CSV B2C
            </button>

            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {b2cData.length > 0 && !error && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle size={16} />
                    {b2cData.length} registros carregados
                </div>
            )}
        </div>
    );
};
