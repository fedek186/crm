/*
Este archivo renderiza una columna específica del tablero Kanban de contactos.
Define visualmente un estado y actúa como zona de caída (droppable) donde se pueden soltar 
y reordenar las tarjetas de contacto que pertenezcan a dicho estado.

Elementos externos:
- useDroppable: hook de @dnd-kit para transformar la columna en un área de recepción.
- SortableContext: contenedor de @dnd-kit que provee el contexto de ordenamiento vertical a las tarjetas hijas.
- KanbanCard: componente hijo que renderiza cada tarjeta dentro de la columna.

Funciones exportadas:
- KanbanColumn: componente de React que representa y agrupa los contactos bajo un mismo estado.
*/
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import KanbanCard from "./KanbanCard";

export default function KanbanColumn({ columnId, title, contacts }: { columnId: string, title: string, contacts: any[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: {
      type: "Column",
    },
  });

  return (
    <div className="flex flex-col w-72 md:w-80 shrink-0 h-full max-h-[75vh]">
      <div className="flex items-center justify-between mb-4 bg-lux-surface border border-lux-hover/40 px-4 py-3 rounded-xl shadow-lg sticky top-0 z-10">
         <h3 className="text-white font-bold text-sm uppercase tracking-wider">{title}</h3>
         <span className="bg-lux-hover/50 text-lux-sec text-xs font-bold px-2.5 py-1 rounded-md shadow-inner">{contacts.length}</span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`flex-1 overflow-y-auto overflow-x-hidden p-2 -m-2 space-y-3 rounded-xl transition-colors
          ${isOver ? 'bg-lux-hover/10 ring-1 ring-lux-hover/30' : ''}`}
      >
        <SortableContext items={contacts.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {contacts.map((contact) => (
            <KanbanCard key={contact.id} contact={contact} />
          ))}
          {contacts.length === 0 && (
             <div className="h-24 border-2 border-dashed border-lux-hover/30 rounded-lg flex items-center justify-center text-lux-muted text-xs bg-black/10">
                 Arrastra tarjetas aquí
             </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
