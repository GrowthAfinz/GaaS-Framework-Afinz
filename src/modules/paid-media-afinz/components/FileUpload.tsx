import React, { useCallback, useState } from 'react';
import { Upload, FileType, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseXLSX } from '../utils/fileParser';
import type { DailyMetrics } from '../types';

interface FileUploadProps {
    onDataLoaded: (data: DailyMetrics[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = async (file: File) => {
        setError(null);
        setIsParsing(true);
        try {
            const data = await parseXLSX(file);
            if (data.length === 0) {
                throw new Error("Nenhum dado válido encontrado nas abas esperadas.");
            }
            // Ensure we are REPLACING data, not appending. 
            // The App.tsx passes 'setRawData' which is a useState setter.
            // setRawData(newData) replaces.
            // BUT if the user uploads same file twice?
            onDataLoaded(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Erro ao processar arquivo.");
        } finally {
            setIsParsing(false);
        }
    };

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div
            className={`
        w-full max-w-2xl mx-auto p-8 border-2 border-dashed rounded-xl transition-all duration-200
        flex flex-col items-center justify-center text-center cursor-pointer
        ${isDragOver
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-slate-300 hover:border-primary hover:bg-slate-50'
                }
      `}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => document.getElementById('fileInput')?.click()}
        >
            <input
                type="file"
                id="fileInput"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleChange}
            />

            {isParsing ? (
                <div className="flex flex-col items-center animate-pulse">
                    <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" />
                    <p className="text-slate-500 font-medium">Processando dados...</p>
                </div>
            ) : (
                <>
                    <div className={`p-4 rounded-full mb-4 ${error ? 'bg-red-100' : 'bg-slate-100'}`}>
                        {error ? <AlertCircle className="w-8 h-8 text-red-500" /> : <Upload className="w-8 h-8 text-slate-500" />}
                    </div>

                    <h3 className="text-lg font-semibold text-slate-700 mb-1">
                        {error ? 'Erro na Importação' : 'Carregar planilha de dados'}
                    </h3>

                    <p className="text-sm text-slate-500 max-w-md">
                        {error ? (
                            <span className="text-red-500">{error}</span>
                        ) : (
                            "Arraste seu arquivo XLSX aqui ou clique para selecionar. Certifique-se de que as 4 abas corretas existem."
                        )}
                    </p>
                </>
            )}
        </div>
    );
};
