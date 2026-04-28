"use client";

/*
Este archivo renderiza el listado de merchants con acciones de edición y archivado.
Muestra una grilla en mobile y una tabla en desktop. La creación de merchants
se maneja desde MerchantCreateButton en el header de la página.

Elementos externos:
- deleteMerchantAction: Server Action para archivar (soft delete) un merchant.
- MerchantForm: formulario reutilizable para editar un merchant.

Funciones exportadas:
- MerchantList: componente cliente que renderiza la lista de merchants con edición y archivado.
*/

import { useMemo, useState, useTransition } from "react";
import type { Merchant } from "@/app/lib/merchant";
import { deleteMerchantAction } from "@/app/actions/merchant.actions";
import { useRouter } from "next/navigation";
import MerchantForm from "@/app/components/merchants/MerchantForm";

type MerchantListProps = {
  merchants: Merchant[];
};

const merchantDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "numeric",
  timeZone: "UTC",
  year: "numeric",
});

export default function MerchantList({ merchants }: MerchantListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingMerchantId, setEditingMerchantId] = useState<Merchant["id"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === editingMerchantId),
    [editingMerchantId, merchants]
  );

  const isEditOpen = editingMerchantId !== null;

  const handleDelete = (merchantId: Merchant["id"]) => {
    const confirmed = window.confirm(
      "¿Seguro que querés archivar este merchant? Se ocultará del listado, pero no se borrará definitivamente."
    );
    if (!confirmed) return;

    setError(null);

    startTransition(async () => {
      const result = await deleteMerchantAction(merchantId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (editingMerchantId === merchantId) {
        setEditingMerchantId(null);
      }

      router.refresh();
    });
  };

  const openEditDialog = (merchantId: Merchant["id"]) => {
    setEditingMerchantId(merchantId);
    setError(null);
  };

  const closeEditDialog = () => {
    setEditingMerchantId(null);
  };

  const renderLogo = (merchant: Merchant) => {
    if (merchant.logo_url) {
      return (
        <img
          alt={`Logo de ${merchant.name}`}
          className="h-12 w-12 rounded-xl border border-lux-hover/40 object-contain bg-lux-bg p-2"
          src={merchant.logo_url}
        />
      );
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-lux-hover/40 bg-lux-bg text-sm font-bold uppercase text-lux-gold">
        {merchant.name.slice(0, 2)}
      </div>
    );
  };

  const renderAliases = (merchant: Merchant) => (
    <div className="flex flex-wrap gap-2">
      {merchant.aliases.length > 0 ? (
        merchant.aliases.map((alias, index) => (
          <span
            className="px-2 py-0.5 rounded-full border border-lux-hover/40 text-lux-sec text-[10px] uppercase tracking-wider"
            key={`${merchant.id}-${alias}-${index}`}
          >
            {alias}
          </span>
        ))
      ) : (
        <span className="text-sm text-lux-muted">Sin aliases</span>
      )}
    </div>
  );

  const renderMetadata = (label: string, value: string) => (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lux-muted">
        {label}
      </p>
      <p className="text-sm text-lux-text">{value}</p>
    </div>
  );

  const formatMerchantDate = (value: string) => merchantDateFormatter.format(new Date(value));

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-100 text-sm">
          {error}
        </div>
      ) : null}

      {merchants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-lux-hover/40 bg-lux-surface px-6 py-14 text-center text-lux-muted shadow-sm">
          No hay merchants cargados todavia.
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {merchants.map((merchant) => (
              <article
                className="rounded-2xl border border-lux-hover/40 bg-lux-surface p-5 shadow-sm hover:border-lux-hover/70 transition-colors"
                key={merchant.id}
              >
                <div className="flex items-start gap-4">
                  {renderLogo(merchant)}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-white">
                      {merchant.name}
                    </h2>
                    <p className="truncate text-xs text-lux-muted">{merchant.id}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {renderMetadata("Dominio", merchant.domain ?? "-")}
                  {renderMetadata("Creado", formatMerchantDate(merchant.created_at))}
                  {renderMetadata("Actualizado", formatMerchantDate(merchant.updated_at))}
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lux-muted">
                    Aliases
                  </p>
                  {renderAliases(merchant)}
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    className="btn btn-ghost sm:btn-sm"
                    onClick={() => openEditDialog(merchant.id)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-error btn-outline sm:btn-sm"
                    disabled={isPending}
                    onClick={() => handleDelete(merchant.id)}
                    type="button"
                  >
                    Archivar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-lux-hover/40 bg-lux-surface shadow-2xl lg:block">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b border-lux-hover/60 text-[11px] font-semibold uppercase tracking-widest text-lux-sec bg-lux-surface">
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4">Dominio</th>
                  <th className="px-6 py-4">Aliases</th>
                  <th className="px-6 py-4">Creado</th>
                  <th className="px-6 py-4">Actualizado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lux-hover/30 font-light">
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-lux-hover/20 transition-colors duration-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {renderLogo(merchant)}
                        <div>
                          <div className="font-semibold text-white">{merchant.name}</div>
                          <div className="text-xs text-lux-muted">{merchant.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-lux-sec">{merchant.domain ?? "-"}</td>
                    <td className="px-6 py-4">{renderAliases(merchant)}</td>
                    <td className="px-6 py-4 text-lux-sec">{formatMerchantDate(merchant.created_at)}</td>
                    <td className="px-6 py-4 text-lux-sec">{formatMerchantDate(merchant.updated_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex items-center text-[11px] font-medium text-lux-sec hover:text-lux-gold transition-colors border border-lux-hover px-3 py-1.5 rounded hover:border-lux-gold/50 uppercase tracking-wider"
                          onClick={() => openEditDialog(merchant.id)}
                          type="button"
                        >
                          Editar
                        </button>
                        <button
                          className="inline-flex items-center text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors border border-red-500/30 px-3 py-1.5 rounded hover:border-red-500/60 uppercase tracking-wider disabled:opacity-40"
                          disabled={isPending}
                          onClick={() => handleDelete(merchant.id)}
                          type="button"
                        >
                          Archivar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isEditOpen ? (
        <dialog className="modal modal-open" open>
          <div className="modal-box w-11/12 max-w-3xl p-0 bg-lux-surface border border-lux-hover/40">
            <div className="flex items-start justify-between gap-4 border-b border-lux-hover/40 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Editar merchant</h2>
                <p className="text-sm text-lux-muted font-normal">
                  Administrá identidad, dominio, logo y aliases en una sola vista.
                </p>
              </div>
              <button
                aria-label="Cerrar dialogo"
                className="btn btn-circle btn-ghost btn-sm text-lux-sec hover:text-white"
                onClick={closeEditDialog}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
              <MerchantForm
                className="border-0 bg-transparent p-0 shadow-none"
                merchant={editingMerchant}
                onCancel={closeEditDialog}
                onSuccess={closeEditDialog}
                showHeader={false}
              />
            </div>
          </div>

          <form className="modal-backdrop bg-black/70 backdrop-blur-sm" method="dialog">
            <button onClick={closeEditDialog} type="button">
              close
            </button>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}
