"use client";

import SearchTableInput from "@/app/components/SearchTableInput";
import type {
  TransactionFilterOption,
  TransactionSortOption,
} from "@/app/lib/transaction";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const filterOptions: Array<{ label: string; value: TransactionFilterOption }> = [
  { label: "Todas", value: "all" },
  { label: "Transferencias", value: "transfers" },
  { label: "Sin merchant", value: "without-merchant" },
  { label: "Ajustes de balance", value: "balance-adjustments" },
];

const sortOptions: Array<{ label: string; value: TransactionSortOption }> = [
  { label: "Fecha: mas recientes", value: "date-desc" },
  { label: "Fecha: mas antiguas", value: "date-asc" },
  { label: "Monto: mayor a menor", value: "amount-desc" },
  { label: "Monto: menor a mayor", value: "amount-asc" },
];

export default function TransactionFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFilter = (searchParams.get("filter") ?? "all") as TransactionFilterOption;
  const currentSort = (searchParams.get("sort") ?? "date-desc") as TransactionSortOption;

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <section className="rounded-2xl border border-lux-hover/40 bg-lux-surface p-4 shadow-xl md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full lg:max-w-md">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lux-sec">
            Buscar
          </p>
          <SearchTableInput placeholder="Buscar por descripcion, email o merchant..." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:w-auto">
          <label className="form-control w-full min-w-[220px]">
            <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lux-sec">
              Ordenar
            </span>
            <select
              className="select select-bordered w-full border-lux-hover bg-lux-bg text-white"
              disabled={isPending}
              onChange={(event) => updateParam("sort", event.target.value)}
              value={currentSort}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control w-full min-w-[220px]">
            <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lux-sec">
              Filtrar
            </span>
            <select
              className="select select-bordered w-full border-lux-hover bg-lux-bg text-white"
              disabled={isPending}
              onChange={(event) => updateParam("filter", event.target.value)}
              value={currentFilter}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
