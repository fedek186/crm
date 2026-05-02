/*
Este archivo provee un componente modal (BulkContactModal) que permite la creación masiva de contactos para diferentes usuarios a partir de una lista de emails.
Es utilizado en la vista principal de usuarios para automatizar campañas o el seguimiento comercial.

Elementos externos:
- addBulkContactsAction: ejecuta la creación de los múltiples contactos en la base de datos y la revalidación de las rutas.
*/
"use client";

import { useState, useRef } from "react";
import { addBulkContactsAction } from "@/app/actions/contactActions";

export default function BulkContactModal() {
  const [isPending, setIsPending] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  const openModal = () => {
    setResultMessage(null);
    modalRef.current?.showModal();
  };

  const closeModal = () => {
    modalRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setResultMessage(null);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Parse emails, allowing comma, semicolon or newline separation
    const rawEmails = formData.get("emails") as string;
    const emails = rawEmails
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emails.length === 0) {
      setResultMessage({ type: 'error', text: 'Por favor, ingrese al menos un email válido.' });
      setIsPending(false);
      return;
    }

    const state = formData.get("state") as any;
    const objective = formData.get("objective") as any;
    const media = formData.get("media") as any;
    const notes = formData.get("notes") as string;

    const result = await addBulkContactsAction({
      emails,
      state,
      objective,
      media,
      notes
    });

    if (result?.success) {
      setResultMessage({ type: 'success', text: `Se han creado ${result.count} contactos exitosamente.` });
      form.reset();
      // Optional: auto-close after success
      // setTimeout(() => closeModal(), 2000);
    } else {
      setResultMessage({ type: 'error', text: result?.error || "Error al añadir la campaña" });
    }
    setIsPending(false);
  };

  return (
    <>
      <button 
        onClick={openModal}
        className="btn bg-lux-gold text-lux-bg hover:bg-lux-gold/90 transition-all shadow-[0_0_15px_rgba(241,111,132,0.12)] border-none flex-1 sm:flex-none whitespace-nowrap"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Contactar
      </button>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box bg-lux-surface border border-lux-hover/40 text-white shadow-2xl max-w-2xl">
          <h3 className="font-bold text-xl mb-6 text-lux-gold border-b border-lux-hover/30 pb-3">Automatizar Nueva Campaña</h3>
          
          {resultMessage && (
            <div className={`p-4 mb-6 rounded-md ${resultMessage.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
              {resultMessage.text}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">
                <span className="label-text text-lux-sec font-semibold tracking-wide uppercase text-xs">Emails de Usuarios (separados por coma o salto de línea)</span>
              </label>
              <textarea 
                name="emails" 
                rows={4} 
                className="textarea textarea-bordered w-full bg-lux-bg text-white border-lux-hover/30 focus:border-lux-gold focus:ring-1 focus:ring-lux-gold" 
                required 
                placeholder="usuario1@ejemplo.com, usuario2@ejemplo.com&#10;usuario3@ejemplo.com"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text text-lux-sec font-semibold tracking-wide uppercase text-xs">Objetivo</span>
                </label>
                <select name="objective" className="select select-bordered w-full bg-lux-bg text-white border-lux-hover/30 focus:border-lux-gold focus:ring-1 focus:ring-lux-gold" required defaultValue="activation">
                  <option value="activation">Activación</option>
                  <option value="increase_trans">Aumentar transacciones</option>
                  <option value="MP">Mercado Pago</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text text-lux-sec font-semibold tracking-wide uppercase text-xs">Medio</span>
                </label>
                <select name="media" className="select select-bordered w-full bg-lux-bg text-white border-lux-hover/30 focus:border-lux-gold focus:ring-1 focus:ring-lux-gold" required defaultValue="email">
                  <option value="email">Email</option>
                  <option value="number">Teléfono</option>
                </select>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text text-lux-sec font-semibold tracking-wide uppercase text-xs">Estado Inicial</span>
                </label>
                <select name="state" className="select select-bordered w-full bg-lux-bg text-white border-lux-hover/30 focus:border-lux-gold focus:ring-1 focus:ring-lux-gold" required defaultValue="contacted">
                  <option value="contacted">Contactado</option>
                  <option value="talking">Hablando</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="no_response">Sin respuesta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text text-lux-sec font-semibold tracking-wide uppercase text-xs">Descripción / Notas (Opcional)</span>
              </label>
              <textarea 
                name="notes" 
                rows={3} 
                className="textarea textarea-bordered w-full bg-lux-bg text-white border-lux-hover/30 focus:border-lux-gold focus:ring-1 focus:ring-lux-gold" 
                placeholder="Notas iniciales para todos estos contactos..."
              ></textarea>
            </div>

            <div className="modal-action pt-4 border-t border-lux-hover/30">
              <button type="button" className="btn btn-ghost text-lux-sec hover:bg-lux-hover/30" onClick={closeModal} disabled={isPending}>
                Cerrar
              </button>
              <button type="submit" className="btn bg-lux-gold text-lux-bg border-none font-bold px-6 shadow-sm hover:bg-[#e0b04a]" disabled={isPending}>
                {isPending ? "Creando..." : "Crear Campaña"}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-black/60 backdrop-blur-sm">
          <button onClick={closeModal}>Cerrar</button>
        </form>
      </dialog>
    </>
  );
}
