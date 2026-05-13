import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Trash2 } from 'lucide-react';
import { Note } from '../types/notes';

interface NoteCardProps {
  note: Note;
  index: number;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  index,
  onEdit,
  onDelete,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  const buBadge = note.tags.bu ? (
    <div className="inline-block bg-amber-300 text-amber-900 text-xs font-semibold px-2 py-1 rounded mb-2">
      {note.tags.bu}
    </div>
  ) : null;

  return (
    <Draggable draggableId={note.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(note)}
          className={`bg-white border border-gray-200 rounded-lg p-3 mb-2 cursor-move transition-all ${
            snapshot.isDragging
              ? 'shadow-lg ring-2 ring-amber-400 opacity-95'
              : 'hover:shadow-md hover:border-amber-300'
          }`}
        >
          {buBadge}
          <p className="text-sm text-gray-700 line-clamp-2 break-words">
            {note.text}
          </p>
          <button
            onClick={handleDelete}
            className="mt-2 text-red-500 hover:text-red-700 transition-colors"
            title="Deletar nota"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </Draggable>
  );
};
