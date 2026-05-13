import { useState, useEffect, useCallback } from 'react';
import { FrameworkRow, FrameworkVersion, VersionStorage } from '../types/framework';
import Papa from 'papaparse';

const STORAGE_KEY = 'growth_brain_versions';
const MAX_VERSIONS = 10;

export const useVersionManager = () => {
    const [versions, setVersions] = useState<FrameworkVersion[]>([]);
    const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
    const [storageUsage, setStorageUsage] = useState<number>(0);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed: VersionStorage = JSON.parse(stored);
                setVersions(parsed.versions || []);
                setCurrentVersionId(parsed.currentVersionId || null);
            }
            calculateStorageUsage();
        } catch (e) {
            console.error('Failed to load versions from localStorage', e);
        }
    }, []);

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (versions.length > 0 || currentVersionId) {
            try {
                const storageData: VersionStorage = {
                    currentVersionId,
                    versions
                };
                const serialized = JSON.stringify(storageData);
                localStorage.setItem(STORAGE_KEY, serialized);
                calculateStorageUsage();
            } catch (e) {
                console.warn('Failed to save versions to localStorage (quota may be exceeded):', e);
            }
        }
    }, [versions, currentVersionId]);

    const calculateStorageUsage = () => {
        let total = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += (localStorage[key].length * 2) / 1024 / 1024; // MB
            }
        }
        setStorageUsage(total);
    };

    const saveNewVersion = useCallback((name: string, data: FrameworkRow[], description?: string, editCount: number = 0) => {
        if (versions.length >= MAX_VERSIONS) {
            throw new Error(`Limite de ${MAX_VERSIONS} versões atingido. Exclua versões antigas.`);
        }

        const newVersion: FrameworkVersion = {
            id: crypto.randomUUID(),
            name,
            description,
            createdAt: new Date().toISOString(),
            createdBy: 'User', // Placeholder
            rowCount: data.length,
            editCount,
            data
        };

        setVersions(prev => [newVersion, ...prev]);
        setCurrentVersionId(newVersion.id);
        return newVersion;
    }, [versions]);

    const restoreVersion = useCallback((id: string) => {
        const version = versions.find(v => v.id === id);
        if (!version) throw new Error('Versão não encontrada');
        setCurrentVersionId(id);
        return version.data;
    }, [versions]);

    const deleteVersion = useCallback((id: string) => {
        if (id === currentVersionId) {
            throw new Error('Não é possível excluir a versão atual ativa.');
        }
        setVersions(prev => prev.filter(v => v.id !== id));
    }, [currentVersionId]);

    const exportVersion = useCallback((id: string) => {
        const version = versions.find(v => v.id === id);
        if (!version) return;

        const csv = Papa.unparse(version.data, {
            delimiter: ";",
            quotes: true
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${version.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [versions]);

    return {
        versions,
        currentVersion: versions.find(v => v.id === currentVersionId),
        currentVersionId,
        storageUsage,
        saveNewVersion,
        restoreVersion,
        deleteVersion,
        exportVersion
    };
};
