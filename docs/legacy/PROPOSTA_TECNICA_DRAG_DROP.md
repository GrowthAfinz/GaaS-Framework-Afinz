# Proposta: Sistema de Notas com Drag-and-Drop estilo Trello

## 📋 Conceito Geral

Quando o botão "Diário de Bordo" está **ATIVADO**, o calendário entra em modo **"Kanban de Notas"** onde:

1. **Cada dia funciona como um "card"** mostrando as anotações
2. **Notas podem ser criadas/editadas inline** dentro do dia
3. **Notas podem ser arrastadas entre dias** (drag-and-drop)
4. **Tags visuais** (BU, Segmentos, Parceiros) como badges coloridas
5. **Ações rápidas** (editar, deletar) ao passar o mouse

---

## 🎨 Visual Proposto

### Modo DESATIVADO (Normal)
```
┌─────────────────────────────────┐
│ 15          [2]  B2C            │ ← Mostra atividades
└─────────────────────────────────┘
```

### Modo ATIVADO (Kanban de Notas)
```
┌──────────────────────────────────┐
│ 15                               │
│ ┌────────────────────────────┐   │
│ │  📝 Reunião com cliente    │   │ ← Card arrastável
│ │  🏷️ B2C Seguros Parceiro A │   │
│ │  [✏️] [🗑️]                 │   │ ← Ações ao hover
│ └────────────────────────────┘   │
│                                  │
│ ┌────────────────────────────┐   │
│ │  📝 Follow-up email        │   │ ← Segunda nota
│ │  🏷️ B2B2C Viagens         │   │
│ │  [✏️] [🗑️]                 │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```

---

## 🔄 Interações Suportadas

### 1. **Criar Nova Nota**
- Clique no dia → abre modal inline/popup
- Escreve anotação
- Salva (nota aparece no dia)

### 2. **Editar Nota Existente**
- Clique no ✏️ → abre modal para edição
- Altera texto e tags
- Salva

### 3. **Deletar Nota**
- Clique no 🗑️ → confirmação
- Deleta

### 4. **Arrastar Nota Entre Dias** (Drag-and-Drop)
- Click e segura o card da nota
- Arrasta para outro dia
- Solta → nota se move para novo dia
- Tags e texto preservados

### 5. **Cores de Tags**
- **BU**: Badges com cores por BU (B2C=azul, B2B2C=verde, Plurix=roxo)
- **Segmentos**: Labels pequenos
- **Parceiros**: Labels pequenos

---

## 🛠️ Arquitetura Técnica

### Stack Recomendado

1. **Drag-and-Drop Library**
   - **react-beautiful-dnd** (Production-grade, usado pelo Trello)
   - OU **dnd-kit** (Modern, mais leve)
   - OU **react-dnd** (Clássico, muito estável)

2. **State Management**
   - Usar hook `useNotesWithTags` (já existe)
   - Adicionar: `isDragging`, `draggedNote`, `targetDay`

3. **Componentes Necessários**
   - `NoteCard.tsx` - Card individual arrastável
   - `DayColumnInKanban.tsx` - Coluna/dia receptora de drops
   - `DraggableNote.tsx` - Wrapper com lógica de drag

### Estrutura de Dados

```typescript
interface Note {
  id: string;
  date: Date; // Pode mudar ao arrastar
  text: string;
  tags: {
    bu?: string;
    segmentos: string[];
    parceiros: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📱 Fluxo de Uso

### Cenário Real no Nosso App

```
1. Usuário clica "Diário de Bordo" (ATIVADO)
   ↓
2. Calendário transforma em Kanban
   - Dias com notas mostram cards
   - Dias vazios têm botão "+ Nova Nota"
   ↓
3. Usuário cria nota em 15/03:
   "Reunião com cliente XYZ" + tags
   ↓
4. Usuário arrasta nota para 16/03
   (reunião agendada foi adiada)
   ↓
5. Nota se move, localStorage atualiza
   ↓
6. Usuário clica "Diário de Bordo" (DESATIVADO)
   ↓
7. Calendário volta ao modo normal
   (notas não desaparecem, só ficam ocultas)
