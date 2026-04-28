/*
Este archivo provee el contexto principal del Drag and Drop (Kanban) y sincroniza los cambios.
Maneja el estado optimista del lado del cliente, calcula los nuevos índices (Fractional Indexing) 
al mover tarjetas, y dispara las mutaciones en lote hacia la base de datos a través de Server Actions.

Elementos externos:
- DndContext, DragOverlay, useSensors, closestCorners: núcleo y utilidades de @dnd-kit para la funcionalidad Drag and Drop interactiva.
- arrayMove: helper auxiliar para reubicar elementos en el estado local temporalmente reordenado.
- KanbanColumn: componente que representa cada una de las listas del tablero.
- KanbanCard: componente que representa las tarjetas de contacto al arrastrarlas e iterables.
- updateContactsKanbanOrder: Server Action para persistir el nuevo orden y estado en la base de datos.
- ContactState: tipo exportado de Prisma.

Funciones exportadas:
- KanbanBoard: componente cliente de React que inicializa e integra la totalidad del tablero Kanban interactivo.
*/
"use client";

import { useState, useTransition, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { type Prisma, ContactState } from "@prisma/client";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import { updateContactsKanbanOrder } from "@/app/actions/contactKanbanActions";

type KanbanContact = Prisma.contactsGetPayload<{ include: { user: true } }> & {
  numero: number;
};

const COLUMNS = [
  { id: 'contacted', title: 'Contactado' },
  { id: 'no_response', title: 'Sin respuesta' },
  { id: 'talking', title: 'Hablando' },
  { id: 'finalizado', title: 'Finalizado' },
];

export default function KanbanBoard({ initialContacts }: { initialContacts: KanbanContact[] }) {
  const [contacts, setContacts] = useState<KanbanContact[]>(initialContacts);
  const [activeContact, setActiveContact] = useState<KanbanContact | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sincronizar en caso de props updates de Server Component
    setContacts(initialContacts);
  }, [initialContacts]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getContactId = (id: number | string) => contacts.find(c => c.id === id);

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const contact = getContactId(active.id);
    if (contact) setActiveContact(contact);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveContact = active.data.current?.type === "Contact";
    const isOverContact = over.data.current?.type === "Contact";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveContact) return;

    // Movimiento sobre otro contacto (reorden o cambio de columna)
    if (isActiveContact && isOverContact) {
      setContacts((contacts) => {
        const activeIndex = contacts.findIndex((c) => c.id === activeId);
        const overIndex = contacts.findIndex((c) => c.id === overId);
        
        if (contacts[activeIndex].state !== contacts[overIndex].state) {
          // Mutación optimista de estado al cruzar columnas
          const newContacts = [...contacts];
          newContacts[activeIndex].state = newContacts[overIndex].state;
          return arrayMove(newContacts, activeIndex, overIndex);
        }
        return arrayMove(contacts, activeIndex, overIndex);
      });
    }

    // Movimiento sobre una columna directamente (ej. vacía o suelta al final)
    if (isActiveContact && isOverColumn) {
      setContacts((contacts) => {
        const activeIndex = contacts.findIndex((c) => c.id === activeId);
        const newContacts = [...contacts];
        if (newContacts[activeIndex].state !== overId) {
          newContacts[activeIndex].state = String(overId) as ContactState;
        }
        return arrayMove(newContacts, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveContact(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;

    // Fractional Indexing Calculation
    let newOrder = 0;
    
    const currentContacts = [...contacts];
    const activeIndex = currentContacts.findIndex(c => c.id === activeId);
    if (activeIndex === -1) return;
    
    const movingContact = currentContacts[activeIndex];
    const targetState = movingContact.state; // ya modificado en onDragOver
    
    // Lista final de la columna ordenada
    const colContacts = currentContacts.filter(c => c.state === targetState);
    const myPosInCol = colContacts.findIndex(c => c.id === activeId);

    if (colContacts.length === 1) {
      // Único elemento en la columna entera
      newOrder = Date.now();
    } else if (myPosInCol === 0) {
      // Movido arriba del todo
      const nextCard = colContacts[1];
      newOrder = nextCard.board_order - 1000; 
    } else if (myPosInCol === colContacts.length - 1) {
      // Movido al fondo del todo
      const prevCard = colContacts[colContacts.length - 2];
      newOrder = prevCard.board_order + 1000;
    } else {
      // Insertado entre dos tarjetas (midpoint)
      const prevCard = colContacts[myPosInCol - 1];
      const nextCard = colContacts[myPosInCol + 1];
      newOrder = (prevCard.board_order + nextCard.board_order) / 2;
    }

    movingContact.board_order = newOrder;
    setContacts(currentContacts.sort((a, b) => a.board_order - b.board_order));

    // Despacho a servidor (bulk action)
    startTransition(async () => {
      await updateContactsKanbanOrder([{
        id: movingContact.id,
        state: targetState as ContactState,
        board_order: newOrder
      }]);
    });
  };

  if (!mounted) return null; // Previene hidratación incorrecta

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 md:gap-6 overflow-x-auto w-full pb-6 custom-scrollbar items-start">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            title={col.title}
            contacts={contacts.filter(c => c.state === col.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeContact ? <KanbanCard contact={activeContact} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
