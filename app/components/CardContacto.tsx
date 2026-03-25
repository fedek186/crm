/*
Este archivo renderiza la tarjeta individual para cada interacción o contacto con un usuario.
Muestra el estado actual ("Contactado", "Hablando", "Finalizado", "Sin respuesta"), el objetivo
y las fechas. Incluye un menú desplegable para afinar el estado rápidamente y un modal con un 
editor de texto nativo con formateo rápido para escribir notas del seguimiento.

Elementos externos:
- useTransition: hook de React para manejar peticiones optimistas al servidor.
- updateContactStateAction, updateContactNotesAction: Server actions para modificar la BD.
- ContactState: Tipo global de Prisma enumerando los estados del contacto.

Funciones exportadas:
- CardContacto: componente principal que gestiona la UI de la tarjeta y sus modales nativos.
*/
"use client";

import { useState, useEffect, useTransition } from "react";
import { updateContactStateAction, deleteContactAction } from "@/app/actions/contactActions";
import ContactNotesModal from "./ContactNotesModal";
import type { ContactState } from "@prisma/client";

export interface CardContactoProps {
  id: number;
  userId: string;
  numero: number;
  objetivo: string | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  estado: string;
  notesText: string | null;
}

export default function CardContacto({ id, userId, numero, objetivo, fechaInicio, fechaFin, estado, notesText }: CardContactoProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useState(estado);

  // Sincronizar el estado si cambia desde el servidor (revalidatePath)
  useEffect(() => {
    setOptimisticState(estado);
  }, [estado]);
  
  const updateStatus = (newStatus: ContactState) => {
    if (optimisticState === newStatus) return;
    
    // Cierra el menú details nativo tras la selección
    const element = document.activeElement;
    if (element instanceof HTMLElement) {
      element.blur();
      const details = element.closest('details');
      if (details) details.removeAttribute('open');
    }
    
    // UI Fluid Update: Cambiamos al instante la UI
    const previousState = optimisticState;
    setOptimisticState(newStatus);

    startTransition(async () => {
      const result = await updateContactStateAction(id, newStatus, userId);
      if (!result?.success) {
        setOptimisticState(previousState);
        alert("Ocurrió un error al intentar cambiar el estado en la base de datos.");
      }
    });
  };

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que querés eliminar este contacto? Esta acción no se puede deshacer.")) {
      startTransition(async () => {
        const result = await deleteContactAction(id, userId);
        if (!result?.success) {
          alert("Ocurrió un error al intentar eliminar el contacto.");
        }
      });
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

  const formatObjetivo = (objRaw: string | null) => {
    if (!objRaw) return 'Sin objetivo';
    switch (objRaw) {
      case 'activation': return 'Activación';
      case 'increase_trans': return 'Aumento Transacciones';
      case 'MP': return 'Mercado Pago';
      default: return objRaw;
    }
  };

  return (
    <div className="bg-lux-surface border border-lux-hover/30 rounded-lg p-5 hover:border-lux-hover transition-colors text-left relative">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-white font-bold text-lg">
          Contacto <span className="text-lux-gold">#{numero}</span>
        </h4>
        <details className="dropdown dropdown-end">
          <summary 
             aria-disabled={isPending} 
             className={`px-3 py-1.5 bg-lux-surface border border-lux-hover/50 rounded-lg hover:border-lux-gold/50 focus:ring-1 focus:ring-lux-gold transition-all relative flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider font-bold cursor-pointer inline-flex w-max list-none [&::-webkit-details-marker]:hidden ${isPending ? 'opacity-50 pointer-events-none' : 'text-lux-sec hover:text-lux-gold'}`}
          >
            <span>{formatEstado(optimisticState)}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 opacity-70">
               <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <ul className="dropdown-content z-20 menu p-1.5 shadow-2xl bg-lux-surface border border-lux-hover/50 rounded-xl w-40 mt-1 flex flex-col gap-1 ring-1 ring-black/80">
            <li>
               <button 
                  onClick={() => updateStatus('contacted')} 
                  className={`px-3 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${optimisticState === 'contacted' ? 'bg-lux-gold/10 text-lux-gold' : 'text-white hover:bg-lux-hover/30 hover:text-lux-gold'}`}
               >
                 Contactado
               </button>
            </li>
            <li>
               <button 
                  onClick={() => updateStatus('talking')} 
                  className={`px-3 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${optimisticState === 'talking' ? 'bg-lux-gold/10 text-lux-gold' : 'text-white hover:bg-lux-hover/30 hover:text-lux-gold'}`}
               >
                 Hablando
               </button>
            </li>
            <li>
               <button 
                  onClick={() => updateStatus('finalizado')} 
                  className={`px-3 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${optimisticState === 'finalizado' ? 'bg-lux-gold/10 text-lux-gold' : 'text-white hover:bg-lux-hover/30 hover:text-lux-gold'}`}
               >
                 Finalizado
               </button>
            </li>
            <li>
               <button 
                  onClick={() => updateStatus('no_response')} 
                  className={`px-3 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${optimisticState === 'no_response' ? 'bg-lux-gold/10 text-lux-gold' : 'text-white hover:bg-lux-hover/30 hover:text-lux-gold'}`}
               >
                 Sin respuesta
               </button>
            </li>
          </ul>
        </details>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="text-lux-muted text-xs uppercase tracking-widest block mb-1">Objetivo</span>
          <div className="flex items-center">
            <span className="text-white text-sm font-medium">{formatObjetivo(objetivo)}</span>
            <button 
                onClick={() => (document.getElementById(`notes_modal_${id}`) as HTMLDialogElement)?.showModal()}
                className="ml-3 text-lux-sec hover:text-lux-gold transition-colors tooltip tooltip-top pointer-events-auto cursor-pointer" 
                data-tip="Ver o editar notas del seguimiento"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
            </button>
            <button 
                disabled={isPending}
                onClick={handleDelete}
                className={`ml-2 text-lux-sec hover:text-red-500/80 transition-colors tooltip tooltip-top pointer-events-auto cursor-pointer ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                data-tip="Eliminar contacto"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center border-t border-lux-hover/30 pt-3">
          <div>
            <span className="text-lux-muted text-xs uppercase tracking-widest block mb-1">Iniciado</span>
            <span className="text-lux-sec text-xs font-semibold">
              {fechaInicio ? fechaInicio.toLocaleDateString() : 'Desconocida'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-lux-muted text-xs uppercase tracking-widest block mb-1">Finalizado</span>
            <span className="text-lux-sec text-xs font-semibold">
              {fechaFin ? fechaFin.toLocaleDateString() : 'En curso'}
            </span>
          </div>
        </div>
      </div>

      <ContactNotesModal contactId={id} userId={userId} notesText={notesText} />
    </div>
  );
}
