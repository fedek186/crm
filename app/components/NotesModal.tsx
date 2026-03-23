"use client";

import { useState, useRef, useTransition } from "react";
import { addNoteAction, updateNoteAction } from "@/app/actions/noteActions";
import type { notes } from "@prisma/client";

interface NotesModalProps {
  contactId: number;
  userId: string;
  notesData: notes[];
}

export default function NotesModal({ contactId, userId, notesData }: NotesModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [selectedNote, setSelectedNote] = useState<notes | null>(null);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  const openModal = () => modalRef.current?.showModal();
  const closeModal = () => {
    modalRef.current?.close();
    resetForm();
  };

  const resetForm = () => {
    setSelectedNote(null);
    setTitle("");
    setText("");
  };

  const handleSelectNote = (note: notes) => {
    setSelectedNote(note);
    setTitle(note.title || "");
    setText(note.text || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formData = new FormData();
    formData.append("contactId", contactId.toString());
    formData.append("userId", userId);
    formData.append("title", title);
    formData.append("text", text);
    
    startTransition(async () => {
      let res;
      if (selectedNote) {
        formData.append("noteId", selectedNote.id.toString());
        res = await updateNoteAction(formData);
      } else {
        res = await addNoteAction(formData);
      }

      if (res?.success) {
        // Reset to allow adding new note, or keep editing
        // keeping it in place is fine, but resetting is cleaner 
        resetForm();
      } else {
        alert(res?.error || "Error al guardar la nota");
      }
    });
  };

  return (
    <>
      <button 
        onClick={openModal}
        className="text-[10px] uppercase tracking-widest font-bold text-lux-gold hover:underline focus:outline-none bg-lux-gold/10 px-2 py-0.5 rounded ml-3 transition-colors hover:bg-lux-gold/20 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 mr-1 inline-block">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        Notas ({notesData.length})
      </button>

      <dialog ref={modalRef} className="modal backdrop-blur-sm bg-black/50">
        <div className="modal-box w-11/12 max-w-5xl bg-lux-surface border border-lux-hover/40 text-white shadow-2xl p-0 overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[650px] relative">
          
          {/* Lado Izquierdo: Lista de Notas (Estilo Post-it) */}
          <div className="w-full md:w-[350px] bg-lux-bg border-r border-lux-hover/30 flex flex-col h-[40%] md:h-full shrink-0">
            <div className="p-5 border-b border-lux-hover/30 flex justify-between items-center bg-lux-surface z-10 sticky top-0 shadow-sm">
              <h3 className="font-bold text-lg text-lux-gold tracking-tight">Bloc de Notas</h3>
              <button 
                onClick={resetForm} 
                className="text-xs bg-lux-bg border border-lux-hover/50 hover:bg-lux-hover/30 hover:text-lux-gold hover:border-lux-gold/50 px-3 py-1.5 rounded transition-all font-bold text-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              >
                + Nueva
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 bg-lux-bg">
              {notesData.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => handleSelectNote(note)}
                  className={`p-4 rounded shadow-md cursor-pointer transition-all border-l-4 hover:-translate-y-0.5 hover:shadow-lg ${
                    selectedNote?.id === note.id 
                    ? 'border-lux-gold bg-lux-surface shadow-[0_0_16px_rgba(241,111,132,0.12)]'
                    : 'border-lux-hover/60 bg-lux-bg hover:bg-lux-surface'
                  }`}
                >
                   <p className="text-[10px] text-lux-muted mb-2 tracking-wider font-mono">{note.date ? note.date.toLocaleString() : ''}</p>
                   <h4 className="font-bold text-sm text-white leading-snug line-clamp-3">{note.title || "Sin título"}</h4>
                </div>
              ))}
              {notesData.length === 0 && (
                <div className="text-center opacity-60 mt-12 px-6">
                  <p className="text-xs text-lux-sec font-medium">No hay anotaciones en este contacto.</p>
                </div>
              )}
            </div>
          </div>

          {/* Lado Derecho: Formulario Editor */}
          <div className="flex-1 flex flex-col h-[60%] md:h-full bg-lux-bg relative">
             <div className="px-8 pt-8 pb-4 flex-1 flex flex-col overflow-hidden">
               <h3 className="text-lux-sec text-xs uppercase tracking-widest font-bold mb-6 border-b border-lux-hover/30 pb-3">
                 {selectedNote ? 'Visualizar / Editar Nota' : 'Escribir Nueva Nota'}
               </h3>
               
               <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full min-h-0 bg-lux-bg/60 rounded-xl border border-lux-hover/20 p-6">
                 <div className="mb-6">
                   <input 
                     type="text" 
                     placeholder="Ingresa un gran título..." 
                     className="w-full bg-transparent text-2xl font-extrabold text-white outline-none placeholder:text-lux-muted/40 border-b border-dashed border-lux-hover/40 hover:border-lux-hover focus:border-lux-gold pb-3 transition-colors focus:ring-0"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     required
                     disabled={isPending}
                   />
                 </div>
                 <div className="flex-1 min-h-0">
                   <textarea 
                     placeholder="Comienza a redactar tu anotación aquí... (Ej. Detalles de la llamada, presupuestos, excusas del cliente)" 
                     className="w-full h-full bg-transparent text-[15px] leading-relaxed text-lux-text outline-none placeholder:text-lux-muted/40 resize-none focus:ring-0 font-sans custom-scrollbar"
                     value={text}
                     onChange={(e) => setText(e.target.value)}
                     disabled={isPending}
                   />
                 </div>
               </form>
             </div>

             <div className="p-5 border-t border-lux-hover/40 bg-lux-surface flex justify-end items-center gap-4 sticky bottom-0 z-10">
               {isPending && <span className="text-xs text-lux-gold animate-pulse mr-auto ml-4">Guardando nota en la nube...</span>}
               <button 
                 type="button" 
                 onClick={closeModal} 
                 className="px-5 py-2 rounded-lg text-sm font-bold text-lux-sec hover:bg-lux-hover/30 transition-all border border-transparent hover:border-lux-hover/50"
                 disabled={isPending}
               >
                 Cerrar y Volver
               </button>
               <button 
                 onClick={handleSubmit}
                 disabled={isPending || !title.trim()}
                 className="px-6 py-2.5 rounded-lg bg-lux-gold text-lux-bg font-extrabold text-sm shadow-[0_0_15px_rgba(241,111,132,0.18)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
               >
                 {selectedNote ? 'Actualizar Nota' : 'Guardar Nueva Nota'}
               </button>
             </div>
          </div>

        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal} className="cursor-default">close</button>
        </form>
      </dialog>
    </>
  );
}
