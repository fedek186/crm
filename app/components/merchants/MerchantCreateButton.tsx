"use client";

/*
Este archivo provee el botón de creación de merchants con su propio diálogo modal.
Vive en el header de la página (junto al buscador) y gestiona el flujo de creación
de forma independiente del listado.

Elementos externos:
- MerchantForm: formulario reutilizable para crear un merchant.
- Button: botón primario reutilizable del CRM.

Funciones exportadas:
- MerchantCreateButton: botón "Nuevo merchant" que abre un modal con el formulario de creación.
*/

import { useState } from "react";
import MerchantForm from "@/app/components/merchants/MerchantForm";
import Button from "@/app/components/ui/Button";

export default function MerchantCreateButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button fullWidthMobile onClick={() => setIsOpen(true)} type="button">
        Nuevo merchant
      </Button>

      {isOpen && (
        <dialog className="modal modal-open" open>
          <div className="modal-box w-11/12 max-w-3xl p-0 bg-lux-surface border border-lux-hover/40">
            <div className="flex items-start justify-between gap-4 border-b border-lux-hover/40 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Nuevo merchant</h2>
                <p className="text-sm text-lux-muted font-normal">
                  Administrá identidad, dominio, logo y aliases en una sola vista.
                </p>
              </div>
              <button
                aria-label="Cerrar dialogo"
                className="btn btn-circle btn-ghost btn-sm text-lux-sec hover:text-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
              <MerchantForm
                className="border-0 bg-transparent p-0 shadow-none"
                onCancel={() => setIsOpen(false)}
                onSuccess={() => setIsOpen(false)}
                showHeader={false}
              />
            </div>
          </div>

          <form className="modal-backdrop bg-black/70 backdrop-blur-sm" method="dialog">
            <button onClick={() => setIsOpen(false)} type="button">
              close
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}
