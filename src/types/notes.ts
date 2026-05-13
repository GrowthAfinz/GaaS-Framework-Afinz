export interface NoteTag {
  bu?: string; // Uma BU por nota
  segmentos: string[]; // Múltiplos segmentos
  parceiros: string[]; // Múltiplos parceiros
}

export interface Note {
  id: string; // Gerado como: YYYY-MM-DD-${timestamp}
  date: Date;
  text: string;
  tags: NoteTag;
  createdAt: Date;
  updatedAt: Date;
}

export interface DayMarker {
  id: string; // Gerado como: YYYY-MM-DD-marker-${timestamp}
  date: Date;
  color: string; // Nome da BU ou cor (ex: 'B2C', 'Plurix', 'B2B2C')
  createdAt: Date;
}

export interface NotesState {
  [dateKey: string]: Note[]; // Chave: YYYY-MM-DD
}

export interface MarkersState {
  [dateKey: string]: DayMarker[]; // Chave: YYYY-MM-DD
}
