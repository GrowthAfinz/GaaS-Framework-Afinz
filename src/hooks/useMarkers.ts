import { useState, useCallback, useEffect } from 'react';
import { formatDateKey } from '../utils/formatters';
import { DayMarker, MarkersState } from '../types/notes';

const STORAGE_KEY = 'calendar-markers';

export const useMarkers = () => {
  const [markers, setMarkers] = useState<MarkersState>({});

  // Carregar do localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMarkers(parsed);
      } catch (e) {
        console.error('Erro ao carregar marcadores:', e);
      }
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  }, [markers]);

  const addMarker = useCallback((date: Date, color: string) => {
    const dateKey = formatDateKey(date);
    
    // Sempre permite adicionar novo marcador, mesmo que haja outro da mesma cor
    const newMarker: DayMarker = {
      id: `${dateKey}-marker-${Date.now()}-${Math.random()}`,
      date,
      color,
      createdAt: new Date(),
    };

    setMarkers(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newMarker],
    }));

    return newMarker.id;
  }, [markers]);

  const removeMarker = useCallback((date: Date, markerId: string) => {
    const dateKey = formatDateKey(date);

    setMarkers(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(m => m.id !== markerId),
    }));
  }, []);

  const getMarkersByDate = useCallback((date: Date): DayMarker[] => {
    const dateKey = formatDateKey(date);
    return markers[dateKey] || [];
  }, [markers]);

  const hasMarkers = useCallback((date: Date): boolean => {
    return getMarkersByDate(date).length > 0;
  }, [getMarkersByDate]);

  const toggleMarker = useCallback((date: Date, color: string) => {
    // Sempre adiciona novo marcador (não faz toggle)
    addMarker(date, color);
  }, [addMarker]);

  return {
    markers,
    addMarker,
    removeMarker,
    getMarkersByDate,
    hasMarkers,
    toggleMarker,
  };
};
