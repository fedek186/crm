/*
Este archivo provee un componente de cliente para filtrar dinámicamente la lista de usuarios.
Permite seleccionar una columna, un operador aritmético/lógico y un valor, aplicando validaciones
según el tipo de dato de la columna. El filtro se persiste en la URL.

Elementos externos:
- useRouter, usePathname, useSearchParams: hooks de Next.js para navegación y manipulación de la URL.

Funciones exportadas:
- UserFilters: componente interactivo que muestra los selectores de columna, operador y valor para filtrar la data.
*/
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export type FilterColumn = 
  | "name" | "surname" | "email" | "country" | "phone" | "created_at"
  | "daily_trans" | "week_trans" | "monthly_trans" | "mp" | "contacts" | "last_contact" | "state";
export type FilterOperator = "eq" | "gt" | "lt" | "gte" | "lte" | "contains";

const COLUMNS: Record<FilterColumn, { label: string; type: "number" | "boolean" | "date" | "string" }> = {
  name: { label: "Nombre", type: "string" },
  surname: { label: "Apellido", type: "string" },
  email: { label: "Email", type: "string" },
  country: { label: "País", type: "string" },
  phone: { label: "Teléfono", type: "string" },
  daily_trans: { label: "Trans. Diarias", type: "number" },
  week_trans: { label: "Trans. Semanales", type: "number" },
  monthly_trans: { label: "Trans. Mensuales", type: "number" },
  mp: { label: "Mercado Pago", type: "boolean" },
  created_at: { label: "Fecha Ingreso", type: "date" },
  contacts: { label: "Cant. Contactos", type: "number" },
  last_contact: { label: "Último Contacto", type: "date" },
  state: { label: "Estado", type: "string" },
};

const OPERATORS_FOR_TYPE = {
  number: [
    { value: "eq", label: "Igual a (=)" },
    { value: "gt", label: "Mayor que (>)" },
    { value: "lt", label: "Menor que (<)" },
    { value: "gte", label: "Mayor o igual (>=)" },
    { value: "lte", label: "Menor o igual (<=)" },
  ],
  boolean: [
    { value: "eq", label: "Igual a" },
  ],
  date: [
    { value: "eq", label: "Exactamente el" },
    { value: "gt", label: "Después del (>)" },
    { value: "lt", label: "Antes del (<)" },
    { value: "gte", label: "Desde el (>=)" },
    { value: "lte", label: "Hasta el (<=)" },
  ],
  string: [
    { value: "contains", label: "Contiene" },
    { value: "eq", label: "Estrictamente igual a" },
  ],
};

export default function UserFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCol = (searchParams.get("filterCol") as FilterColumn) || "monthly_trans";
  const currentOp = (searchParams.get("filterOp") as FilterOperator) || "gt";
  const currentVal = searchParams.get("filterVal") || "";

  const [col, setCol] = useState<FilterColumn>(currentCol);
  const [op, setOp] = useState<FilterOperator>(currentOp);
  const [val, setVal] = useState<string>(currentVal);

  const columnDef = COLUMNS[col];
  const allowedOperators = OPERATORS_FOR_TYPE[columnDef.type];

  // Restablecer operador y valor si cambia la columna a un tipo diferente
  useEffect(() => {
    const defaultOp = OPERATORS_FOR_TYPE[COLUMNS[col].type][0].value as FilterOperator;
    // Si el operador actual no es válido para el nuevo tipo, lo cambiamos
    if (!OPERATORS_FOR_TYPE[COLUMNS[col].type].find((o) => o.value === op)) {
      setOp(defaultOp);
    }
    setVal("");
  }, [col]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (val !== "") {
      params.set("filterCol", col);
      params.set("filterOp", op);
      params.set("filterVal", val);
    } else {
      params.delete("filterCol");
      params.delete("filterOp");
      params.delete("filterVal");
    }
    
    params.set("page", "1"); // Volver a pág 1 al filtrar
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const clearFilter = () => {
    setVal("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filterCol");
    params.delete("filterOp");
    params.delete("filterVal");
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <section className="mb-6 rounded-2xl border border-lux-hover/40 bg-lux-surface p-4 shadow-xl md:p-5 w-full">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end w-full">
        <label className="form-control w-full sm:max-w-xs">
          <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lux-sec">
            Columna
          </span>
          <select
            className="select select-bordered w-full border-lux-hover bg-lux-bg text-white"
            disabled={isPending}
            value={col}
            onChange={(e) => setCol(e.target.value as FilterColumn)}
          >
            {Object.entries(COLUMNS).map(([key, def]) => (
              <option key={key} value={key}>
                {def.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control w-full sm:max-w-[200px]">
          <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lux-sec">
            Operador
          </span>
          <select
            className="select select-bordered w-full border-lux-hover bg-lux-bg text-white"
            disabled={isPending}
            value={op}
            onChange={(e) => setOp(e.target.value as FilterOperator)}
          >
            {allowedOperators.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control w-full sm:max-w-xs flex-1">
          <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lux-sec">
            Valor
          </span>
          {columnDef.type === "boolean" ? (
            <select
              className="select select-bordered w-full border-lux-hover bg-lux-bg text-white"
              disabled={isPending}
              value={val}
              onChange={(e) => setVal(e.target.value)}
            >
              <option value="" disabled>Seleccionar...</option>
              <option value="true">Sí (Tiene MP)</option>
              <option value="false">No (No tiene MP)</option>
            </select>
          ) : columnDef.type === "date" ? (
            <input
              type="date"
              className="input input-bordered w-full border-lux-hover bg-lux-bg text-white"
              disabled={isPending}
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          ) : columnDef.type === "string" ? (
            <input
              type="text"
              placeholder="Ej. Argentina"
              className="input input-bordered w-full border-lux-hover bg-lux-bg text-white"
              disabled={isPending}
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          ) : (
            <input
              type="number"
              placeholder="Ej. 10"
              className="input input-bordered w-full border-lux-hover bg-lux-bg text-white"
              disabled={isPending}
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          )}
        </label>

        <div className="flex gap-2 w-full sm:w-auto mt-4 lg:mt-0">
          <button
            onClick={applyFilter}
            disabled={isPending || val === ""}
            className="btn bg-lux-gold text-lux-bg hover:bg-lux-gold/90 transition-all shadow-[0_0_15px_rgba(241,111,132,0.12)] border-none flex-1 sm:flex-none"
          >
            Filtrar
          </button>
          
          {(currentVal !== "") && (
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