```

---

## ✅ Vantagens da Implementação

| Vantagem | Benefício |
|----------|-----------|
| **Intuitivo** | Usuários de Trello/Jira reconhecem padrão |
| **Eficiente** | Reorganizar notas sem usar modal |
| **Flexível** | Notas podem mudar de data conforme contexto |
| **Visual** | Tags coloridas facilitam identificação |
| **Responsivo** | Works on desktop (touch support fácil) |
| **Persistente** | localStorage mantém organizações |

---

## 🎯 Implementação em Fases

### Fase 1: Estrutura Base (1-2 horas)
- [x] Criar `NoteCard.tsx` componente visual
- [ ] Criar `DayColumnInKanban.tsx` para receptar drops
- [ ] Setup library drag-and-drop (react-beautiful-dnd)

### Fase 2: Drag-and-Drop (2-3 horas)
- [ ] Implementar lógica de arrastar
- [ ] Detectar dia de destino
- [ ] Atualizar localStorage ao soltar
- [ ] Visual feedback (highlight, shadow ao arrastar)

### Fase 3: Polish (1-2 horas)
- [ ] Animações suaves
- [ ] Confirmação ao mover para dia distante
- [ ] Suporte a touch (mobile)
- [ ] Undo/redo (opcional)

---

## 💡 Referências na Internet

### Bibliotecas Recomendadas

1. **react-beautiful-dnd** (Mais usado)
   - Exemplo: https://github.com/atlassian/react-beautiful-dnd
   - Demo: https://react-beautiful-dnd.com/
   - **Vantagem**: Smooth, acessível, produção-pronta
   
2. **dnd-kit** (Moderno)
   - Exemplo: https://github.com/clauderic/dnd-kit
   - Demo: https://docs.dnd-kit.com/
   - **Vantagem**: Lightweight, React 18 ready, sem dependências pesadas

3. **react-dnd** (Clássico)
   - Exemplo: https://github.com/react-dnd/react-dnd
   - **Vantagem**: Estável, muita documentação

### Padrões de Referência

- **Trello**: https://trello.com (kanban classic)
- **Monday.com**: Timeline com drag
- **Jira**: Sprints com cards arrastáveis
- **Notion**: Database com drag-and-drop de propriedades

---

## 🔐 Considerações de Segurança/UX

1. **Confirmação ao mover distante**
   - Se arrasta para mais de 7 dias longe, pede confirmação

2. **Visual Feedback**
   - Ghost image do card enquanto arrasta
   - Dia de destino fica destacado

3. **Limitações**
   - Não permitir arrastar para datas muito antigas
   - Preservar ordem de criação

4. **Mobile**
   - Touch events funcionam com dnd-kit
   - Considerar alternativa para mobile (longa pressão)

---

## 🎓 Exemplo de Implementação Simplificada

### Usando `react-beautiful-dnd`

```tsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export const KanbanNotes = () => {
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;
    
    // sourceDate = source.droppableId (YYYY-MM-DD)
    // destinationDate = destination.droppableId (YYYY-MM-DD)
    // noteId = draggableId
    
    moveNoteBetweenDays(noteId, sourceDate, destinationDate);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {daysInMonth.map(day => (
        <Droppable droppableId={formatDateKey(day)} key={day}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={snapshot.isDraggingOver ? 'bg-blue-100' : ''}
            >
              {notes[day].map((note, index) => (
                <Draggable key={note.id} draggableId={note.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={snapshot.isDragging ? 'shadow-lg' : ''}
                    >
                      <NoteCard note={note} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
    </DragDropContext>
  );
};
```

---

## 📊 Comparação com Solução Atual

| Aspecto | Atual | Com Kanban |
|--------|-------|-----------|
| **Criar Nota** | Modal | Modal ou inline |
| **Mover Nota** | Delete + Recrear | Drag-and-drop |
| **Visualizar** | Preview no dia | Card completo |
| **Tags** | No modal | Badges no card |
| **Workflow** | 3 cliques | 1 drag |

---

## ⚡ Próximos Passos Sugeridos

1. **Validar com você**: Essa visão atende suas necessidades?
2. **Escolher biblioteca**: react-beautiful-dnd vs dnd-kit?
3. **Implementar Fase 1**: Componentes base
4. **Testar**: Drag-and-drop funcional
5. **Polish**: Animações e UX

---

## 🎯 Aplicação Concreta no Nosso Caso

### Seu Workflow com Diário de Bordo Kanban

**Dia 15/03** - Segunda
- Criou 2 notas sobre reunião
- Uma é "Seguir reunião XYZ" marcada para hoje
- Outra é "Preparar apresentação" - era pra hoje mas vai ter que ser amanhã

**Ação**: Arrasta "Preparar apresentação" para 16/03 (Terça)

**Resultado**:
- Nota sai do dia 15
- Aparece no dia 16
- localStorage atualiza automaticamente
- Próxima vez que abrir app, nota está no dia 16

**Depois**: Clica "Diário de Bordo" OFF
- Calendar volta ao normal
- Notas continuam salvas, só não visíveis
- Modo normal com atividades restaurado

---

## ❓ Questão Para Você

**Qual abordagem você prefere?**

A) **Simples**: Apenas drag-and-drop entre dias, sem confirmações
B) **Moderado**: Drag-and-drop + confirmação se >7 dias
C) **Completo**: Drag-drop + confirmação + undo/redo + histórico

Responda e eu implemento! 🚀
