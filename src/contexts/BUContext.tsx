import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUserRole } from '../context/UserRoleContext';

export type BU = 'B2C' | 'B2B2C' | 'Plurix' | 'Seguros';

interface BUContextType {
    selectedBUs: BU[];
    toggleBU: (bu: BU) => void;
    selectAll: () => void;
    deselectAll: () => void;
    isBUSelected: (bu: BU) => boolean;
    isBULocked: boolean;
}

const BUContext = createContext<BUContextType | undefined>(undefined);

const STORAGE_KEY = 'growth-brain-bu-selection';

export const BUProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isBULocked: isRoleLocked, lockedBUs } = useUserRole();
    const [selectedBUs, setSelectedBUs] = useState<BU[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : ['B2C', 'B2B2C', 'Plurix', 'Seguros'];
    });

    useEffect(() => {
        // Force BU selection to locked BUs if user role has restriction
        if (isRoleLocked && lockedBUs.length > 0) {
            setSelectedBUs(lockedBUs as BU[]);
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedBUs));
        }
    }, [isRoleLocked, lockedBUs, selectedBUs]);

    const toggleBU = (bu: BU) => {
        // Prevent toggling if BU is locked
        if (isRoleLocked) return;

        setSelectedBUs(prev => {
            if (prev.includes(bu)) {
                return prev.filter(b => b !== bu);
            } else {
                return [...prev, bu];
            }
        });
    };

    const selectAll = () => {
        if (isRoleLocked) return;
        setSelectedBUs(['B2C', 'B2B2C', 'Plurix', 'Seguros']);
    };

    const deselectAll = () => {
        if (isRoleLocked) return;
        setSelectedBUs([]);
    };

    const isBUSelected = (bu: BU) => selectedBUs.includes(bu);

    return (
        <BUContext.Provider value={{
            selectedBUs,
            toggleBU,
            selectAll,
            deselectAll,
            isBUSelected,
            isBULocked: isRoleLocked
        }}>
            {children}
        </BUContext.Provider>
    );
};

export const useBU = () => {
    const context = useContext(BUContext);
    if (context === undefined) {
        throw new Error('useBU must be used within a BUProvider');
    }
    return context;
};
