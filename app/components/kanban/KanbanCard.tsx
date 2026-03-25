/*
Este archivo renderiza una tarjeta individual dentro del tablero Kanban.
Muestra de manera condensada la información de un contacto (nombre, identificador, estado, objetivo y fechas)
e integra la lógica de origen para permitir que sea arrastrada por el usuario.

Elementos externos:
- useSortable: hook de @dnd-kit para convertir la tarjeta en un elemento draggable y sortable.
- CSS: utilidad de @dnd-kit para aplicar las transformaciones visuales durante el arrastre.

Funciones exportadas:
- KanbanCard: componente de React que representa una tarjeta de contacto interactiva en el tablero.
*/
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ContactNotesModal from "../ContactNotesModal";

export default function KanbanCard({ contact }: { contact: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: contact.id,
    data: {
      type: "Contact",
      contact,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const user = contact.user;
  const name = user ? `${user.name || ''} ${user.surname || ''}`.trim() || 'Usuario sin nombre' : 'Sin asignar';
  const isFinalizado = contact.state === 'finalizado';

  const formatObjetivo = (objRaw: string | null) => {
    switch (objRaw) {
      case 'activation': return 'Activación';
      case 'increase_trans': return 'Aumento Transacciones';
      case 'MP': return 'Mercado Pago';
      default: return objRaw || 'Sin objetivo';
    }
  };

  const formatEstado = (estadoRaw: string) => {
    switch (estadoRaw) {
      case 'contacted': return 'Contactado';
      case 'no_response': return 'Sin respuesta';
      case 'talking': return 'Hablando';
      case 'finalizado': return 'Finalizado';
      default: return estadoRaw;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-lux-surface border rounded-lg p-4 text-left relative cursor-grab active:cursor-grabbing transition-colors 
        ${isDragging ? 'opacity-40 ring-1 ring-lux-gold border-lux-gold z-50 shadow-2xl scale-105' : 'border-lux-hover/30 hover:border-lux-hover/80 hover:shadow-lg'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-white font-bold text-sm leading-tight pr-2">
          {name}
        </h4>
        <span className="text-lux-gold text-xs font-bold shrink-0">#{contact.numero}</span>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="text-lux-muted text-[10px] uppercase tracking-widest block mb-0.5">Estado</span>
          <span className="text-lux-sec text-xs font-semibold px-2 py-1 rounded bg-black/30 border border-white/5 inline-block">
            {formatEstado(contact.state)}
          </span>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lux-muted text-[10px] uppercase tracking-widest block">Objetivo</span>
            <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  (document.getElementById(`notes_modal_${contact.id}`) as HTMLDialogElement)?.showModal();
                }}
                className="text-lux-sec hover:text-lux-gold transition-colors tooltip tooltip-top pointer-events-auto cursor-pointer" >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
            </button>
          </div>
          <span className="text-white text-xs font-medium">{formatObjetivo(contact.objective)}</span>
        </div>
        
        <div className="border-t border-lux-hover/30 pt-2 mt-2">
          {isFinalizado ? (
            <div>
              <span className="text-lux-muted text-[10px] uppercase tracking-widest block mb-0.5">Fecha</span>
              <span className="text-lux-sec text-[11px] font-semibold">
                {contact.start_date ? new Date(contact.start_date).toLocaleDateString() : '?'} - {contact.end_date ? new Date(contact.end_date).toLocaleDateString() : '?'}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-lux-muted text-[10px] uppercase tracking-widest block mb-0.5">Iniciado</span>
              <span className="text-lux-sec text-[11px] font-semibold">
                {contact.start_date ? new Date(contact.start_date).toLocaleDateString() : 'Desconocida'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Excluimos el drag desde dentro del portal Modal usando la detención nativa de nextjs dialogos */}
      <ContactNotesModal contactId={contact.id} userId={contact.user_id} notesText={contact.notes} />
    </div>
  );
}
