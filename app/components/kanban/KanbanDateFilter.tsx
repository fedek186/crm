/*
Este archivo provee un selector de fechas de inicio y fin para filtrar dinámicamente el Kanban.
Su diseño sigue la estética de filtros del panel principal, manejando parámetros de URL.

Elementos externos:
- usePathname, useRouter, useSearchParams: manipulan el estado global vía URL SearchParams para ruteo en Next.js.

Funciones exportadas:
- KanbanDateFilter: componente cliente de UI que muestra los date inputs y controla el ruteo de filtrado.
*/
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";

export default function KanbanDateFilter() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";

  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (from !== "") params.set("from", from);
    else params.delete("from");

    if (to !== "") params.set("to", to);
    else params.delete("to");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const clearFilter = () => {
    setFrom("");
    setTo("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <section className="mb-8 rounded-2xl border border-lux-hover/40 bg-lux-surface p-4 shadow-xl md:p-5 w-full max-w-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end w-full">
        
        <label className="form-control w-full sm:flex-1">
          <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lux-sec">
            Fecha Desde
          </span>
          <input
            type="date"
            className="input input-bordered w-full border-lux-hover bg-lux-bg text-white focus:border-lux-gold/50 focus:ring-1 focus:ring-lux-gold"
            disabled={isPending}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>

        <label className="form-control w-full sm:flex-1">
          <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lux-sec">
            Fecha Hasta
          </span>
          <input
             type="date"
             className="input input-bordered w-full border-lux-hover bg-lux-bg text-white focus:border-lux-gold/50 focus:ring-1 focus:ring-lux-gold"
             disabled={isPending}
             value={to}
             onChange={(e) => setTo(e.target.value)}
          />
        </label>

        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={applyFilter}
            disabled={isPending || (from === "" && to === "")}
            className="btn bg-lux-gold text-lux-bg hover:bg-lux-gold/90 transition-all shadow-[0_0_15px_rgba(241,111,132,0.12)] border-none flex-1 sm:flex-none"
          >
            Filtrar
          </button>
          
          {(currentFrom !== "" || currentTo !== "") && (
            <button
              onClick={clearFilter}
              disabled={isPending}
              className="btn btn-outline border-lux-hover text-lux-sec hover:bg-lux-hover transition-all flex-1 sm:flex-none"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
