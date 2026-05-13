import { useState, useCallback, useEffect } from 'react';
import { formatDateKey } from '../utils/formatters';
import { Note, NoteTag, NotesState } from '../types/notes';

const STORAGE_KEY = 'calendar-notes';

export const useNotesWithTags = () => {
  const [notes, setNotes] = useState<NotesState>({});

  // Carregar do localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed);
      } catch (e) {
        console.error('Erro ao carregar notas:', e);
      }
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = useCallback((date: Date, text: string, tags: NoteTag) => {
    const dateKey = formatDateKey(date);
    const newNote: Note = {
      id: `${dateKey}-${Date.now()}`,
      date,
      text,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setNotes(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newNote],
    }));

    return newNote.id;
  }, []);

  const updateNote = useCallback((date: Date, noteId: string, text: string, tags: NoteTag) => {
    const dateKey = formatDateKey(date);

    setNotes(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map(note =>
        note.id === noteId
          ? { ...note, text, tags, updatedAt: new Date() }
          : note
      ),
    }));
  }, []);

  const deleteNote = useCallback((date: Date, noteId: string) => {
    const dateKey = formatDateKey(date);

    setNotes(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(note => note.id !== noteId),
    }));
  }, []);

  const getNotesByDate = useCallback((date: Date): Note[] => {
    const dateKey = formatDateKey(date);
    return notes[dateKey] || [];
  }, [notes]);

  const hasNotes = useCallback((date: Date): boolean => {
    return getNotesByDate(date).length > 0;
  }, [getNotesByDate]);

  const getNotesWithTags = useCallback((date: Date, filterTags?: NoteTag): Note[] => {
    const dateNotes = getNotesByDate(date);
    if (!filterTags) return dateNotes;

    return dateNotes.filter(note => {
      // Filtrar por BU (se especificado)
      if (filterTags.bu && note.tags.bu !== filterTags.bu) return false;

      // Filtrar por Segmentos (interseção)
      if (filterTags.segmentos.length > 0) {
        const hasSegmento = filterTags.segmentos.some(s => note.tags.segmentos.includes(s));
        if (!hasSegmento) return false;
      }

      // Filtrar por Parceiros (interseção)
      if (filterTags.parceiros.length > 0) {
        const hasParceiro = filterTags.parceiros.some(p => note.tags.parceiros.includes(p));
        if (!hasParceiro) return false;
      }

      return true;
    });
  }, [getNotesByDate]);

  const moveNote = useCallback((sourceDate: Date, targetDate: Date, noteId: string) => {
    const sourceDateKey = formatDateKey(sourceDate);
    const targetDateKey = formatDateKey(targetDate);

    // Encontrar a nota na origem
    const note = (notes[sourceDateKey] || []).find((n: Note) => n.id === noteId);
    if (!note) return;

    // Remover da origem e adicionar no destino
    setNotes((prev: NotesState) => {
      const newNotes = { ...prev };

      // Remover da origem
      newNotes[sourceDateKey] = (prev[sourceDateKey] || []).filter(
        (n: Note) => n.id !== noteId
      );

      // Adicionar no destino com data atualizada
      const movedNote = { ...note, date: targetDate, updatedAt: new Date() };
      newNotes[targetDateKey] = [...(prev[targetDateKey] || []), movedNote];

      return newNotes;
    });
  }, [notes]);

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
    getNotesByDate,
    hasNotes,
    getNotesWithTags,
    moveNote,
  };
};
