import { useState, useEffect } from 'react';

interface Note {
  date: string; // ISO format: YYYY-MM-DD
  text: string;
  createdAt: string;
}

const STORAGE_KEY = 'calendar_notes';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  // Carregar notas do localStorage ao montar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNotes(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao carregar notas:', e);
      }
    }
  }, []);

  // Salvar notas no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = (date: Date, text: string) => {
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const existingIndex = notes.findIndex((n) => n.date === dateKey);

    if (existingIndex >= 0) {
      // Atualizar nota existente
      const updated = [...notes];
      updated[existingIndex] = {
        ...updated[existingIndex],
        text,
        createdAt: new Date().toISOString(),
      };
      setNotes(updated);
    } else {
      // Adicionar nova nota
      setNotes([
        ...notes,
        {
          date: dateKey,
          text,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const removeNote = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    setNotes(notes.filter((n) => n.date !== dateKey));
  };

  const getNote = (date: Date): string | null => {
    const dateKey = date.toISOString().split('T')[0];
    const note = notes.find((n) => n.date === dateKey);
    return note ? note.text : null;
  };

  const hasNote = (date: Date): boolean => {
    const dateKey = date.toISOString().split('T')[0];
    return notes.some((n) => n.date === dateKey);
  };

  return {
    notes,
    addNote,
    removeNote,
    getNote,
    hasNote,
  };
};
