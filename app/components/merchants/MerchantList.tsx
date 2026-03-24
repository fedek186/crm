"use client";

import { useMemo, useState, useTransition } from "react";
import SearchTableInput from "@/app/components/SearchTableInput";
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
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === editingMerchantId),
    [editingMerchantId, merchants]
  );

  const isDialogOpen = dialogMode !== null;

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
        setDialogMode(null);
      }

      router.refresh();
    });
  };

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingMerchantId(null);
    setError(null);
  };

  const openEditDialog = (merchantId: Merchant["id"]) => {
    setDialogMode("edit");
    setEditingMerchantId(merchantId);
    setError(null);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingMerchantId(null);
  };

  const renderLogo = (merchant: Merchant) => {
    if (merchant.logo_url) {
      return (
        <img
          alt={`Logo de ${merchant.name}`}
          className="h-12 w-12 rounded-xl border border-base-300 object-contain bg-base-200 p-2"
          src={merchant.logo_url}
        />
      );
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-base-300 bg-base-200 text-sm font-bold uppercase text-base-content/60">
        {merchant.name.slice(0, 2)}
      </div>
    );
  };

  const renderAliases = (merchant: Merchant) => (
    <div className="flex flex-wrap gap-2">
      {merchant.aliases.length > 0 ? (
        merchant.aliases.map((alias, index) => (
          <span
            className="badge badge-outline"
            key={`${merchant.id}-${alias}-${index}`}
          >
            {alias}
          </span>
        ))
      ) : (
        <span className="text-sm text-base-content/60">Sin aliases</span>
      )}
    </div>
  );

  const renderMetadata = (label: string, value: string) => (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/45">
        {label}
      </p>
      <p className="text-sm text-base-content">{value}</p>
    </div>
  );

  const formatMerchantDate = (value: string) => merchantDateFormatter.format(new Date(value));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Merchants</h1>
          <p className="text-sm text-base-content/70">
            Gestioná merchants, dominios y aliases desde un solo lugar.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <SearchTableInput
            placeholder="Buscar por nombre, URL o tag..."
          />
          <button
            className="btn btn-primary w-full sm:w-auto"
            onClick={openCreateDialog}
            type="button"
          >
            Nuevo merchant
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : null}

      {merchants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-14 text-center text-base-content/60 shadow-sm">
          No hay merchants cargados todavia.
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {merchants.map((merchant) => (
              <article
                className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
                key={merchant.id}
              >
                <div className="flex items-start gap-4">
                  {renderLogo(merchant)}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-base-content">
                      {merchant.name}
                    </h2>
                    <p className="truncate text-xs text-base-content/60">{merchant.id}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {renderMetadata("Dominio", merchant.domain ?? "-")}
                  {renderMetadata(
                    "Creado",
                    formatMerchantDate(merchant.created_at)
                  )}
                  {renderMetadata(
                    "Actualizado",
                    formatMerchantDate(merchant.updated_at)
                  )}
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/45">
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

          <div className="hidden overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm lg:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Dominio</th>
                  <th>Aliases</th>
                  <th>Creado</th>
                  <th>Actualizado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr key={merchant.id}>
                    <td>
                      <div className="flex items-center gap-4">
                        {renderLogo(merchant)}
                        <div>
                          <div className="font-semibold text-base-content">{merchant.name}</div>
                          <div className="text-xs text-base-content/60">{merchant.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{merchant.domain ?? "-"}</td>
                    <td>{renderAliases(merchant)}</td>
                    <td>{formatMerchantDate(merchant.created_at)}</td>
                    <td>{formatMerchantDate(merchant.updated_at)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => openEditDialog(merchant.id)}
                          type="button"
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-error btn-outline"
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

      {isDialogOpen ? (
        <dialog className="modal modal-open" open>
          <div className="modal-box w-11/12 max-w-3xl p-0">
            <div className="flex items-start justify-between gap-4 border-b border-base-300 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-base-content">
                  {dialogMode === "edit" ? "Editar merchant" : "Nuevo merchant"}
                </h2>
                <p className="text-sm text-base-content/65">
                  Administrá identidad, dominio, logo y aliases en una sola vista.
                </p>
              </div>
              <button
                aria-label="Cerrar dialogo"
                className="btn btn-circle btn-ghost btn-sm"
                onClick={closeDialog}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
              <MerchantForm
                className="border-0 bg-transparent p-0 shadow-none"
                merchant={dialogMode === "edit" ? editingMerchant : undefined}
                onCancel={closeDialog}
                onSuccess={closeDialog}
                showHeader={false}
              />
            </div>
          </div>

          <form className="modal-backdrop" method="dialog">
            <button onClick={closeDialog} type="button">
              close
            </button>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}
