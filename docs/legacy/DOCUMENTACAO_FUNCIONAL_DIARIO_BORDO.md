# Diário de Bordo - Notes Feature Implementation

## Summary (Resumo)
Implementação completa do sistema "Diário de Bordo" (Notes/Diary) com suporte a tags, localStorage persistence, e filtragem baseada em filtros ativos.

## Files Created (Arquivos Criados)

### 1. `src/types/notes.ts` (NEW)
Define as estruturas TypeScript para o sistema de notas:
- **NoteTag**: Stores tag information (1 BU + multiple Segmentos/Parceiros)
- **Note**: Represents a single note with text, tags, and timestamps
- **NotesState**: Dictionary of date-keyed note arrays for localStorage

### 2. `src/hooks/useNotesWithTags.ts` (NEW)
Advanced hook for note management:
- **Features**: 
  - localStorage persistence with JSON serialization
  - Full CRUD operations: addNote, updateNote, deleteNote
  - Flexible querying: getNotesByDate, hasNotes, getNotesWithTags
  - Filter-based retrieval: Returns only notes matching active BU/Segmentos/Parceiros
- **Storage Format**: "calendar-notes" key containing all notes by date

## Files Modified (Arquivos Modificados)

### 1. `src/components/NoteEditorModal.tsx` (ENHANCED)
**Before**: Simple text-only note editor
**After**: Full-featured modal with tag management
- Added NoteTag parameter handling
- BU single-select dropdown
- Segmentos multi-select checkboxes
- Parceiros multi-select checkboxes
- Delete button with confirmation dialog
- Overflow scrolling for long tag lists

**Props Added**:
```typescript
initialTags?: NoteTag;
availableBUs: string[];
availableSegmentos: string[];
availableParceiros: string[];
onDelete?: () => void;
```

### 2. `src/components/Calendar.tsx` (MAJOR UPDATE)
**Key Changes**:
- Replaced `useNotes` with `useNotesWithTags` hook
- Added `diaryMode` state for toggling diary view
- Added "Diário de Bordo" button below calendar grid
- Implemented tag-based note filtering logic
- Updated DayCell rendering with new props
- Extract available BUs/Segmentos/Parceiros from data
- Pass filter tags to modal for smart filtering

**New State**:
```typescript
diaryMode: boolean
editingNoteDate: Date | null
editingNoteId: string | null
```

**New Functions**:
- `handleEditNote(date, noteId?)`
- `handleSaveNote(text, tags)`
- `handleDeleteNote(noteId)`

**New Props to DayCell**:
- `diaryMode: boolean`
- `hasNotes: boolean`
- `matchesFilter: boolean`
- `onEditNote: (date, noteId?) => void`
- `noteCount: number`

### 3. `src/components/DayCell.tsx` (ENHANCED)
**Before**: Shows activity count only
**After**: Dual-mode component supporting both activity view and diary view

**New Features**:
- **Diary Mode**:
  - Click to add/edit note
  - Shows 📝 emoji when notes match active filters
  - Shows dim dot (●) when notes exist but don't match filters
  - Dynamic coloring: amber for filtered matches, darker for non-matches
- **Activity Mode**: Unchanged behavior (shows count and BU)

**Color Scheme in Diary Mode**:
- Filtered notes visible: `bg-amber-900/40` (amber background)
- Notes don't match filter: `bg-slate-700/40` (muted)
- No notes: `bg-slate-800` (normal)

### 4. `src/App.tsx` (MINOR UPDATE)
Pass `filters` prop to Calendar component:
```typescript
filters={{
  bu: null,
  canais: [...],
  segmentos: [...],
  parceiros: [...]
}}
```

## Data Flow

```
CSV Upload → useFrameworkData (parses BU/Segmentos/Parceiros)
    ↓
Calendar Component (receives filteredData + filter state)
    ↓
useNotesWithTags hook (manages localStorage notes)
    ↓
DayCell (displays notes if diaryMode active)
    ↓
NoteEditorModal (edit with tag selectors)
    ↓
localStorage ("calendar-notes" key)
```

## localStorage Structure

```json
{
  "calendar-notes": {
    "2025-03-15": [
      {
        "id": "2025-03-15-1708345200000",
        "date": "2025-03-15T00:00:00.000Z",
        "text": "Reunião com cliente",
        "tags": {
          "bu": "B2C",
          "segmentos": ["Seguros", "Viagens"],
          "parceiros": ["Parceiro A", "Parceiro B"]
        },
        "createdAt": "2025-03-15T10:30:00.000Z",
        "updatedAt": "2025-03-15T10:30:00.000Z"
      }
    ],
    "2025-03-16": [...]
  }
}
```

## User Features

### 1. **Toggle Diário de Bordo**
- Button below calendar grid
- Orange (active) / Gray (inactive) styling
- Switches between activity view and diary view

### 2. **Add/Edit Notes**
- Click any day in diary mode to open NoteEditorModal
- Add note text (multiline textarea)
- Select BU (single, optional)
- Select Segmentos (multiple checkboxes)
- Select Parceiros (multiple checkboxes)
- Save or delete note

### 3. **View Notes**
- 📝 emoji appears on days with notes matching active filters
- Small dot (●) indicates notes exist but don't match filters
- Hover shows note count

### 4. **Filter Notes**
- Notes auto-filter based on active BU/Segmentos/Parceiros
- Only days with matching notes show 📝 emoji
- Filtering is automatic (no manual filter needed)

### 5. **Delete Notes**
- Trash icon button in modal
- Confirmation dialog before delete
- Note removed from localStorage

## Testing Checklist

- [ ] Toggle "Diário de Bordo" button - modes switch correctly
- [ ] Add note to a day - text and tags saved
- [ ] Edit existing note - updates applied correctly
- [ ] Delete note - confirmation dialog appears, note removed
- [ ] Filter notes - only matching notes show 📝 emoji
- [ ] BU selector - appears and saves correctly
- [ ] Segmentos multi-select - multiple selection works
- [ ] Parceiros multi-select - multiple selection works
- [ ] localStorage - data persists after page refresh
- [ ] DayCell colors - correct colors in diary mode

## Deployment

```bash
docker build -t calendar-estrategico:notes .
docker run -d --name calendar-final -p 5173:5173 calendar-estrategico:notes
```

## Backward Compatibility

- Old `useNotes` hook remains unchanged (not used by Calendar)
- All existing components still work
- Calendar prop `filters` is optional (defaults provided)
- No breaking changes to existing functionality

## Next Steps (If Needed)

1. Add note search functionality
2. Add export notes to CSV
3. Add note attachment/file upload
4. Add note sharing between users
5. Add note reminders/notifications
6. Add advanced filtering by note content
