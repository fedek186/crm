"use client";

import { useState, useRef } from "react";
import { addContactAction } from "@/app/actions/contactActions";

export default function AddContactModal({ userId }: { userId: string }) {
  const [isPending, setIsPending] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);

  const openModal = () => {
    modalRef.current?.showModal();
  };

  const closeModal = () => {
    modalRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("userId", userId);
    
    const result = await addContactAction(formData);
    if (result?.success) {
      closeModal();
      form.reset();
    } else {
      alert(result?.error || "Error al añadir el contacto");
    }
    setIsPending(false);
  };

  return (
    <>
      <button 
        onClick={openModal}
        className="bg-lux-gold text-lux-bg px-4 py-1.5 rounded text-sm font-bold transition-colors shadow-sm"
      >
        + Añadir
      </button>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box bg-lux-surface border border-lux-hover/40 text-white shadow-2xl">
          <h3 className="font-bold text-xl mb-6 text-lux-gold border-b border-lux-hover/30 pb-3">Añadir Nuevo Contacto</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">
                <span className="label-text text-lux-sec font-semibold tracking-wide uppercase text-xs">Estado</span>
              </label>
              <select name="state" className="select select-bordered w-full bg-lux-bg text-white border-lux-hover/30 focus:border-lux-gold focus:ring-1 focus:ring-lux-gold" required defaultValue="contacted">
                <option value="contacted">Contactado</option>
                <option value="talking">En conversación</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>

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

            <div className="modal-action pt-4 border-t border-lux-hover/30">
              <button type="button" className="btn btn-ghost text-lux-sec hover:bg-lux-hover/30" onClick={closeModal} disabled={isPending}>
                Cancelar
              </button>
              <button type="submit" className="btn bg-lux-gold text-lux-bg border-none font-bold px-6 shadow-sm" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar Contacto"}
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
