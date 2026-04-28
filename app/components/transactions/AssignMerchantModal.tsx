"use client";

import { useState, useTransition } from "react";
import { assignMerchantToTransaction } from "@/app/actions/transaction.actions";
import { useMerchantSearch } from "@/app/hooks/useMerchantSearch";
import { useRouter } from "next/navigation";

type AssignMerchantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transactionDescription: string | null;
  transactionId: string | null;
};

export default function AssignMerchantModal({
  isOpen,
  onClose,
  transactionDescription,
  transactionId,
}: AssignMerchantModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const { merchants, isLoading: isLoadingOptions } = useMerchantSearch(search, { enabled: isOpen });

  const handleClose = () => {
    setSearch("");
    setError(null);
    onClose();
  };

  const handleAssign = (merchantId: string) => {
    if (!transactionId) {
      setError("No encontramos la transaccion a actualizar.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await assignMerchantToTransaction(transactionId, merchantId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      handleClose();
      router.refresh();
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <dialog className="modal modal-open" open>
      <div className="modal-box w-11/12 max-w-3xl border border-lux-hover/40 bg-lux-surface p-0 text-white shadow-2xl">
        <div className="border-b border-lux-hover/30 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-lux-gold">Asignar Merchant</h3>
              <p className="mt-1 text-sm text-lux-sec">
                {transactionDescription
                  ? `Transaccion: ${transactionDescription}`
                  : "Selecciona el merchant correcto para esta transaccion."}
              </p>
            </div>
            <button
              className="btn btn-circle btn-ghost btn-sm text-lux-sec hover:text-white"
              onClick={handleClose}
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="mt-4">
            <input
              className="w-full rounded-xl border border-lux-hover bg-lux-bg px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-lux-muted focus:border-lux-gold focus:ring-1 focus:ring-lux-gold"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar merchant por nombre, dominio o tag..."
              value={search}
            />
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-6">
          {error ? (
            <div className="alert alert-error mb-4 border-0 bg-red-500/10 text-red-100">
              <span>{error}</span>
            </div>
          ) : null}

          {isLoadingOptions ? (
            <div className="flex items-center justify-center py-12 text-lux-sec">
              <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-lux-gold border-t-transparent" />
              Buscando merchants...
            </div>
          ) : merchants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-lux-hover/40 px-6 py-10 text-center text-sm text-lux-sec">
              No encontramos merchants para esa busqueda.
            </div>
          ) : (
            <div className="space-y-3">
              {merchants.map((merchant) => (
                <button
                  className="flex w-full items-center gap-4 rounded-2xl border border-lux-hover/30 bg-lux-bg px-4 py-4 text-left transition-all hover:border-lux-gold/50 hover:bg-lux-hover/20 disabled:opacity-50"
                  disabled={isPending}
                  key={merchant.id}
                  onClick={() => handleAssign(merchant.id)}
                  type="button"
                >
                  {merchant.logoUrl ? (
                    <img
                      alt={`Logo de ${merchant.name}`}
                      className="h-12 w-12 rounded-xl border border-lux-hover/30 bg-white object-contain p-2"
                      src={merchant.logoUrl}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-lux-hover/30 bg-lux-surface text-sm font-bold uppercase text-lux-gold">
                      {merchant.name.slice(0, 2)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{merchant.name}</p>
                    <p className="truncate text-sm text-lux-sec">{merchant.domain ?? "Sin dominio"}</p>
                    {merchant.aliases.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {merchant.aliases.slice(0, 4).map((alias, index) => (
                          <span
                            className="rounded-full border border-lux-hover/40 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-lux-sec"
                            key={`${merchant.id}-${alias}-${index}`}
                          >
                            {alias}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <form className="modal-backdrop bg-black/70 backdrop-blur-sm" method="dialog">
        <button onClick={handleClose} type="button">
          close
        </button>
      </form>
    </dialog>
  );
}
