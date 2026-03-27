import { useMemo } from 'react';
import { useFrameworkData } from './useFrameworkData';

export interface FrameworkOptions {
    bus: string[];
    canais: string[];
    segmentos: string[];
    parceiros: string[];
    ofertas: string[];
    campanhas: string[];
}

export function useFrameworkOptions(): FrameworkOptions {
    const { data } = useFrameworkData();

    return useMemo(() => {
        const bus = new Set<string>();
        const canais = new Set<string>();
        const segmentos = new Set<string>();
        const parceiros = new Set<string>();
        const ofertas = new Set<string>();
        const campanhas = new Set<string>();

        // Iterate over all dates and activities
        Object.values(data).forEach((activities) => {
            activities.forEach((activity) => {
                if (activity.bu) bus.add(activity.bu);
                if (activity.canal) canais.add(activity.canal);
                if (activity.segmento) segmentos.add(activity.segmento);
                if (activity.parceiro) parceiros.add(activity.parceiro);
                if (activity.oferta) ofertas.add(activity.oferta);
                if (activity.id) campanhas.add(activity.id);
            });
        });

        // Add default values if empty (fallback)
        if (bus.size === 0) {
            ['B2C', 'B2B2C', 'Plurix', 'Seguros'].forEach(b => bus.add(b));
        }

        return {
            bus: Array.from(bus).sort(),
            canais: Array.from(canais).sort(),
            segmentos: Array.from(segmentos).sort(),
            parceiros: Array.from(parceiros).sort(),
            ofertas: Array.from(ofertas).sort(),
            campanhas: Array.from(campanhas).sort(),
        };
    }, [data]);
}
