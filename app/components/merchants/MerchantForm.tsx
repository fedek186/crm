"use client";

import { useMemo, useState, useTransition } from "react";
import type { Merchant } from "@/app/lib/merchant";
import {
  createMerchantAction,
  MerchantFormPayload,
  updateMerchantAction,
} from "@/app/actions/merchant.actions";
import { useRouter } from "next/navigation";

type MerchantFormProps = {
  className?: string;
  merchant?: Merchant;
  onCancel?: () => void;
  onSuccess?: () => void;
  showHeader?: boolean;
};

function buildInitialState(merchant?: Merchant): MerchantFormPayload {
  return {
    name: merchant?.name ?? "",
    domain: merchant?.domain ?? "",
    logo_url: merchant?.logo_url ?? "",
    aliases: merchant?.aliases.join(", ") ?? "",
  };
}

export default function MerchantForm({
  className,
  merchant,
  onCancel,
  onSuccess,
  showHeader = true,
}: MerchantFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initialState = useMemo(() => buildInitialState(merchant), [merchant]);
  const [formState, setFormState] = useState<MerchantFormPayload>(initialState);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof MerchantFormPayload) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((currentState) => ({
        ...currentState,
        [field]: event.target.value,
      }));
    };

  const resetForm = () => {
    setFormState(initialState);
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = merchant
        ? await updateMerchantAction(merchant.id, formState)
        : await createMerchantAction(formState);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!merchant) {
        resetForm();
      }

      onSuccess?.();
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm ${className ?? ""}`}
    >
      {showHeader ? (
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-base-content">
              {merchant ? "Editar merchant" : "Nuevo merchant"}
            </h2>
            <p className="text-sm text-base-content/70">
              Administrá identidad, dominio y aliases del merchant.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="form-control w-full">
          <span className="label-text mb-2 text-sm font-medium">Nombre</span>
          <input
            className="input input-bordered w-full"
            onChange={handleChange("name")}
            placeholder="Piggy"
            required
            value={formState.name}
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-2 text-sm font-medium">Dominio</span>
          <input
            className="input input-bordered w-full"
            onChange={handleChange("domain")}
            placeholder="piggy.com"
            value={formState.domain}
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-2 text-sm font-medium">Logo URL</span>
          <input
            className="input input-bordered w-full"
            onChange={handleChange("logo_url")}
            placeholder="https://..."
            value={formState.logo_url}
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-2 text-sm font-medium">Aliases</span>
          <input
            className="input input-bordered w-full"
            onChange={handleChange("aliases")}
            placeholder="piggy, piggy crm, piggy app"
            value={formState.aliases}
          />
        </label>
      </div>

      {error ? (
        <div className="alert alert-error mt-4">
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-end gap-3">
        {onCancel ? (
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
        ) : null}
        <button className="btn btn-primary" disabled={isPending} type="submit">
          {isPending ? "Guardando..." : merchant ? "Guardar cambios" : "Crear merchant"}
        </button>
      </div>
    </form>
  );
}
