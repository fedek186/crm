"use client";

import { useState, useEffect, useTransition } from "react";
import { updateContactStateAction } from "@/app/actions/contactActions";
import type { ContactState, notes } from "@prisma/client";
import NotesModal from "./NotesModal";

export interface CardContactoProps {
  id: number;
  userId: string;
  numero: number;
  objetivo: string | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  estado: string;
  notesData: notes[];
}

export default function CardContacto({ id, userId, numero, objetivo, fechaInicio, fechaFin, estado, notesData }: CardContactoProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useState(estado);

  // Sincronizar el estado si cambia desde el servidor (revalidatePath)
  useEffect(() => {
    setOptimisticState(estado);
  }, [estado]);
  
  const updateStatus = (newStatus: ContactState) => {
    if (optimisticState === newStatus) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur(); // Cierra el menú de DaisyUI
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

  const formatEstado = (estadoRaw: string) => {
    switch (estadoRaw) {
      case 'contacted': return 'Contactado';
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
    <div className="bg-lux-surface border border-lux-hover/30 rounded-lg p-5 hover:border-lux-hover transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-white font-bold text-lg">
          Contacto <span className="text-lux-gold">#{numero}</span>
        </h4>
        <div className="dropdown dropdown-end group">
          <div 
             tabIndex={0} 
             role="button" 
             aria-disabled={isPending} 
             className={`px-3 py-1.5 bg-lux-surface border border-lux-hover/50 rounded-lg hover:border-lux-gold/50 focus:ring-1 focus:ring-lux-gold transition-all relative flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider font-bold cursor-pointer ${isPending ? 'opacity-50 pointer-events-none' : 'text-lux-sec hover:text-lux-gold'}`}
          >
            <span>{formatEstado(optimisticState)}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 opacity-70">
               <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
          <ul tabIndex={0} className="dropdown-content z-20 menu p-1.5 shadow-2xl bg-lux-surface border border-lux-hover/50 rounded-xl w-40 mt-1 flex flex-col gap-1 ring-1 ring-black/80">
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
          </ul>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="text-lux-muted text-xs uppercase tracking-widest block mb-1">Objetivo</span>
          <div className="flex items-center">
            <span className="text-white text-sm font-medium">{formatObjetivo(objetivo)}</span>
            <NotesModal contactId={id} userId={userId} notesData={notesData || []} />
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
    </div>
  );
}
