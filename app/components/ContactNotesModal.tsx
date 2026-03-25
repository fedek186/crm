/*
Este archivo provee un modal reutilizable para visualizar y editar las notas de un contacto.
Permite la edición de texto enriquecido e invoca la mutación en la base de datos para guardar 
los cambios al hacer clic en "Guardar y Cerrar".

Elementos externos:
- useTransition: hook de React para manejar la asincronía y el estado de carga al guardar.
- updateContactNotesAction: Server action que guarda las notas en Postgres y revalida la UI.

Funciones exportadas:
- ContactNotesModal: componente cliente de UI que encapsula el modal de notas y sus eventos.
*/
"use client";

import { useRef, useTransition, MouseEvent } from "react";
import { updateContactNotesAction } from "@/app/actions/contactActions";

export interface ContactNotesModalProps {
  contactId: number;
  userId: string;
  notesText: string | null;
}

export default function ContactNotesModal({ contactId, userId, notesText }: ContactNotesModalProps) {
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef<HTMLDivElement>(null);

  const handleSaveNotes = () => {
    if (!editorRef.current) return;
    const htmlText = editorRef.current.innerHTML;
    
    if (htmlText !== notesText) {
      startTransition(async () => {
        const result = await updateContactNotesAction(contactId, htmlText, userId);
        if (result?.success) {
          (document.getElementById(`notes_modal_${contactId}`) as HTMLDialogElement)?.close();
        } else {
          alert("No se pudieron guardar las notas");
        }
      });
    } else {
      (document.getElementById(`notes_modal_${contactId}`) as HTMLDialogElement)?.close();
    }
  };

  const executeCommand = (e: MouseEvent, command: string) => {
    e.preventDefault(); 
    document.execCommand(command, false, undefined);
  };

  return (
    <dialog 
      id={`notes_modal_${contactId}`} 
      className="modal"
      onKeyDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="modal-box bg-lux-bg border border-lux-hover/40 text-left text-lux-text w-11/12 max-w-2xl relative shadow-2xl flex flex-col p-0 cursor-default">
        <div className="p-6 pb-4 border-b border-lux-hover/40 flex justify-between items-center">
          <h3 className="font-bold text-xl text-white tracking-tight">Notas del Contacto</h3>
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost text-lux-sec hover:text-white cursor-pointer hover:bg-lux-hover/20">✕</button>
          </form>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <div className="bg-lux-surface border border-lux-hover/40 p-1.5 rounded-t-lg flex gap-1 items-center">
            <button type="button" onMouseDown={(e) => executeCommand(e, 'bold')} className="w-8 h-8 flex items-center justify-center hover:bg-lux-hover/40 rounded text-lux-sec hover:text-white cursor-pointer font-bold" title="Negrita (Ctrl+B)">B</button>
            <button type="button" onMouseDown={(e) => executeCommand(e, 'italic')} className="w-8 h-8 flex items-center justify-center hover:bg-lux-hover/40 rounded text-lux-sec hover:text-white cursor-pointer italic font-serif" title="Cursiva (Ctrl+I)">I</button>
            <button type="button" onMouseDown={(e) => executeCommand(e, 'underline')} className="w-8 h-8 flex items-center justify-center hover:bg-lux-hover/40 rounded text-lux-sec hover:text-white cursor-pointer underline" title="Subrayado (Ctrl+U)">U</button>
            <div className="w-[1px] h-5 bg-lux-hover/40 mx-1"></div>
            <button type="button" onMouseDown={(e) => executeCommand(e, 'insertUnorderedList')} className="w-8 h-8 flex items-center justify-center hover:bg-lux-hover/40 rounded text-lux-sec hover:text-white cursor-pointer" title="Lista">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            </button>
          </div>
          
          <div 
            id={`notes_editor_${contactId}`}
            ref={editorRef}
            contentEditable 
            className="w-full h-auto min-h-[200px] bg-lux-surface p-5 border-l border-r border-b border-lux-hover/40 rounded-b-lg text-white font-normal text-sm focus:outline-none focus:ring-1 focus:ring-lux-gold overflow-y-auto leading-relaxed shadow-inner empty:before:content-[attr(data-placeholder)] empty:before:text-lux-muted/50"
            dangerouslySetInnerHTML={{ __html: notesText || "" }}
            data-placeholder="Escribe aquí las notas del cliente... (selecciona el texto y usa Ctrl+B para negrita)"
          />
        </div>

        <div className="p-4 border-t border-lux-hover/40 bg-lux-surface/50 flex justify-between items-center rounded-b-2xl">
          <span className="text-[11px] text-lux-muted">Soporta atajos de teclado (Ctrl+B, Ctrl+I)</span>
          <button 
            type="button" 
            onClick={handleSaveNotes} 
            disabled={isPending}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${isPending ? 'bg-lux-hover text-lux-muted cursor-not-allowed' : 'bg-lux-gold text-lux-bg hover:brightness-110 cursor-pointer shadow-[0_0_15px_rgba(241,111,132,0.3)]'}`}
          >
            {isPending ? 'Guardando...' : 'Guardar y Cerrar'}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>cerrar</button>
      </form>
    </dialog>
  );
}
