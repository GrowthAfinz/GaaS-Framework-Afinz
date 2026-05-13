#!/bin/bash

# Rebuild and deploy calendar app with notes feature
set -e

echo "🔨 Building calendar-estrategico with notes feature..."
docker build -t calendar-estrategico:notes .

echo "🐳 Stopping existing container..."
docker stop calendar-final 2>/dev/null || true

echo "🚀 Starting new container on port 5173..."
docker run -d \
  --name calendar-final \
  -p 5173:5173 \
  calendar-estrategico:notes

echo "✅ Deploy complete!"
echo "📍 App running at http://localhost:5173"
echo ""
echo "📋 Features implemented:"
echo "  ✓ Notes/Diary system with localStorage persistence"
echo "  ✓ Tag-based filtering (BU, Segmentos, Parceiros)"
echo "  ✓ Note indicators (📝 emoji on days with notes)"
echo "  ✓ Delete note functionality"
echo "  ✓ Diário de Bordo toggle button"
echo "  ✓ Enhanced NoteEditorModal with tag selectors"
